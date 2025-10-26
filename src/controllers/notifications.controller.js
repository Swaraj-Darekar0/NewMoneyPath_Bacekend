const notificationsService = require('../services/notifications.service');

const getDailySummary = async (req, res, next) => {
  try {
    const summary = await notificationsService.getDailySummaryForNotifications(req.user.id);
    if (!summary) {
      return res.status(404).json({ message: 'User not found or no summary available.' });
    }
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailySummary,
};
