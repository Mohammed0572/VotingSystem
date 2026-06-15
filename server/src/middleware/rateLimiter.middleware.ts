// @ts-nocheck
/**
 * Rate Limiting Middleware
 * Protects against brute-force and DDoS attacks.
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Global rate limiter — applies to all routes.
 * Default: 100 requests per 15 minutes.
 */
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict limiter for auth endpoints (login/register).
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

export { globalLimiter, authLimiter };

