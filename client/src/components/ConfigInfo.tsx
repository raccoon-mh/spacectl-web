import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings, User, FileText, Server, X } from 'lucide-react';
import { API_BASE_URL } from '../constants/api';

interface JWTInfo {
    header: Record<string, any>;
    payload: Record<string, any>;
}

interface ConfigInfoData {
    config_file_path: string;
    endpoints: Record<string, string>;
    jwt_info?: JWTInfo;
}

interface ConfigInfoProps {
    onClose?: () => void;
}

export const ConfigInfo: React.FC<ConfigInfoProps> = ({ onClose }) => {
    const [configInfo, setConfigInfo] = useState<ConfigInfoData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/configinfo`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setConfigInfo(data.data);
            } else {
                setError(data.error?.message || 'Failed to fetch config info');
            }
        } catch (err) {
            console.error('ConfigInfo fetch error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigInfo();
    }, []);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const getTokenTypeColor = (type: string) => {
        switch (type) {
            case 'SYSTEM_TOKEN':
                return 'bg-blue-100 text-blue-800';
            case 'USER_TOKEN':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-2xl mx-4">
                    <CardContent className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading config information...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuration Information
                    </CardTitle>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {error ? (
                        <div className="text-center text-destructive">
                            <p>Error: {error}</p>
                            <Button onClick={fetchConfigInfo} className="mt-2">
                                Retry
                            </Button>
                        </div>
                    ) : configInfo ? (
                        <>
                            {/* Config File Path */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Config File Path</span>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <code className="text-sm">{configInfo.config_file_path}</code>
                                </div>
                            </div>

                            {/* Endpoints */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Endpoints ({Object.keys(configInfo.endpoints).length})</span>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(configInfo.endpoints).map(([service, endpoint]) => (
                                        <div key={service} className="p-3 bg-muted/50 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-sm font-medium">{service}</span>
                                                <code className="text-sm text-muted-foreground">{endpoint}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* JWT Information */}
                            {configInfo.jwt_info && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">JWT Token Information</span>
                                    </div>

                                    {/* JWT Header */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Header</h4>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            <pre className="text-xs overflow-x-auto">
                                                {JSON.stringify(configInfo.jwt_info.header, null, 2)}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* JWT Payload */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Payload</h4>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            <div className="space-y-3">
                                                {/* Token Type */}
                                                {configInfo.jwt_info.payload.typ && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Type:</span>
                                                        <Badge className={getTokenTypeColor(configInfo.jwt_info.payload.typ)}>
                                                            {configInfo.jwt_info.payload.typ}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Issuer */}
                                                {configInfo.jwt_info.payload.iss && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Issuer:</span>
                                                        <code className="text-sm">{configInfo.jwt_info.payload.iss}</code>
                                                    </div>
                                                )}

                                                {/* Domain ID */}
                                                {configInfo.jwt_info.payload.did && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Domain ID:</span>
                                                        <code className="text-sm">{configInfo.jwt_info.payload.did}</code>
                                                    </div>
                                                )}

                                                {/* Audience */}
                                                {configInfo.jwt_info.payload.aud && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Audience:</span>
                                                        <code className="text-sm">{configInfo.jwt_info.payload.aud}</code>
                                                    </div>
                                                )}

                                                {/* Issued At */}
                                                {configInfo.jwt_info.payload.iat && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Issued At:</span>
                                                        <code className="text-sm">{formatTimestamp(configInfo.jwt_info.payload.iat)}</code>
                                                    </div>
                                                )}

                                                {/* Expires At */}
                                                {configInfo.jwt_info.payload.exp && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Expires At:</span>
                                                        <code className="text-sm">{formatTimestamp(configInfo.jwt_info.payload.exp)}</code>
                                                    </div>
                                                )}

                                                {/* Version */}
                                                {configInfo.jwt_info.payload.ver && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Version:</span>
                                                        <Badge variant="outline">{configInfo.jwt_info.payload.ver}</Badge>
                                                    </div>
                                                )}

                                                {/* Full Payload */}
                                                <details className="mt-4">
                                                    <summary className="text-sm font-medium cursor-pointer">Full Payload</summary>
                                                    <pre className="text-xs mt-2 p-2 bg-background border rounded overflow-x-auto">
                                                        {JSON.stringify(configInfo.jwt_info.payload, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
};
