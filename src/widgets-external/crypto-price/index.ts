import type { Widget } from '../../core/types';
import { CryptoPriceComponent } from './CryptoPriceComponent';

/**
 * Cryptocurrency Price Widget
 *
 * Demonstrates both secrets (API key) and per-instance configuration (which coin to track).
 *
 * SECURITY MODEL:
 * - secretsSchema: API key stored on server, NEVER sent to frontend
 * - configSchema: Per-instance settings (coin symbol, display options) - safe for frontend
 *
 * Setup:
 * 1. Get a free API key from https://www.coingecko.com/en/api
 * 2. Click Settings → Widget Secrets → Configure Crypto Price
 * 3. Enter your API key
 * 4. Add widget instances and configure each to track different coins
 */
export const widget: Widget = {
  id: 'crypto-price-widget',
  name: 'Crypto Price',
  description: 'Track cryptocurrency prices in real-time',
  component: CryptoPriceComponent,
  defaultSize: { w: 2, h: 3 },
  supportedSizes: [{ w: 2, h: 2 }, { w: 2, h: 3 },{ w: 3, h: 3 }],

  // SECRETS (per-widget-type) - Apply to ALL instances
  // These are NEVER exposed to the frontend
  secretsSchema: {
    apiKey: {
      type: 'string',
      label: 'CoinGecko API Key',
      description: 'Your CoinGecko API key (optional for demo, required for production)',
      required: false,
      hint: 'Get a free key at https://www.coingecko.com/en/api'
    },
    apiEndpoint: {
      type: 'string',
      label: 'API Endpoint',
      description: 'Custom API endpoint (advanced)',
      required: false,
      default: 'https://api.coingecko.com/api/v3',
      hint: 'Leave default unless using a proxy'
    }
  },

  // CONFIGURATION (per-instance) - Each widget can track a different coin
  // These are safe to expose to frontend (non-sensitive)
  configSchema: {
    coinId: {
      type: 'select',
      label: 'Cryptocurrency',
      description: 'Which cryptocurrency to track',
      required: true,
      default: 'bitcoin',
      options: [
        'bitcoin',
        'ethereum',
        'cardano',
        'solana',
        'polkadot',
        'chainlink',
        'dogecoin',
        'ripple'
      ],
      hint: 'Select from popular cryptocurrencies'
    },
    currency: {
      type: 'select',
      label: 'Display Currency',
      description: 'Currency to display price in',
      required: false,
      default: 'usd',
      options: ['usd', 'eur', 'gbp', 'jpy', 'aud'],
      hint: 'Price will be shown in this currency'
    },
    showChange24h: {
      type: 'boolean',
      label: 'Show 24h Change',
      description: 'Display 24-hour price change percentage',
      required: false,
      default: true
    },
    showMarketCap: {
      type: 'boolean',
      label: 'Show Market Cap',
      description: 'Display market capitalization',
      required: false,
      default: false
    },
    alertThreshold: {
      type: 'number',
      label: 'Price Alert Threshold (%)',
      description: 'Alert when price changes by this percentage',
      required: false,
      min: 1,
      max: 50,
      hint: 'Leave empty to disable alerts'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to update prices',
      required: false,
      default: 60,
      min: 30,
      max: 300,
      hint: 'Free tier: max 1 req/minute'
    },
    enableCaching: {
      type: 'boolean',
      label: 'Enable Response Caching',
      description: 'Cache API responses to reduce requests',
      required: false,
      default: true,
      hint: 'Recommended to stay under rate limits'
    }
  },

  // AI Data Export Schema
  dataExportSchema: {
    description: 'Real-time cryptocurrency price data',
    fields: {
      coinId: {
        type: 'string',
        description: 'Cryptocurrency identifier'
      },
      price: {
        type: 'number',
        description: 'Current price in selected currency',
        unit: 'currency'
      },
      currency: {
        type: 'string',
        description: 'Display currency (e.g., USD, EUR)'
      },
      change24h: {
        type: 'number',
        description: '24-hour price change percentage',
        unit: 'percent'
      },
      marketCap: {
        type: 'number',
        description: 'Market capitalization',
        unit: 'currency'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last price update'
      }
    }
  }
};
