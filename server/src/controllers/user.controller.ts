// @ts-nocheck
/**
 * User Controller
 * Handles HTTP layer for user profile and admin management endpoints.
 */

import userService from '../services/user.service';
import ApiResponse from '../utils/ApiResponse';

class UserController {
  /**
   * GET /api/users/profile
   * Get current user's profile.
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user._id);

      ApiResponse.ok({ user }, 'Profile retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/profile
   * Update current user's profile.
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user._id, req.body);

      ApiResponse.ok({ user }, 'Profile updated successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users
   * Get all users (admin only).
   */
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role } = req.query;
      const result = await userService.getAllUsers({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        role,
      });

      ApiResponse.ok(result, 'Users retrieved successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/role
   * Change a user's role (admin only).
   */
  async changeRole(req, res, next) {
    try {
      const user = await userService.changeUserRole(req.params.id, req.body.role);

      ApiResponse.ok({ user }, 'User role updated successfully').send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete a user (admin only).
   */
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user._id);

      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

