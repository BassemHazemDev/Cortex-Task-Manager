import { useState, useMemo, useCallback, useEffect } from 'react';
import { loadAppSetting, saveAppSetting } from '../utils/storage';

/**
 * Custom hook for searching and filtering items with highlighting support.
 * 
 * @param {Array} items - Array of items to search through
 * @param {Array<string>} searchFields - Fields to search in (e.g., ['title', 'description', 'tags'])
 * @returns {Object} Search state and utilities
 */
export function useSearch(items, searchFields = ['title', 'description']) {
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load recent searches from storage on mount
    useEffect(() => {
        const loadRecentSearches = async () => {
            const saved = await loadAppSetting('recentSearches', []);
            setRecentSearches(saved);
            setIsLoading(false);
        };
        loadRecentSearches();
    }, []);

    // Filter items based on query
    const results = useMemo(() => {
        if (!query.trim()) return items;

        const lowerQuery = query.toLowerCase().trim();
        const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 0);

        return items.filter(item =>
            queryTerms.every(term =>
                searchFields.some(field => {
                    const value = item[field];
                    if (Array.isArray(value)) {
                        // Handle array fields like tags
                        return value.some(v =>
                            String(v).toLowerCase().includes(term)
                        );
                    }
                    return value && String(value).toLowerCase().includes(term);
                })
            )
        );
    }, [items, query, searchFields]);

    // Add search term to recent searches
    const addToRecent = useCallback(async (term) => {
        if (!term.trim()) return;

        const trimmedTerm = term.trim();
        setRecentSearches(prev => {
            const updated = [trimmedTerm, ...prev.filter(t => t !== trimmedTerm)].slice(0, 5);
            saveAppSetting('recentSearches', updated);
            return updated;
        });
    }, []);

    // Clear recent searches
    const clearRecentSearches = useCallback(async () => {
        setRecentSearches([]);
        await saveAppSetting('recentSearches', []);
    }, []);

    // Apply a recent search
    const applyRecentSearch = useCallback((term) => {
        setQuery(term);
    }, []);

    // Clear current search
    const clearSearch = useCallback(() => {
        setQuery('');
    }, []);

    return {
        query,
        setQuery,
        results,
        recentSearches,
        addToRecent,
        clearRecentSearches,
        applyRecentSearch,
        clearSearch,
        isLoading,
        hasQuery: query.trim().length > 0,
        resultCount: results.length,
    };
}

/**
 * Highlights matching text in a string.
 * Returns an array of { text, isMatch } objects for rendering.
 * 
 * @param {string} text - The text to highlight in
 * @param {string} query - The search query
 * @returns {Array<{text: string, isMatch: boolean}>} Segments with match info
 */
export function highlightMatches(text, query) {
    if (!query || !text) return [{ text: text || '', isMatch: false }];

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0);

    if (terms.length === 0) return [{ text, isMatch: false }];

    // Find all match positions
    const matches = [];
    for (const term of terms) {
        let startIndex = 0;
        while (startIndex < lowerText.length) {
            const index = lowerText.indexOf(term, startIndex);
            if (index === -1) break;
            matches.push({ start: index, end: index + term.length });
            startIndex = index + 1;
        }
    }

    if (matches.length === 0) return [{ text, isMatch: false }];

    // Sort and merge overlapping matches
    matches.sort((a, b) => a.start - b.start);
    const merged = [matches[0]];
    for (let i = 1; i < matches.length; i++) {
        const last = merged[merged.length - 1];
        if (matches[i].start <= last.end) {
            last.end = Math.max(last.end, matches[i].end);
        } else {
            merged.push(matches[i]);
        }
    }

    // Build result segments
    const result = [];
    let lastEnd = 0;
    for (const match of merged) {
        if (match.start > lastEnd) {
            result.push({ text: text.slice(lastEnd, match.start), isMatch: false });
        }
        result.push({ text: text.slice(match.start, match.end), isMatch: true });
        lastEnd = match.end;
    }
    if (lastEnd < text.length) {
        result.push({ text: text.slice(lastEnd), isMatch: false });
    }

    return result;
}

export default useSearch;
