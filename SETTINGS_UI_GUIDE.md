# Settings UI Guide

This guide explains how to use the dashboard settings UI to configure widget secrets and preferences through a user-friendly interface.

## Overview

The dashboard now includes a comprehensive settings page that allows users to configure:
- **Widget Secrets** - API keys and sensitive configuration (per widget type)
- **Widget Configuration** - Per-instance widget settings
- **Dashboard Preferences** - General dashboard settings

## Accessing Settings

### 1. Settings Button

Click the **⚙️ Settings** button in the dashboard header to open the settings page.

### 2. Settings Page

The settings page has two tabs:
- **Widget Secrets** - Configure API keys and secrets for widget types
- **Dashboard** - General dashboard preferences

## Widget Secrets Configuration

### What are Widget Secrets?

Widget secrets are **per-widget-type** settings that apply to all instances of that widget. They typically include:
- API keys (e.g., OpenWeatherMap API key)
- Authentication tokens
- Server URLs
- Global preferences (e.g., city, units, refresh interval)

**Important**: Secrets are stored securely on the server and never exposed to the frontend.

### How to Configure Secrets

1. Click **⚙️ Settings** in the dashboard header
2. The **Widget Secrets** tab shows all widgets
3. Find the widget you want to configure
4. Click the **Configure** button
5. Fill in the required fields:
   - Fields marked with a red dot (●) are required
   - Password/key fields are automatically masked
   - Hover over field labels for descriptions
6. Click **Save Secrets**
7. The server will restart the widget backends automatically

### Example: Weather Widget

The Weather widget requires these secrets:

```
● API Key          - Your OpenWeatherMap API key
● City             - City name (e.g., "London")
  Temperature Units - metric or imperial (optional)
  Refresh Interval  - Update frequency in minutes (optional)
```

## Widget Configuration (Per-Instance)

### What is Widget Configuration?

Widget configuration is **per-instance** settings that only apply to a specific widget on your dashboard. Examples:
- Widget title
- Display preferences (show/hide elements)
- Visual options (colors, animations)

### How to Configure Per-Instance Settings

1. Right-click on any widget in the dashboard
2. Select **Edit Configuration** from the context menu
3. Modify the settings
4. Click **Save Configuration**

The widget will update immediately with your changes.

## Developer Guide: Adding Secrets to Widgets

### Step 1: Define secretsSchema

In your widget's `index.ts`, add a `secretsSchema`:

```typescript
export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  component: MyWidgetComponent,
  defaultSize: { w: 4, h: 4 },

  // Define secrets (per-widget-type settings)
  secretsSchema: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'Your service API key',
      required: true,
      hint: 'Get your API key at https://example.com/api'
    },
    endpoint: {
      type: 'string',
      label: 'API Endpoint',
      description: 'Custom API endpoint URL',
      required: false,
      default: 'https://api.example.com'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to fetch data',
      required: false,
      default: 60,
      min: 10,
      max: 3600
    },
    enableFeature: {
      type: 'boolean',
      label: 'Enable Advanced Features',
      description: 'Enable experimental features',
      required: false,
      default: false
    },
    mode: {
      type: 'select',
      label: 'Operating Mode',
      description: 'Widget operating mode',
      required: false,
      default: 'standard',
      options: ['standard', 'advanced', 'debug']
    }
  }
};
```

### Step 2: Access Secrets in Backend

In your widget's `backend.js`, secrets are provided via the context:

```javascript
export function init(context) {
  const { broadcast, secrets, logger } = context;

  // Access secrets
  const apiKey = secrets.apiKey;
  const endpoint = secrets.endpoint || 'https://api.example.com';
  const refreshInterval = secrets.refreshInterval || 60;

  // Validate required secrets
  if (!apiKey) {
    logger.error('API key not configured');
    return {
      cleanup: () => {},
      exportData: () => ({ error: 'Not configured' })
    };
  }

  // Use secrets in your widget logic
  async function fetchData() {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    // ...
  }

  // Return object with cleanup and exportData
  return {
    cleanup: () => {
      // Cleanup code
    },
    exportData: () => {
      // Return data for AI consumption
    }
  };
}
```

### Step 3: Document Your Secrets

Add a section to your widget's README explaining what secrets are needed:

```markdown
## Configuration

This widget requires the following secrets to be configured:

1. Click **⚙️ Settings** in the dashboard
2. Find **My Widget** in the list
3. Click **Configure**
4. Enter your API key from https://example.com/api
5. (Optional) Customize the refresh interval
6. Click **Save Secrets**

The widget will start working immediately after configuration.
```

## Field Types

### String
```typescript
{
  type: 'string',
  label: 'Field Label',
  description: 'What this field is for',
  required: true,
  default: 'default value',
  hint: 'Helpful hint for the user'
}
```

- Text input field
- Automatically masked if field name contains 'key', 'password', or 'secret'

### Number
```typescript
{
  type: 'number',
  label: 'Refresh Interval',
  description: 'Update frequency in seconds',
  required: false,
  default: 60,
  min: 10,
  max: 3600,
  hint: 'Must be between 10 and 3600'
}
```

- Numeric input with validation
- Supports `min` and `max` constraints

### Boolean
```typescript
{
  type: 'boolean',
  label: 'Enable Feature',
  description: 'Enable experimental features',
  required: false,
  default: false,
  hint: 'Check to enable'
}
```

- Checkbox input

