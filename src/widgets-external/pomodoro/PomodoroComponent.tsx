import { useState, useEffect, useCallback } from 'react';
import type { WidgetProps } from '../../core/types';

export const PomodoroComponent: React.FC<WidgetProps> = ({ config, size }) => {
  const durationMinutes = config?.duration || 25;
  const totalSeconds = durationMinutes * 60;

  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

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

  // Responsive sizing based on widget dimensions
  const minDimension = Math.min(size.w, size.h);
  const svgSize = minDimension <= 1 ? 100 : minDimension <= 2 ? 140 : 180;
  const strokeWidth = minDimension <= 1 ? 8 : minDimension <= 2 ? 10 : 12;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // strokeDashoffset: 0 = full ring, circumference = empty ring
  // We want ring to disappear as time runs out, so offset increases as progress decreases
  const strokeDashoffset = circumference * (1 - progress);

  const isCompact = size.w < 2 || size.h < 2;

  return (
    <div className="widget-card flex-center-column" style={{ gap: isCompact ? '4px' : '12px' }}>
      {/* SVG Ring Timer */}
      <div style={{ position: 'relative', width: svgSize, height: svgSize }}>
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
            fontSize: isCompact ? '1.2rem' : minDimension <= 2 ? '1.5rem' : '2rem',
            fontWeight: 700,
            color: 'var(--dashboard-text)',
            opacity: 0.7,
          }}
        >
          {formatTime(remaining)}
        </div>
      </div>

      {/* Controls */}
      {!isCompact && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleTimer}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isRunning ? 'var(--widget-border)' : 'var(--primary-color)',
              color: 'var(--dashboard-text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {remaining <= 0 ? 'Start' : isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--widget-border)',
              background: 'transparent',
              color: 'var(--dashboard-text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              opacity: 0.7,
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Compact controls - just tap the ring area */}
      {isCompact && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
          }}
          onClick={toggleTimer}
          title={isRunning ? 'Pause' : 'Start'}
        />
      )}
    </div>
  );
};
