const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const { generateTokenFingerprint } = require('../config/tokenFingerprint');

function generateAccessToken(username, fingerprint) {
  return jwt.sign(
    { username, fingerprint, type: 'access' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES }
  );
}

function generateRefreshToken(username, fingerprint, family) {
  return jwt.sign(
    { username, fingerprint, type: 'refresh', family },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

function setRefreshTokenCookie(res, token) {
  res.cookie(config.TOKEN_COOKIE_NAME, token, config.TOKEN_COOKIE_OPTIONS);
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(config.TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
  });
}

function generateTokens(username, req, family) {
  const fingerprint = generateTokenFingerprint(req);
  const accessToken = generateAccessToken(username, fingerprint);
  const refreshToken = generateRefreshToken(username, fingerprint, family);
  return { accessToken, refreshToken, fingerprint };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  generateTokens,
  generateTokenFingerprint,
};
