import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, Copy, Download, Maximize2 } from 'lucide-react';

interface JsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    title?: string;
}

export const JsonModal: React.FC<JsonModalProps> = ({ isOpen, onClose, data, title }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll when modal closes
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const formatJSON = (obj: any) => {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            return String(obj);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(formatJSON(data));
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([formatJSON(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'response'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="relative w-[95vw] h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-lg flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Maximize2 className="h-5 w-5 text-blue-600" />
                        <div>
                            <h3 className="text-lg font-semibold">{title || 'JSON Response'}</h3>
                            <p className="text-sm text-muted-foreground">Full Screen JSON View (Press ESC to close)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="flex items-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* JSON Content */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="h-full min-h-0">
                        <Textarea
                            value={formatJSON(data)}
                            readOnly
                            className="h-full font-mono text-sm resize-none border-0 focus:ring-0"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 rounded-b-lg flex-shrink-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            <p>💡 Tip: Use Ctrl+A to select all, Ctrl+C to copy the JSON content</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Full Screen Mode</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
