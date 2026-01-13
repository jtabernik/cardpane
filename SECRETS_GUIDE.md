# Secrets Management Guide

This guide explains how to securely manage API keys and other sensitive data in your dashboard widgets.

## Overview

The secrets management system allows widgets to access API keys, tokens, and other sensitive data **securely on the server side only**. Secrets are never exposed to the client-side code, preventing unauthorized access by other widgets or users.

## Key Features

- **Per-widget storage**: Each widget type has its own secrets bucket (JSON object)
- **Server-side only**: Secrets are only accessible in widget backend code, never in the browser
- **Encrypted at rest**: Production secrets are encrypted using AES-256-GCM
- **Development mode**: Unencrypted JSON file for easier local development
- **Widget isolation**: Widgets can only access their own secrets

---

## Setup

### 1. Generate Master Key

In production, you need a master encryption key. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your master key:

```env
NODE_ENV=production
SECRETS_MASTER_KEY=your_64_character_hex_key_here
PORT=3001
```

**IMPORTANT**:
- Keep `.env` secure and NEVER commit it to git
- Back up your master key - losing it means losing all secrets
- Use different keys for development and production

### 3. Development Mode

For local development, you can skip the master key:

```env
NODE_ENV=development
```

In development mode, secrets are stored in `dashboard-data/config/secrets.dev.json` as plain JSON for easier debugging.

---

## Creating a Widget with Secrets

### 1. Define Secrets Schema

In your widget file, add a `secretsSchema` to define what secrets you need:

```typescript
// src/widgets-external/weather/WeatherWidget.tsx
export const WeatherWidget: Widget = {
  id: 'weather-widget',
  name: 'Weather',
  component: WeatherComponent,
  defaultSize: { w: 3, h: 3 },

  // Define required secrets
  secretsSchema: {
    apiKey: {
      type: 'string',
      description: 'OpenWeatherMap API key',
      required: true,
      hint: 'Get your free API key at https://openweathermap.org/api'
    },
    city: {
      type: 'string',
      description: 'City name to fetch weather for',
      required: true,
      default: 'London'
    },
    units: {
      type: 'select',
      description: 'Temperature units',
      required: false,
      default: 'metric',
      options: ['metric', 'imperial']
    }
  }
};
```

### 2. Access Secrets in Backend

Create a `backend.js` file that receives secrets via context:

```javascript
// src/widgets-external/weather/backend.js
export function init(context) {
  const { broadcast, secrets, logger } = context;

  // Validate secrets
  if (!secrets.apiKey) {
    logger.error('No API key configured');
    return () => {};
  }

  // Use secrets safely (server-side only!)
  const apiKey = secrets.apiKey;
  const city = secrets.city || 'London';

  async function fetchData() {
    const url = `https://api.example.com/data?key=${apiKey}&city=${city}`;
    const response = await fetch(url);
    const data = await response.json();

    broadcast('weather', data);
  }

  const timer = setInterval(fetchData, 60000);

  return () => clearInterval(timer);
}
```

---

## Managing Secrets via API

### List Widgets with Secrets

```bash
GET /api/admin/secrets
```

Response:
```json
{
  "widgets": ["weather-widget", "github-widget"]
}
```

### Get Widget Secrets (Masked)

```bash
GET /api/admin/widgets/weather-widget/secrets
```

Response:
```json
{
  "widgetId": "weather-widget",
  "hasSecrets": true,
  "secrets": {
    "apiKey": "abc***xyz",
    "city": "London",
    "units": "metric"
  }
}
```

Note: Sensitive values are masked (first 3 + last 3 characters shown).

### Set Widget Secrets

```bash
POST /api/admin/widgets/weather-widget/secrets
Content-Type: application/json

{
  "apiKey": "your-actual-api-key-here",
  "city": "New York",
  "units": "imperial"
}
```

Response:
```json
{
  "status": "ok",
  "widgetId": "weather-widget",
  "message": "Secrets saved successfully"
}
```

**Note**: This replaces ALL secrets for the widget. The widget backend will automatically restart.

### Delete Widget Secrets

```bash
DELETE /api/admin/widgets/weather-widget/secrets
```

Response:
```json
{
  "status": "ok",
  "widgetId": "weather-widget",
  "message": "Secrets deleted successfully"
}
```

---

## Example: Setting Secrets with curl

### Weather Widget

```bash
curl -X POST http://localhost:3001/api/admin/widgets/weather-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "abc123def456",
    "city": "San Francisco",
    "units": "imperial",
    "refreshInterval": 15
  }'
