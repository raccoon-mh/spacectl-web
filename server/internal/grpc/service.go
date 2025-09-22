package grpc

import (
	"context"
	"fmt"
	"time"

	"spacectl-web/server/internal/constants"
	"spacectl-web/server/internal/errors"

	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/dynamic"
	"github.com/jhump/protoreflect/dynamic/grpcdynamic"
	"github.com/jhump/protoreflect/grpcreflect"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/descriptorpb"
)

// ServiceCaller handles gRPC service method calls
type ServiceCaller struct {
	conn             *grpc.ClientConn
	refClient        *grpcreflect.Client
	serviceDiscovery *ServiceDiscovery
}

// NewServiceCaller creates a new ServiceCaller
func NewServiceCaller(conn *grpc.ClientConn, refClient *grpcreflect.Client, serviceDiscovery *ServiceDiscovery) *ServiceCaller {
	return &ServiceCaller{
		conn:             conn,
		refClient:        refClient,
		serviceDiscovery: serviceDiscovery,
	}
}

// CallMethod calls a gRPC method with the given parameters
func (sc *ServiceCaller) CallMethod(serviceName, resourceName, verb string, parameters map[string]interface{}) ([]byte, error) {
	// Get service descriptor - use proper service name format
	// For Health and ServerInfo resources, use the main service name
	var serviceFullName string
	var serviceDesc *desc.ServiceDescriptor
	var err error

	if resourceName == "Health" || resourceName == "ServerInfo" {
		// Get service information from ServiceDiscovery (with caching)
		fmt.Printf("DEBUG: Getting service info for %s\n", serviceName)
		serviceInfo, err := sc.serviceDiscovery.GetServiceInfo(serviceName)
		if err != nil {
			fmt.Printf("DEBUG: Failed to get service info: %v\n", err)
			return nil, errors.NewAPIError(errors.ErrServiceDescriptorFailed,
				fmt.Sprintf("Failed to get service info: %v", err))
		}

		fmt.Printf("DEBUG: Service info retrieved: %s\n", serviceInfo.Name)

		// Check if the resource exists in the discovered service info
		resource, exists := serviceInfo.Resources[resourceName]
		if !exists {
			return nil, errors.NewAPIError(errors.ErrServiceDescriptorFailed,
				fmt.Sprintf("Resource '%s' not found in service '%s'", resourceName, serviceName))
		}

		// Check if the verb exists for this resource
		verbExists := false
		for _, v := range resource.Verbs {
			if v == verb {
				verbExists = true
				break
			}
		}
		if !verbExists {
			return nil, errors.NewAPIError(errors.ErrServiceDescriptorFailed,
				fmt.Sprintf("Verb '%s' not found for resource '%s'", verb, resourceName))
		}

		// Resolve the actual service based on resource type
		if resourceName == "Health" {
			serviceFullName = "grpc.health.v1.Health"
		} else if resourceName == "ServerInfo" {
			serviceFullName = "spaceone.api.core.v1.ServerInfo"
		}

		serviceDesc, err = sc.refClient.ResolveService(serviceFullName)
		if err != nil {
			fmt.Printf("DEBUG: Failed to resolve service %s: %v\n", serviceFullName, err)
			return nil, errors.NewAPIError(errors.ErrServiceDescriptorFailed,
				fmt.Sprintf("Failed to resolve service %s: %v", serviceFullName, err))
		}
	} else {
		serviceFullName = fmt.Sprintf(constants.ServiceNamePattern, serviceName, resourceName)
		serviceDesc, err = sc.refClient.ResolveService(serviceFullName)
		if err != nil {
			fmt.Printf("DEBUG: Failed to resolve service: %v\n", err)
			return nil, errors.NewAPIError(errors.ErrServiceDescriptorFailed, err.Error())
		}
	}

	fmt.Printf("DEBUG: Successfully resolved service: %s\n", serviceFullName)

	// Get method descriptor
	methodDesc := serviceDesc.FindMethodByName(verb)
	if methodDesc == nil {
		return nil, errors.NewAPIError(errors.ErrMethodNotFound, fmt.Sprintf("method '%s' not found", verb))
	}

	// Create request message
	reqFactory := dynamic.NewMessageFactoryWithDefaults()
	requestMsg := reqFactory.NewMessage(methodDesc.GetInputType())

	// Set parameters in the request message
	if len(parameters) > 0 {
		fmt.Printf("DEBUG: Setting parameters in request message: %v\n", parameters)
		// Convert to dynamic message
		if dynamicMsg, ok := requestMsg.(*dynamic.Message); ok {
			for key, value := range parameters {
				if err := sc.setMessageField(dynamicMsg, key, value); err != nil {
					fmt.Printf("DEBUG: Failed to set field %s: %v\n", key, err)
					// Continue with other fields even if one fails
				}
			}
		} else {
			fmt.Printf("DEBUG: Warning: requestMsg is not a dynamic.Message, cannot set parameters\n")
		}
	}

	// Create dynamic gRPC stub
	stub := grpcdynamic.NewStub(sc.conn)

	// Invoke RPC call with timeout
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(constants.DefaultTimeout)*time.Second)
	defer cancel()

	resp, err := stub.InvokeRpc(ctx, methodDesc, requestMsg)
	if err != nil {
		return nil, errors.NewAPIError(errors.ErrRPCCallFailed, err.Error())
	}

	// Convert response to JSON
	respDynamic, ok := resp.(*dynamic.Message)
	if !ok {
		return nil, errors.NewAPIError(errors.ErrResponseConversionFailed, "failed to convert response to dynamic.Message")
	}

	jsonBytes, err := respDynamic.MarshalJSONIndent()
	if err != nil {
		return nil, errors.NewAPIError(errors.ErrJSONConversionFailed, err.Error())
	}

	return jsonBytes, nil
}

