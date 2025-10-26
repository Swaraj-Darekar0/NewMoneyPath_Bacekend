const express = require('express');
const transactionsController = require('../controllers/transactions.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validate, syncTransactionsSchema, manualTransactionSchema } = require('../utils/validation');

const router = express.Router();

// All transaction routes require authentication
router.use(authenticate);

router.post(
  '/sync',
  authRateLimiter(50, 60 * 60), // 50 requests per hour
  validate(syncTransactionsSchema),
  transactionsController.syncTransactions
);

router.get(
  '/history',
  transactionsController.getTransactionHistory
);

router.get(
  '/today',
  transactionsController.getTodaysSummary
);

router.post(
  '/manual',
  authRateLimiter(100, 60 * 60), // 100 requests per hour
  validate(manualTransactionSchema),
  transactionsController.manualEntry
);

module.exports = router;
