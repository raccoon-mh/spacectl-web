import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Maximize2 } from 'lucide-react';
import { AdvancedTable } from './AdvancedTable';

interface TableModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    title?: string;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, data, title }) => {
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="relative w-[95vw] h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Maximize2 className="h-5 w-5 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold">
                                {title || 'Data Table'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Full Screen Table View
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            Press ESC to close
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="h-full min-h-0">
                        <AdvancedTable
                            data={data}
                            title={undefined} // Title is shown in header, so undefined here
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            💡 Tip: Use search, sort, pagination, and column visibility features to explore data
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
