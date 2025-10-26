const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.get(
  '/user',
  analyticsController.getUserAnalytics
);

router.get(
  '/export',
  authRateLimiter(5, 60 * 60), // 5 requests per hour
  analyticsController.exportData
);

module.exports = router;