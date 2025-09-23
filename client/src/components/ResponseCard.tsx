import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Download, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Table, Eye, Maximize2 } from 'lucide-react';
import { AdvancedTable } from './AdvancedTable';
import { TableModal } from './TableModal';
import { JsonModal } from './JsonModal';

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
    const [viewMode, setViewMode] = useState<'json' | 'table'>('json');
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

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

    // Function to prepare table data
    const prepareTableData = (data: any) => {
        if (!data || typeof data !== 'object') {
            return [];
        }

        // If results array exists (e.g., plugin list)
        if (data.results && Array.isArray(data.results)) {
            return data.results;
        }

        // If direct array
        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                return data;
            } else {
                // Convert simple array to object array
                return data.map((item, index) => ({ index, value: item }));
            }
        }

        // If single object, convert to Key-Value format
        return Object.entries(data).map(([key, value]) => ({ key, value }));
    };

    // Function to render data in table format
    const renderTable = (data: any) => {
        const tableData = prepareTableData(data);

        if (tableData.length === 0) {
            return <div className="text-sm text-muted-foreground">Data cannot be displayed in table format.</div>;
        }

        // If results array exists
        if (data.results && Array.isArray(data.results)) {
            return <AdvancedTable data={tableData} title={`Results (${data.results.length} items)`} />;
        }

        // If direct array
        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                return <AdvancedTable data={tableData} title={`Array (${data.length} items)`} />;
            } else {
                return <AdvancedTable data={tableData} title={`Array (${data.length} items)`} />;
            }
        }

        // If single object
        return <AdvancedTable data={tableData} title="Object Properties" />;
    };

    // Generate table title for modal
    const getTableModalTitle = (data: any) => {
        if (data.results && Array.isArray(data.results)) {
            return `Results (${data.results.length} items)`;
        }
        if (Array.isArray(data)) {
            return `Array (${data.length} items)`;
        }
        return 'Object Properties';
    };

    return (
        <Card className={`border-l-4 ${response.error ? 'border-l-red-500 bg-red-50/30' : 'border-l-blue-500'}`}>
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
                                <div className="flex items-center gap-1 border rounded-md">
                                    <Button
                                        variant={viewMode === 'json' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('json')}
                                        disabled={response.loading}
                                        className="h-8 px-3"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        JSON
                                    </Button>
                                    <Button
                                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('table')}
                                        disabled={response.loading}
                                        className="h-8 px-3"
                                    >
                                        <Table className="h-4 w-4 mr-1" />
                                        Table
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (viewMode === 'json') {
                                            setIsJsonModalOpen(true);
                                        } else {
                                            setIsTableModalOpen(true);
                                        }
                                    }}
                                    disabled={response.loading}
                                    title={viewMode === 'json' ? "View Full Screen JSON" : "View Full Screen Table"}
                                >
                                    <Maximize2 className="h-4 w-4 mr-1" />
                                    Full Screen
                                </Button>
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
                        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                            <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Error
                            </h4>
                            <p className="text-sm text-red-600 font-mono">{response.error}</p>
                        </div>
                    )}

                    {response.response && !response.loading && (
                        <div className="space-y-2">
                            <h4 className="font-semibold">Response</h4>
                            {viewMode === 'json' ? (
                                <Textarea
                                    value={formatJSON(response.response)}
                                    readOnly
                                    className="min-h-[200px] font-mono text-sm resize-none"
                                />
                            ) : (
                                renderTable(response.response)
                            )}
                        </div>
                    )}
                </CardContent>
            )}

            {/* Full Screen JSON Modal */}
            {response.response && (
                <JsonModal
                    isOpen={isJsonModalOpen}
                    onClose={() => setIsJsonModalOpen(false)}
                    data={response.response}
                    title="API Response"
                />
            )}

            {/* Full Screen Table Modal */}
            {response.response && (
                <TableModal
                    isOpen={isTableModalOpen}
                    onClose={() => setIsTableModalOpen(false)}
                    data={prepareTableData(response.response)}
                    title={getTableModalTitle(response.response)}
                />
            )}
        </Card>
    );
};
