# Widget Development Template

This template helps you quickly create new widgets for the dashboard system.

## Quick Start

### 1. Create Widget Folder

```bash
mkdir src/widgets-external/my-widget
```

### 2. Create Component File: `MyWidgetComponent.tsx`

```typescript
import React from 'react';
import type { WidgetProps } from '../../core/types';

export const MyWidgetComponent: React.FC<WidgetProps> = ({ id, size, config }) => {
  return (
    <div className="widget-card flex-center-column">
      <h2 className="text-small-title">My Widget</h2>
      <p className="text-label">Instance ID: {id}</p>
      <p className="text-label">Size: {size.w} x {size.h}</p>
    </div>
  );
};
```

### 3. Create Definition File: `index.ts`

```typescript
import type { Widget } from '../../core/types';
import { MyWidgetComponent } from './MyWidgetComponent';

export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  description: 'A brief description of what this widget does',
  component: MyWidgetComponent,
  defaultSize: { w: 3, h: 3 }
};
```

### 4. Test It

Restart your dev server and the widget will appear in the "Add Widget" modal!

---

## Advanced Features

### With Configuration (Per-Instance Settings)

Add a `configSchema` to your widget definition:

```typescript
export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  component: MyWidgetComponent,
  defaultSize: { w: 3, h: 3 },

  // Configuration schema
  configSchema: {
    title: {
      type: 'string',
      label: 'Title',
      description: 'Custom title for this widget instance',
      required: false,
      default: 'My Widget'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to refresh data',
      required: false,
      default: 30,
      min: 5,
      max: 300
    },
    theme: {
      type: 'select',
      label: 'Theme',
      description: 'Color theme',
      required: false,
      default: 'blue',
      options: ['blue', 'green', 'red', 'purple']
    },
    showDetails: {
      type: 'boolean',
      label: 'Show Details',
      description: 'Display additional information',
      required: false,
      default: true
    }
  }
};
```

Access config in your component:

```typescript
export const MyWidgetComponent: React.FC<WidgetProps> = ({ config }) => {
  const title = config?.title || 'My Widget';
  const interval = config?.refreshInterval || 30;
  const theme = config?.theme || 'blue';
  const showDetails = config?.showDetails ?? true;

  // Use configuration values...
};
```

---

### With Backend (Server-Side Logic)

Create a `backend.js` file for server-side operations:

```javascript
/**
 * My Widget - Backend Logic
 * Runs on the server and can broadcast data via SSE
 */

export function init(context) {
  const { broadcast, secrets, config, instanceId, widgetId, logger } = context;

  logger.info('Widget backend starting');

  // Example: Periodic data broadcast
  const interval = setInterval(() => {
    const data = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100
    };

    broadcast('my-widget', data);
  }, 5000);

  // Return cleanup function
  return () => {
    logger.info('Widget backend stopping');
    clearInterval(interval);
  };
}
```

Receive data in your component:

```typescript
import { useSSE } from '../../core/useSSE';

export const MyWidgetComponent: React.FC<WidgetProps> = () => {
  const [data, setData] = useState(null);

  // Subscribe to SSE events
  useSSE('my-widget', (receivedData) => {
    setData(receivedData);
  });

  return (
    <div>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
```

---

### With Secrets (API Keys, Tokens)

Add a `secretsSchema` for server-side only secrets:

```typescript
export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  component: MyWidgetComponent,
  defaultSize: { w: 3, h: 3 },

  // Secrets schema (server-side only!)
  secretsSchema: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'Your API key for external service',
      required: true,
      hint: 'Get your key at https://example.com/api-keys'
    },
    endpoint: {
      type: 'string',
      label: 'API Endpoint',
      description: 'Custom API endpoint URL',
      required: false,
      default: 'https://api.example.com'
    }
  }
};
```

Access secrets in backend:

```javascript
export function init(context) {
  const { secrets, logger } = context;

  if (!secrets.apiKey) {
    logger.error('API key not configured');
    return () => {};
  }

  const apiKey = secrets.apiKey;
  const endpoint = secrets.endpoint || 'https://api.example.com';

  // Use secrets safely on server side
  async function fetchData() {
    const response = await fetch(`${endpoint}/data?key=${apiKey}`);
    const data = await response.json();
    broadcast('my-widget', data);
  }

  // ...
}
```

