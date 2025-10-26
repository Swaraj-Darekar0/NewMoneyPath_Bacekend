const Razorpay = require('razorpay');
const crypto = require('crypto');
const userModel = require('../models/user.model');
const paymentModel = require('../models/payment.model');
const { NotFoundError, ValidationError, ExternalServiceError } = require('../utils/errors');
const auditLogModel = require('../models/auditLog.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (userId, amount) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  // Check current premium status (optional, but good practice)
  // if (user.is_premium && user.premium_expires_at > new Date()) {
  //   throw new ValidationError('User already has an active premium subscription.');
  // }

  const receiptId = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

  try {
    const order = await razorpay.orders.create({
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: userId,
        purpose: 'premium_subscription',
      },
    });

    await paymentModel.create({
      user_id: userId,
      razorpay_order_id: order.id,
      amount: amount,
      currency: order.currency,
      status: 'created',
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new ExternalServiceError('Failed to create payment order.', { originalError: error.message });
  }
};

const verifyPaymentWebhook = async (webhookBody, signature) => {
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(webhookBody))
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new ValidationError('Invalid webhook signature.');
  }

  const event = webhookBody.event;
  const payload = webhookBody.payload;

  if (event === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const userId = paymentEntity.notes.userId;
    const amount = paymentEntity.amount;

    const paymentRecord = await paymentModel.findByRazorpayOrderId(orderId);
    if (!paymentRecord) {
      console.error(`Payment record not found for order ID: ${orderId}`);
      return { status: 'failed', message: 'Payment record not found.' };
    }

    await paymentModel.updateStatus(paymentRecord.id, 'paid', {
      razorpay_payment_id: paymentId,
      payment_method: paymentEntity.method,
    });

    await activatePremium(userId, 30); // Activate for 30 days

    return { status: 'success', message: 'Payment captured and premium activated.' };
  } else if (event === 'payment.failed') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const paymentRecord = await paymentModel.findByRazorpayOrderId(orderId);
    if (paymentRecord) {
      await paymentModel.updateStatus(paymentRecord.id, 'failed');
    }
    return { status: 'failed', message: 'Payment failed.' };
  }

  return { status: 'ignored', message: 'Unhandled webhook event.' };
};

const activatePremium = async (userId, durationDays = 30) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  let newExpiry = new Date();
  if (user.is_premium && user.premium_expires_at && user.premium_expires_at > newExpiry) {
    newExpiry = new Date(user.premium_expires_at);
  }
  newExpiry.setDate(newExpiry.getDate() + durationDays);

  const updatedUser = await userModel.update(userId, {
    is_premium: true,
    premium_expires_at: newExpiry,
  });

  await auditLogModel.create({
    user_id: userId,
    action: 'premium_activated',
    entity_type: 'user',
    entity_id: userId,
    new_values: { is_premium: true, premium_expires_at: newExpiry },
  });

  return updatedUser;
};

const checkAndExpirePremium = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  if (user.is_premium && user.premium_expires_at && user.premium_expires_at <= new Date()) {
    await userModel.update(userId, { is_premium: false, premium_expires_at: null });
    await auditLogModel.create({
      user_id: userId,
      action: 'premium_expired',
      entity_type: 'user',
      entity_id: userId,
      new_values: { is_premium: false },
    });
    return { expired: true };
  }

  return { expired: false, expires_at: user.premium_expires_at };
};

const initializeTrial = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 10); // 10-day trial

  await userModel.update(userId, {
    is_premium: true,
    trial_started_at: new Date(),
    premium_expires_at: trialExpiry,
  });

  await auditLogModel.create({
    user_id: userId,
    action: 'trial_started',
    entity_type: 'user',
    entity_id: userId,
    new_values: { is_premium: true, premium_expires_at: trialExpiry },
  });
};

module.exports = {
  createPaymentOrder,
  verifyPaymentWebhook,
  activatePremium,
  checkAndExpirePremium,
  initializeTrial,
};
