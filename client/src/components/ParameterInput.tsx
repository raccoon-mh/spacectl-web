import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, Trash2 } from 'lucide-react';
import { Parameter } from '../types/api';

interface ParameterInputProps {
    parameters: Parameter[];
    onParametersChange: (parameters: Parameter[]) => void;
    disabled?: boolean;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
    parameters,
    onParametersChange,
    disabled = false,
}) => {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                    Parameters ({parameters.length})
                </Label>
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
            {/* Add new parameter */}
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

            {/* Existing parameters */}
            {parameters.length > 0 && (
                <div className="space-y-2">
                    <Label>Current Parameters</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
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
                    No parameters set. Add key-value pairs above if needed.
                </div>
            )}
        </div>
    );
};
