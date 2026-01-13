# Crypto Price Widget

A cryptocurrency price tracker widget demonstrating secure secrets management and per-instance configuration.

## Features

- 🔐 **Secure API Key Storage** - API keys stored server-side, never exposed to frontend
- 💰 **Real-time Price Updates** - Live cryptocurrency prices via CoinGecko API
- 📊 **24h Change Tracking** - Monitor price changes with visual indicators
- 🎯 **Per-Instance Configuration** - Each widget can track a different cryptocurrency
- 🚨 **Price Alerts** - Optional threshold-based price change alerts
- 🌍 **Multiple Currencies** - Display prices in USD, EUR, GBP, JPY, or AUD

## Setup Instructions

### 1. Configure Secrets (One-time Setup)

1. (Optional) Get a free API key from [CoinGecko](https://www.coingecko.com/en/api)
2. In the dashboard, click **⚙️ Settings**
3. Navigate to **Widget Secrets** tab
4. Find **Crypto Price** and click **Configure**
5. Enter your settings:
   - **API Key** (optional for demo, required for production rate limits)
   - **Refresh Interval** (default: 60 seconds)
   - **Enable Caching** (recommended to stay under rate limits)
6. Click **Save Secrets**

### 2. Add Widget Instances

1. Click **+ Add Widget**
2. Select **Crypto Price**
3. Configure this specific instance:
   - **Cryptocurrency** - Choose which coin to track (Bitcoin, Ethereum, etc.)
   - **Display Currency** - USD, EUR, GBP, JPY, or AUD
   - **Show 24h Change** - Display price change percentage
   - **Show Market Cap** - Display market capitalization
   - **Price Alert Threshold** - Get notified of large price changes
4. Click **Add Widget**

You can add multiple instances to track different cryptocurrencies simultaneously!

## Security Architecture

### 🔒 What Stays Server-Side (Secrets)

These are configured once per widget type and **NEVER** exposed to the frontend:

- **API Key** - Your CoinGecko API key
- **API Endpoint** - Custom API endpoint URL
- **Refresh Interval** - Global update frequency
- **Enable Caching** - Response caching settings

**Security guarantees:**
- Stored encrypted in `server/secrets.json`
- Only accessible in `backend.js` via `context.secrets`
- Never broadcast via SSE
- Never included in `exportData()`
- Never logged to console
- Cannot be accessed by other widgets

### 🎨 What's Per-Instance (Configuration)

These are configured per widget instance and safe for frontend:

- **Cryptocurrency** - Which coin to track (Bitcoin, Ethereum, etc.)
- **Display Currency** - USD, EUR, GBP, JPY, AUD
- **Show 24h Change** - Display preference
- **Show Market Cap** - Display preference
- **Price Alert Threshold** - Alert settings

**Why these are safe:**
- Non-sensitive display preferences
- No authentication credentials
- Specific to this widget instance
- Can be safely accessed by frontend

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  secrets.json (encrypted)                                    │
│  ├─ apiKey: "sk_abc123..."  ◄─── NEVER leaves server        │
│  ├─ apiEndpoint: "https://..."                               │
│  └─ refreshInterval: 60                                      │
│                           │                                   │
│                           ▼                                   │
│  backend.js                                                   │
│  ├─ context.secrets.apiKey  ◄─── Used in HTTP headers       │
│  ├─ fetch(url, { headers: { 'x-api-key': apiKey } })        │
│  └─ broadcast('crypto-price', { price: 45000 })              │
│                           │                                   │
│                           │ Only price data                   │
│                           │ (NO API key!)                     │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            │ SSE Stream
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CryptoPriceComponent.tsx                                    │
│  └─ eventSource.addEventListener('crypto-price', ...)        │
│     └─ Receives: { price: 45000, change24h: 2.5 }           │
│     └─ NEVER receives: API key ✓                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## How Secrets Are Protected

### 1. Storage
- Encrypted at rest in `server/secrets.json` using AES-256-GCM
- Encryption key stored in environment variable or generated on first run
- Never committed to version control (in `.gitignore`)

### 2. Access Control
- **Backend only**: Secrets accessible via `context.secrets` in `backend.js`
- **Never in frontend**: React components have zero access to secrets
- **Widget isolation**: Widget A cannot access Widget B's secrets

### 3. Transmission
- **Server → API**: Secrets used in HTTP headers (server-to-server)
- **Server → Frontend**: Only resulting data broadcast (no secrets)
- **Never in logs**: API keys not logged (use "Configured ✓" instead)

### 4. API Export
- `exportData()` function returns price data for AI consumption
- API keys explicitly excluded from export
- Same data as broadcast to frontend

## Example Usage

### Tracking Multiple Cryptocurrencies

Add multiple widget instances to track different coins:

**Instance 1:**
- Cryptocurrency: Bitcoin
- Display Currency: USD
- Result: Real-time Bitcoin price in USD

**Instance 2:**
- Cryptocurrency: Ethereum
- Display Currency: EUR
- Result: Real-time Ethereum price in EUR

**Instance 3:**
- Cryptocurrency: Cardano
- Display Currency: GBP
- Result: Real-time Cardano price in GBP

All three instances use the **same API key** (configured once in secrets), but track different coins and currencies.

## Developer Notes

### For Widget Developers

This widget serves as a **reference implementation** for:

1. **Secure secrets management**
   ```typescript
   secretsSchema: {
     apiKey: {
       type: 'string',
       label: 'API Key',
       required: true
     }
   }
   ```

2. **Per-instance configuration**
   ```typescript
   configSchema: {
     coinId: {
       type: 'select',
       options: ['bitcoin', 'ethereum', ...]
     }
   }
   ```

3. **Backend secret usage**
   ```javascript
   const apiKey = secrets.apiKey; // Server-side only
   const headers = { 'x-api-key': apiKey };
   const response = await fetch(url, { headers });
   broadcast('crypto-price', { price }); // NO API key
   ```

4. **Frontend data consumption**
   ```typescript
   // Receives price data only, never API key
   eventSource.addEventListener('crypto-price', (event) => {
     const data = JSON.parse(event.data); // { price, change }
   });
   ```

### Security Checklist

When building widgets with secrets:

- [ ] Store API keys in `secretsSchema`, not `configSchema`
- [ ] Access secrets via `context.secrets` in backend only
- [ ] Never include secrets in `broadcast()` calls
- [ ] Never include secrets in `exportData()` return value
- [ ] Never log secrets to console
- [ ] Use secrets only in server-side HTTP requests
- [ ] Validate that secrets are configured before use
- [ ] Provide helpful error messages when secrets are missing

## Troubleshooting

### "API key not configured" error

**Solution**: Configure secrets via Settings → Widget Secrets → Crypto Price

### "Failed to fetch crypto price" error

**Causes**:
1. No internet connection
2. Invalid API key
3. Rate limit exceeded (free tier: 50 calls/minute)
4. Invalid coin ID

**Solution**: Check server logs for detailed error messages

### Rate Limit Issues

Free tier limits:
- 50 calls/minute
- Recommended: 60+ second refresh interval
- Enable caching in secrets configuration

### Widget Not Updating

1. Check SSE connection (green dot in top-right)
2. Check server logs for errors
3. Verify secrets are saved correctly
4. Try restarting the server

## API Reference

### CoinGecko API

- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Free Tier**: 50 calls/minute
- **Paid Tiers**: Higher rate limits
- **Documentation**: https://www.coingecko.com/en/api/documentation

### Supported Cryptocurrencies

- Bitcoin (bitcoin)
- Ethereum (ethereum)
- Cardano (cardano)
- Solana (solana)
- Polkadot (polkadot)
- Chainlink (chainlink)
- Dogecoin (dogecoin)
- Ripple (ripple)

### Supported Currencies

- USD - US Dollar
- EUR - Euro
- GBP - British Pound
- JPY - Japanese Yen
- AUD - Australian Dollar

## License

This widget is part of the dashboard system and follows the same license.

## Support

For issues or questions:
1. Check server logs: `npm run server`
2. Review [SETTINGS_UI_GUIDE.md](../../../SETTINGS_UI_GUIDE.md)
3. Check [SECRETS_GUIDE.md](../../../SECRETS_GUIDE.md)
