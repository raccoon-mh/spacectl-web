import { useState, useCallback } from 'react';
import { APIResponse, Resource, Parameter } from '../types/api';
import { API_BASE_URL } from '../constants/api';

// Simple cache implementation
class APICache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private readonly TTL = 5 * 60 * 1000; // 5 minutes

    set(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    get(key: string) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new APICache();

export const useAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAPI = useCallback(async <T>(
        endpoint: string,
        useCache: boolean = true
    ): Promise<APIResponse<T> | null> => {
        const cacheKey = endpoint;

        // Check cache first
        if (useCache) {
            const cached = cache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            const data: APIResponse<T> = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}`);
            }

            // Cache successful responses
            if (useCache && data.success) {
                cache.set(cacheKey, data);
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchServices = useCallback(async (): Promise<string[]> => {
        const response = await fetchAPI<string[]>('/api/services');
        return response?.data || [];
    }, [fetchAPI]);

    const fetchResources = useCallback(async (service: string): Promise<Resource[]> => {
        const response = await fetchAPI<Resource[]>(`/api/services/${service}/resources`);
        return response?.data || [];
    }, [fetchAPI]);

    const callGRPCMethod = useCallback(async (
        service: string,
        resource: string,
        verb: string,
        parameters?: Parameter[]
    ): Promise<any> => {
        const endpoint = `/api/services/${service}/resources/${resource}/verbs/${verb}`;

        setLoading(true);
        setError(null);

        try {
            // Convert Parameter[] to Record<string, any>
            const paramsObject: Record<string, any> = {};
            if (parameters) {
                parameters.forEach(param => {
                    paramsObject[param.key] = param.value;
                });
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paramsObject),
            });

            const data: APIResponse = await response.json();

            if (!response.ok) {
                // Create a detailed error object with backend error information
                const errorDetails = data.error ? {
                    code: data.error.code,
                    message: data.error.message,
                    details: data.error.details
                } : {
                    code: response.status,
                    message: `HTTP ${response.status}`,
                    details: 'No error details provided'
                };

                const error = new Error(errorDetails.message);
                (error as any).details = errorDetails;
                throw error;
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCache = useCallback(() => {
        cache.clear();
    }, []);

    return {
        loading,
        error,
        fetchServices,
        fetchResources,
        callGRPCMethod,
        clearCache,
    };
};
