import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Download, RefreshCw } from 'lucide-react';

interface ResponseDisplayProps {
    response: any;
    loading?: boolean;
    error?: string | null;
    duration?: string;
    onRetry?: () => void;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
    response,
    loading = false,
    error = null,
    duration,
    onRetry,
}) => {
    const [copied, setCopied] = React.useState(false);

    const formatJSON = (data: any) => {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    const copyToClipboard = async () => {
        try {
            const text = formatJSON(response);
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadJSON = () => {
        try {
            const text = formatJSON(response);
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `api-response-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download:', err);
        }
    };

    const getStatusBadge = () => {
        if (loading) {
            return <Badge variant="secondary">Loading...</Badge>;
        }
        if (error) {
            return <Badge variant="destructive">Error</Badge>;
        }
        if (response) {
            return <Badge variant="default">Success</Badge>;
        }
        return <Badge variant="outline">No Response</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span>5. Response</span>
                        {getStatusBadge()}
                        {duration && (
                            <Badge variant="outline" className="font-mono">
                                {duration}
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {response && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    disabled={loading}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadJSON}
                                    disabled={loading}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </>
                        )}
                        {error && onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                disabled={loading}
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading response...</span>
                    </div>
                )}

                {error && (
                    <div className="space-y-2">
                        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
                            <h4 className="font-semibold text-destructive mb-2">Error</h4>
                            <p className="text-sm text-destructive/80">{error}</p>
                        </div>
                    </div>
                )}

                {response && !loading && (
                    <div className="space-y-2">
                        <Textarea
                            value={formatJSON(response)}
                            readOnly
                            className="min-h-[300px] font-mono text-sm resize-none"
                            placeholder="Response will appear here..."
                        />
                    </div>
                )}

                {!response && !loading && !error && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No response yet. Configure and execute an API call above.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
