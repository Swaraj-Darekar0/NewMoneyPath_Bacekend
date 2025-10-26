const express = require('express');
const paymentsController = require('../controllers/payments.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validate, createOrderSchema } = require('../utils/validation');

const router = express.Router();

// Route for creating a Razorpay order
router.post(
  '/order',
  authenticate,
  authRateLimiter(10, 60 * 60), // 10 requests per hour
  validate(createOrderSchema),
  paymentsController.createOrder
);

// Route for Razorpay webhooks (does not require authentication)
router.post(
  '/webhook',
  express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), // Raw body needed for signature verification
  paymentsController.handleWebhook
);

// Route to get user's premium status
router.get(
  '/status',
  authenticate,
  paymentsController.getPremiumStatus
);

module.exports = router;
