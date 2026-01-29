import type { Widget } from '../../core/types';
import { EmailComponent } from './EmailComponent';

export const widget: Widget = {
  id: 'email-widget',
  name: 'Email Inbox',
  description: 'Recent emails from an IMAP mailbox',
  component: EmailComponent,
  defaultSize: { w: 3, h: 3 },

  secretsSchema: {
    emailAddress: {
      type: 'string',
      label: 'Email Address',
      description: 'Email address (used as IMAP login username)',
      required: true,
      hint: 'e.g., user@gmail.com'
    },
    appPassword: {
      type: 'string',
      label: 'App Password',
      description: 'App-specific password or account password',
      required: true,
      hint: 'For Gmail, generate an App Password in Google Account settings'
    }
  },

  configSchema: {
    imapServer: {
      type: 'string',
      label: 'IMAP Server',
      description: 'IMAP server hostname',
      required: true,
      default: 'imap.gmail.com',
      hint: 'e.g., imap.gmail.com, outlook.office365.com'
    },
    imapPort: {
      type: 'number',
      label: 'IMAP Port',
      description: 'IMAP server port (993 for SSL)',
      required: false,
      default: 993,
      min: 1,
      max: 65535,
      hint: '993 for SSL/TLS (most common)'
    },
    emailCount: {
      type: 'number',
      label: 'Number of Emails',
      description: 'How many recent emails to retrieve',
      required: false,
      default: 10,
      min: 1,
      max: 20,
      hint: '1-20 emails'
    },
    refreshInterval: {
      type: 'number',
      label: 'Refresh Interval (minutes)',
      description: 'How often to check for new emails',
      required: false,
      default: 5,
      min: 1,
      max: 60,
      hint: 'Recommended: 5 minutes'
    }
  },

  dataExportSchema: {
    description: 'Recent emails from an IMAP mailbox',
    fields: {
      emails: {
        type: 'array',
        description: 'Array of email objects'
      },
      from: {
        type: 'string',
        description: 'Sender name and email address'
      },
      subject: {
        type: 'string',
        description: 'Email subject line'
      },
      date: {
        type: 'string',
        description: 'Date the email was sent'
      },
      totalCount: {
        type: 'number',
        description: 'Number of emails retrieved'
      },
      lastUpdate: {
        type: 'string',
        description: 'ISO 8601 timestamp of last check'
      }
    }
  }
};
