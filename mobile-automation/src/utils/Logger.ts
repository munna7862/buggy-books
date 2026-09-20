import winston from 'winston';
import path from 'path';

/**
 * Sanitizes sensitive credentials, tokens, and payment data from log strings
 */
function sanitizeMessage(message: string): string {
  return message
    // Mask Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_JWT]')
    // Mask passwords in key-value pairs or JSON
    .replace(/(password|pwd|pass)["']?\s*[:=]\s*["']?([^"',\s]+)["']?/gi, '$1="[REDACTED_PASSWORD]"')
    // Mask credit card numbers (13-19 digits)
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]');
}

const sanitizeFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = sanitizeMessage(info.message);
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  sanitizeFormat(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  })
);

export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'mobile-automation.log'),
      level: 'debug',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});
