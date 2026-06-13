/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized JSON responses.
 * Never leaks stack traces in production.
 */

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * 404 Not Found handler — for unmatched routes.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Global error handler.
 * Must have 4 arguments to be recognized by Express as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // ── Mongoose: Bad ObjectId ─────────────────────────
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose: Duplicate Key ────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = ApiError.conflict(`Duplicate value for field: ${field}. Please use another value.`);
  }

  // ── Mongoose: Validation Error ─────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest(`Validation error: ${messages.join('; ')}`);
  }

  // ── JWT Errors ─────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token.');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired.');
  }

  // ── Defaults ───────────────────────────────────────
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // ── Logging ────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      stack: err.stack,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      method: req.method,
      url: req.originalUrl,
    });
  }

  // ── Response ───────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler, notFoundHandler };
