import { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

interface DockerData {
  containerName: string;
  containerId: string;
  image: string;
  state: string;
  status: string;
  health: string;
  restartCount: number;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  networkRxFormatted: string;
  networkTxFormatted: string;
  blockRead: number;
  blockWrite: number;
  blockReadFormatted: string;
  blockWriteFormatted: string;
  lastUpdate: string;
  error?: string;
  instanceId?: string;
}

export const DockerComponent: React.FC<WidgetProps> = ({ id, size }) => {
  const [data, setData] = useState<DockerData | null>(null);

  useSSE('docker-widget', (incoming) => {
    if (incoming.instanceId === id) {
      setData(incoming as DockerData);
    }
  });

  if (!data) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Connecting to Docker...</div>
      </div>
    );
  }

  if (data.error && data.state === 'ERROR') {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">{data.containerName}</div>
        <div className="text-error" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          {data.error}
        </div>
      </div>
    );
  }

  // Determine state color
  const getStateStyle = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running':
        return { color: '#4ade80' }; // green
      case 'paused':
        return { color: '#fbbf24' }; // yellow
      case 'restarting':
        return { color: '#60a5fa' }; // blue
      case 'exited':
      case 'dead':
      case 'removing':
        return { color: '#ef4444' }; // red
      case 'created':
        return { color: '#a78bfa' }; // purple
      default:
        return { color: 'var(--dashboard-text)' };
    }
  };

  // Health color
  const getHealthStyle = (health: string) => {
    switch (health) {
      case 'healthy':
        return { color: '#4ade80' };
      case 'unhealthy':
        return { color: '#ef4444' };
      case 'starting':
        return { color: '#fbbf24' };
      default:
        return { color: 'var(--dashboard-text)', opacity: 0.5 };
    }
  };

  // Color based on percentage
  const getPercentColor = (percent: number) => {
    if (percent > 80) return '#ef4444'; // red
    if (percent > 50) return '#fbbf24'; // yellow
    return '#4ade80'; // green
  };

  const isCompact = size.w < 3 && size.h < 3;
  const isExpanded = size.w >= 3 || size.h >= 3;

  return (
    <div className="widget-card flex-center-column">
      {/* Container Name */}
      <div className="text-small-title mb-small" style={{
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data.containerName}
      </div>

      {/* State */}
      <div className="text-large-bold" style={getStateStyle(data.state)}>
        {data.state.toUpperCase()}
      </div>

      {/* Health indicator (if available) */}
      {data.health !== 'none' && (
        <div style={{ fontSize: '0.75rem', ...getHealthStyle(data.health) }}>
          {data.health}
        </div>
      )}

      {/* Image name */}
      {isExpanded && (
        <div className="text-secondary mb-small" style={{
          fontSize: '0.7rem',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          opacity: 0.7
        }}>
          {data.image}
        </div>
      )}

      {/* Stats grid for running containers */}
      {data.state === 'running' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isExpanded ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
          gap: isExpanded ? '12px' : '8px',
          marginTop: '8px',
          width: '100%',
          maxWidth: '200px'
        }}>
          {/* CPU */}
          <div style={{ textAlign: 'center' }}>
            <div className="text-label" style={{ fontSize: '0.65rem' }}>CPU</div>
            <div style={{
              color: getPercentColor(data.cpuPercent),
              fontWeight: 600,
              fontSize: isCompact ? '0.9rem' : '1rem'
            }}>
              {data.cpuPercent.toFixed(1)}%
            </div>
          </div>

          {/* Memory */}
          <div style={{ textAlign: 'center' }}>
            <div className="text-label" style={{ fontSize: '0.65rem' }}>MEM</div>
            <div style={{
              color: getPercentColor(data.memoryPercent),
              fontWeight: 600,
              fontSize: isCompact ? '0.9rem' : '1rem'
            }}>
              {data.memoryPercent.toFixed(0)}%
            </div>
            {isExpanded && (
              <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                {data.memoryUsage}MB
              </div>
            )}
          </div>

          {/* Network - only show in expanded view */}
          {isExpanded && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label" style={{ fontSize: '0.65rem' }}>NET ↓</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {data.networkRxFormatted}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label" style={{ fontSize: '0.65rem' }}>NET ↑</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {data.networkTxFormatted}
                </div>
              </div>
            </>
          )}

          {/* Block I/O - only show in larger expanded view */}
          {isExpanded && size.h >= 3 && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label" style={{ fontSize: '0.65rem' }}>DISK R</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {data.blockReadFormatted}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-label" style={{ fontSize: '0.65rem' }}>DISK W</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {data.blockWriteFormatted}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Restart count warning */}
      {data.restartCount > 0 && (
        <div style={{
          fontSize: '0.7rem',
          color: data.restartCount > 5 ? '#ef4444' : '#fbbf24',
          marginTop: '8px'
        }}>
          ⟳ {data.restartCount} restart{data.restartCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Status / uptime */}
      {isExpanded && (
        <div className="text-small mt-large" style={{ fontSize: '0.65rem', opacity: 0.6 }}>
          {data.status}
        </div>
      )}
    </div>
  );
};
