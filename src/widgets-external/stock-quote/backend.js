/**
 * Stock Quote Widget - Backend Logic
 *
 * Fetches stock quotes from Yahoo Finance (same endpoints as yfinance Python library)
 * No API key required - uses Yahoo Finance's public query endpoints
 */

export function init(context) {
  const { broadcast, config, logger, instanceId } = context;

  // Store latest stock data for AI export
  let latestStockData = null;

  // Get configuration - tickers can be array or comma-separated string
  const tickerConfig = config.tickers || 'AAPL';
  const tickers = Array.isArray(tickerConfig)
    ? tickerConfig.map(t => t.trim().toUpperCase()).filter(t => t)
    : tickerConfig.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
  const refreshInterval = (config.refreshInterval || 5) * 60 * 1000; // Convert minutes to ms

  logger.info(`[${instanceId}] Starting stock quotes for ${tickers.join(', ')} every ${refreshInterval / 60000} minutes`);
  logger.info(`[${instanceId}] Using Yahoo Finance API (no API key required)`);

  /**
   * Fetch single stock data using Yahoo Finance v8 chart endpoint
   * This endpoint is more reliable and doesn't require authentication
   */
  async function fetchSingleStock(ticker) {
    // Yahoo Finance uses dashes instead of dots for share class symbols (e.g., BRK-B instead of BRK.B)
    const yahooTicker = ticker.replace('.', '-');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${ticker}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error(`No data for ${ticker}`);
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker: ticker.toUpperCase(),
      name: meta.shortName || meta.longName || ticker,
      price: currentPrice,
      change,
      changePercent,
      previousClose,
      open: meta.regularMarketOpen || 0,
      dayHigh: meta.regularMarketDayHigh || 0,
      dayLow: meta.regularMarketDayLow || 0,
      volume: meta.regularMarketVolume || 0,
      currency: meta.currency || 'USD',
      marketState: meta.marketState || 'CLOSED',
      exchange: meta.exchangeName || '',
    };
  }

  /**
   * Fetch all stocks
   */
  async function fetchStocks() {
    try {
      // Fetch each ticker individually (more reliable than batch)
      const stockPromises = tickers.map(async (ticker) => {
        try {
          return await fetchSingleStock(ticker);
        } catch (err) {
          logger.warn(`[${instanceId}] Failed to fetch ${ticker}: ${err.message}`);
          return {
            ticker: ticker.toUpperCase(),
            name: ticker.toUpperCase(),
            price: 0,
            change: 0,
            changePercent: 0,
            previousClose: 0,
            currency: 'USD',
            marketState: 'ERROR',
            error: true
          };
        }
      });

      const stocks = await Promise.all(stockPromises);

      // Check if all stocks failed
      const allFailed = stocks.every(s => s.error);
      if (allFailed) {
        throw new Error('All stock fetches failed');
      }

      // Transform to widget format
      const stockData = {
        stocks,
        tickers,
        lastUpdate: new Date().toISOString()
      };

      // Store for AI export
      latestStockData = stockData;

      // Broadcast to all connected clients
      broadcast('stock-quote-widget', { ...stockData, instanceId });

      const summary = stocks
        .filter(s => !s.error)
        .map(s => {
          const sign = s.change >= 0 ? '+' : '';
          return `${s.ticker}: $${s.price.toFixed(2)} (${sign}${s.changePercent.toFixed(2)}%)`;
        })
        .join(', ');
      logger.info(`[${instanceId}] Stock quotes updated: ${summary}`);

    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch stocks: ${error.message}`);

      // Prepare error data
      const errorData = {
        stocks: tickers.map(ticker => ({
          ticker: ticker.toUpperCase(),
          name: ticker.toUpperCase(),
          price: 0,
          change: 0,
          changePercent: 0,
          previousClose: 0,
          currency: 'USD',
          marketState: 'ERROR',
          error: true
        })),
        tickers,
        lastUpdate: new Date().toISOString(),
        error: error.message
      };

      // Store error for AI export
      latestStockData = errorData;

      // Broadcast error to frontend
      broadcast('stock-quote-widget', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup
  fetchStocks().catch(err => {
    logger.error(`[${instanceId}] Initial stock fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchStocks, refreshInterval);

  // Return object with cleanup, exportData, and refresh methods
  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down stock quote updates`);
      clearInterval(timer);
    },

    // Export data for AI consumption
    exportData: () => {
      if (!latestStockData) {
        return {
          stocks: tickers.map(ticker => ({
            ticker: ticker.toUpperCase(),
            price: 0,
            change: 0,
            changePercent: 0
          })),
          tickers,
          lastUpdate: new Date().toISOString()
        };
      }
      return latestStockData;
    },

    // Refresh method to trigger immediate data fetch
    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchStocks().catch(err => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    }
  };
}
