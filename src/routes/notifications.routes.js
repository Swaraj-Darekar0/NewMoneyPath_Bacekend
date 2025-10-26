const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

router.get(
  '/daily-summary',
  authRateLimiter(20, 60 * 60), // 20 requests per hour
  notificationsController.getDailySummary
);

module.exports = router;
