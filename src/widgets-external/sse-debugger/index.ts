import type { Widget } from '../../core/types';
import { SSEDebuggerComponent } from './SSEDebuggerComponent';

export const widget: Widget = {
    id: 'sse-debugger-widget',
    name: 'SSE Debugger',
    description: 'Monitors all real-time SSE traffic with filtering',
    component: SSEDebuggerComponent,
    defaultSize: { w: 4, h: 4 },
    dataExportSchema: {
        description: 'SSE event log and connection status (frontend-only widget)',
        fields: {
            connectionStatus: {
                type: 'string',
                description: 'SSE connection status (connected, disconnected, reconnecting)'
            },
            totalEvents: {
                type: 'number',
                description: 'Total number of SSE events received'
            },
            eventTypes: {
                type: 'array',
                description: 'List of unique event types seen'
            },
            lastEventTime: {
                type: 'string',
                description: 'ISO 8601 timestamp of most recent event'
            }
        }
    }
};
