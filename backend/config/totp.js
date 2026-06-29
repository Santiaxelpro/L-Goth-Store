const crypto = require('crypto');

const TOTP_WINDOW = 1;
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;

function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let buffer = Buffer.alloc(Math.ceil((base32.length * 5) / 8));

  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.toUpperCase()[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i < buffer.length; i++) {
    const byte = bits.substring(i * 8, (i + 1) * 8);
    buffer[i] = parseInt(byte.padEnd(8, '0'), 2);
  }

  return buffer;
}

function generateHOTP(secret, counter) {
  const key = base32ToBuffer(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
}

function generateTOTP(secret) {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  return generateHOTP(secret, counter);
}

function verifyTOTP(token, secret) {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    if (generateHOTP(secret, counter + i) === token) {
      return true;
    }
  }

  return false;
}

function generateMFASecret() {
  const random = crypto.randomBytes(20);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let base32 = '';
  let bits = '';
  for (let i = 0; i < random.length; i++) {
    bits += random[i].toString(2).padStart(8, '0');
  }
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) break;
    base32 += alphabet[parseInt(chunk, 2)];
  }
  return base32;
}

module.exports = { generateTOTP, verifyTOTP, generateMFASecret, TOTP_DIGITS };
