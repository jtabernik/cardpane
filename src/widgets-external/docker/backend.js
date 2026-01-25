/**
 * Docker Container Widget - Backend Logic
 *
 * Monitors Docker container status and resource usage via Docker API
 * Requires Docker API to be exposed over TCP (port 2375 or 2376)
 */

export function init(context) {
  const { broadcast, config, logger, instanceId } = context;

  // CONFIG - Per-instance settings
  const hostAddress = config.hostAddress || '192.168.0.100';
  const port = config.port || 2375;
  const containerName = config.containerName;
  const refreshInterval = (config.refreshInterval || 30) * 1000;
  const showStats = config.showStats !== false;

  // Validate required config
  if (!containerName) {
    logger.error(`[${instanceId}] Missing container name - configure in widget settings`);
    broadcast('docker-widget', {
      containerName: 'Not configured',
      containerId: '',
      image: '',
      state: 'UNCONFIGURED',
      status: 'Configure container name',
      cpuPercent: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      error: 'Missing container name',
      lastUpdate: new Date().toISOString(),
      instanceId
    });
    return {
      cleanup: () => {},
      exportData: () => ({
        containerName: 'Not configured',
        state: 'UNCONFIGURED',
        lastUpdate: new Date().toISOString()
      }),
      refresh: () => {}
    };
  }

  logger.info(`[${instanceId}] Monitoring container "${containerName}" on ${hostAddress}:${port}`);
  logger.info(`[${instanceId}] Refresh interval: ${refreshInterval / 1000}s, Stats: ${showStats ? 'enabled' : 'disabled'}`);

  // Store latest data for AI export
  let latestData = null;
  const baseUrl = `http://${hostAddress}:${port}`;

  /**
   * Find container by name or ID
   */
  async function findContainer() {
    const response = await fetch(`${baseUrl}/containers/json?all=true`);

    if (!response.ok) {
      throw new Error(`Docker API error: ${response.status} ${response.statusText}`);
    }

    const containers = await response.json();

    // Find by name (Docker prefixes names with /) or by ID
    const container = containers.find(c =>
      c.Names?.some(n => n === `/${containerName}` || n === containerName) ||
      c.Id?.startsWith(containerName) ||
      c.Id === containerName
    );

    if (!container) {
      const available = containers.map(c => c.Names?.[0]?.replace('/', '') || c.Id?.substring(0, 12)).join(', ');
      throw new Error(`Container "${containerName}" not found. Available: ${available || 'none'}`);
    }

    return container;
  }

  /**
   * Get detailed container info (restart count, health)
   */
  async function getContainerInspect(containerId) {
    try {
      const response = await fetch(`${baseUrl}/containers/${containerId}/json`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      logger.warn(`[${instanceId}] Failed to inspect container: ${error.message}`);
      return null;
    }
  }

  /**
   * Get container stats (CPU, memory, network, block I/O)
   */
  async function getContainerStats(containerId) {
    try {
      const response = await fetch(`${baseUrl}/containers/${containerId}/stats?stream=false`);

      if (!response.ok) {
        return null;
      }

      const stats = await response.json();

      // Calculate CPU percentage
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuCount = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
      const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;

      // Calculate memory
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 0;
      const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

      // Calculate network I/O (sum all interfaces)
      let networkRx = 0;
      let networkTx = 0;
      if (stats.networks) {
        for (const iface of Object.values(stats.networks)) {
          networkRx += iface.rx_bytes || 0;
          networkTx += iface.tx_bytes || 0;
        }
      }

      // Calculate block I/O
      let blockRead = 0;
      let blockWrite = 0;
      if (stats.blkio_stats?.io_service_bytes_recursive) {
        for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
          if (entry.op === 'read' || entry.op === 'Read') {
            blockRead += entry.value || 0;
          } else if (entry.op === 'write' || entry.op === 'Write') {
            blockWrite += entry.value || 0;
          }
        }
      }

      return {
        cpuPercent: Math.round(cpuPercent * 100) / 100,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
        memoryLimit: Math.round(memoryLimit / 1024 / 1024), // Convert to MB
        memoryPercent: Math.round(memoryPercent * 10) / 10,
        networkRx,
        networkTx,
        blockRead,
        blockWrite
      };
    } catch (error) {
      logger.warn(`[${instanceId}] Failed to get stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Format bytes to human readable
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Fetch container status and stats
   */
  async function fetchDockerStatus() {
    try {
      logger.info(`[${instanceId}] Fetching container status...`);

      const container = await findContainer();

      // Get detailed container info
      const inspect = await getContainerInspect(container.Id);
      const restartCount = inspect?.RestartCount || 0;
      const health = inspect?.State?.Health?.Status || 'none';

      // Get stats if enabled and container is running
      let stats = {
        cpuPercent: 0,
        memoryUsage: 0,
        memoryLimit: 0,
        memoryPercent: 0,
        networkRx: 0,
        networkTx: 0,
        blockRead: 0,
        blockWrite: 0
      };
      if (showStats && container.State === 'running') {
        const containerStats = await getContainerStats(container.Id);
        if (containerStats) {
          stats = containerStats;
        }
      }

      const dockerData = {
        containerName: container.Names?.[0]?.replace('/', '') || containerName,
        containerId: container.Id?.substring(0, 12),
        image: container.Image,
        state: container.State,
        status: container.Status,
        health,
        restartCount,
        cpuPercent: stats.cpuPercent,
        memoryUsage: stats.memoryUsage,
        memoryLimit: stats.memoryLimit,
        memoryPercent: stats.memoryPercent,
        networkRx: stats.networkRx,
        networkTx: stats.networkTx,
        networkRxFormatted: formatBytes(stats.networkRx),
        networkTxFormatted: formatBytes(stats.networkTx),
        blockRead: stats.blockRead,
        blockWrite: stats.blockWrite,
        blockReadFormatted: formatBytes(stats.blockRead),
        blockWriteFormatted: formatBytes(stats.blockWrite),
        lastUpdate: new Date().toISOString()
      };

      latestData = dockerData;
      broadcast('docker-widget', { ...dockerData, instanceId });

      logger.info(`[${instanceId}] Container "${dockerData.containerName}": ${dockerData.state} (CPU: ${dockerData.cpuPercent}%, Mem: ${dockerData.memoryUsage}MB, Net: ↓${dockerData.networkRxFormatted} ↑${dockerData.networkTxFormatted})`);

    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch Docker status: ${error.message}`);

      const errorData = {
        containerName,
        containerId: '',
        image: '',
        state: 'ERROR',
        status: error.message,
        health: 'none',
        restartCount: 0,
        cpuPercent: 0,
        memoryUsage: 0,
        memoryLimit: 0,
        memoryPercent: 0,
        networkRx: 0,
        networkTx: 0,
        networkRxFormatted: '0 B',
        networkTxFormatted: '0 B',
        blockRead: 0,
        blockWrite: 0,
        blockReadFormatted: '0 B',
        blockWriteFormatted: '0 B',
        error: error.message,
        lastUpdate: new Date().toISOString()
      };

      latestData = errorData;
      broadcast('docker-widget', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup
  fetchDockerStatus().catch(err => {
    logger.error(`[${instanceId}] Initial fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchDockerStatus, refreshInterval);

  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down Docker container monitor`);
      clearInterval(timer);
    },

    exportData: () => {
      if (!latestData) {
        return {
          containerName,
          state: 'Loading',
          lastUpdate: new Date().toISOString()
        };
      }
      return {
        containerName: latestData.containerName,
        containerId: latestData.containerId,
        image: latestData.image,
        state: latestData.state,
        status: latestData.status,
        health: latestData.health,
        restartCount: latestData.restartCount,
        cpuPercent: latestData.cpuPercent,
        memoryUsage: latestData.memoryUsage,
        memoryLimit: latestData.memoryLimit,
        memoryPercent: latestData.memoryPercent,
        networkRx: latestData.networkRx,
        networkTx: latestData.networkTx,
        blockRead: latestData.blockRead,
        blockWrite: latestData.blockWrite,
        lastUpdate: latestData.lastUpdate
      };
    },

    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchDockerStatus().catch(err => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    }
  };
}
