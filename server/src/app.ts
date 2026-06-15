// @ts-nocheck
/**
 * Express Application Setup
 * Configures middleware, routes, and error handling.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { config } from './config';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import routes from './routes';

const app = express();

// Trust reverse proxy for rate limiting and security middleware to work correctly
app.set('trust proxy', 1);

// ── Security Headers ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://127.0.0.1:8000", "http://localhost:5000", "http://localhost:7545", "ws://localhost:*", "wss://localhost:*"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()"
  );
  next();
});

// ── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL Injection Prevention ───────────────────────────
app.use(mongoSanitize());

// ── HTTP Request Logging ─────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate Limiting ────────────────────────────────────────
app.use(globalLimiter);

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Voting System API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

export default app;

