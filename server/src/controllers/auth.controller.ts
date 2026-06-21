// @ts-nocheck
/**
 * Auth Controller
 * Handles HTTP layer for authentication endpoints.
 */

import authService from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new voter account.
   */
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);

      ApiResponse.created({ user, token }, 'Registration successful').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT.
   */
  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);

      ApiResponse.ok({ user, token }, 'Login successful').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user.
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);

      ApiResponse.ok({ user }, 'User retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token.
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { user, token } = await authService.refreshToken(refreshToken);

      ApiResponse.ok({ user, token }, 'Token refreshed successfully').send(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

