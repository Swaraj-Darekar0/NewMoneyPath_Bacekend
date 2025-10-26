const express = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const missionRoutes = require('./missions.routes');
const transactionRoutes = require('./transactions.routes');
const notificationRoutes = require('./notifications.routes');
const paymentRoutes = require('./payments.routes');
const analyticsRoutes = require('./analytics.routes');
const privacyRoutes = require('./privacy.routes');
const cronRoutes = require('./cron.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/missions', missionRoutes);
router.use('/transactions', transactionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/privacy', privacyRoutes);
router.use('/cron', cronRoutes);

module.exports = router;
