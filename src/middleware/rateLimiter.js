const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

// General rate limiter for most API endpoints
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next) => {
    next(new RateLimitError('Too many requests.', { ip: req.ip }));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Specific rate limiter for authentication endpoints (e.g., login, signup)
const authRateLimiter = (maxRequests, minutes) => rateLimit({
  windowMs: minutes * 60 * 1000, // Convert minutes to milliseconds
  max: maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  headers: true,
});

module.exports = {
  generalRateLimiter,
  authRateLimiter,
};
