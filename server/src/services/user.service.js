/**
 * User Service
 * Business logic for user profile and admin user management.
 */

const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { PAGINATION_DEFAULTS } = require('../utils/constants');

class UserService {
  /**
   * Get user profile by ID.
   * @param {string} userId
   * @returns {Object} user
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Update user profile (own account).
   * @param {string} userId
   * @param {Object} updateData - { name }
   * @returns {Object} updated user
   */
  async updateProfile(userId, updateData) {
    // Only allow updating specific fields
    const allowedFields = ['name'];
    const sanitizedUpdate = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        sanitizedUpdate[field] = updateData[field];
      }
    });

    if (Object.keys(sanitizedUpdate).length === 0) {
      throw ApiError.badRequest('No valid fields to update.');
    }

    const user = await User.findByIdAndUpdate(userId, sanitizedUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Get all users with pagination (admin only).
   * @param {Object} query - { page, limit, role }
   * @returns {Object} { users, total, page, pages }
   */
  async getAllUsers({ page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT, role } = {}) {
    const filter = {};
    if (role) filter.role = role;

    const safeLimit = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Change a user's role (admin only).
   * @param {string} userId
   * @param {string} newRole
   * @returns {Object} updated user
   */
  async changeUserRole(userId, newRole) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.role === newRole) {
      throw ApiError.badRequest(`User already has the role '${newRole}'.`);
    }

    user.role = newRole;
    await user.save();

    return user;
  }

  /**
   * Delete a user (admin only).
   * @param {string} userId
   * @param {string} requestingUserId - The admin performing the deletion
   */
  async deleteUser(userId, requestingUserId) {
    if (userId === requestingUserId) {
      throw ApiError.badRequest('You cannot delete your own account.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    await User.findByIdAndDelete(userId);
  }
}

module.exports = new UserService();
