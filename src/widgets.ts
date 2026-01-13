/**
 * Widget Registry
 *
 * Centralized widget discovery and registration.
 * This file dynamically loads all widgets from the widgets-external directory
 * and provides a single source of truth for the available widgets.
 */

import type { Widget } from './core/types';

/**
 * Use Vite's glob import to discover all widget index.ts files
 */
const widgetModules = import.meta.glob('/src/widgets-external/*/index.ts');

/**
 * Registered widgets loaded dynamically
 */
export let registeredWidgets: Widget[] = [];

/**
 * Load all widgets dynamically
 * Call this function once during app initialization
 */
export async function loadWidgets(): Promise<Widget[]> {
  const discovered: Widget[] = [];

  for (const path in widgetModules) {
    try {
      const mod = await widgetModules[path]() as any;
      // Each index.ts exports a 'widget' object
      if (mod.widget && typeof mod.widget === 'object' && 'id' in mod.widget && 'component' in mod.widget) {
        discovered.push(mod.widget);
        console.log(`[Widgets] Discovered widget: ${mod.widget.id}`);
      } else {
        console.warn(`[Widgets] Invalid widget export at ${path}:`, mod);
      }
    } catch (err) {
      console.error(`[Widgets] Failed to load widget at ${path}:`, err);
    }
  }

  console.log(`[Widgets] Total widgets discovered: ${discovered.length}`);
  registeredWidgets = discovered;
  return discovered;
}

/**
 * Get a widget by its ID
 */
export function getWidgetById(widgetId: string): Widget | undefined {
  return registeredWidgets.find(w => w.id === widgetId);
}

/**
 * Get all widgets that have secrets schemas
 */
export function getWidgetsWithSecrets(): Widget[] {
  return registeredWidgets.filter(w =>
    w.secretsSchema && Object.keys(w.secretsSchema).length > 0
  );
}

/**
 * Get all widgets that have configuration schemas
 */
export function getWidgetsWithConfig(): Widget[] {
  return registeredWidgets.filter(w =>
    w.configSchema && Object.keys(w.configSchema).length > 0
  );
}
