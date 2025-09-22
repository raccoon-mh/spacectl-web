package middleware

import (
	"log"
	"time"

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

// RequestTimingMiddleware logs the total time taken for each API request
func RequestTimingMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			// Store start time in context
			c.Set("request_start_time", start)

			// Process request
			err := next(c)

			// Calculate duration
			duration := time.Since(start)

			// Log request timing
			log.Printf("API Request: %s %s - Status: %d - Duration: %v",
				c.Request().Method,
				c.Request().URL.Path,
				c.Response().Status,
				duration,
			)

			return err
		}
	}
}
