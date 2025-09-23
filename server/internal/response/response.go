package response

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// Response represents the standard API response structure
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
}

// ErrorInfo represents error information in the response
type ErrorInfo struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Success sends a successful response
func Success(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
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

	return c.JSON(code, Response{
		Success: false,
		Error:   errorInfo,
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
