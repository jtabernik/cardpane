import { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

interface CryptoData {
  coinId: string;
  coinName: string;
  price: number;
  currency: string;
  change24h: number;
  marketCap: number;
  lastUpdate: string;
  instanceId?: string;
  error?: string;
}

/**
 * Crypto Price Widget - Frontend Component
 *
 * SECURITY NOTE:
 * - This component NEVER receives the API key
 * - It only receives the price data broadcast from the backend
 * - All sensitive operations happen server-side
 * - Config (coinId, currency) is safe to access here
 */
export const CryptoPriceComponent: React.FC<WidgetProps> = ({ id, config }) => {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);

  // Get config values (these are safe - NOT secrets)
  const showChange24h = config?.showChange24h !== false;
  const showMarketCap = config?.showMarketCap === true;

  // Subscribe to crypto price updates via SSE
  const { status } = useSSE('crypto-price-widget', (data) => {
    // Filter to only this widget instance's data
    if (data.instanceId === id) {
      setCryptoData(data as CryptoData);
    }
  });

  // Loading state
  if (!cryptoData) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-label">
          {status === 'connecting' ? 'Connecting...' : 'Loading crypto data...'}
        </div>
      </div>
    );
  }

  // Error state
  if (cryptoData.error) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-medium">{cryptoData.coinName}</div>
        <div className="text-error">{cryptoData.error}</div>
        <div className="text-small mt-medium">
          Check Settings → Widget Secrets to configure API
        </div>
      </div>
    );
  }

  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
    }
  };

  // Format market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const isPositiveChange = cryptoData.change24h >= 0;
  const changeIcon = isPositiveChange ? '▲' : '▼';

  return (
    <div className="widget-card flex-center-column text-center">
      {/* Coin Name */}
      <div className="text-small-title mb-small opacity-primary">
        {cryptoData.coinName}
      </div>

      {/* Price */}
      <div className="text-large-bold mb-small">
        {cryptoData.currency === 'USD' && '$'}
        {formatPrice(cryptoData.price)}
        {cryptoData.currency !== 'USD' && ` ${cryptoData.currency}`}
      </div>

      {/* 24h Change */}
      {showChange24h && (
        <div
          className={`crypto-change-indicator flex-center-row mb-medium gap-small ${isPositiveChange ? 'positive' : 'negative'}`}
        >
          <span className="text-tiny">{changeIcon}</span>
          <span>{Math.abs(cryptoData.change24h).toFixed(2)}%</span>
          <span className="text-tiny text-muted">24h</span>
        </div>
      )}

      {/* Market Cap */}
      {showMarketCap && (
        <div className="text-label mt-small">
          Market Cap: {formatMarketCap(cryptoData.marketCap)}
        </div>
      )}

      {/* Last Update */}
      <div className="text-small mt-large">
        Updated: {new Date(cryptoData.lastUpdate).toLocaleTimeString()}
      </div>

      {/* Connection Status Indicator */}
      <div className={`connection-status-dot ${status === 'connected' ? 'connected' : 'disconnected'}`} />
    </div>
  );
};

/**
 * SECURITY NOTES FOR FRONTEND DEVELOPERS:
 *
 * ✅ This component is SECURE because:
 * - No API keys are stored or transmitted here
 * - Only receives price data via SSE (which the backend controls)
 * - Config values (coinId, currency) are non-sensitive display preferences
 * - Cannot access other widgets' data (filtered by instanceId)
 *
 * ✅ Safe to access in frontend:
 * - config.coinId (which coin to display)
 * - config.currency (USD, EUR, etc.)
 * - config.showChange24h (boolean display preference)
 * - Broadcast data (price, change, market cap)
 *
 * ❌ NEVER accessible in frontend:
 * - secrets.apiKey (server-side only)
 * - secrets.apiEndpoint (server-side only)
 * - Any other widget's secrets or data
 */
