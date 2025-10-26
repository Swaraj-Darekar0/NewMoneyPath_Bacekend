const paymentService = require('../services/payment.service');
const { ValidationError } = require('../utils/errors');

const createOrder = async (req, res, next) => {
  try {
    const { amount } = req.validatedBody; // amount in paise
    const order = await paymentService.createPaymentOrder(req.user.id, amount);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      throw new ValidationError('Webhook signature missing.');
    }

    const result = await paymentService.verifyPaymentWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    // Respond with 200 even on error to prevent Razorpay from retrying indefinitely
    res.status(200).json({ status: 'error', message: error.message });
  }
};

const getPremiumStatus = async (req, res, next) => {
  try {
    const status = await paymentService.checkAndExpirePremium(req.user.id);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  handleWebhook,
  getPremiumStatus,
};
