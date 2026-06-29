const tracker = require('../models/LoginAttemptTracker');
const config = require('../config/auth');

function bruteForceProtection(req, res, next) {
  const username = req.body.username || '';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (tracker.isAccountLocked(username)) {
    const remaining = tracker.getLockoutRemaining(username);
    return res.status(429).json({
      success: false,
      message: `Cuenta bloqueada. Intente de nuevo en ${Math.ceil(remaining / 1000 / 60)} minutos.`,
      locked: true,
      retryAfterMs: remaining,
    });
  }

  if (tracker.isIPRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Demasiados intentos desde esta dirección IP.',
    });
  }

  const delay = tracker.getProgressiveDelay(username);
  if (delay > 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        next();
        resolve();
      }, delay);
    });
  }

  next();
}

module.exports = { bruteForceProtection };
