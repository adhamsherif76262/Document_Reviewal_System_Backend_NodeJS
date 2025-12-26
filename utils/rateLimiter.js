const rateLimit = require('express-rate-limit');

// ✅ Default limiter: 10 requests per 15 minutes
exports.defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ More aggressive limiter: 7 attempts per 10 minutes
exports.authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2000,
  message: 'Too many attempts. Please wait 10 minutes and try again.',
  standardHeaders: true,
  legacyHeaders: false,
});
