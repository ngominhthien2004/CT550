const rateLimit = require('express-rate-limit');

const getEnvInt = (key, defaultVal) => {
  const v = process.env[key];
  return v ? parseInt(v, 10) : defaultVal;
};

// 1. Global catch-all: 200 req/min/IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: getEnvInt('RATE_LIMIT_GLOBAL_MAX', 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// 2. Auth (login/register): 10 req/15min/IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getEnvInt('RATE_LIMIT_AUTH_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: false,
});

// 3. AI endpoints: 20 req/min/IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: getEnvInt('RATE_LIMIT_AI_MAX', 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please slow down.' },
});

// 4. Upload: 10 req/15min/IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getEnvInt('RATE_LIMIT_UPLOAD_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads, please try again later.' },
});

// 5. General API: 100 req/min/IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: getEnvInt('RATE_LIMIT_GENERAL_MAX', 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// 6. Password change: 5 req/hour/IP — protects the change-password
// route from brute-force / credential-stuffing attempts without
// blocking legitimate users who occasionally retype wrong.
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: getEnvInt('RATE_LIMIT_PASSWORD_CHANGE_MAX', 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password change attempts, please try again later.' },
});

module.exports = {
  globalLimiter, authLimiter, aiLimiter,
  uploadLimiter, generalLimiter, passwordChangeLimiter,
};
