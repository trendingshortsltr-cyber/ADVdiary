'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Template {
    id: string;
    title: string;
    category: string;
    default_notes: string;
    default_tasks?: string[];
}

interface CaseTemplateSelectorProps {
    onSelect: (template: Template) => void;
}

export function CaseTemplateSelector({ onSelect }: CaseTemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('case_templates')
                .select('*');

            if (!error && data) {
                setTemplates(data);
            }
            setLoading(false);
        };

        fetchTemplates();
    }, []);

    if (loading) {
        return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Loading templates...</div>;
    }

    if (templates.length === 0) return null;

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
                Start from Template
            </label>
            <Select onValueChange={(val) => {
                const template = templates.find(t => t.id === val);
                if (template) onSelect(template);
            }}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a case template..." />
                </SelectTrigger>
                <SelectContent>
                    {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.title} <span className="text-secondary-foreground text-xs ml-2">({t.category})</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