```

### GitHub Widget (Hypothetical)

```bash
curl -X POST http://localhost:3001/api/admin/widgets/github-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "ghp_xxxxxxxxxxxx",
    "org": "mycompany",
    "repo": "myrepo"
  }'
```

---

## Security Best Practices

### ✅ DO

- **Store secrets server-side only** - Use the backend.js pattern
- **Validate secrets** - Check if required secrets exist before using
- **Use HTTPS** - In production, always use HTTPS for API calls
- **Rotate keys regularly** - Update secrets periodically
- **Back up master key** - Store it securely (password manager, vault)
- **Use different keys per environment** - Dev, staging, production should have separate keys

### ❌ DON'T

- **Never log secrets** - Don't console.log API keys or tokens
- **Never send secrets to client** - Keep them in backend.js only
- **Never commit secrets** - Don't commit .env or secrets files to git
- **Never hardcode secrets** - Always use the secrets system
- **Never share master key** - Treat it like a password

---

## Secrets Schema Types

### String

```typescript
{
  apiKey: {
    type: 'string',
    description: 'Your API key',
    required: true,
    hint: 'Get it from https://...'
  }
}
```

### Number

```typescript
{
  refreshInterval: {
    type: 'number',
    description: 'Update interval in minutes',
    required: false,
    default: 30
  }
}
```

### Boolean

```typescript
{
  enableDebug: {
    type: 'boolean',
    description: 'Enable debug logging',
    required: false,
    default: false
  }
}
```

### Select (Enum)

```typescript
{
  region: {
    type: 'select',
    description: 'API region',
    required: true,
    options: ['us-east', 'us-west', 'eu-central']
  }
}
```

---

## Troubleshooting

### "Secrets manager not available"

**Problem**: The API returns 503 error.

**Solution**:
1. Check that `SECRETS_MASTER_KEY` is set in `.env`
2. Verify the key is 64 hex characters (32 bytes)
3. Restart the server after updating `.env`

### Widget backend not receiving secrets

**Problem**: `secrets` object is empty in backend.

**Solution**:
1. Verify secrets are set via API: `GET /api/admin/widgets/your-widget/secrets`
2. Check widget ID matches exactly (e.g., `weather-widget` not `weather`)
3. Restart server to reload secrets

### "Invalid master key" error

**Problem**: Server won't start in production.

**Solution**:
1. Regenerate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update `.env` with new key
3. Delete old `secrets.enc` file (you'll need to re-enter secrets)

### Development secrets not loading

**Problem**: Secrets are empty in development mode.

**Solution**:
1. Set `NODE_ENV=development` in `.env`
2. Create `dashboard-data/config/secrets.dev.json` manually:
   ```json
   {
     "weather-widget": {
       "apiKey": "test-key",
       "city": "London"
     }
   }
   ```
3. Restart server

---

## File Locations

- **Master key**: `.env` (not committed to git)
- **Production secrets**: `dashboard-data/config/secrets.enc` (encrypted)
- **Development secrets**: `dashboard-data/config/secrets.dev.json` (plain JSON)
- **Example config**: `.env.example` (committed to git as template)

---

## Migration from Hardcoded Secrets

If you have existing widgets with hardcoded API keys:

1. **Add secrets schema** to widget definition
2. **Update backend.js** to use `secrets` from context
3. **Remove hardcoded values** from code
4. **Set secrets via API** for each widget
5. **Test thoroughly** before deploying

Example migration:

```javascript
// BEFORE (insecure)
export function init(broadcast) {
  const API_KEY = 'abc123'; // Hardcoded! Bad!
  // ...
}

// AFTER (secure)
export function init(context) {
  const { broadcast, secrets, logger } = context;
  const API_KEY = secrets.apiKey; // From encrypted storage

  if (!API_KEY) {
    logger.error('API key not configured');
    return () => {};
  }
  // ...
}
```

---

## Advanced: Programmatic Access

You can also manage secrets programmatically in Node.js:

```javascript
import { SecretsManager } from './server/secrets.js';

const manager = new SecretsManager(process.env.SECRETS_MASTER_KEY);

// Get secrets
const secrets = manager.getWidgetSecrets('weather-widget');

// Set secrets
manager.setWidgetSecrets('weather-widget', {
  apiKey: 'new-key',
  city: 'Tokyo'
});

// Delete secrets
manager.deleteWidgetSecrets('weather-widget');

// List widgets
const widgets = manager.listWidgetsWithSecrets();
```

---

## Questions?

For more information, see:
- Widget development guide (coming soon)
- API documentation in `server/index.js`
- Example widget: `src/widgets-external/weather/`
