import { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

interface TrueNASData {
  poolName: string;
  poolStatus: string;
  totalDisks: number;
  disksWithErrors: number;
  lastUpdate: string;
  error?: string;
  instanceId?: string;
}

export const TrueNASComponent: React.FC<WidgetProps> = ({ id }) => {
  const [data, setData] = useState<TrueNASData | null>(null);

  useSSE('truenas-widget', (incoming) => {
    if (incoming.instanceId === id) {
      setData(incoming as TrueNASData);
    }
  });

  if (!data) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Connecting to TrueNAS...</div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">{data.poolName}</div>
        <div className="text-error">{data.error}</div>
      </div>
    );
  }

  // Determine status color
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return { color: '#4ade80' }; // green
      case 'DEGRADED':
        return { color: '#fbbf24' }; // yellow
      case 'FAULTED':
      case 'OFFLINE':
      case 'REMOVED':
      case 'UNAVAIL':
        return { color: '#ef4444' }; // red
      default:
        return { color: 'var(--dashboard-text)' };
    }
  };

  const getErrorCountStyle = (count: number) => {
    if (count === 0) {
      return { color: '#4ade80' }; // green
    }
    return { color: '#ef4444' }; // red
  };

  return (
    <div className="widget-card flex-center-column">
      <div className="text-small-title mb-small">
        {data.poolName}
      </div>

      <div className="text-large-bold" style={getStatusStyle(data.poolStatus)}>
        {data.poolStatus}
      </div>

      <div className="text-secondary mb-medium">
        {data.totalDisks} disk{data.totalDisks !== 1 ? 's' : ''}
      </div>

      <div className="text-label">
        Errors: <span style={getErrorCountStyle(data.disksWithErrors)}>
          {data.disksWithErrors}
        </span>
      </div>

      <div className="text-small mt-large">
        {new Date(data.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
};
