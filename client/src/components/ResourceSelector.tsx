import React from 'react';
import { SearchableSelect } from './ui/searchable-select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Resource } from '../types/api';

interface ResourceSelectorProps {
    resources: Resource[];
    selectedResource: string;
    onResourceChange: (resource: string) => void;
    loading?: boolean;
    disabled?: boolean;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
    resources,
    selectedResource,
    onResourceChange,
    loading = false,
    disabled = false,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="resource-select" className="text-sm font-medium">
                Resource ({resources.length})
            </Label>
            <SearchableSelect
                value={selectedResource}
                onValueChange={onResourceChange}
                placeholder={
                    disabled
                        ? "Select service first"
                        : loading
                            ? "Loading..."
                            : "Choose resource"
                }
                disabled={disabled || loading || resources.length === 0}
                searchPlaceholder="Search resources..."
                options={resources.map(resource => ({
                    value: resource.Name,
                    label: resource.Name,
                    display: (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{resource.Name}</span>
                            {resource.ShortNames && resource.ShortNames.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {resource.ShortNames.join(', ')}
                                </Badge>
                            )}
                        </div>
                    )
                }))}
            />
        </div>
    );
};
