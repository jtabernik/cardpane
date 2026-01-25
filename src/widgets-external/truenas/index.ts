import type { Widget } from '../../core/types';
import { TrueNASComponent } from './TrueNASComponent';

export const widget: Widget = {
  id: 'truenas-widget',
  name: 'TrueNAS Health',
  description: 'Monitor TrueNAS pool status and disk health',
  component: TrueNASComponent,
  defaultSize: { w: 2, h: 2 },

  secretsSchema: {
    username: {
      type: 'string',
      label: 'Username',
      description: 'TrueNAS admin username',
      required: true,
      hint: 'Usually "root" or your admin account'
    },
    password: {
      type: 'string',
      label: 'Password',
      description: 'TrueNAS admin password',
      required: true,
      hint: 'Your TrueNAS login password'
    }
  },

  configSchema: {
    serverAddress: {
      type: 'string',
      label: 'Server Address',
      description: 'TrueNAS server IP or hostname',
      required: true,
      default: '192.168.0.146',
      hint: 'e.g., 192.168.0.146 or truenas.local'
    },
    poolName: {
      type: 'string',
      label: 'Pool Name',
      description: 'Name of the ZFS pool to monitor',
      required: true,
      default: 'tank',
      hint: 'e.g., tank, data, pool1'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (minutes)',
      description: 'How often to check pool health',
      required: false,
      default: 5,
      min: 1,
      max: 60,
      hint: 'Recommended: 5 minutes'
    }
  },

  dataExportSchema: {
    description: 'TrueNAS pool health and disk status',
    fields: {
      poolName: {
        type: 'string',
        description: 'Name of the ZFS pool'
      },
      poolStatus: {
        type: 'string',
        description: 'Pool health status (ONLINE, DEGRADED, FAULTED, etc.)'
      },
      totalDisks: {
        type: 'number',
        description: 'Total number of disks in the pool'
      },
      disksWithErrors: {
        type: 'number',
        description: 'Number of disks with read/write/checksum errors'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last health check'
      }
    }
  }
};
