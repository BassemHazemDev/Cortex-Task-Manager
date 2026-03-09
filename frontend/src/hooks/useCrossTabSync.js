import { useEffect } from 'react';

/**
 * Custom hook for cross-tab synchronization using BroadcastChannel.
 * @param {Function} onSync - Callback function to handle sync events. 
 *                            Receives the type of data updated ('tasks', 'todos', etc.)
 */
export function useCrossTabSync(onSync) {
    useEffect(() => {
        const channel = new BroadcastChannel('cortex-sync');

        channel.onmessage = (event) => {
            if (event.data && event.data.type) {
                if (event.data.type === 'TASKS_UPDATED') {
                    onSync('tasks');
                } else if (event.data.type === 'TODOS_UPDATED') {
                    onSync('todos');
                }
            }
        };

        return () => channel.close();
    }, [onSync]);
}

/**
 * Broadcasts a sync event to other tabs.
 * @param {string} type - The type of data updated (e.g., 'TASKS_UPDATED', 'TODOS_UPDATED')
 */
export function broadcastSync(type) {
    const channel = new BroadcastChannel('cortex-sync');
    channel.postMessage({ type, timestamp: Date.now() });
    channel.close();
}
