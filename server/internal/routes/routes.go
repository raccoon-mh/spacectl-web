package routes

import (
	"spacectl-web/server/internal/constants"
	"spacectl-web/server/internal/handlers"

	"github.com/labstack/echo/v4"
)

// SetupRoutes configures all API routes
func SetupRoutes(e *echo.Echo, handler *handlers.Handler) {
	// API routes
	api := e.Group(constants.APIPrefix)
	api.GET(constants.ServicesPath, handler.ListServices)
	api.GET(constants.ResourcesPath, handler.ListResources)
	api.POST(constants.GRPCMethodPath, handler.CallGRPCMethod)
}
