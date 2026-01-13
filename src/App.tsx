import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from './core/Dashboard';
import type { DashboardLayout, Widget } from './core/types';
import { AddWidgetModal } from './components/AddWidgetModal';
import { EditWidgetModal } from './components/EditWidgetModal';
import { StyleSwitcher } from './components/StyleSwitcher';
import { SettingsPage } from './components/SettingsPage';
import { loadWidgets } from './widgets';
import './styles/theme.css';

function App() {
  const [availableWidgets, setAvailableWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<DashboardLayout>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<{ instanceId: string; widget: Widget; config?: Record<string, any> } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWidgetsLoading, setIsWidgetsLoading] = useState(true);

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
    fetch('http://localhost:3001/api/layout')
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

  const saveLayout = (newLayout: DashboardLayout) => {
    fetch('http://localhost:3001/api/layout', {
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'inline-block', marginRight: '16px' }}>Dynamic Dashboard</h1>
          <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Modular Discovery System</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleResetLayout}
            style={{
              background: 'transparent',
              color: 'var(--dashboard-text)',
              border: '1px solid var(--widget-border)',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: 0.8
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
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
            title="Dashboard Settings"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            + Add Widget
          </button>
        </div>
      </header>

      <main>
        <Dashboard
          widgets={availableWidgets}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onEditWidget={handleEditWidget}
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

      <StyleSwitcher isEditable={true} />
    </div>
  );
}

export default App;
