/**
 * Config Barrel Export
 */

const config = require('./env');
const connectDB = require('./db');

module.exports = { config, connectDB };
