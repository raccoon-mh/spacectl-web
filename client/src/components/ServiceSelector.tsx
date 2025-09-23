import React from 'react';
import { SearchableSelect } from './ui/searchable-select';
import { Label } from './ui/label';

interface ServiceSelectorProps {
    services: string[];
    selectedService: string;
    onServiceChange: (service: string) => void;
    loading?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
    services,
    selectedService,
    onServiceChange,
    loading = false,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="service-select" className="text-sm font-medium">
                Service ({services.length})
            </Label>
            <SearchableSelect
                value={selectedService}
                onValueChange={onServiceChange}
                placeholder={loading ? "Loading..." : "Choose service"}
                disabled={loading || services.length === 0}
                searchPlaceholder="Search services..."
                options={services
                    .sort((a, b) => a.localeCompare(b))
                    .map(service => ({
                        value: service,
                        label: service,
                        display: <span className="font-mono text-sm">{service}</span>
                    }))}
            />
        </div>
    );
};