// setMessageField sets a field in the dynamic message
func (sc *ServiceCaller) setMessageField(msg *dynamic.Message, fieldName string, value interface{}) error {
	// Try to set the field directly
	if err := msg.TrySetFieldByName(fieldName, value); err != nil {
		// If direct setting fails, try to convert the value to the appropriate type
		fieldDesc := msg.GetMessageDescriptor().FindFieldByName(fieldName)
		if fieldDesc == nil {
			return fmt.Errorf("field '%s' not found in message", fieldName)
		}

		// Convert value based on field type
		convertedValue, err := sc.convertValue(value, fieldDesc)
		if err != nil {
			return fmt.Errorf("failed to convert value for field '%s': %w", fieldName, err)
		}

		return msg.TrySetFieldByName(fieldName, convertedValue)
	}
	return nil
}

// convertValue converts interface{} value to the appropriate protobuf type
func (sc *ServiceCaller) convertValue(value interface{}, fieldDesc *desc.FieldDescriptor) (interface{}, error) {
	switch fieldDesc.GetType() {
	case descriptorpb.FieldDescriptorProto_TYPE_STRING:
		if str, ok := value.(string); ok {
			return str, nil
		}
		return fmt.Sprintf("%v", value), nil
	case descriptorpb.FieldDescriptorProto_TYPE_INT32, descriptorpb.FieldDescriptorProto_TYPE_INT64:
		switch v := value.(type) {
		case int:
			return v, nil
		case int32:
			return v, nil
		case int64:
			return v, nil
		case float64:
			return int64(v), nil
		case string:
			// Try to parse string as number
			if fieldDesc.GetType() == descriptorpb.FieldDescriptorProto_TYPE_INT32 {
				var result int32
				if _, err := fmt.Sscanf(v, "%d", &result); err == nil {
					return result, nil
				}
			} else {
				var result int64
				if _, err := fmt.Sscanf(v, "%d", &result); err == nil {
					return result, nil
				}
			}
		}
	case descriptorpb.FieldDescriptorProto_TYPE_BOOL:
		if b, ok := value.(bool); ok {
			return b, nil
		}
		if str, ok := value.(string); ok {
			return str == "true" || str == "1", nil
		}
	case descriptorpb.FieldDescriptorProto_TYPE_FLOAT, descriptorpb.FieldDescriptorProto_TYPE_DOUBLE:
		switch v := value.(type) {
		case float32:
			return v, nil
		case float64:
			return v, nil
		case int:
			return float64(v), nil
		case string:
			var result float64
			if _, err := fmt.Sscanf(v, "%f", &result); err == nil {
				return result, nil
			}
		}
	}

	// For complex types (maps, arrays, messages), try to set as-is
	return value, nil
}
