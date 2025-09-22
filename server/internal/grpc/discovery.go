package grpc

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"spacectl-web/server/internal/config"

	"github.com/jhump/protoreflect/grpcreflect"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// ServiceDiscovery manages service discovery and caching
type ServiceDiscovery struct {
	config     *config.Config
	clients    map[string]*grpc.ClientConn
	refClients map[string]*grpcreflect.Client
	cache      map[string]*ServiceInfo
	cacheMutex sync.RWMutex
	cacheTTL   time.Duration
}

// ServiceInfo contains discovered service information
type ServiceInfo struct {
	Name       string                   `json:"name"`
	Resources  map[string]*ResourceInfo `json:"resources"`
	LastUpdate time.Time                `json:"last_update"`
}

// ResourceInfo contains discovered resource information
type ResourceInfo struct {
	Name        string   `json:"name"`
	Verbs       []string `json:"verbs"`
	ServiceName string   `json:"service_name"` // Full service name for gRPC calls
}

// NewServiceDiscovery creates a new ServiceDiscovery instance
func NewServiceDiscovery(cfg *config.Config) *ServiceDiscovery {
	return &ServiceDiscovery{
		config:     cfg,
		clients:    make(map[string]*grpc.ClientConn),
		refClients: make(map[string]*grpcreflect.Client),
		cache:      make(map[string]*ServiceInfo),
		cacheTTL:   5 * time.Minute, // Cache for 5 minutes
	}
}

// GetServiceInfo returns service information, using cache if available
func (sd *ServiceDiscovery) GetServiceInfo(serviceName string) (*ServiceInfo, error) {
	sd.cacheMutex.RLock()
	cached, exists := sd.cache[serviceName]
	sd.cacheMutex.RUnlock()

	// Return cached data if it's still valid
	if exists && time.Since(cached.LastUpdate) < sd.cacheTTL {
		return cached, nil
	}

	// Discover service information
	serviceInfo, err := sd.discoverService(serviceName)
	if err != nil {
		return nil, err
	}

	// Update cache
	sd.cacheMutex.Lock()
	sd.cache[serviceName] = serviceInfo
	sd.cacheMutex.Unlock()

	return serviceInfo, nil
}

// discoverService discovers service information via gRPC reflection
func (sd *ServiceDiscovery) discoverService(serviceName string) (*ServiceInfo, error) {
	// Get gRPC client
	_, refClient, err := sd.getClient(serviceName)
	if err != nil {
		return nil, fmt.Errorf("failed to get gRPC client for %s: %w", serviceName, err)
	}

	// List all available services
	services, err := refClient.ListServices()
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}

	// Debug: Log all discovered services
	fmt.Printf("DEBUG: Discovered %d services for %s:\n", len(services), serviceName)
	for _, service := range services {
		fmt.Printf("  - %s\n", service)
	}

	// Filter services that belong to this service name
	serviceInfo := &ServiceInfo{
		Name:       serviceName,
		Resources:  make(map[string]*ResourceInfo),
		LastUpdate: time.Now(),
	}

	// Group services by resource type
	resourceMap := make(map[string]*ResourceInfo) // resource -> ResourceInfo

	for _, service := range services {
		// Parse service name to extract resource type
		resourceName := sd.extractResourceName(service, serviceName)
		if resourceName == "" {
			fmt.Printf("DEBUG: Skipping service %s (no resource extracted for %s)\n", service, serviceName)
			continue
		}
		fmt.Printf("DEBUG: Extracted resource '%s' from service '%s'\n", resourceName, service)

		// Get service descriptor
		serviceDesc, err := refClient.ResolveService(service)
		if err != nil {
			continue // Skip services we can't resolve
		}

		// Get methods for this service
		methods := serviceDesc.GetMethods()
		var verbs []string
		for _, method := range methods {
			methodName := method.GetName()
			verbs = append(verbs, methodName)
		}

		// Store resource info with actual service name
		resourceMap[resourceName] = &ResourceInfo{
			Name:        resourceName,
			Verbs:       verbs,
			ServiceName: service, // Store the actual discovered service name
		}
	}

	// Copy resource info to service info
	for resourceName, resourceInfo := range resourceMap {
		serviceInfo.Resources[resourceName] = resourceInfo
	}

	// Debug: Log final service info
	fmt.Printf("DEBUG: Final service info for %s:\n", serviceName)
	for resourceName, resourceInfo := range serviceInfo.Resources {
		fmt.Printf("  Resource: %s, Verbs: %v\n", resourceName, resourceInfo.Verbs)
	}

	return serviceInfo, nil
}

