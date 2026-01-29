/**
 * Email Inbox Widget - Backend Logic
 *
 * Fetches recent emails from an IMAP-compatible mailbox using ImapFlow.
 * Requires email address and app password configured as secrets.
 *
 * Only broadcasts minimal email info (from, subject, date, uid) to the frontend.
 * Full email content is cached and retrieved on demand via getEmail() method.
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export function init(context) {
  const { broadcast, secrets, config, logger, instanceId } = context;

  // Secrets
  const emailAddress = secrets.emailAddress;
  const appPassword = secrets.appPassword;

  // Config
  const imapServer = config.imapServer || 'imap.gmail.com';
  const imapPort = config.imapPort || 993;
  const emailCount = Math.min(Math.max(config.emailCount || 10, 1), 20);
  const refreshInterval = (config.refreshInterval || 5) * 60 * 1000;

  // Cache for full email content (keyed by uid)
  const emailCache = new Map();

  // Store latest minimal data for broadcast
  let latestData = null;

  // Validate secrets
  if (!emailAddress || !appPassword) {
    logger.error(`[${instanceId}] Missing email credentials - configure in widget secrets`);
    const errorData = {
      emails: [],
      totalCount: 0,
      error: 'Missing email credentials. Configure email address and app password in Settings > Secrets.',
      lastUpdate: new Date().toISOString(),
      instanceId
    };
    latestData = errorData;
    broadcast('email-widget', errorData);
    return {
      cleanup: () => {},
      exportData: () => latestData,
      refresh: () => {},
      getEmail: () => null
    };
  }

  logger.info(`[${instanceId}] Monitoring ${emailAddress} via ${imapServer}:${imapPort}`);
  logger.info(`[${instanceId}] Fetching ${emailCount} most recent emails every ${refreshInterval / 60000} minutes`);

  /**
   * Fetch recent emails from IMAP
   */
  async function fetchEmails() {
    let client;
    try {
      logger.info(`[${instanceId}] Connecting to ${imapServer}...`);

      client = new ImapFlow({
        host: imapServer,
        port: imapPort,
        secure: imapPort === 993,
        auth: {
          user: emailAddress,
          pass: appPassword
        },
        logger: false
      });

      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      try {
        const mailbox = client.mailbox;
        const totalMessages = mailbox.exists || 0;

        if (totalMessages === 0) {
          emailCache.clear();
          const emptyData = {
            emails: [],
            totalCount: 0,
            lastUpdate: new Date().toISOString(),
            instanceId
          };
          latestData = emptyData;
          broadcast('email-widget', emptyData);
          logger.info(`[${instanceId}] Inbox is empty`);
          return;
        }

        // Fetch the most recent N messages
        const startSeq = Math.max(1, totalMessages - emailCount + 1);
        const range = `${startSeq}:${totalMessages}`;

        const minimalEmails = [];
        const newCache = new Map();

        for await (const message of client.fetch(range, {
          envelope: true,
          source: true
        })) {
          try {
            const parsed = await simpleParser(message.source);

            const fromAddr = message.envelope.from?.[0];
            const fromName = fromAddr?.name || '';
            const fromEmail = fromAddr?.address || '';
            const fromDisplay = fromName ? `${fromName}` : fromEmail;

            const toAddrs = message.envelope.to || [];
            const toDisplay = toAddrs.map(a => a.name || a.address).join(', ');

            const uid = message.uid;
            const emailDate = message.envelope.date?.toISOString() || new Date().toISOString();
            const subject = message.envelope.subject || '(no subject)';

            // Store full email in cache
            newCache.set(uid, {
              uid,
              from: fromDisplay,
              fromEmail: fromEmail,
              to: toDisplay,
              subject,
              date: emailDate,
              bodyHtml: parsed.html || null,
              bodyText: parsed.text || '',
            });

            // Only add minimal info to broadcast list
            minimalEmails.push({
              uid,
              from: fromDisplay,
              subject,
              date: emailDate,
            });
          } catch (parseErr) {
            logger.warn(`[${instanceId}] Failed to parse message ${message.seq}: ${parseErr.message}`);
            const uid = message.uid;

            newCache.set(uid, {
              uid,
              from: 'Unknown',
              fromEmail: '',
              to: '',
              subject: '(failed to parse)',
              date: new Date().toISOString(),
              bodyHtml: null,
              bodyText: 'Failed to parse this email.',
            });

            minimalEmails.push({
              uid,
              from: 'Unknown',
              subject: '(failed to parse)',
              date: new Date().toISOString(),
            });
          }
        }

        // Replace cache with new data
        emailCache.clear();
        for (const [uid, email] of newCache) {
          emailCache.set(uid, email);
        }

        // Sort newest first
        minimalEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const emailData = {
          emails: minimalEmails,
          totalCount: minimalEmails.length,
          lastUpdate: new Date().toISOString(),
          instanceId
        };

        latestData = emailData;
        broadcast('email-widget', emailData);

        logger.info(`[${instanceId}] Fetched ${minimalEmails.length} emails from ${emailAddress}`);

      } finally {
        lock.release();
      }

    } catch (error) {
      logger.error(`[${instanceId}] Failed to fetch emails: ${error.message}`);

      const errorData = {
        emails: latestData?.emails || [],
        totalCount: latestData?.totalCount || 0,
        error: error.message,
        lastUpdate: new Date().toISOString(),
        instanceId
      };

      latestData = errorData;
      broadcast('email-widget', errorData);
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch {
          // ignore logout errors
        }
      }
    }
  }

  // Fetch immediately on startup
  fetchEmails().catch(err => {
    logger.error(`[${instanceId}] Initial email fetch failed:`, err);
  });

  // Set up periodic updates
  const timer = setInterval(fetchEmails, refreshInterval);

  return {
    cleanup: () => {
      logger.info(`[${instanceId}] Shutting down email monitor`);
      clearInterval(timer);
      emailCache.clear();
    },

    exportData: () => {
      if (!latestData) {
        return {
          emails: [],
          totalCount: 0,
          lastUpdate: new Date().toISOString()
        };
      }
      return {
        emails: latestData.emails,
        totalCount: latestData.totalCount,
        lastUpdate: latestData.lastUpdate
      };
    },

    refresh: () => {
      logger.info(`[${instanceId}] Manual refresh triggered`);
      fetchEmails().catch(err => {
        logger.error(`[${instanceId}] Manual refresh failed:`, err);
      });
    },

    // Get full email content by uid
    getEmail: (uid) => {
      const email = emailCache.get(uid);
      if (!email) {
        logger.warn(`[${instanceId}] Email not found in cache: ${uid}`);
        return null;
      }
      return email;
    }
  };
}
