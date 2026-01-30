import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { clsx } from 'clsx';
import '../styles/theme.css';

interface WidgetWrapperProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasConfig?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  // Props injected by react-grid-layout
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class WidgetErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WidgetErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#e74c3c',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <div style={{ fontWeight: 'bold' }}>Widget Crashed</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * This component wraps every widget to provide the standard "Card" look
 * and handle grid interactions (drag handle etc)
 */
export const WidgetWrapper = React.forwardRef<HTMLDivElement, WidgetWrapperProps>(
  ({ children, className, style, hasConfig, onEdit, onRemove, ...props }, ref) => {
    const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.();
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <div
        ref={ref}
        style={style}
        className={clsx('widget-wrapper', className)}
        {...props}
      >
        <div className="widget-actions">
          {hasConfig && onEdit && (
            <button
              className="widget-action-button"
              onClick={handleEditClick}
              title="Configure widget"
            >
              ⚙️
            </button>
          )}
          {onRemove && (
            <button
              className="widget-action-button widget-remove-button"
              onClick={handleRemoveClick}
              title="Remove widget"
            >
              ✕
            </button>
          )}
        </div>

        <div className="widget-content">
          <WidgetErrorBoundary>
            {children}
          </WidgetErrorBoundary>
        </div>

        <style>{`
          .widget-wrapper {
            background: var(--widget-bg);
            border: 1px solid var(--widget-border);
            border-radius: var(--widget-radius);
            box-shadow: var(--widget-shadow);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: box-shadow 0.2s ease, border-color 0.2s ease;
            position: relative;
          }

          .widget-wrapper:hover {
             border-color: var(--primary-color);
          }

          .widget-wrapper:hover .widget-actions {
            opacity: 1;
          }

          .widget-actions {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .widget-action-button {
            background: var(--widget-bg);
            border: 1px solid var(--widget-border);
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            transition: background 0.2s ease, border-color 0.2s ease;
            font-size: 14px;
          }

          .widget-action-button:hover {
            background: var(--primary-color);
            border-color: var(--primary-color);
          }

          .widget-remove-button:hover {
            background: #e74c3c;
            border-color: #e74c3c;
          }

          .widget-content {
            flex: 1;
            overflow: auto;
            position: relative;
            height: 100%;
            width: 100%;
          }

          /* React Grid Layout Overrides specific to this wrapper context could go here */
          .react-grid-item.react-grid-placeholder {
            background: var(--primary-color) !important;
            opacity: 0.2 !important;
            border-radius: var(--widget-radius) !important;
          }
        `}</style>
      </div>
    );
  }
);

WidgetWrapper.displayName = 'WidgetWrapper';
