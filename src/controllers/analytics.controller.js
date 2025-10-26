
const analyticsService = require('../services/analytics.service');

const getUserAnalytics = async (req, res, next) => {
  try {
    const { id: userId } = req.user; // Correctly get user ID
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: { message: 'startDate and endDate query parameters are required.' } });
    }
    const analytics = await analyticsService.getUserAnalytics(userId, { startDate, endDate });
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

const exportData = async (req, res, next) => {
  try {
    const { id: userId } = req.user; // Correctly get user ID
    const { format } = req.query;
    const { data, contentType, fileName } = await analyticsService.exportUserData(userId, format);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserAnalytics,
  exportData,
};
