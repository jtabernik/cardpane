import { useState } from 'react';
import type { Widget, ConfigSchema } from '../core/types';

interface EditWidgetModalProps {
  widget: Widget;
  currentConfig?: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onClose: () => void;
}

export const EditWidgetModal: React.FC<EditWidgetModalProps> = ({
  widget,
  currentConfig = {},
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState<Record<string, any>>(() => {
    // Initialize config with defaults from schema on mount
    if (widget.configSchema) {
      const withDefaults = { ...currentConfig };
      Object.entries(widget.configSchema).forEach(([key, field]) => {
        if (withDefaults[key] === undefined && field.default !== undefined) {
          withDefaults[key] = field.default;
        }
      });
      return withDefaults;
    }
    return currentConfig;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (key: string, value: any, schema: ConfigSchema): string | null => {
    const field = schema[key];
    if (!field) return null;

    // Required field validation
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }

    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'number' && typeof value !== 'number') {
        return `${field.label} must be a number`;
      }
      if (field.type === 'boolean' && typeof value !== 'boolean') {
        return `${field.label} must be a boolean`;
      }
    }

    // Number range validation
    if (field.type === 'number' && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
      if (field.max !== undefined && value > field.max) {
        return `${field.label} must be at most ${field.max}`;
      }
    }

    // Select validation
    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      return `${field.label} must be one of: ${field.options.join(', ')}`;
    }

    return null;
  };

  const handleChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));

    // Clear error for this field if it exists
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    if (!widget.configSchema) {
      onSave(config);
      return;
    }

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(widget.configSchema).forEach(key => {
      const error = validateField(key, config[key], widget.configSchema!);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(config);
  };

  // Handle overlay click - only close if clicking directly on the overlay, not on children
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!widget.configSchema || Object.keys(widget.configSchema).length === 0) {
    return (
      <div style={overlayStyle} onClick={handleOverlayClick}>
        <div style={modalStyle}>
          <h2 style={titleStyle}>Configure {widget.name}</h2>
          <p style={messageStyle}>This widget has no configuration options.</p>
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <h2 style={titleStyle}>Configure {widget.name}</h2>
        {widget.description && <p style={descriptionStyle}>{widget.description}</p>}

        <div style={formStyle}>
          {Object.entries(widget.configSchema).map(([key, field]) => (
            <div key={key} style={fieldGroupStyle}>
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={requiredStyle}>*</span>}
              </label>

              {field.description && (
                <p style={fieldDescriptionStyle}>{field.description}</p>
              )}

              {field.type === 'string' && (
                <input
                  type="text"
                  value={config[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={inputStyle}
                  placeholder={field.hint}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={config[key] ?? ''}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  style={inputStyle}
                  min={field.min}
                  max={field.max}
                  placeholder={field.hint}
                />
              )}

              {field.type === 'boolean' && (
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={config[key] || false}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span>{field.hint || 'Enable'}</span>
                </label>
              )}

              {field.type === 'select' && field.options && (
                <select
                  value={config[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {field.options.map((option: any) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.hint && field.type !== 'boolean' && (
                <p style={hintStyle}>{field.hint}</p>
              )}

              {errors[key] && <p style={errorStyle}>{errors[key]}</p>}
            </div>
          ))}
        </div>

        <div style={buttonContainerStyle}>
          <button style={cancelButtonStyle} onClick={onClose}>
            Cancel
          </button>
          <button style={saveButtonStyle} onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--widget-bg)',
  borderRadius: '12px',
  padding: '30px',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--widget-border)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  color: 'var(--dashboard-text)',
  fontSize: '24px',
  fontWeight: '600',
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: 'var(--dashboard-text)',
  opacity: 0.7,
  fontSize: '14px',
};

const messageStyle: React.CSSProperties = {
  margin: '20px 0',
  color: 'var(--dashboard-text)',
  opacity: 0.7,
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '30px',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  fontSize: '14px',
  fontWeight: '500',
};

const requiredStyle: React.CSSProperties = {
  color: '#ef4444',
  marginLeft: '4px',
};

const fieldDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--dashboard-text)',
  opacity: 0.6,
  fontSize: '12px',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid var(--widget-border)',
  backgroundColor: 'var(--dashboard-bg)',
  color: 'var(--dashboard-text)',
  fontSize: '14px',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'var(--dashboard-text)',
  fontSize: '14px',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--dashboard-text)',
  opacity: 0.5,
  fontSize: '12px',
  fontStyle: 'italic',
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: '#ef4444',
  fontSize: '12px',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const cancelButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'transparent',
  color: 'var(--dashboard-text)',
  border: '1px solid var(--widget-border)',
};

const saveButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'var(--primary-color)',
  color: 'white',
};

