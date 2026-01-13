# AI Integration Guide

This guide explains how to integrate AI agents with your dashboard to enable intelligent monitoring, alerting, and automation.

## Overview

The dashboard exposes widget data through REST API endpoints designed for AI consumption. This allows AI agents to:

- Monitor dashboard state in real-time
- Detect anomalies and trigger alerts
- Generate natural language summaries
- Automate responses to dashboard events
- Correlate data across multiple widgets

## API Endpoints

### 1. AI Summary Endpoint

**Endpoint**: `GET /api/dashboard/ai-summary`

The primary endpoint for AI consumption. Provides a comprehensive dashboard snapshot with health metadata.

**Response Format**:
```json
{
  "timestamp": "2026-01-09T18:30:00.000Z",
  "dashboard_state": "operational",
  "widget_count": 3,
  "health_summary": {
    "healthy": 3,
    "error": 0,
    "stale": 0
  },
  "widgets": [
    {
      "type": "weather-widget",
      "instance_id": "abc-123",
      "last_update": "2026-01-09T18:29:45.000Z",
      "age_seconds": 15,
      "status": "healthy",
      "data": {
        "temperature": 22,
        "condition": "Partly Cloudy",
        "humidity": 65,
        "city": "London",
        "lastUpdate": "2026-01-09T18:29:45.000Z"
      },
      "config": {
        "title": "London Weather",
        "showHumidity": true
      }
    }
  ]
}
```

**Dashboard States**:
- `operational` - All widgets healthy
- `degraded` - Some widgets reporting errors
- `critical` - Majority of widgets reporting errors
- `no_data` - No widget data available

### 2. Raw Snapshot Endpoint

**Endpoint**: `GET /api/dashboard/snapshot`

Returns raw widget data without additional processing.

**Response Format**:
```json
{
  "timestamp": 1704826200000,
  "timestampISO": "2026-01-09T18:30:00.000Z",
  "widget_count": 3,
  "widgets": [...]
}
```

### 3. Widget Instance Endpoint

**Endpoint**: `GET /api/dashboard/widget/:instanceId`

Get data for a specific widget instance.

**Example**: `GET /api/dashboard/widget/abc-123`

**Response Format**:
```json
{
  "widgetId": "weather-widget",
  "instanceId": "abc-123",
  "timestamp": 1704826185000,
  "timestampISO": "2026-01-09T18:29:45.000Z",
  "data": { ... },
  "config": { ... },
  "status": "healthy",
  "age_seconds": 15
}
```

### 4. Widget Type Endpoint

**Endpoint**: `GET /api/dashboard/widget-type/:widgetId`

Get all instances of a specific widget type.

**Example**: `GET /api/dashboard/widget-type/weather-widget`

**Response Format**:
```json
{
  "widgetId": "weather-widget",
  "instance_count": 2,
  "instances": [...]
}
```

## Widget Data Export Schema

**MANDATORY**: Widgets with a backend **must** implement an `exportData()` function that returns data matching their `dataExportSchema`.

### Defining the Schema

First, define what data your widget exports in `index.ts`:

```typescript
export const widget: Widget = {
  id: 'my-widget',
  name: 'My Widget',
  // ... other config ...

  dataExportSchema: {
    description: 'What this widget exports',
    fields: {
      temperature: {
        type: 'number',
        description: 'Current temperature reading',
        unit: 'celsius' // Optional unit
      },
      status: {
        type: 'string',
        description: 'Sensor status'
      }
    }
  }
};
```

**Field Types**:
- `string` - Text data
- `number` - Numeric values
- `boolean` - True/false values
- `object` - Complex nested data
- `array` - Lists of items

### Implementing exportData()

In your `backend.js`, return an object with both `cleanup` and `exportData`:

```javascript
export function init(context) {
  const { broadcast, logger } = context;

  // Store latest data
  let latestData = null;

  // Your widget logic
  async function fetchData() {
    const data = await someAPI.getData();
    latestData = data;
    broadcast('my-widget', data);
  }

  const timer = setInterval(fetchData, 60000);

  // MANDATORY: Return object with cleanup and exportData
  return {
    cleanup: () => {
      clearInterval(timer);
    },

    // This is called when AI requests /api/dashboard/ai-summary
    exportData: () => {
      if (!latestData) {
        return {
          temperature: 0,
          status: 'Loading'
        };
      }
      return {
        temperature: latestData.temp,
        status: latestData.status || 'healthy'
      };
    }
  };
}
```

**Key Points**:
- `exportData()` is called **on-demand** when AI requests data
- Return exactly the fields defined in your `dataExportSchema`
- Handle the case where data isn't available yet
- Don't make API calls in `exportData()` - return cached data
- Frontend-only widgets (no backend) don't need `exportData()`

