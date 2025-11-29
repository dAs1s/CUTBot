/**
 * Logger utility using Winston
 * Provides structured logging for the Discord bot
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      // Safe stringify that handles circular references
      log += ` ${safeStringify(meta)}`;
    }
    return log;
  })
);

/**
 * Safe stringify function that handles circular references
 * @param {Object} obj - Object to stringify
 * @param {Set} seen - Set of seen objects to prevent circular references
 * @returns {string} JSON string
 */
function safeStringify(obj, seen = new Set()) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (seen.has(obj)) {
    return '"[Circular]"';
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => safeStringify(item, seen)).join(',') + ']';
  }

  const keys = Object.keys(obj);
  const entries = keys.map(key => {
    try {
      return `"${key}":${safeStringify(obj[key], seen)}`;
    } catch (e) {
      return `"${key}":"[Unserializable]"`;
    }
  });

  return '{' + entries.join(',') + '}';
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
