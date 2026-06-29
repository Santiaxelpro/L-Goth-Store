const crypto = require('crypto');

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies && req.cookies['csrf_token'];
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken) {
    if (req.path === '/auth/refresh') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'CSRF token requerido' });
  }

  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({ success: false, message: 'CSRF token inválido' });
  }

  next();
}

function csrfTokenRoute(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ csrfToken: token });
}

module.exports = { csrfProtection, csrfTokenRoute };
