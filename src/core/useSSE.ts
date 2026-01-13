import { useEffect } from 'react';
import { useSSEContext } from './SSEContext';

type SSEHandler = (data: any) => void;

/**
 * Custom hook to subscribe to multiplexed SSE events.
 * Uses the shared SSEContext to avoid multiple connections.
 */
export function useSSE(eventType: string, onMessage: SSEHandler) {
    const { subscribe, status } = useSSEContext();

    useEffect(() => {
        const unsubscribe = subscribe(eventType, onMessage);
        return () => unsubscribe();
    }, [eventType, onMessage, subscribe]);

    return { status };
}
