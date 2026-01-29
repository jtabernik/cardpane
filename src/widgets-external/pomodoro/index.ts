import type { Widget } from '../../core/types';
import { PomodoroComponent } from './PomodoroComponent';

export const widget: Widget = {
  id: 'pomodoro-widget',
  name: 'Pomodoro Timer',
  description: 'Countdown timer with circular progress ring',
  component: PomodoroComponent,
  defaultSize: { w: 2, h: 2 },

  configSchema: {
    duration: {
      type: 'number',
      label: 'Timer Duration (minutes)',
      description: 'Countdown duration in minutes',
      required: false,
      default: 25,
      min: 1,
      max: 120,
      hint: 'Traditional Pomodoro is 25 minutes'
    }
  },

  dataExportSchema: {
    description: 'Pomodoro countdown timer status',
    fields: {
      duration: {
        type: 'number',
        description: 'Configured duration in minutes'
      },
      remaining: {
        type: 'number',
        description: 'Time remaining in seconds'
      },
      isRunning: {
        type: 'boolean',
        description: 'Whether the timer is currently running'
      },
      progress: {
        type: 'number',
        description: 'Progress percentage (0-100)',
        unit: 'percent'
      }
    }
  }
};
