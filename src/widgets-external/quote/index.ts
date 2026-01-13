import type { Widget } from '../../core/types';
import { QuoteComponent } from './QuoteComponent';

export const widget: Widget = {
    id: 'quote-widget',
    name: 'Random Quote',
    description: 'Fetches a random inspirational quote',
    component: QuoteComponent,
    defaultSize: { w: 4, h: 4 },
    dataExportSchema: {
        description: 'Random inspirational quote (frontend-only widget)',
        fields: {
            content: {
                type: 'string',
                description: 'The quote text'
            },
            author: {
                type: 'string',
                description: 'Quote author name'
            },
            lastFetched: {
                type: 'string',
                description: 'ISO 8601 timestamp of when quote was fetched'
            }
        }
    }
};
