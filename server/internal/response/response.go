package response

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// Response represents the standard API response structure
type Response struct {
	Success  bool        `json:"success"`
	Data     interface{} `json:"data,omitempty"`
	Error    *ErrorInfo  `json:"error,omitempty"`
	Duration string      `json:"duration,omitempty"`
}

// ErrorInfo represents error information in the response
type ErrorInfo struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Success sends a successful response
func Success(c echo.Context, data interface{}) error {
	durationStr := calculateDuration(c)

	return c.JSON(http.StatusOK, Response{
		Success:  true,
		Data:     data,
		Duration: durationStr,
	})
}

// Error sends an error response
func Error(c echo.Context, code int, message string, details ...string) error {
	errorInfo := &ErrorInfo{
		Code:    code,
		Message: message,
	}

	if len(details) > 0 {
		errorInfo.Details = details[0]
	}

	durationStr := calculateDuration(c)

	return c.JSON(code, Response{
		Success:  false,
		Error:    errorInfo,
		Duration: durationStr,
	})
}

// NotFound sends a 404 response
func NotFound(c echo.Context, message string, details ...string) error {
	return Error(c, http.StatusNotFound, message, details...)
}

// BadRequest sends a 400 response
func BadRequest(c echo.Context, message string, details ...string) error {
	return Error(c, http.StatusBadRequest, message, details...)
}

// InternalServerError sends a 500 response
func InternalServerError(c echo.Context, message string, details ...string) error {
	return Error(c, http.StatusInternalServerError, message, details...)
}

// calculateDuration calculates the request duration from the start time stored in context
func calculateDuration(c echo.Context) string {
	startTime := c.Get("request_start_time")
	if startTime == nil {
		return ""
	}

	if start, ok := startTime.(time.Time); ok {
		duration := time.Since(start)
		// Convert to milliseconds with 3 decimal places
		ms := float64(duration.Nanoseconds()) / 1e6
		return fmt.Sprintf("%.3fms", ms)
	}

	return ""
}
