import { useState } from 'react';
import { registeredWidgets } from '../widgets';
import { WidgetSecretsModal } from './WidgetSecretsModal';
import type { Widget } from '../core/types';

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [activeTab, setActiveTab] = useState<'widgets' | 'dashboard'>('widgets');

  // Filter widgets that have secrets schemas
  const widgetsWithSecrets = registeredWidgets.filter(w =>
    w.secretsSchema && Object.keys(w.secretsSchema).length > 0
  );

  const widgetsWithoutSecrets = registeredWidgets.filter(w =>
    !w.secretsSchema || Object.keys(w.secretsSchema).length === 0
  );

  // Handle overlay click - only close if clicking directly on the overlay, not on children
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div style={overlayStyle} onClick={handleOverlayClick}>
        <div style={modalStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={titleRowStyle}>
              <h1 style={titleStyle}>Dashboard Settings</h1>
              <button style={closeButtonStyle} onClick={onClose} title="Close">
                ✕
              </button>
            </div>
            <p style={subtitleStyle}>
              Configure widget secrets and dashboard preferences
            </p>
          </div>

          {/* Tabs */}
          <div style={tabContainerStyle}>
            <button
              style={{
                ...tabStyle,
                ...(activeTab === 'widgets' ? activeTabStyle : {})
              }}
              onClick={() => setActiveTab('widgets')}
            >
              Widget Secrets
            </button>
            <button
              style={{
                ...tabStyle,
                ...(activeTab === 'dashboard' ? activeTabStyle : {})
              }}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            {activeTab === 'widgets' && (
              <div>
                <div style={infoBoxStyle}>
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>ℹ️</span>
                  <div style={{ flex: 1 }}>
                    <strong>Widget Secrets</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                      Configure API keys and settings that apply to all instances of each widget type.
                      These are stored securely on the server and never exposed to the frontend.
                    </p>
                  </div>
                </div>

                {widgetsWithSecrets.length > 0 ? (
                  <>
                    <h3 style={sectionTitleStyle}>Widgets Requiring Configuration</h3>
                    <div style={widgetListStyle}>
                      {widgetsWithSecrets.map(widget => (
                        <div key={widget.id} style={widgetCardStyle}>
                          <div style={widgetInfoStyle}>
                            <h4 style={widgetNameStyle}>{widget.name}</h4>
                            {widget.description && (
                              <p style={widgetDescStyle}>{widget.description}</p>
                            )}
                            <div style={secretsBadgeContainerStyle}>
                              {Object.entries(widget.secretsSchema!).map(([key, field]) => (
                                <span key={key} style={secretBadgeStyle}>
                                  {field.required && <span style={requiredDotStyle}>●</span>}
                                  {field.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            style={configureButtonStyle}
                            onClick={() => setSelectedWidget(widget)}
                          >
                            Configure
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={emptyStateStyle}>
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>🔧</span>
                    <p>No widgets require secret configuration</p>
                  </div>
                )}

                {widgetsWithoutSecrets.length > 0 && (
                  <>
                    <h3 style={{...sectionTitleStyle, marginTop: '32px'}}>
                      Widgets Without Secrets
                    </h3>
                    <div style={simpleListStyle}>
                      {widgetsWithoutSecrets.map(widget => (
                        <div key={widget.id} style={simpleWidgetItemStyle}>
                          <div>
                            <span style={simpleWidgetNameStyle}>{widget.name}</span>
                            {widget.description && (
                              <span style={simpleWidgetDescStyle}> — {widget.description}</span>
                            )}
                          </div>
                          <span style={noSecretsLabelStyle}>No secrets required</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div>
                <div style={infoBoxStyle}>
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>🎛️</span>
                  <div style={{ flex: 1 }}>
                    <strong>Dashboard Preferences</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                      General dashboard settings and preferences.
                    </p>
                  </div>
                </div>

                <div style={settingsSectionStyle}>
                  <h3 style={sectionTitleStyle}>Layout</h3>
                  <div style={settingItemStyle}>
                    <div>
                      <div style={settingLabelStyle}>Dashboard Layout</div>
                      <div style={settingDescStyle}>
                        Your dashboard layout is automatically saved to dashboard-layout.json
                      </div>
                    </div>
                    <div style={settingValueStyle}>Auto-saved</div>
                  </div>
                </div>

                <div style={settingsSectionStyle}>
                  <h3 style={sectionTitleStyle}>Theme</h3>
                  <div style={settingItemStyle}>
                    <div>
                      <div style={settingLabelStyle}>Current Theme</div>
                      <div style={settingDescStyle}>
                        Change themes using the paint palette icon (🎨) in the bottom-right
                      </div>
                    </div>
                    <div style={settingValueStyle}>
                      {localStorage.getItem('widget-stylesheet') || 'Default'}
                    </div>
                  </div>
                </div>

                <div style={settingsSectionStyle}>
                  <h3 style={sectionTitleStyle}>Server</h3>
                  <div style={settingItemStyle}>
                    <div>
                      <div style={settingLabelStyle}>Backend URL</div>
                      <div style={settingDescStyle}>Server running on http://localhost:3001</div>
                    </div>
                    <div style={settingValueStyle}>Active</div>
                  </div>
                </div>

                <div style={{...infoBoxStyle, marginTop: '24px', backgroundColor: 'rgba(147, 51, 234, 0.1)', borderColor: 'rgba(147, 51, 234, 0.3)'}}>
                  <span style={{ fontSize: '18px', marginRight: '8px' }}>💡</span>
                  <div style={{ flex: 1, fontSize: '12px', opacity: 0.9 }}>
                    <strong>Developer Note:</strong> Additional dashboard preferences can be added here in future versions,
                    such as grid settings, default widget sizes, or export/import functionality.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secrets Modal */}
      {selectedWidget && (
        <WidgetSecretsModal
          widget={selectedWidget}
          onClose={() => setSelectedWidget(null)}
          onSave={() => {
            // Optionally refresh something after save
            console.log('Secrets saved for', selectedWidget.name);
          }}
        />
      )}
    </>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--dashboard-bg)',
  borderRadius: '12px',
  maxWidth: '900px',
  width: '90%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  border: '1px solid var(--widget-border)',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 30px',
  borderBottom: '1px solid var(--widget-border)',
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--dashboard-text)',
  fontSize: '28px',
  fontWeight: '600',
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--dashboard-text)',
  opacity: 0.6,
  fontSize: '14px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--dashboard-text)',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '6px',
  opacity: 0.6,
  transition: 'all 0.2s',
  lineHeight: '1',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  padding: '0 30px',
  borderBottom: '1px solid var(--widget-border)',
};

const tabStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: 'transparent',
  border: 'none',
  color: 'var(--dashboard-text)',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  opacity: 0.6,
  borderBottom: '2px solid transparent',
  transition: 'all 0.2s',
};

const activeTabStyle: React.CSSProperties = {
  opacity: 1,
  borderBottomColor: 'var(--primary-color)',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px 30px',
};

const infoBoxStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  padding: '14px 16px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '8px',
  color: 'var(--dashboard-text)',
  fontSize: '13px',
  marginBottom: '24px',
  lineHeight: '1.4',
};

const sectionTitleStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  opacity: 0.8,
};

const widgetListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '24px',
};

const widgetCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: 'var(--widget-bg)',
  border: '1px solid var(--widget-border)',
  borderRadius: '8px',
  gap: '16px',
};

const widgetInfoStyle: React.CSSProperties = {
  flex: 1,
};

const widgetNameStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  color: 'var(--dashboard-text)',
  fontSize: '16px',
  fontWeight: '600',
};

const widgetDescStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: 'var(--dashboard-text)',
  opacity: 0.7,
  fontSize: '13px',
};

const secretsBadgeContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const secretBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  backgroundColor: 'rgba(99, 102, 241, 0.15)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
  color: 'var(--dashboard-text)',
};

const requiredDotStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '8px',
};

const configureButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
};

const simpleListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const simpleWidgetItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  backgroundColor: 'var(--widget-bg)',
  border: '1px solid var(--widget-border)',
  borderRadius: '6px',
  fontSize: '13px',
};

const simpleWidgetNameStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  fontWeight: '500',
};

const simpleWidgetDescStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  opacity: 0.6,
};

const noSecretsLabelStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  opacity: 0.4,
  fontSize: '11px',
  fontWeight: '500',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  color: 'var(--dashboard-text)',
  opacity: 0.5,
  gap: '16px',
};

const settingsSectionStyle: React.CSSProperties = {
  marginBottom: '28px',
};

const settingItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  backgroundColor: 'var(--widget-bg)',
  border: '1px solid var(--widget-border)',
  borderRadius: '8px',
  marginBottom: '12px',
};

const settingLabelStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '4px',
};

const settingDescStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  opacity: 0.6,
  fontSize: '12px',
};

const settingValueStyle: React.CSSProperties = {
  color: 'var(--dashboard-text)',
  fontSize: '13px',
  fontWeight: '500',
  opacity: 0.8,
  padding: '6px 12px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '4px',
};
