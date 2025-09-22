import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
    value: string;
    label: string;
    display?: React.ReactNode;
}

interface SearchableSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    options?: Option[];
    searchPlaceholder?: string;
    className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    value,
    onValueChange,
    placeholder = "Select an option",
    disabled = false,
    options = [],
    searchPlaceholder = "Search...",
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
    const selectRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setFilteredOptions(options);
            return;
        }

        if (!searchTerm.trim()) {
            setFilteredOptions(options);
            return;
        }

        const filtered = options.filter((option) => {
            return option.label.toLowerCase().includes(searchTerm.toLowerCase());
        });

        setFilteredOptions(filtered);
    }, [options, searchTerm, isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (newValue: string) => {
        onValueChange(newValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange('');
        setIsOpen(false);
        setSearchTerm('');
    };

    const getDisplayValue = () => {
        if (!value) return placeholder;

        const selectedOption = options.find(option => option.value === value);
        return selectedOption ? selectedOption.label : value;
    };

    return (
        <div ref={selectRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-2 ring-ring ring-offset-2"
                )}
            >
                <span className={cn("truncate", !value && "text-muted-foreground")}>
                    {getDisplayValue()}
                </span>
                <div className="flex items-center gap-1">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        option.value === value && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {option.display || option.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
