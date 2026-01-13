/**
 * SSE Debugger - Backend Logic
 * Currently just stays active to register the widget's presence.
 */

export function init(context) {
    const { broadcast, secrets, logger } = context;

    logger.info('Backend initialized');
    // We could broadcast a "debugger-online" event here

    return () => {
        logger.info('Shutting down');
    };
}
