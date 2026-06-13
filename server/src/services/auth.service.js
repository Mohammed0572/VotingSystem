/**
 * Auth Service
 * Handles user registration, login, and JWT token management.
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

class AuthService {
  /**
   * Register a new user.
   * @param {Object} userData - { name, email, password }
   * @returns {Object} { user, token }
   */
  async register({ name, email, password }) {
    // Check if email already exists
    const existingUser = await User.findOne({ email: String(email) });
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists.');
    }

    // Create user (password hashed automatically by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Authenticate user with email and password.
   * @param {Object} credentials - { email, password }
   * @returns {Object} { user, token }
   */
  async login({ email, password }) {
    // Find user and explicitly select password field
    const user = await User.findOne({ email: String(email) }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Generate JWT
    const token = this.generateToken(user);

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  /**
   * Get current user by ID.
   * @param {string} userId
   * @returns {Object} user
   */
  async getCurrentUser(userId) {
    const user = await User.findById(String(userId));
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Generate a signed JWT token.
   * @param {Object} user - Mongoose user document
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn,
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Generate a refresh token (longer lived).
   * @param {Object} user
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      config.jwtSecret,
      {
        expiresIn: config.jwtRefreshExpiresIn,
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Refresh access token using a refresh token.
   * @param {string} refreshToken
   * @returns {Object} { user, token }
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtSecret, {
        algorithms: ['HS256'],
      });

      const user = await User.findById(decoded.id);
      if (!user) {
        throw ApiError.unauthorized('User not found.');
      }

      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }
  }
}

module.exports = new AuthService();
