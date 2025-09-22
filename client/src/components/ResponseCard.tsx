import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Download, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ResponseCardProps {
    response: {
        id: string;
        request: {
            service: string;
            resource: string;
            verb: string;
            parameters: Array<{ key: string; value: string }>;
        };
        response: any;
        loading: boolean;
        error: string | null;
        duration: string;
        timestamp: Date;
    };
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ response }) => {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const formatJSON = (data: any) => {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    const copyToClipboard = async () => {
        try {
            const text = formatJSON(response.response);
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadJSON = () => {
        try {
            const text = formatJSON(response.response);
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `api-response-${response.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download:', err);
        }
    };

    const getStatusIcon = () => {
        if (response.loading) {
            return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
        }
        if (response.error) {
            return <XCircle className="h-4 w-4 text-red-500" />;
        }
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    };

    const getStatusBadge = () => {
        if (response.loading) {
            return <Badge variant="secondary">Loading...</Badge>;
        }
        if (response.error) {
            return <Badge variant="destructive">Error</Badge>;
        }
        return <Badge variant="default">Success</Badge>;
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleString();
    };

    const formatRequestInfo = () => {
        const { service, resource, verb, parameters } = response.request;
        let info = `${service}/${resource}/${verb}`;
        if (parameters.length > 0) {
            info += ` (${parameters.length} params)`;
        }
        return info;
    };

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getStatusIcon()}
                        <div>
                            <CardTitle className="text-lg font-mono">
                                {formatRequestInfo()}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge()}
                                {response.duration && (
                                    <Badge variant="outline" className="font-mono">
                                        {response.duration}
                                    </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(response.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {response.response && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    disabled={response.loading}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadJSON}
                                    disabled={response.loading}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent>
                    {/* Request Details */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-md">
                        <h4 className="font-semibold mb-2">Request Details</h4>
                        <div className="space-y-1 text-sm">
                            <div><strong>Service:</strong> {response.request.service}</div>
                            <div><strong>Resource:</strong> {response.request.resource}</div>
                            <div><strong>Verb:</strong> {response.request.verb}</div>
                            {response.request.parameters.length > 0 && (
                                <div>
                                    <strong>Parameters:</strong>
                                    <div className="ml-4 mt-1">
                                        {response.request.parameters.map((param, index) => (
                                            <div key={index} className="font-mono text-xs">
                                                {param.key}: {param.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Response Content */}
                    {response.loading && (
                        <div className="flex items-center justify-center py-8">
                            <Clock className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading response...</span>
                        </div>
                    )}

                    {response.error && (
                        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
                            <h4 className="font-semibold text-destructive mb-2">Error</h4>
                            <p className="text-sm text-destructive/80">{response.error}</p>
                        </div>
                    )}

                    {response.response && !response.loading && (
                        <div className="space-y-2">
                            <h4 className="font-semibold">Response</h4>
                            <Textarea
                                value={formatJSON(response.response)}
                                readOnly
                                className="min-h-[200px] font-mono text-sm resize-none"
                            />
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
};
