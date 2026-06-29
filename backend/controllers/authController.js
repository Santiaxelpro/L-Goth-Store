const tracker = require('../models/LoginAttemptTracker');
const jwt = require('../config/jwt');
const passwordUtils = require('../config/password');
const config = require('../config/auth');
const totp = require('../config/totp');

let cachedAdminHash = null;

async function getAdminHash() {
  if (!cachedAdminHash) {
    cachedAdminHash = await passwordUtils.getOrCreateAdminHash();
  }
  return cachedAdminHash;
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
    }

    if (username !== config.ADMIN_USERNAME) {
      tracker.recordFailedAttempt(username, ip);
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const adminHash = await getAdminHash();
    const validPassword = await passwordUtils.verifyPassword(password, adminHash);

    if (!validPassword) {
      const result = tracker.recordFailedAttempt(username, ip);
      if (result.locked) {
        return res.status(429).json({
          success: false,
          message: `Cuenta bloqueada por demasiados intentos. Intente de nuevo en ${Math.ceil(config.LOCKOUT_DURATION_MS / 1000 / 60)} minutos.`,
          locked: true,
          retryAfterMs: config.LOCKOUT_DURATION_MS,
        });
      }
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    if (tracker.isMFAEnabled(username)) {
      const tempToken = jwt.generateAccessToken(username, jwt.generateTokenFingerprint(req));
      return res.json({
        success: true,
        mfaRequired: true,
        tempToken,
      });
    }

    tracker.recordSuccessfulAttempt(username, ip);

    const family = tracker.createRefreshTokenFamily(username);
    const tokens = jwt.generateTokens(username, req, family);

    jwt.setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      success: true,
      token: tokens.accessToken,
      username,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function refreshToken(req, res) {
  try {
    const token = req.cookies && req.cookies[config.TOKEN_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verifyRefreshToken(token);
    } catch (err) {
      jwt.clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: 'Refresh token inválido o expirado' });
    }

    if (decoded.type !== 'refresh') {
      jwt.clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: 'Tipo de token inválido' });
    }

    const currentFingerprint = jwt.generateTokenFingerprint(req);
    if (decoded.fingerprint !== currentFingerprint) {
      tracker.invalidateAllUserRefreshTokens(decoded.username);
      jwt.clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: 'Posible robo de token detectado' });
    }

    const newFamily = tracker.validateAndRotateRefreshTokenFamily(decoded.family, decoded.username);
    if (!newFamily) {
      jwt.clearRefreshTokenCookie(res);
      return res.status(403).json({ success: false, message: 'Token reutilizado - posible ataque detectado' });
    }

    const tokens = jwt.generateTokens(decoded.username, req, newFamily);
    jwt.setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      success: true,
      token: tokens.accessToken,
      username: decoded.username,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies && req.cookies[config.TOKEN_COOKIE_NAME];

    if (token) {
      try {
        const decoded = jwt.verifyRefreshToken(token);
        if (decoded && decoded.family) {
          tracker.invalidateRefreshTokenFamily(decoded.family);
        }
      } catch (e) {
        // Token already invalid, continue
      }
    }

    jwt.clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function verifyToken(req, res) {
  res.json({
    success: true,
    username: req.user.username,
  });
}

async function setupMFA(req, res) {
  try {
    const username = req.user && req.user.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const secret = totp.generateMFASecret();
    tracker.setMFASecret(username, secret);

    const otpauthUrl = `otpauth://totp/LGothStore:${encodeURIComponent(username)}?secret=${secret}&issuer=LGothStore&algorithm=SHA1&digits=${totp.TOTP_DIGITS}&period=30`;

    res.json({
      success: true,
      secret,
      otpauthUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
    });
  } catch (err) {
    console.error('MFA setup error:', err);
    res.status(500).json({ success: false, message: 'Error al configurar MFA' });
  }
}

async function verifyMFA(req, res) {
  try {
    const { token, tempToken } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Código MFA requerido' });
    }

    let username;
    if (tempToken) {
      try {
        const decoded = jwt.verifyAccessToken(tempToken);
        username = decoded.username;
      } catch (e) {
        return res.status(403).json({ success: false, message: 'Token temporal inválido o expirado' });
      }
    } else if (req.user) {
      username = req.user.username;
    } else {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const secret = tracker.getMFASecret(username);
    if (!secret) {
      return res.status(400).json({ success: false, message: 'MFA no configurado para este usuario' });
    }

    const isValid = totp.verifyTOTP(token, secret);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Código MFA inválido' });
    }

    tracker.setMFAEnabled(username, true);

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    tracker.recordSuccessfulAttempt(username, ip);

    const family = tracker.createRefreshTokenFamily(username);
    const tokens = jwt.generateTokens(username, req, family);
    jwt.setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      success: true,
      token: tokens.accessToken,
      username,
      mfaEnabled: true,
    });
  } catch (err) {
    console.error('MFA verify error:', err);
    res.status(500).json({ success: false, message: 'Error al verificar MFA' });
  }
}

async function disableMFA(req, res) {
  try {
    const username = req.user && req.user.username;
    if (!username) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    tracker.setMFAEnabled(username, false);
    res.json({ success: true, message: 'MFA deshabilitado' });
  } catch (err) {
    console.error('MFA disable error:', err);
    res.status(500).json({ success: false, message: 'Error al deshabilitar MFA' });
  }
}

async function checkAuthStatus(req, res) {
  const username = req.user && req.user.username;
  res.json({
    authenticated: true,
    username,
    mfaEnabled: username ? tracker.isMFAEnabled(username) : false,
  });
}

module.exports = {
  login,
  refreshToken,
  logout,
  verifyToken,
  setupMFA,
  verifyMFA,
  disableMFA,
  checkAuthStatus,
};
