/**
 * TrueNAS Health Widget - Backend Logic
 *
 * Fetches pool status and disk health from TrueNAS API
 * Uses HTTP Basic Auth with credentials from secrets
 */

export function init(context) {
  const { broadcast, secrets, config, logger, instanceId } = context;

  // SECRETS - Server-side only
  const username = secrets.username;
  const password = secrets.password;

  // CONFIG - Per-instance settings
  const serverAddress = config.serverAddress || '192.168.0.146';
  const poolName = config.poolName || 'tank';
  const refreshInterval = (config.refreshInterval || 5) * 60 * 1000; // Convert minutes to ms

  // Validate required secrets
  if (!username || !password) {
    logger.error(`[${instanceId}] Missing credentials - configure username and password in Settings`);
    broadcast('truenas-widget', {
      poolName,
      poolStatus: 'UNCONFIGURED',
      totalDisks: 0,
      disksWithErrors: 0,
      error: 'Missing credentials - configure in Settings',
      lastUpdate: new Date().toISOString(),
      instanceId
    });
    return {
      cleanup: () => {},
      exportData: () => ({
        poolName,
        poolStatus: 'UNCONFIGURED',
        totalDisks: 0,
        disksWithErrors: 0,
        lastUpdate: new Date().toISOString()
      }),
      refresh: () => {}
    };
  }

  logger.info(`[${instanceId}] Monitoring TrueNAS at ${serverAddress}, pool: ${poolName}`);
  logger.info(`[${instanceId}] Refresh interval: ${refreshInterval / 60000} minutes`);
  logger.info(`[${instanceId}] Credentials: Configured ✓`);

  // Store latest data for AI export
  let latestData = null;

  /**
   * Create Basic Auth header
   */
  function getAuthHeader() {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Fetch pool status and disk health from TrueNAS API
   */
  async function fetchTrueNASHealth() {
    try {
      const baseUrl = `http://${serverAddress}/api/v2.0`;
      const headers = {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      };

      // Fetch all pools
      logger.info(`[${instanceId}] Fetching pool data...`);
      const poolsResponse = await fetch(`${baseUrl}/pool`, { headers });

      if (!poolsResponse.ok) {
        if (poolsResponse.status === 401) {
          throw new Error('Authentication failed - check username/password');
        }
        throw new Error(`Pool API error: ${poolsResponse.status} ${poolsResponse.statusText}`);
      }

      const pools = await poolsResponse.json();

      // Find the requested pool
      const pool = pools.find(p => p.name === poolName);
      if (!pool) {
        throw new Error(`Pool "${poolName}" not found. Available pools: ${pools.map(p => p.name).join(', ')}`);
      }

      // Count disks and errors from the pool topology
      let totalDisks = 0;
      let disksWithErrors = 0;

      // Helper function to count disks recursively in vdevs
      function countDisksInVdev(vdev) {
        if (vdev.type === 'DISK') {
          totalDisks++;
          // Check for errors (read, write, checksum)
          const hasErrors = (vdev.stats?.read_errors || 0) > 0 ||
                           (vdev.stats?.write_errors || 0) > 0 ||
                           (vdev.stats?.checksum_errors || 0) > 0;
          if (hasErrors) {
            disksWithErrors++;
          }
        }
        // Recurse into children
        if (vdev.children && Array.isArray(vdev.children)) {
          vdev.children.forEach(countDisksInVdev);
        }
      }

      // Process data vdevs
      if (pool.topology?.data) {
        pool.topology.data.forEach(countDisksInVdev);
      }

      // Process cache vdevs
      if (pool.topology?.cache) {
        pool.topology.cache.forEach(countDisksInVdev);
      }

      // Process log vdevs
      if (pool.topology?.log) {
        pool.topology.log.forEach(countDisksInVdev);
      }

      // Process spare vdevs
      if (pool.topology?.spare) {
        pool.topology.spare.forEach(countDisksInVdev);
      }

      const healthData = {
        poolName: pool.name,
        poolStatus: pool.status || 'UNKNOWN',
        totalDisks,
        disksWithErrors,
        lastUpdate: new Date().toISOString()
      };

      // Store for AI export
      latestData = healthData;

      // Broadcast to frontend
      broadcast('truenas-widget', { ...healthData, instanceId });

      logger.info(`[${instanceId}] Pool "${poolName}": ${healthData.poolStatus}, ${totalDisks} disks, ${disksWithErrors} with errors`);

    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch TrueNAS health: ${error.message}`);

      const errorData = {
        poolName,
        poolStatus: 'ERROR',
        totalDisks: 0,
        disksWithErrors: 0,
        error: error.message,
        lastUpdate: new Date().toISOString()
      };

      latestData = errorData;
      broadcast('truenas-widget', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup
  fetchTrueNASHealth().catch(err => {
    logger.error(`[${instanceId}] Initial fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchTrueNASHealth, refreshInterval);

  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down TrueNAS health monitor`);
      clearInterval(timer);
    },

    exportData: () => {
      if (!latestData) {
        return {
          poolName,
          poolStatus: 'Loading',
          totalDisks: 0,
          disksWithErrors: 0,
          lastUpdate: new Date().toISOString()
        };
      }
      return {
        poolName: latestData.poolName,
        poolStatus: latestData.poolStatus,
        totalDisks: latestData.totalDisks,
        disksWithErrors: latestData.disksWithErrors,
        lastUpdate: latestData.lastUpdate
      };
    },

    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchTrueNASHealth().catch(err => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    }
  };
}
