import type { Widget } from '../../core/types';
import { ClockComponent } from './ClockComponent';

export const widget: Widget = {
    id: 'clock-widget',
    name: 'Digital Clock',
    description: 'Displays the current time and date',
    component: ClockComponent,
    defaultSize: { w: 1, h: 1 },
    supportedSizes: [{ w: 1, h: 1 }, { w: 1, h: 2 }],
    dataExportSchema: {
        description: 'Current time and date information (frontend-only widget)',
        fields: {
            timestamp: {
                type: 'string',
                description: 'ISO 8601 timestamp of current time'
            },
            localTime: {
                type: 'string',
                description: 'Formatted local time string'
            },
            timezone: {
                type: 'string',
                description: 'Client timezone identifier'
            }
        }
    }
};