**Set secrets via API:**

```bash
curl -X POST http://localhost:3001/api/admin/widgets/my-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-secret-key", "endpoint": "https://api.example.com"}'
```

---

### With AI Data Export (For AI Monitoring)

Add a `dataExportSchema` to document what data your widget exports for AI consumption:

```typescript
export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  component: MyWidgetComponent,
  defaultSize: { w: 3, h: 3 },

  // Data export schema for AI/external systems
  dataExportSchema: {
    description: 'Sensor readings and status',
    fields: {
      temperature: {
        type: 'number',
        description: 'Current temperature reading',
        unit: 'celsius'
      },
      status: {
        type: 'string',
        description: 'Sensor status (online, offline, error)'
      },
      lastReading: {
        type: 'string',
        description: 'ISO 8601 timestamp of last reading'
      },
      readings: {
        type: 'array',
        description: 'Array of recent readings'
      }
    }
  }
};
```

**Field Types:**
- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false
- `object` - Complex nested data
- `array` - Lists of items

**AI Integration:**

Your widget data will be automatically exposed at:
- `GET /api/dashboard/ai-summary` - All widgets with health metadata
- `GET /api/dashboard/snapshot` - Raw widget data
- `GET /api/dashboard/widget/:instanceId` - Single widget instance
- `GET /api/dashboard/widget-type/:widgetId` - All instances of a type

**IMPORTANT**: If your widget has a `backend.js` file, it **MUST** implement `exportData()` to provide data for AI consumption:

```javascript
// backend.js must return object with cleanup AND exportData
return {
  cleanup: () => { /* cleanup code */ },
  exportData: () => ({ /* return data matching dataExportSchema */ })
};
```

Frontend-only widgets (no backend) don't need `exportData()`.

See [AI Integration Guide](./AI_INTEGRATION.md) for complete documentation.

---

## Widget Folder Structure

```
src/widgets-external/my-widget/
├── index.ts              ← Widget definition (required)
├── MyWidgetComponent.tsx ← Frontend UI (required)
└── backend.js            ← Server logic (optional)
```

---

## Full Example: Complete Widget

### `index.ts`
```typescript
import type { Widget } from '../../core/types';
import { ExampleComponent } from './ExampleComponent';

export const widget: Widget = {
  id: 'example-widget',
  name: 'Example Widget',
  description: 'Demonstrates all widget features',
  component: ExampleComponent,
  defaultSize: { w: 4, h: 3 },
  supportedSizes: [{ w: 4, h: 3 }, { w: 6, h: 4 }],

  configSchema: {
    title: {
      type: 'string',
      label: 'Title',
      required: false,
      default: 'Example'
    }
  },

  secretsSchema: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      required: true,
      hint: 'Get from https://example.com'
    }
  },

  dataExportSchema: {
    description: 'Data exported for AI/external consumption',
    fields: {
      value: {
        type: 'number',
        description: 'Current metric value',
        unit: 'units'
      },
      timestamp: {
        type: 'string',
        description: 'ISO 8601 timestamp of data'
      }
    }
  }
};
```

### `ExampleComponent.tsx`
```typescript
import React, { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

export const ExampleComponent: React.FC<WidgetProps> = ({ config, size }) => {
  const [data, setData] = useState<any>(null);
  const title = config?.title || 'Example';

  useSSE('example-widget', (receivedData) => {
    setData(receivedData);
  });

  return (
    <div className="flex-column full-height p-large">
      <h3 className="text-small-title mb-medium">{title}</h3>
      <p className="text-label">Size: {size.w} x {size.h}</p>
      {data && <pre className="font-mono text-small mt-medium">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
```

