# Weather Widget - City Coordinates

The weather widget now uses **Open-Meteo API** which is completely free and requires no API key!

However, you need to provide latitude and longitude coordinates for your location.

## Quick Setup

1. Click **⚙️ Settings** in the dashboard
2. Navigate to **Widget Secrets**
3. Find **Weather** and click **Configure**
4. Enter:
   - **City Name** - Display name (e.g., "New York")
   - **Latitude** - See list below
   - **Longitude** - See list below
5. Click **Save Secrets**

## Common City Coordinates

### United States
| City | Latitude | Longitude |
|------|----------|-----------|
| New York, NY | 40.7128 | -74.0060 |
| Los Angeles, CA | 34.0522 | -118.2437 |
| Chicago, IL | 41.8781 | -87.6298 |
| Houston, TX | 29.7604 | -95.3698 |
| Phoenix, AZ | 33.4484 | -112.0740 |
| San Francisco, CA | 37.7749 | -122.4194 |
| Seattle, WA | 47.6062 | -122.3321 |
| Miami, FL | 25.7617 | -80.1918 |
| Boston, MA | 42.3601 | -71.0589 |
| Washington, DC | 38.9072 | -77.0369 |

### Europe
| City | Latitude | Longitude |
|------|----------|-----------|
| London, UK | 51.5074 | -0.1278 |
| Paris, France | 48.8566 | 2.3522 |
| Berlin, Germany | 52.5200 | 13.4050 |
| Madrid, Spain | 40.4168 | -3.7038 |
| Rome, Italy | 41.9028 | 12.4964 |
| Amsterdam, Netherlands | 52.3676 | 4.9041 |
| Vienna, Austria | 48.2082 | 16.3738 |
| Stockholm, Sweden | 59.3293 | 18.0686 |
| Copenhagen, Denmark | 55.6761 | 12.5683 |
| Dublin, Ireland | 53.3498 | -6.2603 |

### Asia
| City | Latitude | Longitude |
|------|----------|-----------|
| Tokyo, Japan | 35.6762 | 139.6503 |
| Beijing, China | 39.9042 | 116.4074 |
| Shanghai, China | 31.2304 | 121.4737 |
| Singapore | 1.3521 | 103.8198 |
| Hong Kong | 22.3193 | 114.1694 |
| Seoul, South Korea | 37.5665 | 126.9780 |
| Mumbai, India | 19.0760 | 72.8777 |
| Delhi, India | 28.7041 | 77.1025 |
| Bangkok, Thailand | 13.7563 | 100.5018 |
| Dubai, UAE | 25.2048 | 55.2708 |

### Australia & Oceania
| City | Latitude | Longitude |
|------|----------|-----------|
| Sydney, Australia | -33.8688 | 151.2093 |
| Melbourne, Australia | -37.8136 | 144.9631 |
| Brisbane, Australia | -27.4698 | 153.0251 |
| Perth, Australia | -31.9505 | 115.8605 |
| Auckland, New Zealand | -36.8485 | 174.7633 |
| Wellington, New Zealand | -41.2865 | 174.7762 |

### South America
| City | Latitude | Longitude |
|------|----------|-----------|
| São Paulo, Brazil | -23.5505 | -46.6333 |
| Rio de Janeiro, Brazil | -22.9068 | -43.1729 |
| Buenos Aires, Argentina | -34.6037 | -58.3816 |
| Santiago, Chile | -33.4489 | -70.6693 |
| Lima, Peru | -12.0464 | -77.0428 |
| Bogotá, Colombia | 4.7110 | -74.0721 |

### Canada
| City | Latitude | Longitude |
|------|----------|-----------|
| Toronto, ON | 43.6532 | -79.3832 |
| Vancouver, BC | 49.2827 | -123.1207 |
| Montreal, QC | 45.5017 | -73.5673 |
| Calgary, AB | 51.0447 | -114.0719 |
| Ottawa, ON | 45.4215 | -75.6972 |

## How to Find Your City's Coordinates

If your city isn't listed above, you can find coordinates using:

1. **Google Maps**:
   - Search for your city
   - Right-click on the location
   - Click the coordinates that appear
   - First number is latitude, second is longitude

2. **LatLong.net**:
   - Visit https://www.latlong.net/
   - Enter your city name
   - Copy the latitude and longitude

3. **Open-Meteo Website**:
   - Visit https://open-meteo.com/
   - Use their location search to find coordinates

## Notes

- **Latitude** ranges from -90 (South Pole) to +90 (North Pole)
- **Longitude** ranges from -180 to +180
- Negative latitude = Southern Hemisphere
- Negative longitude = West of Prime Meridian
- The widget works anywhere in the world!

## Example Configuration

For **New York City**:
```json
{
  "city": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "units": "imperial",
  "refreshInterval": 30
}
```

For **Tokyo**:
```json
{
  "city": "Tokyo",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "units": "metric",
  "refreshInterval": 30
}
```

## API Information

- **Provider**: Open-Meteo (https://open-meteo.com/)
- **Cost**: Completely free
- **API Key**: Not required
- **Rate Limits**: Very generous (10,000 requests/day for free)
- **Data**: High-quality weather data from national weather services

## Troubleshooting

### Widget shows "Loading..."
- Check that latitude and longitude are set correctly
- Verify your internet connection
- Check server logs for API errors

### Wrong location
- Double-check your latitude and longitude values
- Make sure you didn't swap latitude and longitude
- Negative signs matter! (Southern hemisphere and west of Prime Meridian use negatives)

### Temperature seems wrong
- Check your units setting (metric vs imperial)
- Metric = Celsius, Imperial = Fahrenheit
