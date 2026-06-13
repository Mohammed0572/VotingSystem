/**
 * Auth Validation Schemas
 */

const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string().min(8).max(128).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required',
      }),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
};
