import { useState, useEffect, useRef } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface PrometheusData {
  label: string;
  timeRange: string;
  timestamps: number[];
  values: number[];
  metricLabels?: Record<string, string>;
  min?: number;
  max?: number;
  current?: number;
  lastUpdate: string;
  instanceId?: string;
  error?: string;
}

export const PrometheusComponent: React.FC<WidgetProps> = ({ id, config }) => {
  const [data, setData] = useState<PrometheusData | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  const chartColor = config?.chartColor || '#60a5fa';

  // Track whether we have renderable data (for re-running observer setup)
  const hasRenderableData = data && data.timestamps && data.timestamps.length > 0;

  // Observe chart container size changes
  // Re-run when hasRenderableData changes so we can attach to the newly rendered chartRef
  useEffect(() => {
    const chartContainer = chartRef.current;
    if (!chartContainer) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if we have valid dimensions
        if (width > 0 && height > 0) {
          setChartSize({ width, height });
        }
      }
    });

    resizeObserver.observe(chartContainer);
    return () => resizeObserver.disconnect();
  }, [hasRenderableData]);

  // Subscribe to SSE updates
  useSSE('prometheus-widget', (incoming) => {
    if (incoming.instanceId === id) {
      setData(incoming as PrometheusData);
    }
  });

  // Create/update uPlot chart
  useEffect(() => {
    if (!chartRef.current || !data || !data.timestamps || data.timestamps.length === 0) {
      // Clear existing chart if no data
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
      return;
    }

    // Don't create chart until we have valid dimensions
    if (chartSize.width < 50 || chartSize.height < 50) {
      return;
    }

    const chartContainer = chartRef.current;

    // Use the actual measured chart container dimensions
    const chartWidth = Math.floor(chartSize.width);
    const chartHeight = Math.floor(chartSize.height);

    // Prepare data for uPlot: [timestamps, values]
    const plotData: uPlot.AlignedData = [data.timestamps, data.values];

    // Chart options
    const opts: uPlot.Options = {
      width: chartWidth,
      height: chartHeight,
      cursor: {
        show: true,
        x: true,
        y: false,
      },
      legend: {
        show: false,
      },
      axes: [
        {
          // X axis (time)
          stroke: 'rgba(255,255,255,0.3)',
          grid: {
            stroke: 'rgba(255,255,255,0.05)',
            width: 1,
          },
          ticks: {
            stroke: 'rgba(255,255,255,0.1)',
            width: 1,
          },
          values: (_, ticks) => {
            return ticks.map((t) => {
              const date = new Date(t * 1000);
              // Show time for short ranges, date for longer
              if (data.timeRange === '7d') {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }
              return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            });
          },
          font: '10px system-ui',
          size: 28,
        },
        {
          // Y axis (values)
          stroke: 'rgba(255,255,255,0.3)',
          grid: {
            stroke: 'rgba(255,255,255,0.05)',
            width: 1,
          },
          ticks: {
            stroke: 'rgba(255,255,255,0.1)',
            width: 1,
          },
          values: (_, ticks) => ticks.map((v) => formatValue(v)),
          font: '10px system-ui',
          size: 50,
        },
      ],
      series: [
        {},
        {
          stroke: chartColor,
          width: 1.5,
          fill: hexToRgba(chartColor, 0.15),
        },
      ],
      scales: {
        x: {
          time: true,
        },
        y: {
          auto: true,
          range: (_, min, max) => {
            // Add some padding to the range
            const padding = (max - min) * 0.1 || 1;
            return [min - padding, max + padding];
          },
        },
      },
    };

    // Update existing chart or create new one
    if (uplotRef.current) {
      // Update data and resize if needed
      uplotRef.current.setData(plotData);
      uplotRef.current.setSize({ width: chartWidth, height: chartHeight });
    } else {
      // Create new chart
      chartContainer.innerHTML = '';
      uplotRef.current = new uPlot(opts, plotData, chartContainer);
    }

    return () => {
      // Don't destroy on every update, only on unmount
    };
  }, [data, chartSize, chartColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, []);

  // Format value for display
  function formatValue(val: number): string {
    if (val === undefined || val === null || isNaN(val)) return '-';
    if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(2) + 'G';
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + 'M';
    if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(2) + 'K';
    if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(2);
    return val.toFixed(2);
  }

  // Convert hex color to rgba
  function hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(96, 165, 250, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  }

  // Loading state
  if (!data) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Connecting to Prometheus...</div>
      </div>
    );
  }

  // Error state (no data at all)
  if (data.error && (!data.timestamps || data.timestamps.length === 0)) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">{data.label}</div>
        <div className="text-error" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          {data.error}
        </div>
      </div>
    );
  }

  // No data state
  if (!data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">{data.label}</div>
        <div className="text-muted">No data for this time range</div>
      </div>
    );
  }

  return (
    <div
      className="widget-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '8px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
          flexShrink: 0,
        }}
      >
        <div className="text-small-title" style={{ opacity: 0.9 }}>
          {data.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: chartColor,
            }}
          >
            {formatValue(data.current ?? 0)}
          </span>
          <span className="text-muted" style={{ fontSize: '0.65rem' }}>
            {data.timeRange}
          </span>
        </div>
      </div>

      {/* Error banner if we have data but also an error */}
      {data.error && (
        <div style={{ fontSize: '0.65rem', color: '#fbbf24', marginBottom: '4px', flexShrink: 0 }}>
          Update error: {data.error}
        </div>
      )}

      {/* Chart container */}
      <div
        ref={chartRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      />

      {/* Footer */}
      <div
        className="text-muted"
        style={{
          fontSize: '0.55rem',
          textAlign: 'right',
          opacity: 0.5,
          marginTop: '4px',
          flexShrink: 0,
        }}
      >
        {new Date(data.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
};
