package errors

import (
	"fmt"
	"net/http"
)

// APIError represents a structured API error
type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s", e.Message, e.Details)
	}
	return e.Message
}

// Predefined errors
var (
	ErrServiceNotFound = &APIError{
		Code:    http.StatusNotFound,
		Message: "Service not found",
	}

	ErrResourceNotFound = &APIError{
		Code:    http.StatusNotFound,
		Message: "Resource not found",
	}

	ErrVerbNotSupported = &APIError{
		Code:    http.StatusBadRequest,
		Message: "Verb not supported for resource",
	}

	ErrGRPCClientFailed = &APIError{
		Code:    http.StatusInternalServerError,
		Message: "Failed to create gRPC client",
	}

	ErrServiceDescriptorFailed = &APIError{
		Code:    http.StatusInternalServerError,
		Message: "Failed to get service descriptor",
	}

	ErrMethodNotFound = &APIError{
		Code:    http.StatusNotFound,
		Message: "Method not found",
	}

	ErrRPCCallFailed = &APIError{
		Code:    http.StatusInternalServerError,
		Message: "RPC call failed",
	}

	ErrResponseConversionFailed = &APIError{
		Code:    http.StatusInternalServerError,
		Message: "Failed to convert response",
	}

	ErrJSONConversionFailed = &APIError{
		Code:    http.StatusInternalServerError,
		Message: "Failed to convert response to JSON",
	}
)

// NewAPIError creates a new API error with details
func NewAPIError(baseErr *APIError, details string) *APIError {
	return &APIError{
		Code:    baseErr.Code,
		Message: baseErr.Message,
		Details: details,
	}
}
