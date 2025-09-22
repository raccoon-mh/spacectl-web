import React from 'react';
import { SearchableSelect } from './ui/searchable-select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface VerbSelectorProps {
    verbs: string[];
    selectedVerb: string;
    onVerbChange: (verb: string) => void;
    disabled?: boolean;
}

export const VerbSelector: React.FC<VerbSelectorProps> = ({
    verbs,
    selectedVerb,
    onVerbChange,
    disabled = false,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="verb-select" className="text-sm font-medium">
                Verb ({verbs.length})
            </Label>
            <SearchableSelect
                value={selectedVerb}
                onValueChange={onVerbChange}
                placeholder={
                    disabled
                        ? "Select resource first"
                        : "Choose verb"
                }
                disabled={disabled || verbs.length === 0}
                searchPlaceholder="Search verbs..."
                options={verbs.map(verb => ({
                    value: verb,
                    label: verb,
                    display: (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{verb}</span>
                            <Badge
                                variant={
                                    verb === 'list' ? 'default' :
                                        verb === 'get' ? 'secondary' :
                                            verb.includes('register') || verb.includes('create') ? 'default' :
                                                verb.includes('update') || verb.includes('modify') ? 'secondary' :
                                                    verb.includes('delete') || verb.includes('remove') ? 'destructive' :
                                                        'outline'
                                }
                                className="text-xs"
                            >
                                {verb === 'list' ? 'READ' :
                                    verb === 'get' ? 'READ' :
                                        verb.includes('register') || verb.includes('create') ? 'CREATE' :
                                            verb.includes('update') || verb.includes('modify') ? 'UPDATE' :
                                                verb.includes('delete') || verb.includes('remove') ? 'DELETE' :
                                                    'ACTION'}
                            </Badge>
                        </div>
                    )
                }))}
            />
        </div>
    );
};