## Use Cases

### 1. Monitoring and Alerting

**Example: Basic health monitoring**

```python
import requests
import time

DASHBOARD_URL = "http://localhost:3001"

def check_dashboard_health():
    response = requests.get(f"{DASHBOARD_URL}/api/dashboard/ai-summary")
    data = response.json()

    if data["dashboard_state"] != "operational":
        send_alert(f"Dashboard is {data['dashboard_state']}")

    for widget in data["widgets"]:
        if widget["status"] == "error":
            send_alert(f"Widget {widget['type']} is reporting errors")

        if widget["age_seconds"] > 300:  # 5 minutes
            send_alert(f"Widget {widget['type']} hasn't updated in {widget['age_seconds']}s")

# Poll every 60 seconds
while True:
    check_dashboard_health()
    time.sleep(60)
```

### 2. Natural Language Summarization

**Example: AI-generated dashboard summary**

```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

def generate_dashboard_summary():
    # Fetch dashboard data
    response = requests.get("http://localhost:3001/api/dashboard/ai-summary")
    dashboard_data = response.json()

    # Ask Claude to summarize
    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""
            Here is my dashboard data in JSON format:

            {json.dumps(dashboard_data, indent=2)}

            Please provide a concise natural language summary of:
            1. Overall dashboard health
            2. Any concerning trends or anomalies
            3. Key metrics and their current values

            Keep it brief and actionable.
            """
        }]
    )

    return message.content[0].text

# Example output:
# "Your dashboard is operational with all 3 widgets healthy.
#  London weather is 22°C and partly cloudy.
#  Server heartbeat is active with 42 pulses detected.
#  No anomalies detected."
```

### 3. Intelligent Alerting

**Example: Context-aware alerts**

```python
def check_conditions():
    response = requests.get("http://localhost:3001/api/dashboard/ai-summary")
    data = response.json()

    for widget in data["widgets"]:
        if widget["type"] == "weather-widget":
            temp = widget["data"]["temperature"]
            if temp > 30:
                send_alert(f"High temperature alert: {temp}°C in {widget['data']['city']}")

        elif widget["type"] == "truenas-widget":
            storage = widget["data"]["storage_used_percent"]
            if storage > 85:
                send_alert(f"Storage critical: {storage}% used")

        elif widget["type"] == "email-widget":
            unread = widget["data"]["unread_count"]
            if unread > 100:
                send_alert(f"High unread email count: {unread}")
```

### 4. Automated Responses

**Example: Self-healing actions**

```python
def automated_response():
    response = requests.get("http://localhost:3001/api/dashboard/ai-summary")
    data = response.json()

    for widget in data["widgets"]:
        # Auto-restart services
        if widget["type"] == "service-monitor" and widget["status"] == "error":
            service_name = widget["config"]["service_name"]
            restart_service(service_name)
            log_action(f"Auto-restarted {service_name}")

        # Auto-scale resources
        if widget["type"] == "cpu-monitor":
            cpu_usage = widget["data"]["usage_percent"]
            if cpu_usage > 90:
                scale_up_resources()
                log_action("Scaled up compute resources")
```

### 5. Daily Digest

**Example: Morning summary email**

```python
import anthropic
import schedule

def generate_morning_digest():
    response = requests.get("http://localhost:3001/api/dashboard/ai-summary")
    dashboard_data = response.json()

    client = anthropic.Anthropic(api_key="your-api-key")

    message = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""
            Based on this dashboard data:

            {json.dumps(dashboard_data, indent=2)}

            Create a morning digest email with:
            1. Good morning greeting
            2. Overall system health
            3. Key metrics and their values
            4. Any action items or concerns
            5. Weather forecast if available

            Format as a friendly, concise email.
            """
        }]
    )

    summary = message.content[0].text
    send_email("you@example.com", "Daily Dashboard Digest", summary)

# Schedule for 7 AM daily
schedule.every().day.at("07:00").do(generate_morning_digest)
```

## Claude Desktop Integration

You can create a Model Context Protocol (MCP) server to expose your dashboard to Claude Desktop:

```typescript
// mcp-dashboard-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "dashboard-monitor", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "get_dashboard_summary",
      description: "Get current dashboard status and all widget data",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "get_dashboard_summary") {
    const response = await fetch("http://localhost:3001/api/dashboard/ai-summary");
    const data = await response.json();

    return {
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "dashboard": {
      "command": "node",
      "args": ["/path/to/mcp-dashboard-server.js"]
    }
  }
}
```

Now you can ask Claude: "What's the current state of my dashboard?" and it will fetch and analyze the data.

## Best Practices

