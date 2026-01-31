import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureStorage, loadConfig, saveConfig } from './storage.js';
import { SecretsManager } from './secrets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Secrets Manager
const isDevelopment = process.env.NODE_ENV !== 'production';
const masterKey = process.env.SECRETS_MASTER_KEY;

let secretsManager;
try {
    secretsManager = new SecretsManager(masterKey, isDevelopment);
    console.log(`[Server] Secrets manager initialized (${isDevelopment ? 'development' : 'production'} mode)`);
} catch (error) {
    console.error('[Server] Failed to initialize secrets manager:', error.message);
    if (!isDevelopment) {
        console.error('[Server] CRITICAL: Secrets manager required in production. Exiting.');
        process.exit(1);
    }
    // In development, continue without secrets
    secretsManager = null;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Storage
ensureStorage();

// Root endpoint - show available routes
app.get('/', (req, res) => {
    res.json({
        name: 'CardPane Server',
        version: '0.1.0',
        endpoints: {
            health: '/api/health',
            layout: '/api/layout',
            config: '/api/config',
            events: '/api/events (SSE)',
            dashboard: {
                snapshot: '/api/dashboard/snapshot',
                aiSummary: '/api/dashboard/ai-summary',
                widget: '/api/dashboard/widget/:instanceId',
                widgetType: '/api/dashboard/widget-type/:widgetId'
            },
            secrets: {
                list: '/api/admin/secrets',
                widget: '/api/admin/widgets/:widgetId/secrets'
            }
        }
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Layout API
 */
app.get('/api/layout', (req, res) => {
    const config = loadConfig();
    res.json(config.layout || []);
});

app.post('/api/layout', (req, res) => {
    const newLayout = req.body;
    const config = loadConfig();

    const oldInstanceCount = (config.layout || []).length;
    const newInstanceCount = newLayout.length;

    // Merge new layout
    config.layout = newLayout;

    if (saveConfig(config)) {
        console.log(`[Server] Layout updated: ${oldInstanceCount} -> ${newInstanceCount} instances`);
        // Sync backends whenever the layout changes
        syncWidgetBackends();
        res.json({ status: 'ok', layout: config.layout });
    } else {
        res.status(500).json({ error: 'Failed to save layout' });
    }
});

/**
 * Widgets API (For configured widgets list if needed, currently reusing layout but plan separates them)
 * This ensures we have a place to store "widget definitions" separate from their layout position if desired.
 * For MVP, we might rely mostly on layout, but let's expose the whole config for debugging/admin.
 */
app.get('/api/config', (req, res) => {
    res.json(loadConfig());
});

/**
 * Secrets Management API
 */

// Get masked secrets for a widget (shows which keys exist, not the values)
app.get('/api/admin/widgets/:widgetId/secrets', (req, res) => {
    if (!secretsManager) {
        return res.status(503).json({ error: 'Secrets manager not available' });
    }

    try {
        const { widgetId } = req.params;
        const maskedSecrets = secretsManager.getMaskedSecrets(widgetId);
        res.json({
            widgetId,
            secrets: maskedSecrets,
            hasSecrets: secretsManager.hasSecrets(widgetId)
        });
    } catch (error) {
        console.error('[API] Error getting masked secrets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Set secrets for a widget (replaces all secrets for this widget)
app.post('/api/admin/widgets/:widgetId/secrets', (req, res) => {
    if (!secretsManager) {
        return res.status(503).json({ error: 'Secrets manager not available' });
    }

    try {
        const { widgetId } = req.params;
        const secretsBucket = req.body;

        if (!secretsBucket || typeof secretsBucket !== 'object') {
            return res.status(400).json({ error: 'Request body must be a JSON object' });
        }

        secretsManager.setWidgetSecrets(widgetId, secretsBucket);

        // Restart the backend for this widget if it's running
        syncWidgetBackends();

        res.json({
            status: 'ok',
            widgetId,
            message: 'Secrets saved successfully'
        });
    } catch (error) {
        console.error('[API] Error setting secrets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete all secrets for a widget
app.delete('/api/admin/widgets/:widgetId/secrets', (req, res) => {
    if (!secretsManager) {
        return res.status(503).json({ error: 'Secrets manager not available' });
    }

    try {
        const { widgetId } = req.params;
        secretsManager.deleteWidgetSecrets(widgetId);

        // Restart the backend for this widget if it's running
        syncWidgetBackends();

        res.json({
            status: 'ok',
            widgetId,
            message: 'Secrets deleted successfully'
        });
    } catch (error) {
        console.error('[API] Error deleting secrets:', error);
        res.status(500).json({ error: error.message });
    }
});

// List all widgets that have secrets configured
app.get('/api/admin/secrets', (req, res) => {
    if (!secretsManager) {
        return res.status(503).json({ error: 'Secrets manager not available' });
    }

    try {
        const widgetsWithSecrets = secretsManager.listWidgetsWithSecrets();
        res.json({ widgets: widgetsWithSecrets });
    } catch (error) {
        console.error('[API] Error listing secrets:', error);
        res.status(500).json({ error: error.message });
    }
});


import fs from 'fs';

/**
 * SSE Foundation
 */
let clients = [];

const LOG_FILE = path.join(__dirname, 'sse-traffic.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

/**
 * Data Snapshot Storage for AI Consumption
 * Stores the latest data from each widget instance
 */
const widgetDataSnapshot = new Map(); // instanceId -> { widgetId, instanceId, timestamp, data, config }

export function broadcast(type, data) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${JSON.stringify(data)}\n`;

    // Log to console
    console.log(`[SSE Broadcast] ${logEntry.trim()}`);

    // Log to file
    logStream.write(logEntry);

    // Capture data snapshot for AI consumption
    // Match broadcast type to active widget instances
    const config = loadConfig();
    const layout = config.layout || [];

    layout.forEach(item => {
        // Match widget by ID (type matches widgetId in most cases)
        if (item.widgetId === type || type.includes(item.widgetId)) {
            const snapshotEntry = {
                widgetId: item.widgetId,
                instanceId: item.i,
                timestamp: Date.now(),
                timestampISO: timestamp,
                data: data,
                config: item.config || {},
                status: data.error ? 'error' : 'healthy'
            };

            widgetDataSnapshot.set(item.i, snapshotEntry);
        }
    });

    const payload = JSON.stringify({ type, data, timestamp });
    clients.forEach(client => {
        client.res.write(`data: ${payload}\n\n`);
    });
}

/**
 * Dynamic Widget Backend Discovery & Management
 */
const backendRegistry = new Map(); // widgetId -> init function
const activeBackends = new Map(); // instanceId -> { cleanup, exportData }

async function discoverWidgets() {
    const widgetsDir = path.join(__dirname, '../src/widgets-external');

    if (!fs.existsSync(widgetsDir)) {
        console.warn(`[Server] Widgets directory not found: ${widgetsDir}`);
        return;
    }

    const entries = fs.readdirSync(widgetsDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const widgetPath = path.join(widgetsDir, entry.name);
            const backendPath = path.join(widgetPath, 'backend.js');
            const widgetFilePath = path.join(widgetPath, `${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}Widget.tsx`);

            if (fs.existsSync(backendPath)) {
                try {
                    // Convert absolute path to file:// URL for Windows/ESM compatibility
                    const fileUrl = `file://${backendPath.replace(/\\/g, '/')}`;
                    const module = await import(fileUrl);

                    if (module.init) {
                        // We need to know the widget ID to match it with the layout.
                        // We can try to infer it from the folder name or by reading the .tsx file.
                        // For this implementation, we'll use a convention: widget folder name + "-widget"
                        const inferredId = `${entry.name}-widget`;
                        backendRegistry.set(inferredId, module.init);
                        console.log(`[Server] Registered discovery for widget: ${inferredId}`);
                    }
                } catch (err) {
                    console.error(`[Server] Failed to register backend for widget ${entry.name}:`, err);
                }
            }
        }
    }

    // Initial sync after discovery
    syncWidgetBackends();
}

/**
 * Synchronize running backend processes with the current layout
 * Now supports per-instance backends with instance-specific config
 */
function syncWidgetBackends() {
    const config = loadConfig();
    const currentLayout = config.layout || [];

    // Build map of active instances
    const activeInstances = new Map();
    currentLayout.forEach(item => {
        if (backendRegistry.has(item.widgetId)) {
            activeInstances.set(item.i, item);
        }
    });

    console.log(`[Server] Syncing backends. Active instances: ${activeInstances.size}`);

    // Helper function to start a backend
    const startBackend = (instanceId, item) => {
        try {
            console.log(`[Server] Starting backend for instance: ${instanceId} (${item.widgetId})`);
            const initFn = backendRegistry.get(item.widgetId);

            // Get secrets for this widget type (empty object if no secrets or no secrets manager)
            const secrets = secretsManager ? secretsManager.getWidgetSecrets(item.widgetId) : {};

            // Create context object for backend
            const context = {
                broadcast,
                secrets,
                config: item.config || {}, // Instance-specific config
                instanceId: item.i,
                widgetId: item.widgetId,
                logger: {
                    info: (...args) => console.log(`[Widget:${item.widgetId}:${instanceId}]`, ...args),
                    warn: (...args) => console.warn(`[Widget:${item.widgetId}:${instanceId}]`, ...args),
                    error: (...args) => console.error(`[Widget:${item.widgetId}:${instanceId}]`, ...args)
                }
            };

            // Initialize backend with context
            const result = initFn(context);

            // Backend can return either:
            // 1. A cleanup function (legacy)
            // 2. An object with { cleanup, exportData, refresh }
            if (typeof result === 'function') {
                // Legacy: just a cleanup function
                activeBackends.set(instanceId, { cleanup: result, exportData: null, refresh: null, config: item.config });
            } else if (result && typeof result === 'object') {
                // New: object with cleanup, exportData, refresh, and custom methods
                activeBackends.set(instanceId, {
                    cleanup: result.cleanup || (() => {}),
                    exportData: result.exportData || null,
                    refresh: result.refresh || null,
                    getEmail: result.getEmail || null,
                    config: item.config
                });
            } else {
                // No cleanup provided
                activeBackends.set(instanceId, { cleanup: () => {}, exportData: null, refresh: null, config: item.config });
            }
        } catch (err) {
            console.error(`[Server] Failed to start backend for ${item.widgetId} instance ${instanceId}:`, err);
        }
    };

    // 1. Check for config changes and restart backends if needed
    for (const [instanceId, item] of activeInstances.entries()) {
        const existingBackend = activeBackends.get(instanceId);

        if (existingBackend) {
            // Check if config has changed
            const configChanged = JSON.stringify(existingBackend.config || {}) !== JSON.stringify(item.config || {});

            if (configChanged) {
                console.log(`[Server] Config changed for instance: ${instanceId}, restarting backend`);

                // Stop existing backend
                if (existingBackend.cleanup && typeof existingBackend.cleanup === 'function') {
                    try {
                        existingBackend.cleanup();
                    } catch (err) {
                        console.error(`[Server] Error during cleanup for instance ${instanceId}:`, err);
                    }
                }
                activeBackends.delete(instanceId);

                // Start new backend with updated config
                startBackend(instanceId, item);
            }
        } else {
            // Start backends for new instances
            startBackend(instanceId, item);
        }
    }

    // 2. Stop backends for instances no longer in layout
    for (const [instanceId, backend] of activeBackends.entries()) {
        if (!activeInstances.has(instanceId)) {
            console.log(`[Server] Stopping backend for removed instance: ${instanceId}`);
            if (backend && typeof backend.cleanup === 'function') {
                try {
                    backend.cleanup();
                    console.log(`[Server] Cleanup completed for instance: ${instanceId}`);
                } catch (err) {
                    console.error(`[Server] Error during cleanup for instance ${instanceId}:`, err);
                }
            }
            activeBackends.delete(instanceId);
            // Also clear the data snapshot for this instance
            widgetDataSnapshot.delete(instanceId);
            console.log(`[Server] Backend and data snapshot removed for instance: ${instanceId}`);
        }
    }
}

/**
 * AI-Consumable Data Export Endpoints
 * These endpoints expose widget data in a format optimized for AI consumption
 */

// Get raw snapshot of all widget data
app.get('/api/dashboard/snapshot', (req, res) => {
    const snapshot = Array.from(widgetDataSnapshot.values());

    res.json({
        timestamp: Date.now(),
        timestampISO: new Date().toISOString(),
        widget_count: snapshot.length,
        widgets: snapshot
    });
});

// Get AI-friendly summary with enhanced metadata
app.get('/api/dashboard/ai-summary', (req, res) => {
    const config = loadConfig();
    const layout = config.layout || [];
    const now = Date.now();
    const widgets = [];

    // Collect data from all active widget instances
    for (const [instanceId, backend] of activeBackends.entries()) {
        const layoutItem = layout.find(item => item.i === instanceId);
        if (!layoutItem) continue;

        let data = null;
        let status = 'unknown';

        // Try to get data from exportData() method
        if (backend.exportData && typeof backend.exportData === 'function') {
            try {
                data = backend.exportData();
                status = data && data.error ? 'error' : 'healthy';
            } catch (err) {
                console.error(`[AI Export] Error calling exportData for ${instanceId}:`, err);
                status = 'error';
                data = { error: err.message };
            }
        } else {
            // Fallback to cached snapshot if no exportData method
            const cached = widgetDataSnapshot.get(instanceId);
            if (cached) {
                data = cached.data;
                status = cached.status;
            } else {
                status = 'no_data';
            }
        }

        widgets.push({
            type: layoutItem.widgetId,
            instance_id: instanceId,
            last_update: new Date().toISOString(),
            status: status,
            data: data,
            config: layoutItem.config || {}
        });
    }

    // Calculate dashboard health
    const errorCount = widgets.filter(w => w.status === 'error').length;
    const healthyCount = widgets.filter(w => w.status === 'healthy').length;
    const noDataCount = widgets.filter(w => w.status === 'no_data').length;

    let dashboardState = 'operational';
    if (noDataCount > 0) dashboardState = 'no_data';
    if (errorCount > 0) dashboardState = 'degraded';
    if (errorCount > widgets.length / 2) dashboardState = 'critical';
    if (widgets.length === 0) dashboardState = 'no_data';

    const summary = {
        timestamp: new Date().toISOString(),
        dashboard_state: dashboardState,
        widget_count: widgets.length,
        health_summary: {
            healthy: healthyCount,
            error: errorCount,
            no_data: noDataCount
        },
        widgets: widgets
    };

    res.json(summary);
});

// Get data for a specific widget instance
app.get('/api/dashboard/widget/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    const widgetData = widgetDataSnapshot.get(instanceId);

    if (!widgetData) {
        return res.status(404).json({
            error: 'Widget instance not found',
            instanceId
        });
    }

    res.json({
        ...widgetData,
        age_seconds: Math.floor((Date.now() - widgetData.timestamp) / 1000)
    });
});

// Get all data for a specific widget type
app.get('/api/dashboard/widget-type/:widgetId', (req, res) => {
    const { widgetId } = req.params;
    const widgets = Array.from(widgetDataSnapshot.values())
        .filter(w => w.widgetId === widgetId);

    if (widgets.length === 0) {
        return res.status(404).json({
            error: 'No instances of this widget type found',
            widgetId
        });
    }

    res.json({
        widgetId,
        instance_count: widgets.length,
        instances: widgets
    });
});

// Get full email content from email widget cache
app.get('/api/widgets/:instanceId/email/:uid', (req, res) => {
    const { instanceId, uid } = req.params;
    const backend = activeBackends.get(instanceId);

    if (!backend) {
        return res.status(404).json({
            error: 'Widget instance not found',
            instanceId
        });
    }

    if (!backend.getEmail) {
        return res.status(400).json({
            error: 'This widget does not support email retrieval',
            instanceId
        });
    }

    const email = backend.getEmail(parseInt(uid, 10));

    if (!email) {
        return res.status(404).json({
            error: 'Email not found in cache',
            uid
        });
    }

    res.json(email);
});

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    console.log(`[SSE] Client connected: ${clientId}. Total clients: ${clients.length}`);

    // Initial message
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

    // Trigger immediate refresh for all widgets and send cached data
    // This ensures widgets display fresh data when browser refreshes
    const config = loadConfig();
    const layout = config.layout || [];

    for (const [instanceId, backend] of activeBackends.entries()) {
        const layoutItem = layout.find(item => item.i === instanceId);
        if (!layoutItem) continue;

        // Trigger refresh if backend supports it (will broadcast fresh data via SSE)
        if (backend.refresh && typeof backend.refresh === 'function') {
            try {
                console.log(`[SSE] Triggering refresh for ${layoutItem.widgetId} (${instanceId})`);
                backend.refresh();
            } catch (err) {
                console.error(`[SSE] Error refreshing ${instanceId}:`, err);
            }
        }

        // Also send current cached data immediately (in case refresh takes time)
        if (backend.exportData && typeof backend.exportData === 'function') {
            try {
                const data = backend.exportData();
                const timestamp = new Date().toISOString();
                const payload = JSON.stringify({
                    type: layoutItem.widgetId,
                    data: { ...data, instanceId },
                    timestamp
                });
                res.write(`data: ${payload}\n\n`);
                console.log(`[SSE] Sent cached data to new client for ${layoutItem.widgetId} (${instanceId})`);
            } catch (err) {
                console.error(`[SSE] Error sending cached data for ${instanceId}:`, err);
            }
        }
    }

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        console.log(`[SSE] Client disconnected: ${clientId}. Total clients: ${clients.length}`);
    });
});

// Start Discovery
discoverWidgets();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
