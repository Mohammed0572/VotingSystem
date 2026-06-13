/**
 * Environment Configuration
 * Loads and validates all environment variables.
 */

require('dotenv').config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 min
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Blockchain
  blockchainEnabled: process.env.BLOCKCHAIN_ENABLED === 'true',
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:7545',
};

// ── Validation ─────────────────────────────────────────
const requiredInProduction = ['JWT_SECRET', 'MONGODB_URI'];

if (config.nodeEnv === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.jwtSecret === 'fallback-secret-do-not-use-in-production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

module.exports = config;
