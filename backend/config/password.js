const bcrypt = require('bcryptjs');
const config = require('../config/auth');

async function hashPassword(password) {
  return bcrypt.hash(password, config.BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function getAdminPasswordHash() {
  return config.ADMIN_PASSWORD_HASH || null;
}

async function getOrCreateAdminHash() {
  const existing = getAdminPasswordHash();
  if (existing) return existing;
  const hash = await hashPassword(config.ADMIN_PASSWORD);
  config.ADMIN_PASSWORD_HASH = hash;
  return hash;
}

module.exports = { hashPassword, verifyPassword, getAdminPasswordHash, getOrCreateAdminHash };
