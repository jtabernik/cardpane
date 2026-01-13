import type { Widget } from '../../core/types';
import { HeartbeatComponent } from './HeartbeatComponent';

export const widget: Widget = {
    id: 'heartbeat-widget',
    name: 'Server Heartbeat',
    description: 'Monitors the server health via SSE pulses every 5 minutes',
    component: HeartbeatComponent,
    defaultSize: { w: 2, h: 2 },
    supportedSizes: [{ w: 2, h: 2 }],
    dataExportSchema: {
        description: 'Server health monitoring via periodic heartbeat pulses',
        fields: {
            pulseCount: {
                type: 'number',
                description: 'Total number of heartbeat pulses received'
            },
            lastPulse: {
                type: 'string',
                description: 'ISO 8601 timestamp of last heartbeat'
            },
            isAlive: {
                type: 'boolean',
                description: 'Whether server is responding to heartbeat checks'
            },
            uptimeSeconds: {
                type: 'number',
                description: 'Server uptime in seconds',
                unit: 'seconds'
            }
        }
    }
};
