const express = require('express');
const privacyController = require('../controllers/privacy.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);

router.delete(
  '/delete-data',
  authRateLimiter(1, 60 * 24), // 1 request per day (1440 minutes)
  privacyController.deleteUserData
);

router.get(
  '/settings',
  privacyController.getPrivacySettings
);

router.put(
  '/settings',
  privacyController.updatePrivacySettings
);

module.exports = router;