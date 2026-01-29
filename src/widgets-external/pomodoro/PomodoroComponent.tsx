import { useState, useEffect, useCallback, useRef } from 'react';
import type { WidgetProps } from '../../core/types';

export const PomodoroComponent: React.FC<WidgetProps> = ({ config }) => {
  const durationMinutes = config?.duration || 25;
  const totalSeconds = durationMinutes * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset timer when duration config changes
  useEffect(() => {
    setRemaining(durationMinutes * 60);
    setIsRunning(false);
  }, [durationMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remaining]);

  const toggleTimer = useCallback(() => {
    if (remaining <= 0) {
      // Reset and start
      setRemaining(totalSeconds);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [remaining, totalSeconds]);

  const resetTimer = useCallback(() => {
    setRemaining(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG ring calculations
  const progress = remaining / totalSeconds;

  // Calculate ring size to fill most of the container
  // Leave space for controls at the bottom (about 32px)
  const controlsHeight = 32;
  const padding = 16;
  const availableWidth = containerSize.width - padding * 2;
  const availableHeight = containerSize.height - padding * 2 - controlsHeight;
  const svgSize = Math.max(60, Math.min(availableWidth, availableHeight));

  // Scale stroke width proportionally
  const strokeWidth = Math.max(6, Math.min(14, svgSize * 0.07));
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // strokeDashoffset: 0 = full ring, circumference = empty ring
  // We want ring to disappear as time runs out, so offset increases as progress decreases
  const strokeDashoffset = circumference * (1 - progress);

  // Scale font size based on ring size
  const fontSize = Math.max(0.9, Math.min(2.5, svgSize / 80));

  return (
    <div
      ref={containerRef}
      className="widget-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* SVG Ring Timer */}
      <div style={{ position: 'relative', width: svgSize, height: svgSize, flexShrink: 0 }}>
        <svg
          width={svgSize}
          height={svgSize}
          style={{
            // Rotate 90deg to start at bottom, scaleX(-1) to make it go clockwise
            transform: 'rotate(90deg) scaleX(-1)',
          }}
        >
          {/* Background ring - shows through when foreground is consumed */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="var(--widget-border)"
            strokeWidth={strokeWidth}
          />

          {/* Foreground ring - the timer progress */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="var(--dashboard-text)"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none',
              opacity: 0.6,
            }}
          />
        </svg>

        {/* Time display in center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'inherit',
            fontSize: `${fontSize}rem`,
            fontWeight: 700,
            color: 'var(--dashboard-text)',
            opacity: 0.7,
          }}
        >
          {formatTime(remaining)}
        </div>
      </div>

      {/* Icon Controls - positioned at bottom corners */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Reset icon - left side */}
        <button
          onClick={resetTimer}
          title="Reset"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--dashboard-text)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          ↺
        </button>

        {/* Play/Pause icon - right side */}
        <button
          onClick={toggleTimer}
          title={remaining <= 0 ? 'Start' : isRunning ? 'Pause' : 'Start'}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--dashboard-text)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
};
