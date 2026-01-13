import type { Widget } from '../../core/types';
import { WeatherComponent } from './WeatherComponent';

export const widget: Widget = {
  id: 'weather-widget',
  name: 'Weather',
  description: 'Live weather updates using Open-Meteo (no API key required)',
  component: WeatherComponent,
  defaultSize: { w: 3, h: 3 },
  configSchema: {
    title: {
      type: 'string',
      label: 'Widget Title',
      description: 'Custom title for this weather widget',
      required: false,
      default: 'Weather',
      hint: 'Leave empty to use city name'
    },
    city: {
      type: 'string',
      label: 'City Name',
      description: 'Display name for the location',
      required: false,
      default: 'London',
      hint: 'Used for display only'
    },
    latitude: {
      type: 'number',
      label: 'Latitude',
      description: 'Location latitude',
      required: false,
      default: 51.5074,
      hint: 'Example: London is 51.5074'
    },
    longitude: {
      type: 'number',
      label: 'Longitude',
      description: 'Location longitude',
      required: false,
      default: -0.1278,
      hint: 'Example: London is -0.1278'
    },
    units: {
      type: 'select',
      label: 'Temperature Units',
      description: 'Temperature units',
      required: false,
      default: 'metric',
      options: ['metric', 'imperial']
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (minutes)',
      description: 'Update interval in minutes',
      required: false,
      default: 30,
      min: 5,
      max: 120
    },
    showHumidity: {
      type: 'boolean',
      label: 'Show Humidity',
      description: 'Display humidity information',
      required: false,
      default: true
    },
    updateAnimation: {
      type: 'boolean',
      label: 'Update Animation',
      description: 'Show animation on weather updates',
      required: false,
      default: true
    }
  },
  dataExportSchema: {
    description: 'Current weather conditions and forecast data',
    fields: {
      temperature: {
        type: 'number',
        description: 'Current temperature',
        unit: 'celsius'
      },
      condition: {
        type: 'string',
        description: 'Weather condition description (e.g., "Partly Cloudy", "Rain")'
      },
      humidity: {
        type: 'number',
        description: 'Relative humidity',
        unit: 'percent'
      },
      city: {
        type: 'string',
        description: 'City name for this weather data'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last weather data update'
      }
    }
  }
};
