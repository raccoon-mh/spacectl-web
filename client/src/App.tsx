import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ServiceSelector } from './components/ServiceSelector';
import { ResourceSelector } from './components/ResourceSelector';
import { VerbSelector } from './components/VerbSelector';
import { ParameterInput } from './components/ParameterInput';
import { ResponseCard } from './components/ResponseCard';
import { useAPI } from './hooks/useAPI';
import { Resource, Parameter } from './types/api';
import { Play, RefreshCw, Trash2 } from 'lucide-react';

function App() {
  const { loading, error, fetchServices, fetchResources, callGRPCMethod, clearCache } = useAPI();

  // State management
  const [services, setServices] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [selectedVerb, setSelectedVerb] = useState<string>('');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [responses, setResponses] = useState<Array<{
    id: string;
    request: {
      service: string;
      resource: string;
      verb: string;
      parameters: Parameter[];
    };
    response: any;
    loading: boolean;
    error: string | null;
    duration: string;
    timestamp: Date;
  }>>([]);

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      const serviceList = await fetchServices();
      setServices(serviceList);
    };
    loadServices();
  }, [fetchServices]);

  // Load resources when service changes
  useEffect(() => {
    if (selectedService) {
      const loadResources = async () => {
        const resourceList = await fetchResources(selectedService);
        setResources(resourceList);
        setSelectedResource(''); // Reset resource selection
        setSelectedVerb(''); // Reset verb selection
      };
      loadResources();
    } else {
      setResources([]);
      setSelectedResource('');
      setSelectedVerb('');
    }
  }, [selectedService, fetchResources]);

  // Reset verb when resource changes
  useEffect(() => {
    setSelectedVerb('');
  }, [selectedResource]);

  // Get available verbs for selected resource
  const availableVerbs = selectedResource
    ? resources.find(r => r.Name === selectedResource)?.Verbs || []
    : [];

  // Execute API call
  const executeAPICall = async () => {
    if (!selectedService || !selectedResource || !selectedVerb) {
      return;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newResponse = {
      id: requestId,
      request: {
        service: selectedService,
        resource: selectedResource,
        verb: selectedVerb,
        parameters: [...parameters],
      },
      response: null,
      loading: true,
      error: null,
      duration: '',
      timestamp: new Date(),
    };

    // Add new response to the top of the list
    setResponses(prev => [newResponse, ...prev]);

    try {
      const startTime = Date.now();
      const result = await callGRPCMethod(selectedService, selectedResource, selectedVerb, parameters);
      const endTime = Date.now();

      // Update the response
      setResponses(prev => prev.map(resp =>
        resp.id === requestId
          ? {
            ...resp,
            response: result?.data || result,
            loading: false,
            duration: result?.duration || `${(endTime - startTime).toFixed(2)}ms`,
            error: result?.success === false ? result.error?.message : null
          }
          : resp
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResponses(prev => prev.map(resp =>
        resp.id === requestId
          ? { ...resp, error: errorMessage, loading: false }
          : resp
      ));
    }
  };

  // Reset all selections
  const resetAll = () => {
    setSelectedService('');
    setSelectedResource('');
    setSelectedVerb('');
    setParameters([]);
    setResponses([]);
  };

  // Clear cache
  const handleClearCache = () => {
    clearCache();
    // Reload services to refresh cache
    const loadServices = async () => {
      const serviceList = await fetchServices();
      setServices(serviceList);
    };
    loadServices();
  };

  const canExecute = selectedService && selectedResource && selectedVerb;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">spacectl-WEB</h1>
              <p className="text-muted-foreground mt-2">
                Interactive gRPC API explorer for SpaceONE services
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearCache}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                onClick={resetAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Panel - Fixed at top */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
                loading={loading}
              />

              <ResourceSelector
                resources={resources}
                selectedResource={selectedResource}
                onResourceChange={setSelectedResource}
                loading={loading}
                disabled={!selectedService}
              />

              <VerbSelector
                verbs={availableVerbs}
                selectedVerb={selectedVerb}
                onVerbChange={setSelectedVerb}
                disabled={!selectedResource}
              />

              <div className="flex items-end">
                <Button
                  onClick={executeAPICall}
                  disabled={!canExecute}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              </div>
            </div>

            <ParameterInput
              parameters={parameters}
              onParametersChange={setParameters}
              disabled={!selectedVerb}
            />
          </CardContent>
        </Card>

        {/* Response History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Response History</h2>
            <Badge variant="outline">{responses.length} requests</Badge>
          </div>

          {responses.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No API calls yet. Configure and execute a request above.</p>
              </CardContent>
            </Card>
          )}

          {responses.map((resp) => (
            <ResponseCard key={resp.id} response={resp} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p>SpaceONE gRPC API Client - Built with React & shadcn/ui</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {services.length} Services
              </Badge>
              <Badge variant="outline">
                {resources.length} Resources
              </Badge>
              <Badge variant="outline">
                {availableVerbs.length} Verbs
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
