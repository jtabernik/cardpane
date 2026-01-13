# Quick Start: Secrets Management

Get started with secure secrets management in 5 minutes.

## Step 1: Generate Master Key

```bash
npm run generate-key
```

Copy the output (something like `SECRETS_MASTER_KEY=abc123...`).

## Step 2: Create .env File

```bash
cp .env.example .env
```

Paste your master key into `.env`:

```env
NODE_ENV=production
SECRETS_MASTER_KEY=your_generated_key_here
PORT=3001
```

## Step 3: Start the Server

```bash
npm run dev
```

## Step 4: Set Secrets for a Widget

Using curl:

```bash
curl -X POST http://localhost:3001/api/admin/widgets/weather-widget/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-openweathermap-api-key",
    "city": "London",
    "units": "metric"
  }'
```

Or using any HTTP client (Postman, Insomnia, etc.).

## Step 5: Add the Widget to Dashboard

1. Open http://localhost:5173 in your browser
2. Click "Add Widget"
3. Select "Weather"
4. The widget will now display weather data using your secure API key!

---

## Verify It's Working

Check your secrets are stored:

```bash
curl http://localhost:3001/api/admin/widgets/weather-widget/secrets
```

You should see masked secrets:

```json
{
  "widgetId": "weather-widget",
  "hasSecrets": true,
  "secrets": {
    "apiKey": "you***key",
    "city": "London",
    "units": "metric"
  }
}
```

---

## Development Mode (Easier Testing)

For local development without encryption:

**1. Set development mode in .env:**
```env
NODE_ENV=development
```

**2. Create plain JSON file:**
```bash
mkdir -p dashboard-data/config
cat > dashboard-data/config/secrets.dev.json << 'EOF'
{
  "weather-widget": {
    "apiKey": "test-api-key",
    "city": "London",
    "units": "metric"
  }
}
EOF
```

**3. Restart server:**
```bash
npm run dev
```

Secrets are now stored unencrypted for easier debugging. **Never use development mode in production!**

---

## Next Steps

- Read the full guide: [SECRETS_GUIDE.md](./SECRETS_GUIDE.md)
- Create your own widget with secrets
- Add more widgets to your dashboard

## Troubleshooting

**Server won't start?**
- Check your master key is 64 hex characters
- Verify `.env` file exists
- Try development mode first

**Widget shows "waiting for data"?**
- Check backend logs for errors
- Verify secrets are set via API
- Test API key manually: https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY

**Need help?**
- Check server logs in terminal
- Read [SECRETS_GUIDE.md](./SECRETS_GUIDE.md) for detailed docs
- Review example widget: `src/widgets-external/weather/`