// extractResourceName extracts resource name from full service name
func (sd *ServiceDiscovery) extractResourceName(fullServiceName, serviceName string) string {
	// Handle special cases first
	if fullServiceName == "grpc.health.v1.Health" {
		return "Health"
	}
	if fullServiceName == "spaceone.api.core.v1.ServerInfo" {
		return "ServerInfo"
	}

	parts := strings.Split(fullServiceName, ".")

	if len(parts) >= 5 && parts[0] == "spaceone" && parts[1] == "api" {
		// Check if this service belongs to our service name
		// parts[2] = service name, parts[3] = version (v1/v2), parts[4] = resource
		discoveredServiceName := parts[2]

		// Handle service name matching with special cases
		// e.g., inventory_v2 should match both spaceone.api.inventory_v2.v1.* and spaceone.api.inventory.v1.*
		if discoveredServiceName == serviceName {
			resourceName := parts[4]
			fmt.Printf("DEBUG: Found matching resource '%s' for service '%s' (version: %s)\n", resourceName, serviceName, parts[3])
			return resourceName
		} else if sd.isCompatibleService(discoveredServiceName, serviceName) {
			resourceName := parts[4]
			fmt.Printf("DEBUG: Found compatible resource '%s' for service '%s' (discovered: %s, version: %s)\n", resourceName, serviceName, discoveredServiceName, parts[3])
			return resourceName
		} else {
			fmt.Printf("DEBUG: Service part '%s' doesn't match requested service '%s'\n", discoveredServiceName, serviceName)
		}
	} else {
		fmt.Printf("DEBUG: Service '%s' doesn't match spaceone.api pattern (expected at least 5 parts)\n", fullServiceName)
	}

	return ""
}

// isCompatibleService checks if a discovered service is compatible with the requested service
func (sd *ServiceDiscovery) isCompatibleService(discoveredServiceName, requestedServiceName string) bool {
	// Handle special compatibility cases
	// e.g., inventory_v2 should be compatible with inventory
	if requestedServiceName == "inventory_v2" && discoveredServiceName == "inventory" {
		return true
	}
	if requestedServiceName == "inventory" && discoveredServiceName == "inventory_v2" {
		return true
	}

	// Add more compatibility rules as needed
	// e.g., cost_analysis_v2 and cost_analysis
	if requestedServiceName == "cost_analysis_v2" && discoveredServiceName == "cost_analysis" {
		return true
	}
	if requestedServiceName == "cost_analysis" && discoveredServiceName == "cost_analysis_v2" {
		return true
	}

	return false
}

// getClient returns a gRPC client and reflection client for the specified service
func (sd *ServiceDiscovery) getClient(serviceName string) (*grpc.ClientConn, *grpcreflect.Client, error) {
	// Return existing client if already connected
	if conn, exists := sd.clients[serviceName]; exists {
		return conn, sd.refClients[serviceName], nil
	}

	// Get endpoint URL for the service
	endpoint, exists := sd.config.Endpoints[serviceName]
	if !exists {
		return nil, nil, fmt.Errorf("endpoint not found for service '%s'", serviceName)
	}

	// Extract host:port from grpc+ssl://host:port/v1 format
	address := strings.TrimPrefix(endpoint, "grpc+ssl://")
	address = strings.TrimSuffix(address, "/v1")

	// Create SSL/TLS credentials
	creds := credentials.NewClientTLSFromCert(nil, "")

	// Create gRPC connection
	conn, err := grpc.NewClient(
		address,
		grpc.WithTransportCredentials(creds),
		grpc.WithPerRPCCredentials(PerRPCCredentials{Token: sd.config.Token}),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to service '%s': %w", serviceName, err)
	}

	// Create reflection client
	refClient := grpcreflect.NewClientAuto(context.Background(), conn)

	// Store clients
	sd.clients[serviceName] = conn
	sd.refClients[serviceName] = refClient

	return conn, refClient, nil
}

// GetAvailableServices returns list of available service names from config
func (sd *ServiceDiscovery) GetAvailableServices() []string {
	services := make([]string, 0, len(sd.config.Endpoints))
	for serviceName := range sd.config.Endpoints {
		services = append(services, serviceName)
	}
	return services
}

// ClearCache clears the service discovery cache
func (sd *ServiceDiscovery) ClearCache() {
	sd.cacheMutex.Lock()
	defer sd.cacheMutex.Unlock()
	sd.cache = make(map[string]*ServiceInfo)
}

// Close closes all gRPC connections
func (sd *ServiceDiscovery) Close() {
	for _, conn := range sd.clients {
		conn.Close()
	}
}
