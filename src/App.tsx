import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from './core/Dashboard';
import type { DashboardLayout, Widget } from './core/types';
import { AddWidgetModal } from './components/AddWidgetModal';
import { EditWidgetModal } from './components/EditWidgetModal';
import { SettingsPage } from './components/SettingsPage';
import { loadWidgets } from './widgets';
import { API_ENDPOINTS } from './config';
import './styles/theme.css';

const STYLESHEETS = [
  { id: 'default', name: 'Default', path: '/src/styles/widgets.css' },
  { id: 'neon', name: 'Neon', path: '/src/styles/widgets-neon.css' },
  { id: 'mono', name: 'Monochrome', path: '/src/styles/widgets-mono.css' },
];

function App() {
  const [availableWidgets, setAvailableWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<DashboardLayout>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<{ instanceId: string; widget: Widget; config?: Record<string, any> } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWidgetsLoading, setIsWidgetsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('default');

  // Load saved style preference
  useEffect(() => {
    const saved = localStorage.getItem('widget-stylesheet');
    if (saved) {
      setCurrentStyle(saved);
      applyStylesheet(saved);
    }
  }, []);

  // Load all widgets dynamically
  useEffect(() => {
    const initWidgets = async () => {
      const widgets = await loadWidgets();
      setAvailableWidgets(widgets);
      setIsWidgetsLoading(false);
    };

    initWidgets();
  }, []);

  // Load layout from API on mount
  useEffect(() => {
    fetch(API_ENDPOINTS.layout)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLayout(data);
        } else {
          // If no layout exists, we'll wait for widgets to load to create a default one
          // or just leave it empty for the user to add.
          setLayout([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        console.warn('Failed to load layout from API, using empty layout');
        setLayout([]);
        setIsLoading(false);
      });
  }, []);

  const applyStylesheet = (styleId: string) => {
    // Remove all widget stylesheets
    const existingLinks = document.querySelectorAll('link[data-widget-stylesheet]');
    existingLinks.forEach(link => link.remove());

    // Add the selected stylesheet
    const stylesheet = STYLESHEETS.find(s => s.id === styleId);
    if (stylesheet) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheet.path;
      link.setAttribute('data-widget-stylesheet', 'true');
      document.head.appendChild(link);
    }
  };

  const handleStyleChange = (styleId: string) => {
    setCurrentStyle(styleId);
    localStorage.setItem('widget-stylesheet', styleId);
    applyStylesheet(styleId);
    setIsMenuOpen(false);
  };

  const saveLayout = (newLayout: DashboardLayout) => {
    fetch(API_ENDPOINTS.layout, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLayout)
    }).catch(err => console.error('Failed to save layout:', err));
  };

  const handleLayoutChange = (newLayout: DashboardLayout) => {
    setLayout(newLayout);
    saveLayout(newLayout);
  };

  const handleAddWidget = (widget: Widget) => {
    const newItem = {
      i: uuidv4(),
      widgetId: widget.id,
      x: 0,
      y: Infinity,
      w: widget.defaultSize.w,
      h: widget.defaultSize.h
    };

    const newLayout = [...layout, newItem];
    handleLayoutChange(newLayout);
    setIsModalOpen(false);
  };

  const handleResetLayout = () => {
    if (confirm('Are you sure you want to reset the dashboard layout?')) {
      handleLayoutChange([]);
    }
  };

  const handleEditWidget = (instanceId: string) => {
    const item = layout.find(l => l.i === instanceId);
    if (!item) return;

    const widget = availableWidgets.find(w => w.id === item.widgetId);
    if (!widget) return;

    setEditingWidget({
      instanceId,
      widget,
      config: item.config
    });
  };

  const handleSaveConfig = (config: Record<string, any>) => {
    if (!editingWidget) return;

    const newLayout = layout.map(item => {
      if (item.i === editingWidget.instanceId) {
        return { ...item, config };
      }
      return item;
    });

    handleLayoutChange(newLayout);
    setEditingWidget(null);
  };

  const handleRemoveWidget = (instanceId: string) => {
    if (confirm('Remove this widget from the dashboard?')) {
      const newLayout = layout.filter(item => item.i !== instanceId);
      handleLayoutChange(newLayout);
    }
  };

  if (isLoading || isWidgetsLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--dashboard-bg)',
        color: 'var(--dashboard-text)',
        gap: '10px'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard...</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>Discovering widgets and loading layout</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid var(--widget-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--dashboard-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CardPane</h1>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'transparent',
              color: 'var(--dashboard-text)',
              border: '1px solid var(--widget-border)',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: 0.8
            }}
          >
            ☰ Menu
          </button>

          {isMenuOpen && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setIsMenuOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--widget-bg)',
                border: '1px solid var(--widget-border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                minWidth: '200px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--dashboard-text)',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--widget-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>➕</span> Add Widget
                </button>
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--dashboard-text)',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--widget-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>⚙️</span> Settings
                </button>
                <button
                  onClick={() => {
                    handleResetLayout();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--dashboard-text)',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--widget-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>🔄</span> Reset Layout
                </button>
                <div style={{
                  padding: '8px 20px 4px',
                  fontSize: '0.75rem',
                  color: 'var(--dashboard-text)',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Theme
                </div>
                {STYLESHEETS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    style={{
                      width: '100%',
                      background: currentStyle === style.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: 'var(--dashboard-text)',
                      border: 'none',
                      padding: '12px 20px 12px 40px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = currentStyle === style.id ? 'rgba(255,255,255,0.1)' : 'transparent'}
                  >
                    <span>{style.name}</span>
                    {currentStyle === style.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main>
        <Dashboard
          widgets={availableWidgets}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onEditWidget={handleEditWidget}
          onRemoveWidget={handleRemoveWidget}
        />
      </main>

      <AddWidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddWidget}
        widgets={availableWidgets}
      />

      {editingWidget && (
        <EditWidgetModal
          widget={editingWidget.widget}
          currentConfig={editingWidget.config}
          onSave={handleSaveConfig}
          onClose={() => setEditingWidget(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsPage onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
