const userModel = require('../models/user.model');
const missionModel = require('../models/mission.model');
const transactionModel = require('../models/transaction.model');
const disciplineService = require('./discipline.service');
const dateUtils = require('../utils/dates');

const calculateAlertLevel = (spendToday, targetToday) => {
  const spend = parseInt(spendToday, 10) || 0;
  const target = parseInt(targetToday, 10) || 0;

  if (target === 0) return 'ok'; // Avoid division by zero

  if (spend >= target) return 'critical';
  if (spend >= (target * 0.8)) return 'warning';
  if (spend >= (target * 0.5)) return 'warning';
  return 'ok';
};

const getDailySummaryForNotifications = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) return null;

  // Ensure numeric values
  const todaysSavingTarget = parseInt(user.todays_saving_target, 10) || 0;
  const bufferStatus = parseInt(user.buffer_status, 10) || 0;
  const spendToday = parseInt(user.spend_today, 10) || 0;
  const gainToday = parseInt(user.gain_today, 10) || 0;

  const activeMissions = await missionModel.findByUserId(userId, { status: 'active' });
  const todaysTransactions = await transactionModel.getTodaysTransactions(userId, user.timezone);

  // Morning Command Data
  const morningData = {
    target: todaysSavingTarget,
    buffer: bufferStatus,
    mission_count: activeMissions.length,
    top_mission: activeMissions.length > 0 ? activeMissions[0] : null, // Simplified: just the first one
  };

  // Midday Reminder Data
  const percentageSpent = todaysSavingTarget > 0 ? ((spendToday / todaysSavingTarget) * 100).toFixed(2) : '0.00';
  const bufferRemaining = bufferStatus - spendToday;
  const alertLevel = calculateAlertLevel(spendToday, todaysSavingTarget);

  const middayData = {
    spent: spendToday,
    target: todaysSavingTarget,
    percentage: parseFloat(percentageSpent),
    remaining: bufferRemaining,
    alert_level: alertLevel,
  };

  // Evening Review Data
  const performanceStatus = gainToday > 0 ? 'ahead' : (gainToday < 0 ? 'behind' : 'on_track');
  // TODO: Implement logic for impacted_missions if deficit

  const eveningData = {
    gain: gainToday,
    spent: spendToday,
    target: todaysSavingTarget,
    status: performanceStatus,
    impacted_missions: [], // Placeholder
  };

  return {
    morning: morningData,
    midday: middayData,
    evening: eveningData,
  };
};

module.exports = {
  getDailySummaryForNotifications,
};
