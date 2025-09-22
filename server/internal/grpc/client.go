package grpc

import (
	"context"
	"fmt"
	"strings"

	"spacectl-web/server/internal/config"

	"github.com/jhump/protoreflect/grpcreflect"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// PerRPCCredentials implements credentials.PerRPCCredentials for token-based authentication
type PerRPCCredentials struct {
	Token string
}

// GetRequestMetadata adds authentication metadata to the context
func (c PerRPCCredentials) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	// Remove "Bearer " prefix if present
	token := strings.TrimPrefix(c.Token, "Bearer ")
	return map[string]string{
		"token": token,
	}, nil
}

// RequireTransportSecurity indicates whether TLS security is required
func (c PerRPCCredentials) RequireTransportSecurity() bool {
	return true
}

// ClientManager manages gRPC connections for different services
type ClientManager struct {
	config           *config.Config
	clients          map[string]*grpc.ClientConn
	refClients       map[string]*grpcreflect.Client
	serviceDiscovery *ServiceDiscovery
}

// NewClientManager creates a new GRPCClientManager instance
func NewClientManager(cfg *config.Config, serviceDiscovery *ServiceDiscovery) *ClientManager {
	return &ClientManager{
		config:           cfg,
		clients:          make(map[string]*grpc.ClientConn),
		refClients:       make(map[string]*grpcreflect.Client),
		serviceDiscovery: serviceDiscovery,
	}
}

// GetClient returns a gRPC client and reflection client for the specified service
func (m *ClientManager) GetClient(serviceName string) (*grpc.ClientConn, *grpcreflect.Client, error) {
	// Return existing client if already connected
	if conn, exists := m.clients[serviceName]; exists {
		return conn, m.refClients[serviceName], nil
	}

	// Get endpoint URL for the service
	endpoint, exists := m.config.Endpoints[serviceName]
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
		grpc.WithPerRPCCredentials(PerRPCCredentials{Token: m.config.Token}),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to service '%s': %w", serviceName, err)
	}

	// Create reflection client without timeout first
	refClient := grpcreflect.NewClientAuto(context.Background(), conn)

	// Store clients
	m.clients[serviceName] = conn
	m.refClients[serviceName] = refClient

	return conn, refClient, nil
}

// GetServiceCaller returns a ServiceCaller for the specified service
func (m *ClientManager) GetServiceCaller(serviceName string) (*ServiceCaller, error) {
	conn, refClient, err := m.GetClient(serviceName)
	if err != nil {
		return nil, err
	}
	return NewServiceCaller(conn, refClient, m.serviceDiscovery), nil
}

// Close closes all gRPC connections
func (m *ClientManager) Close() {
	for _, conn := range m.clients {
		conn.Close()
	}
}
