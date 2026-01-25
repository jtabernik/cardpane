import type { Widget } from '../../core/types';
import { DockerComponent } from './DockerComponent';

export const widget: Widget = {
  id: 'docker-widget',
  name: 'Docker Container',
  description: 'Monitor Docker container status and resource usage',
  component: DockerComponent,
  defaultSize: { w: 2, h: 2 },

  configSchema: {
    hostAddress: {
      type: 'string',
      label: 'Docker Host',
      description: 'IP or hostname of the Docker host',
      required: true,
      default: '192.168.0.100',
      hint: 'e.g., 192.168.0.100 or docker.local'
    },
    port: {
      type: 'number',
      label: 'API Port',
      description: 'Docker API port',
      required: false,
      default: 2375,
      min: 1,
      max: 65535,
      hint: '2375 (unencrypted) or 2376 (TLS)'
    },
    containerName: {
      type: 'string',
      label: 'Container Name',
      description: 'Name or ID of the container to monitor',
      required: true,
      default: '',
      hint: 'e.g., nginx, portainer, or container ID'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to check container status',
      required: false,
      default: 30,
      min: 5,
      max: 300,
      hint: 'Recommended: 30 seconds'
    },
    showStats: {
      type: 'boolean',
      label: 'Show Resource Stats',
      description: 'Display CPU and memory usage',
      required: false,
      default: true,
      hint: 'Requires additional API call'
    }
  },

  dataExportSchema: {
    description: 'Docker container status and resource metrics',
    fields: {
      containerName: {
        type: 'string',
        description: 'Name of the container'
      },
      containerId: {
        type: 'string',
        description: 'Container ID (short form)'
      },
      image: {
        type: 'string',
        description: 'Container image name'
      },
      state: {
        type: 'string',
        description: 'Container state (running, exited, paused, etc.)'
      },
      status: {
        type: 'string',
        description: 'Human-readable status (e.g., "Up 2 hours")'
      },
      health: {
        type: 'string',
        description: 'Health check status (healthy, unhealthy, starting, none)'
      },
      restartCount: {
        type: 'number',
        description: 'Number of times container has restarted'
      },
      cpuPercent: {
        type: 'number',
        description: 'CPU usage percentage',
        unit: 'percent'
      },
      memoryUsage: {
        type: 'number',
        description: 'Memory usage in MB',
        unit: 'megabytes'
      },
      memoryLimit: {
        type: 'number',
        description: 'Memory limit in MB',
        unit: 'megabytes'
      },
      memoryPercent: {
        type: 'number',
        description: 'Memory usage as percentage of limit',
        unit: 'percent'
      },
      networkRx: {
        type: 'number',
        description: 'Network bytes received',
        unit: 'bytes'
      },
      networkTx: {
        type: 'number',
        description: 'Network bytes transmitted',
        unit: 'bytes'
      },
      blockRead: {
        type: 'number',
        description: 'Block I/O bytes read',
        unit: 'bytes'
      },
      blockWrite: {
        type: 'number',
        description: 'Block I/O bytes written',
        unit: 'bytes'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last check'
      }
    }
  }
};
