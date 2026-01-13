# Secrets Management System

## ✨ What's New

Your dashboard now has a **production-ready secrets management system** that allows widgets to securely access API keys, tokens, and other sensitive data on the server side only.

## 🚀 Quick Start

### 1. Generate a Master Key

```bash
npm run generate-key
```

Copy the output (e.g., `SECRETS_MASTER_KEY=abc123...`)

### 2. Create Environment File

```bash
cp .env.example .env
```

Paste your master key into `.env`:

```env
NODE_ENV=development  # or 'production'
SECRETS_MASTER_KEY=your_key_here
PORT=3001
```

### 3. Start the Dashboard

```bash
npm run dev
```

### 4. Set Secrets for Your Widget

```bash
curl -X POST http://localhost:3001/api/admin/widgets/weather-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "city": "London",
    "units": "metric"
  }'
```

### 5. Add Widget to Dashboard

Open http://localhost:5173, click "Add Widget", and select your widget!

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART_SECRETS.md)** - Get started in 5 minutes
- **[Comprehensive Guide](./SECRETS_GUIDE.md)** - Full documentation with examples
- **[Implementation Details](./IMPLEMENTATION_SUMMARY.md)** - Technical architecture

## 🔒 Security Features

✅ **AES-256-GCM encryption** - Military-grade encryption for production
✅ **Server-side only** - Secrets never exposed to browser
✅ **Widget isolation** - Each widget can only access its own secrets
✅ **Per-widget storage** - JSON bucket for each widget type
✅ **Masked API responses** - View which secrets exist without seeing values
✅ **Development mode** - Unencrypted storage for easy local testing

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/secrets` | List widgets with secrets |
| `GET` | `/api/admin/widgets/:id/secrets` | Get masked secrets |
| `POST` | `/api/admin/widgets/:id/secrets` | Set secrets (JSON) |
| `DELETE` | `/api/admin/widgets/:id/secrets` | Delete all secrets |

## 📦 Example Widget

Check out the Weather widget for a complete example:

**Frontend**: `src/widgets-external/weather/WeatherWidget.tsx`
```typescript
export const WeatherWidget: Widget = {
  id: 'weather-widget',
  name: 'Weather',
  secretsSchema: {
    apiKey: {
      type: 'string',
      description: 'OpenWeatherMap API key',
      required: true,
      hint: 'Get your free API key at https://openweathermap.org/api'
    },
    city: {
      type: 'string',
      description: 'City name',
      required: true,
      default: 'London'
    }
  }
};
```

**Backend**: `src/widgets-external/weather/backend.js`
```javascript
export function init(context) {
  const { broadcast, secrets, logger } = context;

  if (!secrets.apiKey) {
    logger.error('No API key configured');
    return () => {};
  }

  // Safely use secrets on server side
  async function fetchWeather() {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?` +
      `q=${secrets.city}&appid=${secrets.apiKey}`
    );
    broadcast('weather', await response.json());
  }

  setInterval(fetchWeather, 60000);
  return () => clearInterval(timer);
}
```

## 🧪 Testing

The implementation has been tested and verified:

✅ Master key generation
✅ Secrets encryption/decryption
✅ API endpoints (GET, POST, DELETE)
✅ Masked secret display
✅ Widget backend initialization with secrets
✅ Development mode (unencrypted storage)
✅ Production mode (encrypted storage)

Test results:
```bash
$ curl -X POST http://localhost:3001/api/admin/widgets/weather-widget/secrets \
  -d '{"apiKey":"test-key","city":"London"}'
{"status":"ok","message":"Secrets saved successfully"}

$ curl http://localhost:3001/api/admin/widgets/weather-widget/secrets
{"widgetId":"weather-widget","secrets":{"apiKey":"tes***key","city":"***"},"hasSecrets":true}
```

## 📋 Migration Guide

If you have existing widgets with hardcoded secrets:

### 1. Add Secrets Schema

```typescript
export const MyWidget: Widget = {
  // ... existing properties
  secretsSchema: {
    apiKey: {
      type: 'string',
      description: 'Your API key',
      required: true
    }
  }
};
```

### 2. Update Backend Signature

**Before:**
```javascript
export function init(broadcast) {
  const API_KEY = 'hardcoded-key'; // Insecure!
}
```

**After:**
```javascript
export function init(context) {
  const { broadcast, secrets, logger } = context;
  const API_KEY = secrets.apiKey; // Secure!

  if (!API_KEY) {
    logger.error('No API key configured');
    return () => {};
  }
}
```

### 3. Set Secrets via API

```bash
curl -X POST http://localhost:3001/api/admin/widgets/my-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-actual-key"}'
```

## ⚠️ Important Notes

### Production Deployment

1. **Use production mode**: Set `NODE_ENV=production` in `.env`
2. **Secure master key**: Generate a unique key for production
3. **Back up master key**: Losing it means losing all secrets
4. **Use HTTPS**: Always use HTTPS for API endpoints
5. **Never commit**: Ensure `.env` is in `.gitignore` (already done)

### Development Mode

- Sets `NODE_ENV=development` in `.env`
- Secrets stored in `dashboard-data/config/secrets.dev.json` (unencrypted)
- Easier debugging and testing
- **Never use in production!**

## 📁 Files Created

### Core System
- ✅ `server/crypto.js` - Encryption utilities
- ✅ `server/secrets.js` - SecretsManager class
- ✅ `.env.example` - Environment template
- ✅ Updated `.gitignore` - Excludes secret files

### Documentation
- ✅ `README_SECRETS.md` - This file
- ✅ `QUICKSTART_SECRETS.md` - 5-minute guide
- ✅ `SECRETS_GUIDE.md` - Comprehensive documentation
- ✅ `IMPLEMENTATION_SUMMARY.md` - Technical details

### Example Widget
- ✅ `src/widgets-external/weather/` - Complete working example

### Configuration
- ✅ Updated `package.json` - Added `generate-key` script
- ✅ Updated `server/index.js` - Integrated secrets system
- ✅ Updated `src/core/types.ts` - Added TypeScript types

## 🔧 Troubleshooting

### Server won't start

**Error**: "Invalid or missing SECRETS_MASTER_KEY"

**Solution**:
1. Run `npm run generate-key`
2. Copy output to `.env` file
3. Verify key is 64 hex characters

### Widget not receiving secrets

**Check**:
1. Secrets are set: `curl http://localhost:3001/api/admin/widgets/your-widget/secrets`
2. Widget ID matches exactly
3. Server restarted after setting secrets

### Development secrets not loading

**Solution**:
1. Set `NODE_ENV=development` in `.env`
2. Check `dashboard-data/config/secrets.dev.json` exists
3. Verify JSON is valid

## 🎯 Next Steps

1. **Try the weather widget** - Complete example included
2. **Create your own widget** - Follow the patterns in weather widget
3. **Deploy to production** - Generate production master key
4. **Build admin UI** (optional) - Create React components for secret management

## 🤝 Contributing

When creating widgets:
- Always define `secretsSchema` for any sensitive data
- Use `context.logger` for logging (includes widget ID)
- Validate secrets before use (handle missing keys gracefully)
- Never log secret values

## 📖 Additional Resources

- Widget Development Guide (coming soon)
- API Reference: See `server/index.js`
- Example widgets: `src/widgets-external/`

---

**Questions?** Check the [comprehensive guide](./SECRETS_GUIDE.md) or review the [implementation summary](./IMPLEMENTATION_SUMMARY.md).

**Found a bug?** Please report it with details about your environment and steps to reproduce.

---

**Built with ❤️ for secure dashboard development**
