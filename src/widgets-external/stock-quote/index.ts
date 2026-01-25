import type { Widget } from '../../core/types';
import { StockQuoteComponent } from './StockQuoteComponent';

export const widget: Widget = {
  id: 'stock-quote-widget',
  name: 'Stock Quote',
  description: 'Real-time stock quotes via Yahoo Finance (no API key required)',
  component: StockQuoteComponent,
  defaultSize: { w: 2, h: 2 },

  configSchema: {
    tickers: {
      type: 'string',
      label: 'Stock Tickers',
      description: 'Comma-separated list of ticker symbols',
      required: true,
      default: 'AAPL,MSFT',
      hint: 'e.g., AAPL,MSFT,GOOGL,NVDA'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (minutes)',
      description: 'How often to fetch stock data',
      required: false,
      default: 5,
      min: 1,
      max: 60,
      hint: 'Yahoo Finance is free - no rate limits'
    }
  },

  dataExportSchema: {
    description: 'Real-time stock market data from Yahoo Finance',
    fields: {
      stocks: {
        type: 'array',
        description: 'Array of stock quote objects'
      },
      ticker: {
        type: 'string',
        description: 'Stock ticker symbol'
      },
      name: {
        type: 'string',
        description: 'Company short name'
      },
      price: {
        type: 'number',
        description: 'Current market price',
        unit: 'currency'
      },
      change: {
        type: 'number',
        description: 'Price change from previous close',
        unit: 'currency'
      },
      changePercent: {
        type: 'number',
        description: 'Percentage change from previous close',
        unit: 'percent'
      },
      dayHigh: {
        type: 'number',
        description: 'Highest price today',
        unit: 'currency'
      },
      dayLow: {
        type: 'number',
        description: 'Lowest price today',
        unit: 'currency'
      },
      volume: {
        type: 'number',
        description: 'Trading volume today'
      },
      marketCap: {
        type: 'number',
        description: 'Market capitalization',
        unit: 'currency'
      },
      fiftyTwoWeekHigh: {
        type: 'number',
        description: '52-week high price',
        unit: 'currency'
      },
      fiftyTwoWeekLow: {
        type: 'number',
        description: '52-week low price',
        unit: 'currency'
      },
      marketState: {
        type: 'string',
        description: 'Market state (REGULAR, PRE, POST, CLOSED)'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last update'
      }
    }
  }
};
