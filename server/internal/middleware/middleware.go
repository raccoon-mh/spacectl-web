package middleware

import (
	"spacectl-web/server/internal/grpc"

	"github.com/labstack/echo/v4"
)

// GRPCMiddleware adds the gRPC manager to the request context
func GRPCMiddleware(grpcManager *grpc.ClientManager) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("grpcManager", grpcManager)
			return next(c)
		}
	}
}
