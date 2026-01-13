import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encrypt, decrypt, isValidMasterKey } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECRETS_FILE = path.join(__dirname, '../dashboard-data/config/secrets.enc');
const DEV_SECRETS_FILE = path.join(__dirname, '../dashboard-data/config/secrets.dev.json');

/**
 * Manages encrypted secrets storage for widgets
 * Secrets are stored per widget type, not per instance
 */
export class SecretsManager {
  constructor(masterKey, isDevelopment = false) {
    this.masterKey = masterKey;
    this.isDevelopment = isDevelopment;
    this.secrets = {};

    // Validate master key in production
    if (!isDevelopment && !isValidMasterKey(masterKey)) {
      throw new Error(
        'Invalid or missing SECRETS_MASTER_KEY environment variable. ' +
        'Run "npm run generate-key" to create one.'
      );
    }

    this.load();
  }

  /**
   * Loads secrets from disk
   * In development, loads from unencrypted JSON file
   * In production, loads from encrypted file
   */
  load() {
    try {
      if (this.isDevelopment) {
        // Development mode: use unencrypted file for easier testing
        if (fs.existsSync(DEV_SECRETS_FILE)) {
          const data = fs.readFileSync(DEV_SECRETS_FILE, 'utf8');
          this.secrets = JSON.parse(data);
          console.log('[SecretsManager] Loaded development secrets (unencrypted)');
        } else {
          console.log('[SecretsManager] No development secrets file found, starting with empty secrets');
          this.secrets = {};
        }
      } else {
        // Production mode: use encrypted file
        if (fs.existsSync(SECRETS_FILE)) {
          const encryptedData = fs.readFileSync(SECRETS_FILE, 'utf8');
          this.secrets = decrypt(encryptedData, this.masterKey);
          console.log('[SecretsManager] Loaded encrypted secrets');
        } else {
          console.log('[SecretsManager] No secrets file found, starting with empty secrets');
          this.secrets = {};
        }
      }
    } catch (error) {
      console.error('[SecretsManager] Error loading secrets:', error.message);
      // Start with empty secrets on error rather than crashing
      this.secrets = {};
    }
  }

  /**
   * Saves secrets to disk
   * In development, saves as unencrypted JSON
   * In production, saves as encrypted file
   */
  save() {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.isDevelopment ? DEV_SECRETS_FILE : SECRETS_FILE);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (this.isDevelopment) {
        // Development mode: save unencrypted
        fs.writeFileSync(
          DEV_SECRETS_FILE,
          JSON.stringify(this.secrets, null, 2),
          'utf8'
        );
        console.log('[SecretsManager] Saved development secrets (unencrypted)');
      } else {
        // Production mode: save encrypted
        const encryptedData = encrypt(this.secrets, this.masterKey);
        fs.writeFileSync(SECRETS_FILE, encryptedData, 'utf8');
        console.log('[SecretsManager] Saved encrypted secrets');
      }
    } catch (error) {
      console.error('[SecretsManager] Error saving secrets:', error.message);
      throw error;
    }
  }

  /**
   * Gets all secrets for a specific widget type
   * @param {string} widgetId - Widget ID (e.g., "weather-widget")
   * @returns {Object} Object containing all secrets for this widget, or empty object
   */
  getWidgetSecrets(widgetId) {
    if (!widgetId) {
      throw new Error('Widget ID is required');
    }

    return this.secrets[widgetId] || {};
  }

  /**
   * Sets all secrets for a specific widget type
   * @param {string} widgetId - Widget ID
   * @param {Object} secretsBucket - Object containing all secrets for this widget
   */
  setWidgetSecrets(widgetId, secretsBucket) {
    if (!widgetId) {
      throw new Error('Widget ID is required');
    }

    if (!secretsBucket || typeof secretsBucket !== 'object') {
      throw new Error('Secrets bucket must be an object');
    }

    // Store the secrets bucket
    this.secrets[widgetId] = { ...secretsBucket };

    // Save to disk
    this.save();

    console.log(`[SecretsManager] Updated secrets for widget: ${widgetId}`);
  }

  /**
   * Deletes all secrets for a specific widget type
   * @param {string} widgetId - Widget ID
   */
  deleteWidgetSecrets(widgetId) {
    if (!widgetId) {
      throw new Error('Widget ID is required');
    }

    if (this.secrets[widgetId]) {
      delete this.secrets[widgetId];
      this.save();
      console.log(`[SecretsManager] Deleted secrets for widget: ${widgetId}`);
    }
  }

  /**
   * Lists all widget IDs that have secrets configured
   * @returns {string[]} Array of widget IDs
   */
  listWidgetsWithSecrets() {
    return Object.keys(this.secrets);
  }

  /**
   * Gets masked version of secrets (for displaying in UI)
   * Shows first 3 and last 3 characters, masks the middle
   * @param {string} widgetId - Widget ID
   * @returns {Object} Object with same keys but masked values
   */
  getMaskedSecrets(widgetId) {
    const secrets = this.getWidgetSecrets(widgetId);
    const masked = {};

    for (const [key, value] of Object.entries(secrets)) {
      if (typeof value === 'string' && value.length > 8) {
        // Mask middle characters: "abc...xyz"
        masked[key] = `${value.substring(0, 3)}***${value.substring(value.length - 3)}`;
      } else if (typeof value === 'string' && value.length > 0) {
        // Short strings: just show asterisks
        masked[key] = '***';
      } else {
        // Non-strings or empty: show as-is
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Checks if a widget has any secrets configured
   * @param {string} widgetId - Widget ID
   * @returns {boolean} True if widget has secrets
   */
  hasSecrets(widgetId) {
    const secrets = this.getWidgetSecrets(widgetId);
    return Object.keys(secrets).length > 0;
  }

  /**
   * Validates secrets against a widget's schema
   * @param {string} widgetId - Widget ID
   * @param {Object} schema - Secrets schema from widget definition
   * @returns {Object} { valid: boolean, missing: string[], errors: string[] }
   */
  validateSecrets(widgetId, schema) {
    if (!schema) {
      return { valid: true, missing: [], errors: [] };
    }

    const secrets = this.getWidgetSecrets(widgetId);
    const missing = [];
    const errors = [];

    for (const [key, definition] of Object.entries(schema)) {
      const value = secrets[key];

      // Check if required secret is missing
      if (definition.required && (value === undefined || value === null || value === '')) {
        missing.push(key);
        continue;
      }

      // Skip validation if not required and not provided
      if (!definition.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (definition.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`);
      } else if (definition.type === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`);
      } else if (definition.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${key} must be a boolean`);
      }

      // Enum validation
      if (definition.options && !definition.options.includes(value)) {
        errors.push(`${key} must be one of: ${definition.options.join(', ')}`);
      }
    }

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    };
  }
}
