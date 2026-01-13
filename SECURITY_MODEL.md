# Security Model

This document explains the security architecture of the dashboard system, specifically how secrets and sensitive data are protected.

## Core Security Principle

**Secrets NEVER reach the frontend.** All sensitive data (API keys, tokens, passwords) stays server-side and is only used in backend contexts.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        SERVER PROCESS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ secrets.json (AES-256-GCM Encrypted)                    │   │
│  │ ──────────────────────────────────────────────────────  │   │
│  │ {                                                        │   │
│  │   "weather-widget": {                                   │   │
│  │     "apiKey": "encrypted_blob_abc123...",  ◄────────┐   │   │
│  │     "city": "encrypted_blob_def456..."               │   │   │
│  │   }                                                   │   │   │
│  │ }                                                     │   │   │
│  └───────────────────────────────────────────┬───────────┘   │
│                                              │               │
│                                              ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Widget Backend (backend.js)                             │   │
│  │ ──────────────────────────────────────────────────────  │   │
│  │                                                          │   │
│  │ export function init(context) {                         │   │
│  │   const { secrets, broadcast } = context;              │   │
│  │                                                          │   │
│  │   // Secrets accessible here ✓                         │   │
│  │   const apiKey = secrets.apiKey;                       │   │
│  │                                                          │   │
│  │   // Use in server-side HTTP request                   │   │
│  │   const response = await fetch(url, {                  │   │
│  │     headers: { 'Authorization': `Bearer ${apiKey}` }   │   │
│  │   });                                                   │   │
│  │                                                          │   │
│  │   // Extract non-sensitive data                        │   │
│  │   const data = await response.json();                  │   │
│  │                                                          │   │
│  │   // Broadcast ONLY the data, NOT the API key         │   │
│  │   broadcast('weather', {                               │   │
│  │     temperature: data.temp,                            │   │
│  │     condition: data.condition                          │   │
│  │     // NO apiKey here! ✓                               │   │
│  │   });                                                   │   │
│  │ }                                                       │   │
│  └─────────────────────────────────────┬────────────────────┘   │
│                                        │                     │
│                                        │ SSE Broadcast       │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                                         │ { temperature: 22, condition: "Sunny" }
                                         │ (NO API key!)
                                         ▼
┌────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                           │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  eventSource.addEventListener('weather', (event) => {           │
│    const data = JSON.parse(event.data);                        │
│    // Receives: { temperature: 22, condition: "Sunny" }        │
│    // NEVER receives: API key ✓                                │
│  });                                                            │
│                                                                  │
│  // Secrets object does NOT exist in frontend ✓                │
│  // Cannot access context.secrets ✓                            │
│  // Cannot access other widgets' data ✓                        │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## Security Layers

### Layer 1: Storage Encryption

**Location**: `server/secrets.json`

**Protection**:
- Encrypted at rest using **AES-256-GCM**
- Encryption key stored in environment variable `SECRETS_KEY`
- If no key provided, one is generated and logged on first run
- File permissions: 600 (owner read/write only)
- Added to `.gitignore` (never committed)

**Format**:
```json
{
  "weather-widget": {
    "apiKey": "encrypted_blob_with_iv_and_auth_tag",
    "city": "encrypted_blob_with_iv_and_auth_tag"
  }
}
```

### Layer 2: Access Control

**Server-Side Only**:
- Secrets decrypted in server memory at runtime
- Passed to widget backends via `context.secrets`
- **Never** sent to frontend via HTTP or SSE
- **Never** included in API responses
- **Never** logged to console

**Widget Isolation**:
```javascript
// Widget A backend
export function init(context) {
  const { secrets } = context;
  // Can ONLY access Widget A's secrets
  // CANNOT access Widget B's secrets
  // CANNOT access other instances' data
}
```

Each widget backend runs in its own isolated context with access only to its own secrets.

### Layer 3: Transmission Security

