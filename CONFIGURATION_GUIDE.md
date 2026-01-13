# Widget Configuration Guide

This guide explains how to configure widgets in your dashboard.

## Two Types of Settings

### 1. Widget Secrets (Widget-Level)
**Location**: Settings → Widget Secrets

**What it's for**: Sensitive data that applies to **all instances** of a widget type
- API keys
- Authentication tokens
- API endpoints (for advanced users)

**Examples**:
- Crypto Price widget: CoinGecko API key (optional)
- (Future widgets: Weather API keys, Database credentials, etc.)

**How to configure**:
1. Click "⚙️ Settings" in the top bar
2. Navigate to "Widget Secrets" tab
3. Click "Configure" for the widget type
4. Enter sensitive information
5. Click "Save Secrets"

**Important**:
- These settings apply to ALL widgets of this type
- Secrets are encrypted and stored server-side only
- Never exposed to the frontend

---

### 2. Widget Configuration (Instance-Level)
**Location**: Gear icon on each widget

**What it's for**: Non-sensitive preferences that are **unique per widget instance**
- Display options
- Location/coordinates
- Refresh intervals
- Which data to show

**Examples**:
- Weather widget: City name, latitude, longitude, temperature units, refresh interval
- Crypto Price widget: Which coin to track, currency, refresh interval, display options

**How to configure**:
1. Click the gear icon (⚙️) on any widget
2. Adjust the settings for that specific widget
3. Click "Save Configuration"

**Important**:
- Each widget instance can have different settings
- Multiple weather widgets can track different cities
- Multiple crypto widgets can track different cryptocurrencies
- Settings are stored in your dashboard layout

---

## Example: Setting Up Multiple Weather Widgets

**Goal**: Track weather in 3 different cities

**Steps**:
1. Add 3 Weather widgets to your dashboard
2. Click gear icon on first widget:
   - City: "New York"
   - Latitude: 40.7128
   - Longitude: -74.0060
   - Units: imperial
3. Click gear icon on second widget:
   - City: "London"
   - Latitude: 51.5074
   - Longitude: -0.1278
   - Units: metric
4. Click gear icon on third widget:
   - City: "Tokyo"
   - Latitude: 35.6762
   - Longitude: 139.6503
   - Units: metric

Each widget now shows weather for a different city!

---

## Example: Setting Up Multiple Crypto Widgets

**Goal**: Track Bitcoin and Ethereum prices

**Steps**:
1. (Optional) Configure API key once:
   - Settings → Widget Secrets → Crypto Price → Enter API key
2. Add 2 Crypto Price widgets to your dashboard
3. Click gear icon on first widget:
   - Cryptocurrency: bitcoin
   - Currency: USD
   - Show 24h Change: Yes
4. Click gear icon on second widget:
   - Cryptocurrency: ethereum
   - Currency: USD
   - Show 24h Change: Yes

Both widgets use the same API key but track different coins!

---

## Quick Reference

| Setting Type | Scope | Access Method | Examples |
|-------------|-------|---------------|----------|
| **Secrets** | All widgets of this type | Settings → Widget Secrets | API keys, tokens |
| **Configuration** | Single widget instance | Gear icon on widget | Location, preferences |

---

## What Changed?

**Previous behavior** (incorrect):
- Weather location was in "Widget Secrets"
- All weather widgets showed the same location
- Had to reconfigure secrets to change location

**New behavior** (correct):
- Weather location is per-widget configuration
- Each weather widget can show a different location
- No need for secrets (Open-Meteo API is free)
- Same for crypto refresh intervals and preferences

---

## Widget Documentation

### Weather Widget
- **Secrets**: None (uses free Open-Meteo API)
- **Configuration**:
  - City name (display only)
  - Latitude (required for accurate weather)
  - Longitude (required for accurate weather)
  - Temperature units (metric/imperial)
  - Refresh interval (5-120 minutes)
  - Display options (humidity, animations)

### Crypto Price Widget
- **Secrets**:
  - CoinGecko API key (optional, recommended for production)
  - API endpoint (advanced users only)
- **Configuration**:
  - Which cryptocurrency to track
  - Display currency (USD, EUR, GBP, etc.)
  - Refresh interval (30-300 seconds)
  - Display options (24h change, market cap)
  - Price alert threshold

### Heartbeat Widget
- **Secrets**: None
- **Configuration**: None
- Automatically sends heartbeat every 5 minutes

---

## Troubleshooting

### Widget shows "Loading..." forever
- Check widget configuration (gear icon)
- Verify all required fields are set
- For weather: Check latitude/longitude are correct
- For crypto: Verify coin ID is valid

### Widget shows error message
- Read the error message carefully
- Common issues:
  - Invalid coordinates (weather)
  - Rate limit exceeded (crypto - reduce refresh interval)
  - Network connectivity

### Changes not saving
- Make sure to click "Save Configuration" or "Save Secrets"
- Check browser console for errors
- Refresh the page and try again

### Want to reset to defaults?
- Open configuration modal
- Manually enter default values:
  - Weather: London (51.5074, -0.1278)
  - Crypto: Bitcoin, USD, 60s refresh

---

## For Developers

When creating new widgets, follow this guideline:

**Use `secretsSchema` for**:
- API keys
- Authentication tokens
- Database credentials
- Any sensitive data

**Use `configSchema` for**:
- Display preferences
- Data source selection
- Refresh intervals
- Feature toggles
- Location/coordinates
- Any non-sensitive settings

See `src/widgets-external/weather/index.ts` and `src/widgets-external/crypto-price/index.ts` for examples.
