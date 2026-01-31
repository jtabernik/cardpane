import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../config';

type SSEEvent = {
    type: string;
    data: any;
    timestamp: string;
};

type SSEContextType = {
    status: 'connecting' | 'connected' | 'error';
    logs: SSEEvent[];
    subscribe: (type: string, handler: (data: any) => void) => () => void;
    clearLogs: () => void;
};

const SSEContext = createContext<SSEContextType | null>(null);

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [logs, setLogs] = useState<SSEEvent[]>([]);
    const subscribers = useRef<Map<string, Set<(data: any) => void>>>(new Map());
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const es = new EventSource(API_ENDPOINTS.events);
        eventSourceRef.current = es;

        es.onopen = () => {
            console.log('[SSE Context] Connection opened');
            setStatus('connected');
        };

        es.onerror = (e) => {
            console.error('[SSE Context] Connection error', e);
            setStatus('error');
        };

        es.onmessage = (event) => {
            try {
                const parsed: SSEEvent = JSON.parse(event.data);

                // Track logs for the debugger
                setLogs(prev => [parsed, ...prev].slice(0, 100)); // Keep last 100

                // Dispatch to subscribers
                const typeSubscribers = subscribers.current.get(parsed.type);
                if (typeSubscribers) {
                    typeSubscribers.forEach(handler => handler(parsed.data));
                }

                // Also support wildcard subscribers
                const wildcardSubscribers = subscribers.current.get('*');
                if (wildcardSubscribers) {
                    wildcardSubscribers.forEach(handler => handler(parsed));
                }
            } catch (err) {
                console.error('[SSE Context] Failed to parse message', err);
            }
        };

        return () => {
            console.log('[SSE Context] Closing connection');
            es.close();
        };
    }, []);

    const subscribe = useCallback((type: string, handler: (data: any) => void) => {
        if (!subscribers.current.has(type)) {
            subscribers.current.set(type, new Set());
        }
        subscribers.current.get(type)!.add(handler);

        return () => {
            const set = subscribers.current.get(type);
            if (set) {
                set.delete(handler);
                if (set.size === 0) subscribers.current.delete(type);
            }
        };
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    return (
        <SSEContext.Provider value={{ status, logs, subscribe, clearLogs }}>
            {children}
        </SSEContext.Provider>
    );
};

export const useSSEContext = () => {
    const context = useContext(SSEContext);
    if (!context) throw new Error('useSSEContext must be used within an SSEProvider');
    return context;
};
