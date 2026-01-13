import React, { useEffect, useState } from 'react';
import type { Widget, WidgetProps } from '../core/types';

const ClockComponent: React.FC<WidgetProps> = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'var(--dashboard-text)',
            textAlign: 'center'
        }}>
            <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1.2rem', opacity: 0.7 }}>Current Time</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
                {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
        </div>
    );
};

export const ClockWidget: Widget = {
    id: 'clock-widget',
    name: 'Digital Clock',
    description: 'Displays the current time and date',
    component: ClockComponent,
    defaultSize: { w: 3, h: 4 },
    supportedSizes: [{ w: 3, h: 4 }, { w: 6, h: 4 }]
};
