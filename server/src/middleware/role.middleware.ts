// @ts-nocheck
/**
 * Role-Based Access Control Middleware
 * Restricts route access to specified roles.
 */

import ApiError from '../utils/ApiError';

/**
 * Authorize only users with one of the specified roles.
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'voter')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/elections', authenticate, authorize('admin'), controller);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

export {  };

