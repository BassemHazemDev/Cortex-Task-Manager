import { useState, useCallback, useMemo } from 'react';
import haptics from '../utils/haptics';

/**
 * Custom hook for managing bulk selection and actions on items.
 * 
 * @returns {Object} Bulk action state and utilities
 */
export function useBulkActions() {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Toggle selection of a single item
    const toggleSelect = useCallback((id) => {
        haptics.light();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Select all items from a given list
    const selectAll = useCallback((ids) => {
        haptics.medium();
        setSelectedIds(new Set(ids));
    }, []);

    // Deselect all items
    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Clear selection and exit select mode
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectMode(false);
    }, []);

    // Enter select mode
    const enterSelectMode = useCallback(() => {
        haptics.light();
        setIsSelectMode(true);
    }, []);

    // Exit select mode and clear selection
    const exitSelectMode = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectMode(false);
    }, []);

    // Check if an item is selected
    const isSelected = useCallback((id) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    // Get selected IDs as array
    const selectedArray = useMemo(() => {
        return Array.from(selectedIds);
    }, [selectedIds]);

    return {
        // State
        selectedIds,
        selectedArray,
        isSelectMode,

        // Computed
        hasSelection: selectedIds.size > 0,
        selectionCount: selectedIds.size,

        // Actions
        toggleSelect,
        selectAll,
        deselectAll,
        clearSelection,
        enterSelectMode,
        exitSelectMode,
        isSelected,
        setIsSelectMode,
    };
}

export default useBulkActions;
