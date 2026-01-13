import type { WidgetDefinition } from '../../core/types';
import { StockQuoteComponent } from './StockQuoteComponent';

export const widget: WidgetDefinition = {
  id: 'stock-quote',
  name: 'Stock Quote',
  description: 'Display real-time stock quotes from Yahoo Finance',
  component: StockQuoteComponent,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  maxSize: { w: 6, h: 4 },

  // Configuration schema - per-instance settings
  configSchema: {
    tickers: {
      type: 'array',
      label: 'Stock Tickers',
      description: 'List of stock ticker symbols (e.g., AAPL, MSFT, GOOGL)',
      default: ['AAPL'],
      itemType: 'string',
      itemLabel: 'Ticker Symbol'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (minutes)',
      description: 'How often to fetch stock data',
      default: 5,
      min: 1,
      max: 60
    }
  },

  // No secrets needed - Yahoo Finance API is public
  secretsSchema: {},

  // Backend configuration
  backend: {
    enabled: true,
    path: './backend.js'
  },

  // Data export for AI consumption
  dataExportSchema: {
    stocks: {
      type: 'array',
      description: 'Current stock quotes'
    },
    tickers: {
      type: 'array',
      description: 'List of tracked tickers'
    },
    lastUpdate: {
      type: 'string',
      description: 'Timestamp of last data update'
    }
  },

  // Tags for categorization
  tags: ['finance', 'stocks', 'real-time']
};
