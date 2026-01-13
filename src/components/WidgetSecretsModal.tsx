import { useState, useEffect } from 'react';
import type { Widget, SecretsSchema } from '../core/types';

interface WidgetSecretsModalProps {
  widget: Widget;
  onClose: () => void;
  onSave?: () => void;
}

export const WidgetSecretsModal: React.FC<WidgetSecretsModalProps> = ({
  widget,
  onClose,
  onSave
}) => {
  const [secrets, setSecrets] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingSecrets, setLoadingSecrets] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch existing secrets from server
  useEffect(() => {
    const fetchExistingSecrets = async () => {
      if (!widget.secretsSchema) {
        setLoadingSecrets(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/admin/widgets/${widget.id}/secrets`);

        if (response.ok) {
          const data = await response.json();

          // Merge existing secrets with defaults
          const withDefaults: Record<string, any> = {};
          Object.entries(widget.secretsSchema).forEach(([key, field]) => {
            // Use existing value if available, otherwise use default
            if (data.secrets && data.secrets[key] !== undefined) {
              // For masked strings (e.g., "***"), use default instead
              if (typeof data.secrets[key] === 'string' && data.secrets[key].includes('***')) {
                withDefaults[key] = field.default !== undefined ? field.default : '';
              } else {
                withDefaults[key] = data.secrets[key];
              }
            } else if (field.default !== undefined) {
              withDefaults[key] = field.default;
            }
          });

          setSecrets(withDefaults);
        } else {
          // If fetching fails, just use defaults
          const withDefaults: Record<string, any> = {};
          Object.entries(widget.secretsSchema).forEach(([key, field]) => {
            if (field.default !== undefined) {
              withDefaults[key] = field.default;
            }
          });
          setSecrets(withDefaults);
        }
      } catch (error) {
        console.error('Failed to fetch existing secrets:', error);
        // Use defaults on error
        const withDefaults: Record<string, any> = {};
        Object.entries(widget.secretsSchema).forEach(([key, field]) => {
          if (field.default !== undefined) {
            withDefaults[key] = field.default;
          }
        });
        setSecrets(withDefaults);
      } finally {
        setLoadingSecrets(false);
      }
    };

    fetchExistingSecrets();
  }, [widget]);

  const validateField = (key: string, value: any, schema: SecretsSchema): string | null => {
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
    setSecrets(prev => ({ ...prev, [key]: value }));

    // Clear error for this field if it exists
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    // Clear save status on any change
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!widget.secretsSchema) {
      onClose();
      return;
    }

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(widget.secretsSchema).forEach(key => {
      const error = validateField(key, secrets[key], widget.secretsSchema!);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save secrets via API
    setLoading(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`http://localhost:3001/api/admin/widgets/${widget.id}/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secrets),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save secrets');
      }

      setSaveStatus('success');

      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save secrets:', error);
      setSaveStatus('error');
      setErrors({ _general: error instanceof Error ? error.message : 'Failed to save secrets' });
    } finally {
      setLoading(false);
    }
  };

  // Handle overlay click - only close if clicking directly on the overlay, not on children
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!widget.secretsSchema || Object.keys(widget.secretsSchema).length === 0) {
    return (
      <div style={overlayStyle} onClick={handleOverlayClick}>
        <div style={modalStyle}>
          <h2 style={titleStyle}>Configure {widget.name}</h2>
          <p style={messageStyle}>This widget has no secrets to configure.</p>
          <div style={buttonContainerStyle}>
            <button style={buttonStyle} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingSecrets) {
    return (
      <div style={overlayStyle} onClick={handleOverlayClick}>
        <div style={modalStyle}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: 'var(--dashboard-text)', opacity: 0.7 }}>
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Configure {widget.name} Secrets</h2>
          {widget.description && <p style={descriptionStyle}>{widget.description}</p>}
          <div style={warningBoxStyle}>
            <span style={{ fontSize: '18px', marginRight: '8px' }}>🔒</span>
            <div>
              <strong>Widget-Level Settings</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                These settings apply to all instances of this widget type.
                Secrets like API keys are stored securely on the server.
              </p>
            </div>
          </div>
        </div>

        <div style={formStyle}>
          {Object.entries(widget.secretsSchema).map(([key, field]) => (
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
                  type={key.toLowerCase().includes('key') || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                  value={secrets[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={inputStyle}
                  placeholder={field.hint}
                  disabled={loading}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={secrets[key] ?? ''}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  style={inputStyle}
                  min={field.min}
                  max={field.max}
                  placeholder={field.hint}
                  disabled={loading}
                />
              )}

              {field.type === 'boolean' && (
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={secrets[key] || false}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    style={checkboxStyle}
                    disabled={loading}
                  />
                  <span>{field.hint || 'Enable'}</span>
                </label>
              )}

              {field.type === 'select' && field.options && (
                <select
                  value={secrets[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={selectStyle}
                  disabled={loading}
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

          {errors._general && (
            <div style={generalErrorStyle}>
              {errors._general}
            </div>
          )}

          {saveStatus === 'success' && (
            <div style={successMessageStyle}>
              ✓ Secrets saved successfully! Restarting widget backends...
            </div>
          )}
        </div>

        <div style={buttonContainerStyle}>
          <button
            style={cancelButtonStyle}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            style={{
              ...saveButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Secrets'}
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
  maxWidth: '600px',
  width: '90%',
  maxHeight: '85vh',
  overflow: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--widget-border)',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  color: 'var(--dashboard-text)',
  fontSize: '24px',
  fontWeight: '600',
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: 'var(--dashboard-text)',
  opacity: 0.7,
  fontSize: '14px',
};

const warningBoxStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '8px',
  color: 'var(--dashboard-text)',
  fontSize: '13px',
  lineHeight: '1.4',
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

const generalErrorStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '6px',
  color: '#ef4444',
  fontSize: '13px',
};

const successMessageStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(34, 197, 94, 0.1)',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderRadius: '6px',
  color: '#22c55e',
  fontSize: '13px',
  fontWeight: '500',
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
