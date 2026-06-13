/**
 * Auth Routes
 * POST /api/auth/register  — Register new voter
 * POST /api/auth/login     — Login and get JWT
 * POST /api/auth/refresh   — Refresh JWT token
 * GET  /api/auth/me        — Get current user
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

// ── Public Routes ────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

// ── Protected Routes ─────────────────────────────────────
router.get('/me', authenticate, authController.getMe);

router.post('/refresh', authController.refresh);

module.exports = router;
