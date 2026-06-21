// @ts-nocheck
/**
 * User Routes
 * GET   /api/users/profile    — Get own profile
 * PATCH /api/users/profile    — Update own profile
 * GET   /api/users            — List all users (admin)
 * PATCH /api/users/:id/role   — Change user role (admin)
 * DELETE /api/users/:id       — Delete user (admin)
 */

import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { ROLES } from '../utils/constants';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ── Self-service Routes ──────────────────────────────────
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

// ── Admin Routes ─────────────────────────────────────────
router.get('/', authorize(ROLES.ADMIN), userController.getAllUsers);
router.patch('/:id/role', authorize(ROLES.ADMIN), userController.changeRole);
router.delete('/:id', authorize(ROLES.ADMIN), userController.deleteUser);

export default router;

