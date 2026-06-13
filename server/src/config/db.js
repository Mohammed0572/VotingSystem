/**
 * Database Connection
 * Connects to MongoDB with fallback to in-memory server for development.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

let mongoServer = null;

async function connectDB() {
  try {
    let uri = config.mongodbUri;

    // In development, fall back to in-memory MongoDB if connection fails
    if (config.nodeEnv === 'development') {
      try {
        // Try connecting to the configured URI first
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        logger.info(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      } catch {
        // Fall back to in-memory MongoDB
        logger.warn('⚠️  Local MongoDB not available. Starting in-memory database...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        await mongoose.connect(uri);
        logger.info(`✅ In-memory MongoDB started: ${uri}`);
        logger.info('💡 Data will NOT persist after server restart. Use MongoDB Atlas for persistence.');
      }
    } else {
      // In production, fail fast if MongoDB is unavailable
      await mongoose.connect(uri);
      logger.info(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    }

    // ── Connection Events ──────────────────────────────
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected.');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = connectDB;
