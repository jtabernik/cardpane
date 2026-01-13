/**
 * Stock Quote Widget - Backend Logic
 * Fetches stock quotes from Yahoo Finance API
 */

export function init(context) {
  const { broadcast, config, logger, instanceId } = context;

  // Store latest stock data for AI export
  let latestStockData = null;

  // Get configuration
  const tickers = config.tickers || ['AAPL'];
  const refreshInterval = (config.refreshInterval || 5) * 60 * 1000; // Convert minutes to ms

  logger.info(`Starting stock quote updates for ${tickers.join(', ')} every ${refreshInterval / 60000} minutes`);

  // Function to fetch stock data
  async function fetchStocks() {
    try {
      const stockPromises = tickers.map(async (ticker) => {
        // Using Yahoo Finance API via yfinance proxy
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Yahoo Finance API returned ${response.status} for ${ticker}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) {
          throw new Error(`No data returned for ${ticker}`);
        }

        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          ticker: ticker.toUpperCase(),
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          previousClose: previousClose,
          currency: meta.currency || 'USD',
          marketState: meta.marketState || 'REGULAR',
          lastUpdate: new Date().toISOString()
        };
      });

      const stocks = await Promise.all(stockPromises);

      // Transform to widget format
      const stockData = {
        stocks: stocks,
        tickers: tickers,
        lastUpdate: new Date().toISOString()
      };

      // Store for AI export
      latestStockData = stockData;

      // Broadcast to all connected clients
      broadcast('stock-quote', { ...stockData, instanceId });

      logger.info(`Stock quotes updated: ${stocks.map(s => `${s.ticker}: $${s.price.toFixed(2)}`).join(', ')}`);
    } catch (error) {
      logger.error(`Failed to fetch stocks: ${error.message}`);

      // Prepare error data
      const errorData = {
        stocks: tickers.map(ticker => ({
          ticker: ticker.toUpperCase(),
          price: 0,
          change: 0,
          changePercent: 0,
          previousClose: 0,
          currency: 'USD',
          marketState: 'CLOSED',
          error: true
        })),
        tickers: tickers,
        lastUpdate: new Date().toISOString(),
        error: error.message
      };

      // Store error for AI export
      latestStockData = errorData;

      // Broadcast error to frontend
      broadcast('stock-quote', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup
  fetchStocks().catch(err => {
    logger.error('Initial stock fetch failed:', err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchStocks, refreshInterval);

  // Return object with cleanup, exportData, and refresh methods
  return {
    cleanup: () => {
      logger.info('Shutting down stock quote updates');
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
          tickers: tickers,
          lastUpdate: new Date().toISOString()
        };
      }
      return latestStockData;
    },

    // Refresh method to trigger immediate data fetch
    refresh: () => {
      logger.info('Manual refresh triggered');
      fetchStocks().catch(err => {
        logger.error('Manual refresh failed:', err);
      });
    }
  };
}
