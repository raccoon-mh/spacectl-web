import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, X, Trash2, Check, AlertCircle, Info } from 'lucide-react';
import { Parameter, MethodInfo } from '../types/api';

interface ParameterInputProps {
    parameters: Parameter[];
    onParametersChange: (parameters: Parameter[]) => void;
    methodInfo?: MethodInfo;
    disabled?: boolean;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
    parameters,
    onParametersChange,
    methodInfo,
    disabled = false,
}) => {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [availableParams, setAvailableParams] = useState<{ name: string, type: 'required' | 'optional' }[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Update available parameters when methodInfo changes
    useEffect(() => {
        if (methodInfo) {
            const requiredParams = methodInfo.required_params || [];
            const optionalParams = methodInfo.optional_params || [];

            const params = [
                ...requiredParams.map(name => ({ name, type: 'required' as const })),
                ...optionalParams.map(name => ({ name, type: 'optional' as const }))
            ];
            setAvailableParams(params);

            // Auto-add only required parameters on first load (when methodInfo changes)
            if (!hasInitialized) {
                const paramsToAdd = requiredParams.filter(
                    paramName => !parameters.some(p => p.key === paramName)
                );

                if (paramsToAdd.length > 0) {
                    const newParams = paramsToAdd.map(name => ({
                        key: name,
                        value: ''
                    }));
                    onParametersChange([...parameters, ...newParams]);
                }
                setHasInitialized(true);
            }
        } else {
            setAvailableParams([]);
            setHasInitialized(false);
        }
    }, [methodInfo, onParametersChange]);

    // Reset initialization flag when methodInfo changes
    useEffect(() => {
        setHasInitialized(false);
    }, [methodInfo]);

    const addParameter = () => {
        if (newKey.trim() && newValue.trim()) {
            const newParam: Parameter = {
                key: newKey.trim(),
                value: newValue.trim(),
            };
            onParametersChange([...parameters, newParam]);
            setNewKey('');
            setNewValue('');
        }
    };

    const removeParameter = (index: number) => {
        const newParams = parameters.filter((_, i) => i !== index);
        onParametersChange(newParams);
    };

    const updateParameter = (index: number, field: 'key' | 'value', value: string) => {
        const newParams = parameters.map((param, i) =>
            i === index ? { ...param, [field]: value } : param
        );
        onParametersChange(newParams);
    };

    const clearAll = () => {
        onParametersChange([]);
    };

    const toggleParameter = (paramName: string) => {
        const existingParam = parameters.find(p => p.key === paramName);
        if (existingParam) {
            // Remove parameter if it exists
            onParametersChange(parameters.filter(p => p.key !== paramName));
        } else {
            // Add parameter with empty value
            const newParam: Parameter = {
                key: paramName,
                value: '',
            };
            onParametersChange([...parameters, newParam]);
        }
    };

    const addAllRequired = () => {
        if (!methodInfo || !methodInfo.required_params) return;
        const requiredParamsToAdd = methodInfo.required_params.filter(
            paramName => !parameters.some(p => p.key === paramName)
        );

        if (requiredParamsToAdd.length > 0) {
            const newRequiredParams = requiredParamsToAdd.map(name => ({
                key: name,
                value: ''
            }));
            onParametersChange([...parameters, ...newRequiredParams]);
        }
    };

    const addAllOptional = () => {
        if (!methodInfo || !methodInfo.optional_params) return;
        const optionalParamsToAdd = methodInfo.optional_params.filter(
            paramName => !parameters.some(p => p.key === paramName)
        );

        if (optionalParamsToAdd.length > 0) {
            const newOptionalParams = optionalParamsToAdd.map(name => ({
                key: name,
                value: ''
            }));
            onParametersChange([...parameters, ...newOptionalParams]);
        }
    };

    const removeAllOptional = () => {
        if (!methodInfo || !methodInfo.optional_params) return;
        const filteredParams = parameters.filter(
            param => !methodInfo.optional_params.includes(param.key)
        );
        onParametersChange(filteredParams);
    };

    const isParameterActive = (paramName: string) => {
        return parameters.some(p => p.key === paramName);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                    Parameters ({parameters.length})
                </Label>
                <div className="flex gap-2">
                    {parameters.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAll}
                            disabled={disabled}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>


            {/* Available Parameters Selection */}
            {availableParams.length > 0 && (
                <div className="space-y-4">
                    {/* Required Parameters */}
                    {availableParams.filter(p => p.type === 'required').length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        Required Parameters
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addAllRequired}
                                        disabled={disabled}
                                        className="text-xs"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add All Required
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {availableParams
                                        .filter(param => param.type === 'required')
                                        .map((param) => (
                                            <div
                                                key={param.name}
                                                className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${isParameterActive(param.name)
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-red-50/30 hover:bg-red-50/50 border-red-100'
                                                    }`}
                                                onClick={() => !disabled && toggleParameter(param.name)}
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${isParameterActive(param.name)
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'border-red-300'
                                                    }`}>
                                                    {isParameterActive(param.name) && (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-mono text-sm font-medium">{param.name}</span>
                                                    <Badge variant="destructive" className="ml-2 text-xs">
                                                        required
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Optional Parameters */}
                    {availableParams.filter(p => p.type === 'optional').length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        Optional Parameters
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addAllOptional}
                                            disabled={disabled}
                                            className="text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={removeAllOptional}
                                            disabled={disabled}
                                            className="text-xs text-destructive hover:text-destructive"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Remove All
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {availableParams
                                        .filter(param => param.type === 'optional')
                                        .map((param) => (
                                            <div
                                                key={param.name}
                                                className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${isParameterActive(param.name)
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-blue-50/30 hover:bg-blue-50/50 border-blue-100'
                                                    }`}
                                                onClick={() => !disabled && toggleParameter(param.name)}
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${isParameterActive(param.name)
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-blue-300'
                                                    }`}>
                                                    {isParameterActive(param.name) && (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-mono text-sm font-medium">{param.name}</span>
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        optional
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
            {/* Custom Parameters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-500" />
                        Custom Parameters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                            <Label htmlFor="param-key">Key</Label>
                            <Input
                                id="param-key"
                                placeholder="parameter_key"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                disabled={disabled}
                                onKeyPress={(e) => e.key === 'Enter' && addParameter()}
                            />
                        </div>
                        <div>
                            <Label htmlFor="param-value">Value</Label>
                            <Input
                                id="param-value"
                                placeholder="parameter_value"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                disabled={disabled}
                                onKeyPress={(e) => e.key === 'Enter' && addParameter()}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={addParameter}
                                disabled={disabled || !newKey.trim() || !newValue.trim()}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Existing parameters */}
            {parameters.length > 0 && (
                <div className="space-y-2">
                    <Label>Current Parameters</Label>
                    <div className="space-y-2">
                        {parameters.map((param, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md bg-muted/50">
                                <div>
                                    <Input
                                        value={param.key}
                                        onChange={(e) => updateParameter(index, 'key', e.target.value)}
                                        disabled={disabled}
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <Input
                                        value={param.value}
                                        onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                        disabled={disabled}
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeParameter(index)}
                                        disabled={disabled}
                                        className="text-destructive hover:text-destructive w-full"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {parameters.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                    No parameters set.
                </div>
            )}
        </div>
    );
};
