import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSEContext } from '../../core/SSEContext';

export const SSEDebuggerComponent: React.FC<WidgetProps> = () => {
    const { logs, clearLogs } = useSSEContext();
    const [filter, setFilter] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredLogs = useMemo(() => {
        if (!filter.trim()) return logs;
        const search = filter.toLowerCase();
        return logs.filter(log =>
            log.type.toLowerCase().includes(search) ||
            JSON.stringify(log.data).toLowerCase().includes(search)
        );
    }, [logs, filter]);

    // Auto-scroll to top when new logs arrive (since logs are unshifted)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs.length]);

    return (
        <div className="widget-card flex-column text-small">
            <div className="flex-space-between mb-medium">
                <h3 className="m-none text-primary text-small-title">SSE Debugger</h3>
                <button
                    onClick={clearLogs}
                    className="btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                    Clear
                </button>
            </div>

            <input
                type="text"
                placeholder="Filter by widget name or data..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-text mb-medium"
            />

            <div
                ref={scrollRef}
                className="scrollable-container font-mono flex-column gap-small"
            >
                {filteredLogs.length === 0 ? (
                    <div className="text-muted text-center mt-xlarge">
                        No matching logs
                    </div>
                ) : (
                    filteredLogs.map((log, i) => (
                        <div
                            key={i}
                            className={`log-entry ${i === 0 ? 'indicator-left' : 'indicator-left inactive'}`}
                        >
                            <div className="log-entry-header">
                                <span className="text-accent font-semibold">{log.type}</span>
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-break">
                                {JSON.stringify(log.data)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
