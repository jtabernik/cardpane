/**
 * Weather Widget - Backend Logic
 * Fetches weather data from OpenWeatherMap API and broadcasts to frontend
 * Demonstrates how to use secrets securely on the server side
 */

export function init(context) {
  const { broadcast, config, logger, instanceId } = context;

  // Store latest weather data for AI export
  let latestWeatherData = null;

  // Get configuration (Open-Meteo doesn't require API key!)
  const latitude = config.latitude || 51.5074;  // London by default
  const longitude = config.longitude || -0.1278;
  const city = config.city || 'London';
  const units = config.units || 'metric';
  const refreshInterval = (config.refreshInterval || 30) * 60 * 1000; // Convert minutes to ms

  logger.info(`Starting weather updates for ${city} (lat: ${latitude}, lon: ${longitude}) every ${refreshInterval / 60000} minutes`);
  logger.info('Using Open-Meteo API (no API key required)');

  // Function to fetch weather data from Open-Meteo
  async function fetchWeather() {
    try {
      // Open-Meteo API - completely free, no API key needed
      const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=${tempUnit}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Map weather codes to conditions
      // Open-Meteo weather codes: https://open-meteo.com/en/docs
      const weatherCodeMap = {
        0: 'Clear',
        1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy',
        51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
        61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Snow', 73: 'Snow', 75: 'Heavy Snow',
        77: 'Snow Grains',
        80: 'Rain Showers', 81: 'Rain Showers', 82: 'Heavy Rain Showers',
        85: 'Snow Showers', 86: 'Heavy Snow Showers',
        95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
      };

      const weatherCode = data.current.weather_code;
      const condition = weatherCodeMap[weatherCode] || 'Unknown';

      // Transform API response to our widget format
      const weatherData = {
        temperature: data.current.temperature_2m,
        condition: condition,
        humidity: data.current.relative_humidity_2m,
        city: city,
        units: units,
        lastUpdate: new Date().toISOString()
      };

      // Store for AI export
      latestWeatherData = weatherData;

      // Broadcast to all connected clients
      // Include instanceId so frontend can filter to the correct widget
      broadcast('weather-widget', { ...weatherData, instanceId });
      logger.info(`Weather updated: ${weatherData.temperature}°${units === 'metric' ? 'C' : 'F'}, ${weatherData.condition}`);
    } catch (error) {
      logger.error(`Failed to fetch weather: ${error.message}`);

      // Prepare error data
      const errorData = {
        temperature: 0,
        condition: 'Error',
        humidity: 0,
        city,
        units: units,
        lastUpdate: new Date().toISOString(),
        error: error.message
      };

      // Store error for AI export
      latestWeatherData = errorData;

      // Broadcast error to frontend
      broadcast('weather-widget', { ...errorData, instanceId });
    }
  }

  // Fetch immediately on startup (don't await - let it run async)
  fetchWeather().catch(err => {
    logger.error('Initial weather fetch failed:', err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchWeather, refreshInterval);

  // Return object with cleanup, exportData, and refresh methods
  return {
    cleanup: () => {
      logger.info('Shutting down weather updates');
      clearInterval(timer);
    },

    // Export data for AI consumption (mandatory for widgets with dataExportSchema)
    exportData: () => {
      if (!latestWeatherData) {
        return {
          temperature: 0,
          condition: 'Loading',
          humidity: 0,
          city,
          units: units,
          lastUpdate: new Date().toISOString()
        };
      }
      return latestWeatherData;
    },

    // Refresh method to trigger immediate data fetch
    refresh: () => {
      logger.info('Manual refresh triggered');
      fetchWeather().catch(err => {
        logger.error('Manual refresh failed:', err);
      });
    }
  };
}
