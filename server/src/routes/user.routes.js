/**
 * User Routes
 * GET   /api/users/profile    — Get own profile
 * PATCH /api/users/profile    — Update own profile
 * GET   /api/users            — List all users (admin)
 * PATCH /api/users/:id/role   — Change user role (admin)
 * DELETE /api/users/:id       — Delete user (admin)
 */

const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

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

module.exports = router;
