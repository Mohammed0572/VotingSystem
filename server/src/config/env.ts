/**
 * Environment Configuration
 * Loads and validates all environment variables.
 */

import dotenv from 'dotenv';
import { cleanEnv, str, port, num, bool } from 'envalid';

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 5000 }),
  MONGODB_URI: str({ default: 'mongodb://localhost:27017/voting_system' }),
  JWT_SECRET: str({ default: 'fallback-secret-do-not-use-in-production' }),
  JWT_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  CORS_ORIGIN: str({ default: 'http://localhost:8080' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
  BLOCKCHAIN_ENABLED: bool({ default: false }),
  BLOCKCHAIN_RPC_URL: str({ default: 'http://localhost:7545' }),
});

const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,

  // MongoDB
  mongodbUri: env.MONGODB_URI,

  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,

  // CORS
  corsOrigin: env.CORS_ORIGIN,

  // Rate Limiting
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: env.RATE_LIMIT_MAX,

  // Blockchain
  blockchainEnabled: env.BLOCKCHAIN_ENABLED,
  blockchainRpcUrl: env.BLOCKCHAIN_RPC_URL,
};

if (config.nodeEnv === 'production' && config.jwtSecret === 'fallback-secret-do-not-use-in-production') {
  throw new Error('JWT_SECRET must be securely set in production.');
}

export default config;
