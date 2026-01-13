import React, { useEffect, useState } from 'react';
import type { WidgetProps } from '../../core/types';

export const ClockComponent: React.FC<WidgetProps> = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="widget-card flex-center-column text-center">
            <div className="text-large font-mono">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-primary text-small">
                {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
        </div>
    );
};
