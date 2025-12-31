import { useState, useEffect, useCallback } from 'react';
import db from '../utils/db';

const DEFAULT_TEMPLATES = [
    {
        name: 'Text',
        descriptionType: 'text',
        defaults: {
            title: '',
            description: '',
            descriptionType: 'text'
        }
    },
    {
        name: 'List',
        descriptionType: 'list',
        defaults: {
            title: '',
            description: '- ',
            descriptionType: 'list'
        }
    },
    {
        name: 'Chunk',
        descriptionType: 'chunks',
        defaults: {
            title: '',
            description: '[Objective]\n\n[Key Results]\n\n[Context]',
            descriptionType: 'chunks'
        }
    }
];

export function useTaskTemplates() {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTemplates = useCallback(async () => {
        try {
            if (!db.templates) {
                // Fallback if schema wasn't updated or table missing
                setTemplates(DEFAULT_TEMPLATES);
                return;
            }


            const stored = await db.templates.toArray();

            // Check if we need to migrate (if stored contains old "Meeting" etc or duplicates)
            const hasOldTemplates = stored.some(t => ['Meeting', 'Deep Work', 'Email/Admin'].includes(t.name));
            const hasDuplicates = new Set(stored.map(t => t.name)).size !== stored.length;

            if (stored.length === 0 || hasOldTemplates || hasDuplicates) {
                // Clear and Seed defaults
                await db.templates.clear();
                await db.templates.bulkAdd(DEFAULT_TEMPLATES);
                setTemplates(DEFAULT_TEMPLATES);
            } else {
                setTemplates(stored);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates(DEFAULT_TEMPLATES);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const addTemplate = async (template) => {
        try {
            const id = await db.templates.add(template);
            setTemplates(prev => [...prev, { ...template, id }]);
            return id;
        } catch (error) {
            console.error('Error adding template:', error);
        }
    };

    const deleteTemplate = async (id) => {
        try {
            await db.templates.delete(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const applyTemplate = (template) => {
        return { ...template.defaults, descriptionType: template.descriptionType || 'text' };
    };

    return {
        templates,
        isLoading,
        addTemplate,
        deleteTemplate,
        applyTemplate
    };
}