### `backend.js`
```javascript
export function init(context) {
  const { broadcast, secrets, config, logger } = context;

  // Store latest data for AI export
  let latestData = null;

  if (!secrets.apiKey) {
    logger.error('No API key configured');

    // Return object with cleanup and exportData
    return {
      cleanup: () => {},
      exportData: () => ({
        value: 0,
        timestamp: Date.now(),
        error: 'No API key configured'
      })
    };
  }

  logger.info('Starting with config:', config);

  const timer = setInterval(() => {
    const data = {
      value: Math.random(),
      timestamp: Date.now()
    };

    latestData = data;  // Store for AI export
    broadcast('example-widget', data);
  }, 3000);

  // MANDATORY: Return object with cleanup AND exportData
  return {
    cleanup: () => {
      clearInterval(timer);
      logger.info('Stopped');
    },

    // Called when AI requests /api/dashboard/ai-summary
    exportData: () => {
      if (!latestData) {
        return {
          value: 0,
          timestamp: Date.now()
        };
      }
      return latestData;
    }
  };
}
```

---

## Tips & Best Practices

### Styling

**Use the Global Stylesheet** - All widgets should use CSS classes from [src/styles/widgets.css](src/styles/widgets.css) instead of inline styles. This ensures consistency and makes theme changes easy.

**Common widget patterns:**
```typescript
// Standard card layout
<div className="widget-card flex-center-column">
  <h3 className="text-small-title mb-small">Title</h3>
  <div className="text-large-bold">Value</div>
  <p className="text-label mt-small">Details</p>
</div>

// Form layout
<div className="flex-column p-large gap-medium">
  <input className="input-text" placeholder="Enter value..." />
  <button className="btn-primary">Submit</button>
</div>

// Status indicator
<div className="flex-space-between">
  <h3>Status</h3>
  <div className="badge-status connected">ONLINE</div>
</div>
```

**Frequently used classes:**
- Layout: `widget-card`, `flex-center-column`, `flex-space-between`, `full-height`
- Typography: `text-large-bold`, `text-small-title`, `text-label`, `text-primary`
- Spacing: `p-large`, `mt-small`, `mb-medium`, `gap-small`
- Interactive: `btn-primary`, `btn-secondary`, `input-text`
- Status: `status-pulse`, `badge-status`

For a complete reference, see [WIDGET_STYLING.md](WIDGET_STYLING.md).

**CSS Variables** - Use theme variables for colors:
  - `var(--dashboard-bg)` - Background
  - `var(--dashboard-text)` - Text color
  - `var(--widget-bg)` - Widget background
  - `var(--widget-border)` - Border color
  - `var(--primary-color)` - Primary accent
  - `var(--accent-color)` - Secondary accent

### Responsive Design
- Use the `size` prop to adapt UI based on widget dimensions
- Example:
  ```typescript
  const fontSize = size.w >= 4 ? '24px' : '18px';
  const showDetails = size.h >= 3;
  ```

### Error Handling
- Widget components are wrapped in error boundaries
- Errors in one widget won't crash the entire dashboard
- Always validate props and handle missing data gracefully

### Performance
- Use `React.memo()` for expensive components
- Debounce frequent updates
- Clean up timers and subscriptions in useEffect cleanup

### Testing
- Test your widget in different sizes
- Test with missing config/data
- Test SSE reconnection scenarios
- Test with invalid secrets (backend should handle gracefully)

---

## Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(() => setLoading(false));
}, []);

if (loading) {
  return (
    <div className="widget-card flex-center-column">
      <div className="text-muted">Loading...</div>
    </div>
  );
}
```

### Error State
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <div className="widget-card flex-center-column">
      <div className="text-error">{error}</div>
    </div>
  );
}
```

### Refresh Button
```typescript
const handleRefresh = () => {
  broadcast('refresh-request', { instanceId: id });
};

<button className="btn-primary" onClick={handleRefresh}>Refresh</button>
```

---

## Need Help?

- Check existing widgets in `src/widgets-external/` for examples
- Read the [Widget Styling Guide](./WIDGET_STYLING.md) for styling best practices
- Read the [Secrets Guide](./SECRETS_GUIDE.md) for secrets management
- Read the [AI Integration Guide](./AI_INTEGRATION.md) for AI monitoring and automation
- Review type definitions in `src/core/types.ts`
- Ask questions in the project repository

Happy widget building! 🚀
