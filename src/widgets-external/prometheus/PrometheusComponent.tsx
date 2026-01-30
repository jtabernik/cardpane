import { useState, useEffect, useRef, useCallback } from 'react';
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

// Helper functions outside component to avoid recreation
function formatValue(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(2) + 'G';
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + 'M';
  if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(2) + 'K';
  if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(2);
  return val.toFixed(2);
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(96, 165, 250, ${alpha})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

export const PrometheusComponent: React.FC<WidgetProps> = ({ id, config }) => {
  const [data, setData] = useState<PrometheusData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const dataRef = useRef<PrometheusData | null>(null);

  const chartColor = config?.chartColor || '#60a5fa';

  // Keep dataRef in sync for use in resize handler
  dataRef.current = data;

  // Subscribe to SSE updates
  useSSE('prometheus-widget', (incoming) => {
    if (incoming.instanceId === id) {
      setData(incoming as PrometheusData);
    }
  });

  // Update chart data when data changes (without recreating chart)
  useEffect(() => {
    if (!uplotRef.current || !data?.timestamps || data.timestamps.length === 0) {
      return;
    }
    // Just update data on existing chart
    uplotRef.current.setData([data.timestamps, data.values]);
  }, [data]);

  // Build chart options
  const buildChartOpts = useCallback(
    (width: number, height: number, timeRange: string): uPlot.Options => ({
      width,
      height,
      cursor: { show: true, x: true, y: false },
      legend: { show: false },
      axes: [
        {
          stroke: 'rgba(255,255,255,0.3)',
          grid: { stroke: 'rgba(255,255,255,0.05)', width: 1 },
          ticks: { stroke: 'rgba(255,255,255,0.1)', width: 1 },
          values: (_, ticks) =>
            ticks.map((t) => {
              const date = new Date(t * 1000);
              if (timeRange === '7d') {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }
              return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            }),
          font: '10px system-ui',
          size: 28,
        },
        {
          stroke: 'rgba(255,255,255,0.3)',
          grid: { stroke: 'rgba(255,255,255,0.05)', width: 1 },
          ticks: { stroke: 'rgba(255,255,255,0.1)', width: 1 },
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
        x: { time: true },
        y: {
          auto: true,
          range: (_, min, max) => {
            const pad = (max - min) * 0.1 || 1;
            return [min - pad, max + pad];
          },
        },
      },
    }),
    [chartColor]
  );

  // Create chart and resize observer - only depends on chartColor (config change)
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    // Function to create/recreate chart
    const createChart = () => {
      const currentData = dataRef.current;
      if (!currentData?.timestamps || currentData.timestamps.length === 0) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width < 50 || height < 50) return;

      // Destroy existing chart
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }

      sizeRef.current = { width, height };
      container.innerHTML = '';

      const plotData: uPlot.AlignedData = [currentData.timestamps, currentData.values];
      const opts = buildChartOpts(width, height, currentData.timeRange);
      uplotRef.current = new uPlot(opts, plotData, container);
    };

    // Initial chart creation with small delay to ensure container is sized
    const initTimeout = setTimeout(createChart, 50);

    // Set up resize observer
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          const newWidth = Math.floor(entry.contentRect.width);
          const newHeight = Math.floor(entry.contentRect.height);

          if (newWidth < 50 || newHeight < 50) continue;

          // Only act if size changed significantly
          if (
            Math.abs(newWidth - sizeRef.current.width) > 5 ||
            Math.abs(newHeight - sizeRef.current.height) > 5
          ) {
            sizeRef.current = { width: newWidth, height: newHeight };

            if (uplotRef.current) {
              // Just resize existing chart
              uplotRef.current.setSize({ width: newWidth, height: newHeight });
            } else {
              // No chart yet, try to create one
              createChart();
            }
          }
        }
      }, 100);
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [buildChartOpts]); // Only recreate on chartColor change

  // Track if we need to create chart when data first arrives
  const hasData = data?.timestamps && data.timestamps.length > 0;
  const chartExists = uplotRef.current !== null;

  // Create chart when data first becomes available
  useEffect(() => {
    if (hasData && !chartExists && chartRef.current) {
      const container = chartRef.current;
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width >= 50 && height >= 50 && data) {
        sizeRef.current = { width, height };
        container.innerHTML = '';
        const plotData: uPlot.AlignedData = [data.timestamps, data.values];
        const opts = buildChartOpts(width, height, data.timeRange);
        uplotRef.current = new uPlot(opts, plotData, container);
      }
    }
  }, [hasData, chartExists, data, buildChartOpts]);

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
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: chartColor }}>
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
