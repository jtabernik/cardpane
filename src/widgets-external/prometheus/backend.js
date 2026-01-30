/**
 * Prometheus Metrics Widget - Backend Logic
 *
 * Fetches time series data from a Prometheus server using PromQL queries.
 * Supports basic authentication and configurable time ranges.
 */

export function init(context) {
  const { broadcast, secrets, config, logger, instanceId } = context;

  // Secrets
  const prometheusUrl = secrets.prometheusUrl;
  const query = secrets.query;
  const username = secrets.username || '';
  const password = secrets.password || '';

  // Config
  const timeRange = config.timeRange || '1h';
  const refreshInterval = Math.max(10, config.refreshInterval || 30) * 1000;
  const label = config.label || 'Metric';

  // Store latest data for export
  let latestData = null;

  // Parse time range to seconds
  const timeRangeSeconds = {
    '5m': 5 * 60,
    '15m': 15 * 60,
    '1h': 60 * 60,
    '6h': 6 * 60 * 60,
    '24h': 24 * 60 * 60,
    '7d': 7 * 24 * 60 * 60,
  };

  const rangeSecs = timeRangeSeconds[timeRange] || 3600;

  // Calculate step based on time range (aim for ~100-200 data points)
  const step = Math.max(15, Math.floor(rangeSecs / 150));

  // Validate required secrets
  if (!prometheusUrl || !query) {
    logger.error(`[${instanceId}] Missing Prometheus URL or query - configure in widget secrets`);
    const errorData = {
      label,
      timeRange,
      timestamps: [],
      values: [],
      error: 'Missing Prometheus URL or query. Configure in Settings > Secrets.',
      lastUpdate: new Date().toISOString(),
      instanceId,
    };
    latestData = errorData;
    broadcast('prometheus-widget', errorData);
    return {
      cleanup: () => {},
      exportData: () => latestData,
      refresh: () => {},
    };
  }

  logger.info(`[${instanceId}] Querying Prometheus at ${prometheusUrl}`);
  logger.info(`[${instanceId}] Query: ${query}, Range: ${timeRange}, Step: ${step}s, Refresh: ${refreshInterval / 1000}s`);

  /**
   * Build authorization header if credentials provided
   */
  function getAuthHeader() {
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      return { Authorization: `Basic ${credentials}` };
    }
    return {};
  }

  /**
   * Fetch time series data from Prometheus
   */
  async function fetchMetrics() {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - rangeSecs;

      // Build query URL
      const baseUrl = prometheusUrl.replace(/\/$/, '');
      const params = new URLSearchParams({
        query,
        start: start.toString(),
        end: end.toString(),
        step: step.toString(),
      });

      const url = `${baseUrl}/api/v1/query_range?${params}`;

      logger.info(`[${instanceId}] Fetching metrics...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.error || 'Query failed');
      }

      // Extract time series data
      // Prometheus returns: { data: { resultType: "matrix", result: [{ metric: {...}, values: [[ts, val], ...] }] } }
      const result = data.data?.result?.[0];

      if (!result || !result.values || result.values.length === 0) {
        const emptyData = {
          label,
          timeRange,
          timestamps: [],
          values: [],
          metricLabels: {},
          lastUpdate: new Date().toISOString(),
          instanceId,
        };
        latestData = emptyData;
        broadcast('prometheus-widget', emptyData);
        logger.info(`[${instanceId}] Query returned no data`);
        return;
      }

      // Convert Prometheus format to arrays
      // values: [[timestamp, "value"], ...]
      const timestamps = result.values.map((v) => v[0]);
      const values = result.values.map((v) => parseFloat(v[1]));

      const metricsData = {
        label,
        timeRange,
        timestamps,
        values,
        metricLabels: result.metric || {},
        min: Math.min(...values),
        max: Math.max(...values),
        current: values[values.length - 1],
        lastUpdate: new Date().toISOString(),
        instanceId,
      };

      latestData = metricsData;
      broadcast('prometheus-widget', metricsData);

      logger.info(`[${instanceId}] Fetched ${values.length} data points, current: ${metricsData.current}`);
    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch metrics: ${error.message}`);

      const errorData = {
        label,
        timeRange,
        timestamps: latestData?.timestamps || [],
        values: latestData?.values || [],
        error: error.message,
        lastUpdate: new Date().toISOString(),
        instanceId,
      };

      latestData = errorData;
      broadcast('prometheus-widget', errorData);
    }
  }

  // Fetch immediately on startup
  fetchMetrics().catch((err) => {
    logger.error(`[${instanceId}] Initial fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchMetrics, refreshInterval);

  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down Prometheus monitor`);
      clearInterval(timer);
    },

    exportData: () => {
      if (!latestData) {
        return {
          label,
          timeRange,
          timestamps: [],
          values: [],
          lastUpdate: new Date().toISOString(),
        };
      }
      return {
        label: latestData.label,
        timeRange: latestData.timeRange,
        dataPoints: latestData.values?.length || 0,
        min: latestData.min,
        max: latestData.max,
        current: latestData.current,
        lastUpdate: latestData.lastUpdate,
      };
    },

    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchMetrics().catch((err) => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    },
  };
}
