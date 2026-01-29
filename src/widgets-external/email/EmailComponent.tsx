import { useState, useCallback } from 'react';
import type { WidgetProps } from '../../core/types';
import { useSSE } from '../../core/useSSE';

// Minimal email info received via SSE
interface EmailSummary {
  uid: number;
  from: string;
  subject: string;
  date: string;
}

// Full email content fetched on demand
interface FullEmail {
  uid: number;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  bodyHtml: string | null;
  bodyText: string;
}

interface EmailData {
  emails: EmailSummary[];
  totalCount: number;
  lastUpdate: string;
  instanceId?: string;
  error?: string;
}

export const EmailComponent: React.FC<WidgetProps> = ({ id, size }) => {
  const [data, setData] = useState<EmailData | null>(null);

  useSSE('email-widget', (incoming) => {
    if (incoming.instanceId === id) {
      setData(incoming as EmailData);
    }
  });

  const openEmail = useCallback(async (email: EmailSummary) => {
    // Open window immediately so it's not blocked by popup blocker
    const emailWindow = window.open('', '_blank');
    if (!emailWindow) return;

    // Show loading state
    emailWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Loading...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #1a1a2e; color: #e0e0e0; text-align: center; }
  </style>
</head>
<body>
  <div>Loading email...</div>
</body>
</html>`);

    try {
      // Fetch full email content from server
      const response = await fetch(`/api/widgets/${id}/email/${email.uid}`);

      if (!response.ok) {
        throw new Error('Failed to load email');
      }

      const fullEmail: FullEmail = await response.json();

      const body = fullEmail.bodyHtml || `<pre style="white-space:pre-wrap;font-family:sans-serif;">${escapeHtml(fullEmail.bodyText)}</pre>`;
      const date = new Date(fullEmail.date).toLocaleString();

      // Replace loading content with full email
      emailWindow.document.open();
      emailWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(fullEmail.subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: #e0e0e0; }
    .header { border-bottom: 1px solid #333; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 12px 0; font-size: 1.3rem; color: #fff; }
    .field { margin: 4px 0; font-size: 0.9rem; }
    .field-label { color: #888; font-weight: 600; display: inline-block; width: 60px; }
    .field-value { color: #ccc; }
    .body { line-height: 1.6; }
    .body img { max-width: 100%; }
    a { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(fullEmail.subject)}</h1>
    <div class="field"><span class="field-label">From:</span> <span class="field-value">${escapeHtml(fullEmail.from)} &lt;${escapeHtml(fullEmail.fromEmail)}&gt;</span></div>
    <div class="field"><span class="field-label">To:</span> <span class="field-value">${escapeHtml(fullEmail.to)}</span></div>
    <div class="field"><span class="field-label">Date:</span> <span class="field-value">${escapeHtml(date)}</span></div>
  </div>
  <div class="body">${body}</div>
</body>
</html>`);
      emailWindow.document.close();
    } catch (error) {
      emailWindow.document.open();
      emailWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #1a1a2e; color: #ef4444; text-align: center; }
  </style>
</head>
<body>
  <div>Failed to load email. The email may have been refreshed out of cache.</div>
</body>
</html>`);
      emailWindow.document.close();
    }
  }, [id]);

  if (!data) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-muted">Connecting to mailbox...</div>
      </div>
    );
  }

  if (data.error && data.emails.length === 0) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">Email Inbox</div>
        <div className="text-error" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          {data.error}
        </div>
      </div>
    );
  }

  if (data.emails.length === 0) {
    return (
      <div className="widget-card flex-center-column">
        <div className="text-small-title mb-small">Email Inbox</div>
        <div className="text-muted">No emails found</div>
      </div>
    );
  }

  const isCompact = size.w < 3;

  return (
    <div className="widget-card flex-column" style={{ gap: '8px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="text-small-title">Inbox</div>
        <div className="text-muted" style={{ fontSize: '0.65rem' }}>
          {data.totalCount} email{data.totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      {data.error && (
        <div style={{ fontSize: '0.7rem', color: '#fbbf24', padding: '2px 0' }}>
          Last fetch error: {data.error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isCompact ? '0.7rem' : '0.78rem',
          tableLayout: 'fixed'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{
                textAlign: 'left',
                padding: '4px 6px',
                color: 'var(--dashboard-text)',
                opacity: 0.5,
                fontWeight: 600,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                width: isCompact ? '35%' : '30%',
                overflow: 'hidden'
              }}>
                From
              </th>
              <th style={{
                textAlign: 'left',
                padding: '4px 6px',
                color: 'var(--dashboard-text)',
                opacity: 0.5,
                fontWeight: 600,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                overflow: 'hidden'
              }}>
                Subject
              </th>
            </tr>
          </thead>
          <tbody>
            {data.emails.map((email) => (
              <tr
                key={email.uid}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <td style={{
                  padding: '5px 6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--dashboard-text)',
                  opacity: 0.8
                }}>
                  {email.from}
                </td>
                <td style={{
                  padding: '5px 6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openEmail(email);
                    }}
                    style={{
                      color: '#60a5fa',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    title={email.subject}
                  >
                    {email.subject}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-muted" style={{ fontSize: '0.6rem', textAlign: 'right', opacity: 0.5 }}>
        Updated {new Date(data.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