**Server → External API**:
```javascript
// API key used in server-to-server HTTP
const response = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${secrets.apiKey}` // Stays server-side
  }
});
```

**Server → Frontend**:
```javascript
// Only broadcast non-sensitive results
broadcast('widget-type', {
  temperature: 22,
  humidity: 65
  // NO API key!
});
```

**API Exports** (for AI consumption):
```javascript
exportData: () => {
  return {
    temperature: latestData.temp,
    timestamp: Date.now()
    // NO API key!
  };
}
```

### Layer 4: Frontend Isolation

**No Secret Access**:
- Frontend code runs in browser (untrusted environment)
- `context.secrets` does NOT exist in frontend
- Frontend only receives broadcast data via SSE
- React components have zero access to secrets

**Safe Config Access**:
```typescript
// Frontend CAN access non-sensitive config
const CryptoWidget = ({ config }) => {
  const coinId = config.coinId; // Safe: "bitcoin"
  const currency = config.currency; // Safe: "USD"
  // But CANNOT access secrets.apiKey ✓
};
```

## What Goes Where?

### Use `secretsSchema` for:

✅ **API Keys & Tokens**
```typescript
secretsSchema: {
  apiKey: {
    type: 'string',
    label: 'API Key',
    required: true
  }
}
```

✅ **Passwords & Credentials**
```typescript
secretsSchema: {
  username: { type: 'string' },
  password: { type: 'string' }
}
```

✅ **Server URLs with Auth**
```typescript
secretsSchema: {
  apiEndpoint: {
    type: 'string',
    default: 'https://api.example.com'
  }
}
```

✅ **Per-Widget-Type Settings**
- Settings that apply to ALL instances
- Example: One API key for all weather widgets

### Use `configSchema` for:

✅ **Display Preferences**
```typescript
configSchema: {
  showHumidity: {
    type: 'boolean',
    default: true
  }
}
```

✅ **Per-Instance Settings**
```typescript
configSchema: {
  city: {
    type: 'string',
    label: 'City Name'
  }
}
```

✅ **Non-Sensitive Options**
```typescript
configSchema: {
  refreshInterval: {
    type: 'number',
    default: 60
  }
}
```

✅ **Visual Customization**
- Colors, themes, layouts
- Show/hide elements
- Widget-specific preferences

## Common Security Mistakes

### ❌ DON'T: Broadcast secrets

```javascript
// BAD - Exposes API key to frontend
broadcast('weather', {
  temperature: 22,
  apiKey: secrets.apiKey // ❌ NEVER DO THIS
});
```

### ✅ DO: Broadcast only data

```javascript
// GOOD - Only broadcast results
broadcast('weather', {
  temperature: 22,
  condition: 'Sunny'
});
```

---

### ❌ DON'T: Include secrets in exportData

```javascript
// BAD - Exposes API key to AI
exportData: () => ({
  temperature: 22,
  apiKey: secrets.apiKey // ❌ NEVER DO THIS
})
```

### ✅ DO: Export only data

```javascript
// GOOD - Only export results
exportData: () => ({
  temperature: 22,
  timestamp: Date.now()
})
```

---

### ❌ DON'T: Log secrets

```javascript
// BAD - Secrets in logs
logger.info(`API Key: ${secrets.apiKey}`); // ❌ NEVER DO THIS
```

### ✅ DO: Log status only

```javascript
// GOOD - Indicate presence without exposing value
logger.info(`API Key: ${secrets.apiKey ? 'Configured ✓' : 'Not configured'}`);
```

---

### ❌ DON'T: Use configSchema for secrets

```typescript
// BAD - API key in config (exposed to frontend)
configSchema: {
  apiKey: { // ❌ Should be in secretsSchema
    type: 'string'
  }
}
```

### ✅ DO: Use secretsSchema for secrets

```typescript
// GOOD - API key in secrets (server-only)
secretsSchema: {
  apiKey: {
    type: 'string',
    required: true
  }
}
```

## Attack Vectors & Mitigations

### 1. XSS (Cross-Site Scripting)

**Risk**: Attacker injects malicious JavaScript to steal data

**Mitigation**:
- ✅ Secrets never reach frontend (nothing to steal via XSS)
- ✅ React automatically escapes output (prevents script injection)
- ✅ CSP headers can be added for extra protection

### 2. MITM (Man-in-the-Middle)

**Risk**: Attacker intercepts network traffic

**Mitigation**:
- ✅ Secrets only transmitted server-to-server (HTTPS)
- ✅ Frontend only receives non-sensitive data via SSE
- ⚠️ Consider HTTPS for SSE in production

### 3. Widget Isolation Breach

**Risk**: Widget A tries to access Widget B's secrets

**Mitigation**:
- ✅ Each backend gets isolated context
- ✅ Secrets scoped by widget ID
- ✅ No shared global state between widgets

### 4. Disk Access

**Risk**: Attacker reads `secrets.json` from disk

**Mitigation**:
- ✅ Secrets encrypted at rest (AES-256-GCM)
- ✅ File permissions: 600 (owner only)
- ✅ Added to `.gitignore`
- ⚠️ Encryption key should be in environment variable

## Environment Variables

### Production Deployment

**Set encryption key via environment variable**:

```bash
# Generate a strong key
export SECRETS_KEY=$(openssl rand -hex 32)

# Start server with key
SECRETS_KEY=$SECRETS_KEY npm run server
```

**Docker**:
```dockerfile
ENV SECRETS_KEY=your_secure_key_here
```

**systemd**:
```ini
[Service]
Environment="SECRETS_KEY=your_secure_key_here"
```

## Security Best Practices

### For Widget Developers

1. ✅ Store API keys in `secretsSchema`
2. ✅ Access secrets via `context.secrets` in backend only
3. ✅ Use secrets in server-side HTTP requests
4. ✅ Broadcast only non-sensitive results
5. ✅ Export only non-sensitive data
6. ✅ Never log secrets (log "Configured ✓" instead)
7. ✅ Validate secrets before use
8. ✅ Provide helpful errors when secrets missing

### For Server Administrators

1. ✅ Set `SECRETS_KEY` environment variable
2. ✅ Use HTTPS in production
3. ✅ Restrict file permissions on `secrets.json`
4. ✅ Never commit `secrets.json` to git
5. ✅ Rotate secrets regularly
6. ✅ Monitor server logs for suspicious activity
7. ✅ Keep dependencies updated
8. ✅ Use firewall rules to restrict server access

## Audit Checklist

Before deploying widgets with secrets:

- [ ] Secrets defined in `secretsSchema`, not `configSchema`
- [ ] Secrets accessed only in `backend.js`
- [ ] No secrets in `broadcast()` calls
- [ ] No secrets in `exportData()` return values
- [ ] No secrets in console logs
- [ ] Secrets used only in server-side HTTP requests
- [ ] Error messages don't expose secrets
- [ ] Widget provides fallback when secrets not configured
- [ ] `secrets.json` in `.gitignore`
- [ ] `SECRETS_KEY` set in production environment

## Further Reading

- [SETTINGS_UI_GUIDE.md](SETTINGS_UI_GUIDE.md) - How to configure secrets via UI
- [SECRETS_GUIDE.md](SECRETS_GUIDE.md) - Server-side secrets architecture
- [WIDGET_TEMPLATE.md](WIDGET_TEMPLATE.md) - Widget development guide
- [Crypto Price Widget README](src/widgets-external/crypto-price/README.md) - Reference implementation

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security concerns privately
3. Include steps to reproduce
4. Allow time for patch before disclosure

## License

This security model is part of the dashboard system and follows the same license.
