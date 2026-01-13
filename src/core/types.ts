import type { ComponentType } from 'react';

/**
 * Dimensions in grid units
 */
export interface GridSize {
  w: number;
  h: number;
}

/**
 * Field definition for widget configuration or secrets
 */
export interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string; // Display label for the field
  description?: string; // Longer description
  required: boolean;
  default?: any;
  options?: any[]; // For select type
  hint?: string; // Helper text, e.g., "Get your key at https://..."
  min?: number; // For number type
  max?: number; // For number type
}

/**
 * Secret field definition for a widget
 */
export interface SecretFieldDefinition extends FieldDefinition {}

/**
 * Config field definition for a widget
 */
export interface ConfigFieldDefinition extends FieldDefinition {}

/**
 * Schema defining what secrets a widget needs
 */
export type SecretsSchema = Record<string, SecretFieldDefinition>;

/**
 * Schema defining what configuration a widget needs
 */
export type ConfigSchema = Record<string, ConfigFieldDefinition>;

/**
 * Data export field definition for AI consumption
 */
export interface DataExportField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  unit?: string; // Optional unit (e.g., "celsius", "percent", "bytes")
}

/**
 * Schema defining what data a widget exports for AI/external consumption
 */
export interface DataExportSchema {
  description?: string; // Overall description of what this widget exports
  fields: Record<string, DataExportField>;
}

/**
 * Interface that all Widgets must implement.
 */
export interface Widget {
  id: string;
  name: string;
  description?: string;
  component: ComponentType<WidgetProps>;
  defaultSize: GridSize;
  supportedSizes?: GridSize[]; // If defined, restrict resizing to these
  secretsSchema?: SecretsSchema; // Defines what secrets this widget needs (server-side only)
  configSchema?: ConfigSchema; // Defines what configuration this widget needs (per-instance)
  dataExportSchema?: DataExportSchema; // Defines what data this widget exports for AI/external consumption
}

/**
 * Props passed to the Widget Component
 */
export interface WidgetProps {
  id: string; // The instance ID on the dashboard
  size: GridSize; // Current size
  config?: Record<string, any>; // Instance-specific configuration
}

/**
 * Configuration for a widget instance on the dashboard
 */
export interface DashboardItemConfig {
  i: string; // Unique instance ID
  widgetId: string; // ID of the registered widget type
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, any>; // Instance-specific configuration
}

export type DashboardLayout = DashboardItemConfig[];
