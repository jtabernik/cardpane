/**
 * Application Configuration
 *
 * In development: Uses localhost:3001 for direct backend access
 * In production: Uses relative URLs (proxied by nginx)
 */

const isDev = import.meta.env.DEV;

export const API_BASE_URL = isDev
  ? 'http://localhost:3001'
  : '';

export const API_ENDPOINTS = {
  layout: `${API_BASE_URL}/api/layout`,
  events: `${API_BASE_URL}/api/events`,
  health: `${API_BASE_URL}/api/health`,
  secrets: (widgetId: string) => `${API_BASE_URL}/api/admin/widgets/${widgetId}/secrets`,
};
