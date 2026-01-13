/**
 * Heartbeat Widget - Backend Logic
 * This module is initialized by the core server.
 */

const HEARTBEAT_INTERVAL = 5 * 60 * 1000;

export function init(context) {
    // Destructure context (new signature)
    const { broadcast, logger } = context;

    logger.info('Initialized backend pulse (5 min)');

    // Track heartbeat data for AI export
    let pulseCount = 0;
    let lastPulseTime = null;
    const startTime = Date.now();

    // Send initial heartbeat immediately
    pulseCount++;
    lastPulseTime = new Date().toISOString();
    broadcast('heartbeat', {
        status: 'alive',
        pulseCount,
        timestamp: lastPulseTime
    });

    // Set up the heartbeat interval
    const timer = setInterval(() => {
        pulseCount++;
        lastPulseTime = new Date().toISOString();

        broadcast('heartbeat', {
            status: 'alive',
            pulseCount,
            timestamp: lastPulseTime
        });
    }, HEARTBEAT_INTERVAL);

    // Return object with cleanup, exportData, and refresh methods
    return {
        cleanup: () => {
            logger.info('Shutting down heartbeat');
            clearInterval(timer);
        },

        // Export data for AI consumption (mandatory for widgets with dataExportSchema)
        exportData: () => {
            const now = Date.now();
            const uptimeSeconds = Math.floor((now - startTime) / 1000);

            return {
                pulseCount,
                lastPulse: lastPulseTime || new Date().toISOString(),
                isAlive: true, // If this function is being called, server is alive
                uptimeSeconds
            };
        },

        // Refresh method to send immediate heartbeat
        refresh: () => {
            logger.info('Manual heartbeat refresh triggered');
            pulseCount++;
            lastPulseTime = new Date().toISOString();
            broadcast('heartbeat', {
                status: 'alive',
                pulseCount,
                timestamp: lastPulseTime
            });
        }
    };
}
