import React, { useState, useCallback } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

export const HeartbeatComponent: React.FC<WidgetProps> = () => {
    const [lastPulse, setLastPulse] = useState<string | null>(null);
    const [pulseCount, setPulseCount] = useState(0);

    const handleHeartbeat = useCallback((_data: any) => {
        setLastPulse(new Date().toLocaleTimeString());
        setPulseCount(prev => prev + 1);
    }, []);

    const { status } = useSSE('heartbeat', handleHeartbeat);

    return (
        <div className="widget-card flex-center-column text-center">
            <div
                className={`status-pulse ${status === 'connected' ? 'active' : 'inactive'}`}
                style={{
                    width: '40px',
                    height: '40px',
                    background: status === 'connected' ? '#ff4757' : '#747d8c',
                    marginBottom: '10px',
                    animation: status === 'connected' ? 'heartbeat-pulse 2s infinite' : 'none',
                    boxShadow: status === 'connected' ? '0 0 15px rgba(255, 71, 87, 0.5)' : 'none'
                }}
            />

            <h3 className="m-none text-primary text-small-title">Server Heartbeat</h3>

            <div className="mt-medium">
                {lastPulse ? (
                    <>
                        <div className="text-medium-title">Pulse #{pulseCount}</div>
                        <div className="text-label">Last: {lastPulse}</div>
                    </>
                ) : (
                    <div className="text-label text-secondary">
                        {status === 'connecting' ? 'Connecting to pulse...' : 'Waiting for first pulse (5min)...'}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes heartbeat-pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};
