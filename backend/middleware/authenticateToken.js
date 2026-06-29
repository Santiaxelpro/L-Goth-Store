const jwt = require('../config/jwt');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verifyAccessToken(token);
    if (decoded.type !== 'access') {
      return res.status(403).json({ success: false, message: 'Tipo de token inválido' });
    }

    const currentFingerprint = jwt.generateTokenFingerprint(req);
    if (decoded.fingerprint !== currentFingerprint) {
      return res.status(403).json({ success: false, message: 'Token no válido para este dispositivo' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado', expired: true });
    }
    return res.status(403).json({ success: false, message: 'Token inválido' });
  }
}

module.exports = { authenticateToken };
