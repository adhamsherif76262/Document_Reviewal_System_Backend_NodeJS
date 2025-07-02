// // utils/logger.js
// const { createLogger, format, transports } = require('winston');
// const path = require('path');

// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
//   ),
//   transports: [
//     new transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),  
//     new transports.File({ filename: path.join('logs', 'combined.log') }),
//   ],
// });

// // In development, log to console as well
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new transports.Console({
//     format: format.simple(),
//   }));
// }

// module.exports = logger;


// utils/logger.js

const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}


const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const isProduction = process.env.NODE_ENV === 'production';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // 🔴 Rotated error logs (kept for 30 days, compressed)
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',      // 🔄 Keep logs for 30 days
      zippedArchive: true,  // 🗜 Compress old logs
    }),

    // 🔵 Rotated combined logs (kept for 30 days, compressed)
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',      // 🔄 Keep logs for 30 days
      zippedArchive: true,
    }),
  ],
});

// 🖥 Console logging in development
if (!isProduction) {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
