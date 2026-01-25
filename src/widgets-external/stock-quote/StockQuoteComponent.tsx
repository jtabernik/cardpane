import { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

interface Stock {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  marketState: string;
  error?: boolean;
}

interface StockData {
  stocks: Stock[];
  tickers: string[];
  lastUpdate: string;
  instanceId?: string;
  error?: string;
}

export const StockQuoteComponent: React.FC<WidgetProps> = ({ id, size }) => {
  const [stockData, setStockData] = useState<StockData | null>(null);

  // Subscribe to stock updates via SSE
  useSSE('stock-quote-widget', (data) => {
    // Filter to only this widget instance's data
    if (data.instanceId === id) {
      setStockData(data as StockData);
    }
  });

  if (!stockData) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Waiting for stock data...</div>
      </div>
    );
  }

  const isLargeWidget = size.w >= 3 && size.h >= 2;
  const showMultiple = stockData.stocks.length > 1;

  return (
    <div className="widget-card flex-column" style={{ gap: '12px' }}>
      <div className="text-small-title mb-small">Stock Quotes</div>

      {showMultiple ? (
        // Multiple stocks - show as list
        <div className="flex-column gap-medium" style={{ flex: 1, overflowY: 'auto' }}>
          {stockData.stocks.map((stock) => (
            <div key={stock.ticker} className="flex-space-between" style={{ alignItems: 'center' }}>
              <div>
                <div className="text-medium-title font-mono">{stock.ticker}</div>
                {isLargeWidget && (
                  <div className="text-small text-muted">
                    ${stock.previousClose.toFixed(2)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-label font-mono font-bold">
                  ${stock.price.toFixed(2)}
                </div>
                <div
                  className="text-small font-mono"
                  style={{
                    color: stock.change >= 0 ? '#10b981' : '#ef4444'
                  }}
                >
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single stock - show large
        stockData.stocks.length > 0 && (
          <div className="flex-center-column text-center">
            <div className="text-medium-title mb-small font-mono">
              {stockData.stocks[0].ticker}
            </div>
            <div className="text-large-bold mb-small font-mono">
              ${stockData.stocks[0].price.toFixed(2)}
            </div>
            <div
              className="text-secondary font-mono"
              style={{
                color: stockData.stocks[0].change >= 0 ? '#10b981' : '#ef4444',
                fontSize: '1rem'
              }}
            >
              {stockData.stocks[0].change >= 0 ? '+' : ''}{stockData.stocks[0].change.toFixed(2)} ({stockData.stocks[0].changePercent >= 0 ? '+' : ''}{stockData.stocks[0].changePercent.toFixed(2)}%)
            </div>
            {isLargeWidget && (
              <>
                <div className="text-label mt-medium">
                  Previous Close: ${stockData.stocks[0].previousClose.toFixed(2)}
                </div>
                <div className="text-small mt-small text-muted">
                  {stockData.stocks[0].marketState}
                </div>
              </>
            )}
          </div>
        )
      )}

      {isLargeWidget && (
        <div className="text-small mt-small text-muted" style={{ textAlign: 'center' }}>
          Last update: {new Date(stockData.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
