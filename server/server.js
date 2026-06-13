/**
 * Server Entry Point
 * Connects to MongoDB and starts the Express server.
 */

const { connectDB, config } = require('./src/config');
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = config.port;

// ── Bootstrap ──────────────────────────────────────────
async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api`);
    });

    // ── Graceful Shutdown ────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ── Unhandled Errors ─────────────────────────────────
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION:', err);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
