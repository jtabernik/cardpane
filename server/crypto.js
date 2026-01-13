import crypto from 'crypto';

/**
 * Encryption utilities for secrets management
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

/**
 * Derives a key from the master key using PBKDF2
 * @param {string} masterKey - The master key from environment
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts data using AES-256-GCM
 * @param {Object} data - Plain object to encrypt
 * @param {string} masterKey - Master encryption key
 * @returns {string} Base64-encoded encrypted data with IV, salt, and auth tag
 */
export function encrypt(data, masterKey) {
  if (!masterKey) {
    throw new Error('Master key is required for encryption');
  }

  // Convert data to JSON string
  const plaintext = JSON.stringify(data);

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key from master key
  const key = deriveKey(masterKey, salt);

  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine salt + iv + encrypted + authTag and encode as base64
  const combined = Buffer.concat([
    salt,
    iv,
    Buffer.from(encrypted, 'hex'),
    authTag
  ]);

  return combined.toString('base64');
}

/**
 * Decrypts data encrypted with encrypt()
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @param {string} masterKey - Master encryption key
 * @returns {Object} Decrypted data as object
 */
export function decrypt(encryptedData, masterKey) {
  if (!masterKey) {
    throw new Error('Master key is required for decryption');
  }

  if (!encryptedData) {
    throw new Error('No encrypted data provided');
  }

  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(combined.length - TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);

  // Derive decryption key
  const key = deriveKey(masterKey, salt);

  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // Parse JSON and return
  return JSON.parse(decrypted);
}

/**
 * Generates a secure random master key
 * @returns {string} Hex-encoded random key (64 characters)
 */
export function generateMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates that a master key is properly formatted
 * @param {string} masterKey - Key to validate
 * @returns {boolean} True if valid
 */
export function isValidMasterKey(masterKey) {
  if (!masterKey || typeof masterKey !== 'string') {
    return false;
  }

  // Should be 64 hex characters (32 bytes)
  return /^[0-9a-f]{64}$/i.test(masterKey);
}
