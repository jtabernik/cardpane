import React, { useState, useEffect } from 'react';

interface StyleSwitcherProps {
  isEditable: boolean;
}

const STYLESHEETS = [
  { id: 'default', name: 'Default', path: '/src/styles/widgets.css' },
  { id: 'neon', name: 'Neon', path: '/src/styles/widgets-neon.css' },
  { id: 'mono', name: 'Monochrome', path: '/src/styles/widgets-mono.css' },
];

export const StyleSwitcher: React.FC<StyleSwitcherProps> = ({ isEditable }) => {
  const [currentStyle, setCurrentStyle] = useState('default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('widget-stylesheet');
    if (saved) {
      setCurrentStyle(saved);
      applyStylesheet(saved);
    }
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
    setIsOpen(false);
  };

  if (!isEditable) {
    return null;
  }

  const currentStylesheet = STYLESHEETS.find(s => s.id === currentStyle);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
    }}>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          background: 'var(--widget-bg)',
          border: '1px solid var(--widget-border)',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '180px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: 'var(--dashboard-text)',
            opacity: 0.7,
            textTransform: 'uppercase',
          }}>
            Widget Style
          </div>
          {STYLESHEETS.map(style => (
            <button
              key={style.id}
              onClick={() => handleStyleChange(style.id)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                marginBottom: '4px',
                background: currentStyle === style.id
                  ? 'var(--primary-color)'
                  : 'transparent',
                color: currentStyle === style.id
                  ? 'white'
                  : 'var(--dashboard-text)',
                border: '1px solid var(--widget-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (currentStyle !== style.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentStyle !== style.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {style.name}
              {currentStyle === style.id && ' ✓'}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={`Current: ${currentStylesheet?.name || 'Default'}`}
      >
        🎨
      </button>
    </div>
  );
};
