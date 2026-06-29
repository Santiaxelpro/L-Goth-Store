const crypto = require('crypto');
const config = require('../config/auth');

function generateTokenFingerprint(req) {
  const components = [
    req.ip || '',
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['sec-ch-ua'] || '',
  ];
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

module.exports = { generateTokenFingerprint };
