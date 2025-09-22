package constants

// Default values
const (
	DefaultPort       = "8080"
	DefaultConfigFile = "config.yaml"
	DefaultTimeout    = 30
)

// API paths
const (
	APIPrefix      = "/api"
	ServicesPath   = "/services"
	ResourcesPath  = "/services/:service/resources"
	GRPCMethodPath = "/services/:service/resources/:resource/verbs/:verb"
)

// Service name patterns
const (
	ServiceNamePattern = "spaceone.api.%s.v1.%s"
)

// HTTP headers
const (
	ContentTypeJSON = "application/json"
)

// Log messages
const (
	LogServerStarting = "Starting SpaceONE gRPC API Server on port %s"
	LogServerStarted  = "Server started successfully"
	LogServerStopped  = "Server stopped"
)
