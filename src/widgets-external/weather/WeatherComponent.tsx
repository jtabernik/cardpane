import { useState } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  city: string;
  units: string;
  lastUpdate: string;
  instanceId?: string;
}

export const WeatherComponent: React.FC<WidgetProps> = ({ id, size }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to weather updates via SSE
  useSSE('weather-widget', (data) => {
    // Filter to only this widget instance's data
    if (data.instanceId === id) {
      setWeather(data as WeatherData);
      setError(null);
    }
  });

  if (error) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-error">{error}</div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Waiting for weather data...</div>
      </div>
    );
  }

  const temperatureClass = size.w >= 3 ? 'text-large-bold' : 'text-large';
  const conditionClass = size.w >= 3 ? 'text-medium-title' : 'text-secondary';

  return (
    <div className="widget-card flex-center-column">
      <div className="text-small-title mb-small">
        {weather.city}
      </div>
      <div className={temperatureClass}>
        {Math.round(weather.temperature)}°{weather.units === 'imperial' ? 'F' : 'C'}
      </div>
      <div className={`${conditionClass} mb-medium`}>
        {weather.condition}
      </div>
      {size.w >= 3 && (
        <>
          <div className="text-label mt-small">
            Humidity: {weather.humidity}%
          </div>
          <div className="text-small mt-large">
            Last update: {new Date(weather.lastUpdate).toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  );
};
