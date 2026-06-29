const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { bruteForceProtection } = require('../middleware/bruteForceProtection');
const { authenticateToken } = require('../middleware/authenticateToken');
const config = require('../config/auth');

const authLimiter = rateLimit({
  windowMs: config.GLOBAL_AUTH_WINDOW_MS,
  max: config.GLOBAL_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes de autenticación.' },
});

router.use(authLimiter);

router.post('/login', bruteForceProtection, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify', authenticateToken, authController.verifyToken);
router.get('/status', authenticateToken, authController.checkAuthStatus);
router.get('/mfa/setup', authenticateToken, authController.setupMFA);
router.post('/mfa/verify', authController.verifyMFA);
router.post('/mfa/disable', authenticateToken, authController.disableMFA);

module.exports = router;
