const config = require('../config/auth');

class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map();
    this.ipAttempts = new Map();
    this.lockedAccounts = new Map();
    this.refreshTokenFamilies = new Map();
    this.activeRefreshTokens = new Map();
    this.mfaSecrets = new Map();
    this.mfaEnabled = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.attempts) {
      if (now - data.firstAttempt > config.GLOBAL_AUTH_WINDOW_MS) {
        this.attempts.delete(key);
      }
    }
    for (const [ip, data] of this.ipAttempts) {
      if (now - data.windowStart > config.IP_RATE_LIMIT_WINDOW_MS) {
        this.ipAttempts.delete(ip);
      }
    }
    for (const [username, lockedUntil] of this.lockedAccounts) {
      if (now > lockedUntil) {
        this.lockedAccounts.delete(username);
        this.attempts.delete(username);
      }
    }
    for (const [family, data] of this.refreshTokenFamilies) {
      if (now - data.lastUsed > config.JWT_REFRESH_EXPIRES_MS) {
        this.refreshTokenFamilies.delete(family);
      }
    }
  }

  recordFailedAttempt(username, ip) {
    const now = Date.now();
    if (!this.attempts.has(username)) {
      this.attempts.set(username, { count: 0, firstAttempt: now, lastAttempt: 0 });
    }
    const entry = this.attempts.get(username);
    if (now - entry.firstAttempt > config.GLOBAL_AUTH_WINDOW_MS) {
      entry.count = 0;
      entry.firstAttempt = now;
    }
    entry.count++;
    entry.lastAttempt = now;

    if (entry.count >= config.MAX_FAILED_ATTEMPTS) {
      this.lockedAccounts.set(username, now + config.LOCKOUT_DURATION_MS);
      this.attempts.delete(username);
      return { locked: true, lockedUntil: now + config.LOCKOUT_DURATION_MS };
    }

    if (!this.ipAttempts.has(ip)) {
      this.ipAttempts.set(ip, { count: 0, windowStart: now });
    }
    const ipEntry = this.ipAttempts.get(ip);
    if (now - ipEntry.windowStart > config.IP_RATE_LIMIT_WINDOW_MS) {
      ipEntry.count = 0;
      ipEntry.windowStart = now;
    }
    ipEntry.count++;

    return { locked: false, attemptCount: entry.count, ipCount: ipEntry.count };
  }

  recordSuccessfulAttempt(username, ip) {
    this.attempts.delete(username);
    this.lockedAccounts.delete(username);
    this.ipAttempts.delete(ip);
  }

  isAccountLocked(username) {
    const lockedUntil = this.lockedAccounts.get(username);
    if (!lockedUntil) return false;
    if (Date.now() > lockedUntil) {
      this.lockedAccounts.delete(username);
      return false;
    }
    return true;
  }

  getLockoutRemaining(username) {
    const lockedUntil = this.lockedAccounts.get(username);
    if (!lockedUntil) return 0;
    return Math.max(0, lockedUntil - Date.now());
  }

  getProgressiveDelay(username) {
    const entry = this.attempts.get(username);
    if (!entry || entry.count <= 1) return 0;
    const delay = config.PROGRESSIVE_DELAY_BASE_MS *
      Math.pow(config.PROGRESSIVE_DELAY_MULTIPLIER, entry.count - 1);
    return Math.min(delay, config.PROGRESSIVE_DELAY_MAX_MS);
  }

  isIPRateLimited(ip) {
    const entry = this.ipAttempts.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.windowStart > config.IP_RATE_LIMIT_WINDOW_MS) {
      this.ipAttempts.delete(ip);
      return false;
    }
    return entry.count > config.IP_RATE_LIMIT_MAX;
  }

  createRefreshTokenFamily(userId) {
    const crypto = require('crypto');
    const family = crypto.randomBytes(config.REFRESH_TOKEN_FAMILY_LENGTH).toString('hex');
    this.refreshTokenFamilies.set(family, { userId, lastUsed: Date.now(), valid: true });
    return family;
  }

  validateAndRotateRefreshTokenFamily(family, userId) {
    const data = this.refreshTokenFamilies.get(family);
    if (!data || !data.valid || data.userId !== userId) {
      if (family && this.refreshTokenFamilies.has(family)) {
        this.refreshTokenFamilies.delete(family);
      }
      return null;
    }
    const crypto = require('crypto');
    const newFamily = crypto.randomBytes(config.REFRESH_TOKEN_FAMILY_LENGTH).toString('hex');
    data.valid = false;
    this.refreshTokenFamilies.set(newFamily, { userId, lastUsed: Date.now(), valid: true });
    return newFamily;
  }

  invalidateRefreshTokenFamily(family) {
    if (family && this.refreshTokenFamilies.has(family)) {
      this.refreshTokenFamilies.delete(family);
    }
  }

  invalidateAllUserRefreshTokens(userId) {
    for (const [family, data] of this.refreshTokenFamilies) {
      if (data.userId === userId) {
        this.refreshTokenFamilies.delete(family);
      }
    }
  }

  setMFASecret(username, secret) {
    this.mfaSecrets.set(username, secret);
  }

  getMFASecret(username) {
    return this.mfaSecrets.get(username);
  }

  setMFAEnabled(username, enabled) {
    this.mfaEnabled.set(username, enabled);
  }

  isMFAEnabled(username) {
    return this.mfaEnabled.get(username) || false;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

module.exports = new LoginAttemptTracker();
