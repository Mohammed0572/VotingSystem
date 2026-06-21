// @ts-nocheck
/**
 * Request Validation Middleware
 * Uses Joi schemas to validate request body, params, and query.
 */

import ApiError from '../utils/ApiError';

/**
 * Validate request against a Joi schema.
 *
 * @param {Object} schema - Object with optional keys: body, params, query
 * @returns {Function} Express middleware
 *
 * @example
 * import { registerSchema } from '../validators/auth.validator';
 * router.post('/register', validate(registerSchema), controller);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each part of the request
    ['body', 'params', 'query'].forEach((key) => {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const messages = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message.replace(/['"]/g, ''),
          }));
          errors.push(...messages);
        } else {
          // Replace request data with validated (and sanitized) values
          req[key] = value;
        }
      }
    });

    if (errors.length > 0) {
      const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      return next(ApiError.badRequest(`Validation failed — ${errorMessage}`));
    }

    next();
  };
};

export {  };

