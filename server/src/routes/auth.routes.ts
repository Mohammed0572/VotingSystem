// @ts-nocheck
/**
 * Auth Routes
 * POST /api/auth/register  — Register new voter
 * POST /api/auth/login     — Login and get JWT
 * POST /api/auth/refresh   — Refresh JWT token
 * GET  /api/auth/me        — Get current user
 */

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

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

router.post('/refresh', authLimiter, authController.refresh);

export default router;

