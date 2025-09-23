import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
} from '@tanstack/react-table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ExternalLink,
    Eye,
    EyeOff,
    Settings,
} from 'lucide-react';

interface AdvancedTableProps {
    data: any[];
    title?: string;
}

export const AdvancedTable: React.FC<AdvancedTableProps> = ({ data, title }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // Create columns based on the first object's keys
    const columns = useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        const firstItem = data[0];
        if (!firstItem || typeof firstItem !== 'object') {
            return [];
        }

        const keys = Object.keys(firstItem).sort();

        return keys.map((key) => ({
            accessorKey: key,
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                        {key}
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                );
            },
            cell: ({ getValue }: any) => {
                const value = getValue();
                return <TableCell value={value} />;
            },
        })) as ColumnDef<any>[];
    }, [data]);

    const table = useReactTable({
        data: data || [],
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    // Show empty table if data is empty
    if (!data || data.length === 0) {
        return (
            <div className="border rounded-lg p-4">
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <div className="text-center text-muted-foreground py-8">
                    No data to display.
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden h-full flex flex-col">
            {title && (
                <div className="px-4 py-3 border-b bg-muted/50 flex-shrink-0">
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
            )}

            {/* Search and Filter */}
            <div className="p-4 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search all..."
                            value={globalFilter ?? ''}
                            onChange={(event) => setGlobalFilter(String(event.target.value))}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">
                            Total {data.length} items
                        </Badge>
                        <Badge variant="outline">
                            {table.getFilteredRowModel().rows.length} shown
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="flex items-center gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            Column Settings
                        </Button>
                    </div>
                </div>

                {/* Column Settings Panel */}
                {showColumnSettings && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.toggleAllColumnsVisible(true)}
                                    className="text-xs"
                                >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Show All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.toggleAllColumnsVisible(false)}
                                    className="text-xs"
                                >
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide All
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {table.getAllColumns().map((column) => (
                                <div key={column.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={column.getIsVisible()}
                                        onChange={column.getToggleVisibilityHandler()}
                                        className="rounded"
                                    />
                                    <label className="text-sm font-medium">
                                        {column.id}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left font-medium text-sm border-b"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-muted/30 border-b">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-3 text-sm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Rows per page:
                        </span>
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value));
                            }}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            ({table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} items shown)
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Table cell component
const TableCell: React.FC<{ value: any }> = ({ value }) => {
    if (value === null) {
        return <span className="text-muted-foreground italic">null</span>;
    }

    if (value === undefined) {
        return <span className="text-muted-foreground italic">undefined</span>;
    }

    if (typeof value === 'boolean') {
        return (
            <Badge variant={value ? 'default' : 'secondary'}>
                {value ? 'true' : 'false'}
            </Badge>
        );
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return (
                <div className="max-w-xs">
                    <Badge variant="outline" className="mb-1">
                        Array ({value.length})
                    </Badge>
                    <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                        {value.slice(0, 3).map((item, index) => (
                            <div key={index} className="truncate">
                                {JSON.stringify(item)}
                            </div>
                        ))}
                        {value.length > 3 && <div>... {value.length - 3} more</div>}
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-xs">
                <Badge variant="outline" className="mb-1">
                    Object
                </Badge>
                <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    const stringValue = String(value);

    // Check if URL
    if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) {
        return (
            <a
                href={stringValue}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline truncate block max-w-xs"
                title={stringValue}
            >
                {stringValue}
            </a>
        );
    }

    // Handle long text
    if (stringValue.length > 50) {
        return (
            <div className="max-w-xs">
                <div className="truncate" title={stringValue}>
                    {stringValue}
                </div>
            </div>
        );
    }

    return <span>{stringValue}</span>;
};
