/**
 * Authentication Middleware
 * Verifies JWT from Authorization header and attaches user to request.
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Protect routes — requires valid JWT.
 * Attaches the full user document to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is missing. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired. Please log in again.');
      }
      if (err.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid token. Please log in again.');
      }
      throw ApiError.unauthorized('Authentication failed.');
    }

    // 3. Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User belonging to this token no longer exists.');
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
