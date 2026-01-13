import React from 'react';
import type { Widget } from '../core/types';
import '../styles/theme.css';

interface AddWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (widget: Widget) => void;
    widgets: Widget[];
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    widgets
}) => {
    if (!isOpen) return null;

    // Handle overlay click - only close if clicking directly on the overlay, not on children
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add Widget</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="widget-list">
                    {widgets.map(widget => (
                        <div
                            key={widget.id}
                            className="widget-option"
                            onClick={() => onAdd(widget)}
                        >
                            <h3>{widget.name}</h3>
                            <p>{widget.description}</p>
                            <div className="widget-meta">
                                Default Size: {widget.defaultSize.w}x{widget.defaultSize.h}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: var(--widget-bg);
          border: 1px solid var(--widget-border);
          border-radius: var(--widget-radius);
          width: 500px;
          max-width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid var(--widget-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--dashboard-text);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--dashboard-text);
          font-size: 2rem;
          cursor: pointer;
          opacity: 0.6;
        }
        
        .close-btn:hover {
          opacity: 1;
        }

        .widget-list {
          padding: 20px;
          display: grid;
          gap: 15px;
        }

        .widget-option {
          padding: 15px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--widget-border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .widget-option:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .widget-option h3 {
          margin: 0 0 5px 0;
          color: var(--primary-color);
        }

        .widget-option p {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .widget-meta {
            font-size: 0.8rem;
            opacity: 0.5;
            font-family: monospace;
        }
      `}</style>
        </div>
    );
};
