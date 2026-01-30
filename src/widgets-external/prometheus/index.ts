import type { Widget } from '../../core/types';
import { PrometheusComponent } from './PrometheusComponent';

export const widget: Widget = {
  id: 'prometheus-widget',
  name: 'Prometheus Metrics',
  description: 'Graph time series data from Prometheus using PromQL queries',
  component: PrometheusComponent,
  defaultSize: { w: 3, h: 2 },

  configSchema: {
    timeRange: {
      type: 'select',
      label: 'Time Range',
      description: 'Time window to display',
      required: false,
      default: '1h',
      options: ['5m', '15m', '1h', '6h', '24h', '7d'],
      hint: '5 minutes, 15 minutes, 1 hour, 6 hours, 24 hours, or 7 days',
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to fetch new data',
      required: false,
      default: 30,
      min: 10,
      max: 300,
      hint: 'Minimum 10 seconds to avoid rate limiting',
    },
    label: {
      type: 'string',
      label: 'Display Label',
      description: 'Name shown in the widget header',
      required: false,
      default: 'Metric',
      hint: 'e.g., "CPU Usage", "Memory", "Requests/sec"',
    },
    chartColor: {
      type: 'string',
      label: 'Chart Color',
      description: 'Hex color for the chart line',
      required: false,
      default: '#60a5fa',
      hint: 'e.g., #60a5fa (blue), #34d399 (green), #f87171 (red)',
    },
  },

  secretsSchema: {
    prometheusUrl: {
      type: 'string',
      label: 'Prometheus URL',
      description: 'Base URL of your Prometheus server',
      required: true,
      hint: 'e.g., http://localhost:9090 or https://prometheus.example.com',
    },
    query: {
      type: 'string',
      label: 'PromQL Query',
      description: 'Prometheus query to execute (same syntax as Grafana)',
      required: true,
      hint: 'e.g., rate(http_requests_total[5m]) or node_cpu_seconds_total{mode="idle"}',
    },
    username: {
      type: 'string',
      label: 'Username (optional)',
      description: 'Username for basic authentication',
      required: false,
    },
    password: {
      type: 'password',
      label: 'Password (optional)',
      description: 'Password for basic authentication',
      required: false,
    },
  },

  dataExportSchema: {
    description: 'Prometheus time series metrics',
    fields: {
      label: {
        type: 'string',
        description: 'Display label for the metric',
      },
      timeRange: {
        type: 'string',
        description: 'Time range being displayed',
      },
      dataPoints: {
        type: 'number',
        description: 'Number of data points in the series',
      },
      min: {
        type: 'number',
        description: 'Minimum value in the time range',
      },
      max: {
        type: 'number',
        description: 'Maximum value in the time range',
      },
      current: {
        type: 'number',
        description: 'Most recent value',
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO timestamp of last successful fetch',
      },
    },
  },
};
