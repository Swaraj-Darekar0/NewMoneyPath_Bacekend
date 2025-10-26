const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes (256 bits)
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be provided in environment variables.');
}

// Ensure key is a Buffer of correct length
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
if (keyBuffer.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte hex string.');
}

const encrypt = (plaintext) => {
  if (!plaintext) return null;

  const iv = crypto.randomBytes(16); // 16 bytes for AES-256-CBC
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted; // Store IV with encrypted data
};

const decrypt = (encrypted) => {
  if (!encrypted) return null;

  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
