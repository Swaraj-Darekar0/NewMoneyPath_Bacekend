const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate, signupSchema, loginSchema } = require('../utils/validation');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /auth/signup
router.post(
  '/signup',
  authRateLimiter(5, 60), // 5 requests per hour
  validate(signupSchema),
  authController.signup
);

// POST /auth/login
router.post(
  '/login',
  authRateLimiter(10, 60), // 10 requests per hour
  validate(loginSchema),
  authController.login
);

// POST /auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /auth/refresh
router.post(
  '/refresh',
  authRateLimiter(20, 60), // 20 requests per hour
  authController.refreshToken
);

// GET /auth/profile
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
