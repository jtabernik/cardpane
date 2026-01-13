/**
 * Crypto Price Widget - Backend Logic
 *
 * SECURITY DEMONSTRATION:
 * - API keys come from context.secrets (server-side only, encrypted at rest)
 * - Per-instance config comes from context.config (safe for frontend)
 * - We NEVER broadcast secrets - only the resulting price data
 * - Each widget instance is isolated - cannot access other widgets' data
 */

export function init(context) {
  // Destructure context
  const { broadcast, secrets, config, logger, instanceId } = context;

  // ============================================
  // SECRETS - Server-side only, NEVER exposed
  // ============================================
  const apiKey = secrets.apiKey; // Optional for demo API
  const apiEndpoint = secrets.apiEndpoint || 'https://api.coingecko.com/api/v3';

  // ============================================
  // CONFIGURATION - Per-instance preferences
  // ============================================
  const refreshInterval = (config.refreshInterval || 60) * 1000;
  const enableCaching = config.enableCaching !== false;

  // ============================================
  // CONFIG - Per-instance, safe for frontend
  // ============================================
  const coinId = config.coinId || 'bitcoin';
  const currency = config.currency || 'usd';
  const showChange24h = config.showChange24h !== false;
  const showMarketCap = config.showMarketCap === true;
  const alertThreshold = config.alertThreshold;

  logger.info(`[${instanceId}] Tracking ${coinId} in ${currency.toUpperCase()}`);
  logger.info(`[${instanceId}] Refresh interval: ${refreshInterval / 1000}s`);
  logger.info(`[${instanceId}] API Key: ${apiKey ? 'Configured ✓' : 'Not configured (using free tier)'}`);

  // Store latest data for AI export
  let latestData = null;
  let lastPrice = null; // For alert threshold tracking

  /**
   * Fetch cryptocurrency price from CoinGecko API
   *
   * SECURITY NOTE:
   * - apiKey is ONLY used in server-side HTTP request headers
   * - The fetched data (price, change) is broadcast to frontend
   * - The API key itself is NEVER broadcast
   */
  async function fetchCryptoPrice() {
    try {
      // Build API URL
      const url = `${apiEndpoint}/simple/price?ids=${coinId}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`;

      // Prepare headers (API key stays server-side)
      const headers = {};
      if (apiKey) {
        headers['x-cg-demo-api-key'] = apiKey; // API key NEVER leaves the server
      }

      logger.info(`[${instanceId}] Fetching ${coinId} price...`);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check if we got valid data
      if (!data[coinId]) {
        throw new Error(`No data returned for ${coinId}`);
      }

      const priceData = data[coinId];

      // Prepare data to broadcast to frontend
      // SECURITY: Only broadcast the price data, NEVER the API key
      const cryptoData = {
        coinId,
        coinName: coinId.charAt(0).toUpperCase() + coinId.slice(1),
        price: priceData[currency],
        currency: currency.toUpperCase(),
        change24h: priceData[`${currency}_24h_change`] || 0,
        marketCap: priceData[`${currency}_market_cap`] || 0,
        lastUpdate: new Date().toISOString()
      };

      // Check alert threshold
      if (alertThreshold && lastPrice) {
        const percentChange = Math.abs(((cryptoData.price - lastPrice) / lastPrice) * 100);
        if (percentChange >= alertThreshold) {
          logger.warn(`[${instanceId}] ALERT: ${coinId} price changed by ${percentChange.toFixed(2)}%`);
        }
      }

      lastPrice = cryptoData.price;

      // Store for AI export
      latestData = cryptoData;

      // Broadcast to frontend (API key is NOT included)
      // Include instanceId so frontend can filter to the correct widget
      broadcast('crypto-price-widget', { ...cryptoData, instanceId });

      logger.info(
        `[${instanceId}] Price updated: ${cryptoData.price} ${cryptoData.currency} ` +
        `(${cryptoData.change24h > 0 ? '+' : ''}${cryptoData.change24h.toFixed(2)}%)`
      );

    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch crypto price:`, error.message);

      // Broadcast error to frontend (still no API key exposure)
      const errorData = {
        coinId,
        coinName: coinId.charAt(0).toUpperCase() + coinId.slice(1),
        price: 0,
        currency: currency.toUpperCase(),
        change24h: 0,
        marketCap: 0,
        error: error.message,
        lastUpdate: new Date().toISOString()
      };

      latestData = errorData;
      broadcast('crypto-price-widget', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup (don't await - let it run async)
  fetchCryptoPrice().catch(err => {
    logger.error(`[${instanceId}] Initial crypto price fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchCryptoPrice, refreshInterval);

  // Return cleanup, exportData, and refresh functions
  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down crypto price tracker`);
      clearInterval(timer);
    },

    /**
     * Export data for AI consumption
     *
     * SECURITY NOTE:
     * - This function returns data that AI can access
     * - We return price data, NOT the API key
     * - Data is the same as what's broadcast to frontend
     */
    exportData: () => {
      if (!latestData) {
        return {
          coinId,
          coinName: coinId.charAt(0).toUpperCase() + coinId.slice(1),
          price: 0,
          currency: currency.toUpperCase(),
          change24h: 0,
          marketCap: 0,
          lastUpdate: new Date().toISOString(),
          status: 'Loading'
        };
      }

      // Return latest data (no secrets included)
      return {
        coinId: latestData.coinId,
        price: latestData.price,
        currency: latestData.currency,
        change24h: latestData.change24h,
        marketCap: latestData.marketCap,
        lastUpdate: latestData.lastUpdate
      };
    },

    // Refresh method to trigger immediate data fetch
    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchCryptoPrice().catch(err => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    }
  };
}

/**
 * SECURITY SUMMARY FOR DEVELOPERS:
 *
 * ✅ DO:
 * - Store API keys in secretsSchema
 * - Access secrets via context.secrets in backend
 * - Use secrets only in server-side HTTP requests
 * - Broadcast only the resulting data (prices, weather, etc.)
 * - Store per-instance preferences in configSchema
 *
 * ❌ DON'T:
 * - Never broadcast secrets via broadcast()
 * - Never include secrets in exportData()
 * - Never log secrets to console (use "Configured ✓" instead)
 * - Never expose secrets in error messages
 * - Never store secrets in frontend localStorage/state
 *
 * WIDGET ISOLATION:
 * - Each widget backend runs in its own context
 * - Widget A cannot access Widget B's secrets
 * - Widget A cannot access Widget B's data
 * - The only shared channel is SSE broadcast (which you control)
 */