### Select
```typescript
{
  type: 'select',
  label: 'Mode',
  description: 'Operating mode',
  required: false,
  default: 'standard',
  options: ['standard', 'advanced', 'debug']
}
```

- Dropdown select with predefined options

## Secrets vs Configuration

### Use `secretsSchema` for:
- API keys and tokens
- Passwords and credentials
- Server URLs and endpoints
- Settings that apply to **all instances** of the widget type
- Sensitive data that should be server-side only

### Use `configSchema` for:
- Widget titles and labels
- Display preferences (show/hide elements)
- Colors and visual options
- Settings that vary **per widget instance**
- Non-sensitive frontend preferences

## Example: Complete Widget with Secrets

```typescript
// index.ts
export const widget: Widget = {
  id: 'stock-widget',
  name: 'Stock Ticker',
  description: 'Real-time stock prices',
  component: StockComponent,
  defaultSize: { w: 4, h: 4 },

  // Per-widget-type secrets (API key applies to all instances)
  secretsSchema: {
    apiKey: {
      type: 'string',
      label: 'Stock API Key',
      description: 'Your stock data API key',
      required: true,
      hint: 'Get your free API key at https://stockapi.com'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (seconds)',
      description: 'How often to update prices',
      required: false,
      default: 30,
      min: 5,
      max: 300
    }
  },

  // Per-instance configuration (each widget can watch different stocks)
  configSchema: {
    symbol: {
      type: 'string',
      label: 'Stock Symbol',
      description: 'Stock ticker symbol (e.g., AAPL)',
      required: true,
      hint: 'Enter a valid stock symbol'
    },
    showChange: {
      type: 'boolean',
      label: 'Show Price Change',
      description: 'Display price change percentage',
      required: false,
      default: true
    }
  }
};
```

```javascript
// backend.js
export function init(context) {
  const { broadcast, secrets, config, logger, instanceId } = context;

  // Get secrets (same for all instances)
  const apiKey = secrets.apiKey;
  const refreshInterval = (secrets.refreshInterval || 30) * 1000;

  // Get instance config (unique per widget instance)
  const symbol = config.symbol;

  if (!apiKey) {
    logger.error('Stock API key not configured');
    return {
      cleanup: () => {},
      exportData: () => ({ error: 'API key required' })
    };
  }

  if (!symbol) {
    logger.error(`No stock symbol configured for instance ${instanceId}`);
    return {
      cleanup: () => {},
      exportData: () => ({ error: 'Symbol required' })
    };
  }

  let latestData = null;

  async function fetchStock() {
    try {
      const response = await fetch(
        `https://stockapi.com/quote/${symbol}?apikey=${apiKey}`
      );
      const data = await response.json();

      latestData = {
        symbol: symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        timestamp: new Date().toISOString()
      };

      broadcast('stock', latestData);
      logger.info(`Stock updated: ${symbol} = $${data.price}`);
    } catch (error) {
      logger.error(`Failed to fetch stock ${symbol}:`, error.message);
    }
  }

  fetchStock();
  const timer = setInterval(fetchStock, refreshInterval);

  return {
    cleanup: () => {
      clearInterval(timer);
    },
    exportData: () => {
      return latestData || {
        symbol: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        timestamp: new Date().toISOString()
      };
    }
  };
}
```

## Security Best Practices

### DO:
- ✅ Use `secretsSchema` for API keys and passwords
- ✅ Store secrets server-side only
- ✅ Validate secrets in your backend code
- ✅ Provide clear error messages when secrets are missing
- ✅ Use descriptive labels and hints for users
- ✅ Document what API keys users need and where to get them

### DON'T:
- ❌ Don't expose secrets to the frontend
- ❌ Don't hardcode API keys in your code
- ❌ Don't use `configSchema` for sensitive data
- ❌ Don't store secrets in localStorage or sessionStorage
- ❌ Don't log secrets to the console

## Troubleshooting

### Secrets Not Saving

1. Check that the server is running on port 3001
2. Open browser console for error messages
3. Check server logs for API errors
4. Ensure all required fields are filled in
5. Try restarting the server

### Widget Not Working After Configuration

1. Check server logs for backend errors
2. Verify the API key is correct
3. Check that the widget backend is initializing
4. Look for error messages in the widget display
5. Use the SSE Debugger widget to monitor events

### Settings Button Not Visible

1. Ensure you're running the latest version
2. Check that `SettingsPage` component is imported in App.tsx
3. Verify the header rendering code includes the settings button

## API Reference

### POST /api/admin/widgets/:widgetId/secrets

Save secrets for a widget type.

**Request Body**:
```json
{
  "apiKey": "your-api-key",
  "city": "London",
  "refreshInterval": 30
}
```

**Response**:
```json
{
  "message": "Secrets saved successfully",
  "widgetId": "weather-widget"
}
```

The server automatically restarts all backend instances of that widget type after saving secrets.

## Further Reading

- [Widget Development Template](WIDGET_TEMPLATE.md) - Complete widget development guide
- [Secrets Management Guide](SECRETS_GUIDE.md) - Server-side secrets architecture
- [AI Integration Guide](AI_INTEGRATION.md) - AI/API data export
- [Widget Styling Guide](WIDGET_STYLING.md) - Styling your widgets

## Support

For questions about the settings UI:
1. Check this guide for examples
2. Review the weather widget as a reference implementation
3. Check the server logs for detailed error messages
4. Open an issue if you find a bug
