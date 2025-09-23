package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"spacectl-web/server/internal/config"
	"spacectl-web/server/internal/errors"
	"spacectl-web/server/internal/grpc"
	"spacectl-web/server/internal/response"

	"github.com/labstack/echo/v4"
)

// Handler contains dependencies for HTTP handlers
type Handler struct {
	grpcManager      *grpc.ClientManager
	serviceDiscovery *grpc.ServiceDiscovery
	config           *config.Config
	configFilePath   string
}

// NewHandler creates a new Handler instance
func NewHandler(grpcManager *grpc.ClientManager, serviceDiscovery *grpc.ServiceDiscovery, cfg *config.Config, configFilePath string) *Handler {
	return &Handler{
		grpcManager:      grpcManager,
		serviceDiscovery: serviceDiscovery,
		config:           cfg,
		configFilePath:   configFilePath,
	}
}

// ListServices returns the list of available services
func (h *Handler) ListServices(c echo.Context) error {
	services := h.serviceDiscovery.GetAvailableServices()
	return response.Success(c, services)
}

// ListResources returns the list of resources for a specific service
func (h *Handler) ListResources(c echo.Context) error {
	serviceName := c.Param("service")

	// Get service information from discovery
	serviceInfo, err := h.serviceDiscovery.GetServiceInfo(serviceName)
	if err != nil {
		return response.NotFound(c, "Service not found", fmt.Sprintf("service '%s' not found: %v", serviceName, err))
	}

	// Convert to the expected format
	resources := make([]map[string]interface{}, 0, len(serviceInfo.Resources))
	for _, resource := range serviceInfo.Resources {
		resources = append(resources, map[string]interface{}{
			"Name":    resource.Name,
			"Verbs":   resource.Verbs,
			"Methods": resource.Methods,
		})
	}

	return response.Success(c, resources)
}

// CallGRPCMethod calls a gRPC method for the specified service, resource, and verb
func (h *Handler) CallGRPCMethod(c echo.Context) error {
	serviceName := c.Param("service")
	resourceName := c.Param("resource")
	verb := c.Param("verb")

	// Validate service, resource, and verb
	if err := h.validateRequest(serviceName, resourceName, verb); err != nil {
		return err
	}

	// Read request body for parameters
	var requestBody map[string]interface{}
	if err := c.Bind(&requestBody); err != nil {
		// If no body is provided, use empty map
		requestBody = make(map[string]interface{})
	}

	// Filter out metadata fields that shouldn't be passed to gRPC
	grpcParameters := make(map[string]interface{})
	for key, value := range requestBody {
		// Skip metadata fields that are not part of the actual gRPC request
		if key != "service" && key != "resource" && key != "verb" {
			grpcParameters[key] = value
		}
	}

	// Get service caller
	serviceCaller, err := h.grpcManager.GetServiceCaller(serviceName)
	if err != nil {
		return response.InternalServerError(c, "Failed to create service caller", err.Error())
	}

	// Call method
	jsonBytes, err := serviceCaller.CallMethod(serviceName, resourceName, verb, grpcParameters)
	if err != nil {
		apiErr, ok := err.(*errors.APIError)
		if ok {
			return response.Error(c, apiErr.Code, apiErr.Message, apiErr.Details)
		}
		return response.InternalServerError(c, "Unknown error occurred", err.Error())
	}

	return response.Success(c, json.RawMessage(jsonBytes))
}

// validateRequest validates the service, resource, and verb parameters
func (h *Handler) validateRequest(serviceName, resourceName, verb string) error {
	// Get service information from discovery
	serviceInfo, err := h.serviceDiscovery.GetServiceInfo(serviceName)
	if err != nil {
		return response.NotFound(nil, "Service not found", fmt.Sprintf("service '%s' not found: %v", serviceName, err))
	}

	// Validate resource exists
	resource, exists := serviceInfo.Resources[resourceName]
	if !exists {
		return response.NotFound(nil, "Resource not found", fmt.Sprintf("resource '%s' not found", resourceName))
	}

	// Validate verb exists
	verbExists := false
	for _, v := range resource.Verbs {
		if v == verb {
			verbExists = true
			break
		}
	}
	if !verbExists {
		return response.BadRequest(nil, "Verb not supported", fmt.Sprintf("verb '%s' is not supported for resource '%s'", verb, resourceName))
	}

	return nil
}

// JWTInfo represents parsed JWT token information
type JWTInfo struct {
	Header  map[string]interface{} `json:"header"`
	Payload map[string]interface{} `json:"payload"`
}

// ConfigInfo represents configuration information
type ConfigInfo struct {
	ConfigFilePath string            `json:"config_file_path"`
	Endpoints      map[string]string `json:"endpoints"`
	JWTInfo        *JWTInfo          `json:"jwt_info,omitempty"`
}

// parseJWT parses a JWT token and returns header and payload
func parseJWT(token string) (*JWTInfo, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	// Parse header
	headerData, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("failed to decode header: %w", err)
	}

	var header map[string]interface{}
	if err := json.Unmarshal(headerData, &header); err != nil {
		return nil, fmt.Errorf("failed to parse header: %w", err)
	}

	// Parse payload
	payloadData, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode payload: %w", err)
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(payloadData, &payload); err != nil {
		return nil, fmt.Errorf("failed to parse payload: %w", err)
	}

	return &JWTInfo{
		Header:  header,
		Payload: payload,
	}, nil
}

// GetConfigInfo returns configuration information including JWT token details
func (h *Handler) GetConfigInfo(c echo.Context) error {
	configInfo := &ConfigInfo{
		ConfigFilePath: h.configFilePath,
		Endpoints:      h.config.Endpoints,
	}

	// Parse JWT token if available
	if h.config.Token != "" {
		jwtInfo, err := parseJWT(h.config.Token)
		if err != nil {
			// If JWT parsing fails, still return config info but without JWT details
			return response.Success(c, configInfo)
		}
		configInfo.JWTInfo = jwtInfo
	}

	return response.Success(c, configInfo)
}