### Polling Intervals

- **Real-time monitoring**: 10-30 seconds
- **Regular checks**: 1-5 minutes
- **Periodic summaries**: 15-60 minutes
- **Digest reports**: Once per day

Respect the dashboard server - avoid excessive polling.

### Error Handling

Always handle network errors and invalid responses:

```python
import requests
from requests.exceptions import RequestException

def safe_fetch_dashboard():
    try:
        response = requests.get(
            "http://localhost:3001/api/dashboard/ai-summary",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except RequestException as e:
        log_error(f"Failed to fetch dashboard: {e}")
        return None
```

### Stale Data Detection

Check the `age_seconds` field to detect stale data:

```python
STALE_THRESHOLD = 300  # 5 minutes

for widget in data["widgets"]:
    if widget["age_seconds"] > STALE_THRESHOLD:
        handle_stale_widget(widget)
```

### Rate Limiting

If implementing webhooks or rapid polling, add rate limiting:

```python
import time
from functools import wraps

def rate_limit(calls_per_minute=60):
    min_interval = 60.0 / calls_per_minute
    last_call = [0.0]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_call[0]
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            last_call[0] = time.time()
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(calls_per_minute=30)
def fetch_dashboard():
    # Will be limited to 30 calls/minute
    pass
```

## Advanced Features

### Webhook Support (Future)

If you add webhook support to the server, AI agents can subscribe to events:

```python
# Subscribe to dashboard events
requests.post("http://localhost:3001/api/webhooks/subscribe", json={
    "url": "https://your-ai-agent.com/webhook",
    "events": ["widget.error", "dashboard.degraded"]
})
```

### Historical Data (Future)

For trend analysis, consider storing historical snapshots:

```python
import sqlite3
from datetime import datetime

def store_snapshot(data):
    conn = sqlite3.connect('dashboard_history.db')
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO snapshots (timestamp, data)
        VALUES (?, ?)
    """, (datetime.now(), json.dumps(data)))

    conn.commit()
    conn.close()

# Analyze trends
def analyze_trends(widget_type, hours=24):
    # Query historical data
    # Detect patterns, anomalies, trends
    pass
```

## Security Considerations

### Authentication (Recommended for Production)

Add API key authentication to protect your endpoints:

```javascript
// server/index.js
const API_KEY = process.env.DASHBOARD_API_KEY;

app.use('/api/dashboard', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
});
```

Client usage:
```python
headers = {"X-API-Key": "your-secret-key"}
response = requests.get(
    "http://localhost:3001/api/dashboard/ai-summary",
    headers=headers
)
```

### Network Security

- **Local only**: If dashboard is on localhost, ensure AI agent runs on same machine
- **VPN**: Use VPN for remote access instead of exposing to internet
- **Firewall**: Restrict access to trusted IPs only
- **HTTPS**: Use HTTPS in production with valid certificates

### Data Privacy

Be mindful of sensitive data in widgets:
- Don't expose API keys or secrets in widget data
- Sanitize data before sending to external AI services
- Use local AI models for sensitive environments

## Troubleshooting

### No Data Returned

**Problem**: Empty `widgets` array in response

**Solutions**:
1. Ensure widgets are broadcasting data via SSE
2. Check that widget backends are running (check server logs)
3. Verify widgets have configured secrets if required
4. Wait for initial data - widgets need time to fetch and broadcast

### Stale Data

**Problem**: `age_seconds` is very high

**Solutions**:
1. Check widget backend is still running
2. Verify network connectivity to external APIs
3. Check for errors in server logs
4. Restart server to reinitialize backends

### 404 Not Found

**Problem**: Endpoint returns 404

**Solutions**:
1. Ensure server is running on port 3001
2. Check URL includes `/api/` prefix
3. Verify endpoint path is correct
4. Check server version supports AI endpoints

## Example Scripts

### Complete Monitoring Script

See [examples/ai-monitor.py](examples/ai-monitor.py) for a complete monitoring script with:
- Polling loop
- Alert thresholds
- Email notifications
- Logging

### Claude Desktop MCP Server

See [examples/mcp-dashboard-server.ts](examples/mcp-dashboard-server.ts) for integration with Claude Desktop.

## Further Reading

- [Widget Development Template](WIDGET_TEMPLATE.md)
- [Secrets Management Guide](SECRETS_GUIDE.md)
- [Widget Styling Guide](WIDGET_STYLING.md)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Anthropic API Documentation](https://docs.anthropic.com)

## Support

For questions or issues with AI integration:
1. Check server logs for errors
2. Test endpoints with `curl` or Postman
3. Review widget backend code for data broadcasting
4. Open an issue in the repository

Happy AI integration!
