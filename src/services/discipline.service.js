const userModel = require('../models/user.model');
const missionModel = require('../models/mission.model');
const transactionModel = require('../models/transaction.model');
const dateUtils = require('../utils/dates');

const calculateBaselineFinancials = (userData) => {
  const dailyExpenses = parseInt(userData.daily_expenses, 10) || 0;
  const monthlyIncome = parseInt(userData.average_monthly_income, 10) || 0;

  if (!monthlyIncome) return { todays_saving_target: 0, buffer_status: 0, total_available: 0 };

  const baseline_daily_income = Math.floor(monthlyIncome / 30);
  const ratio = baseline_daily_income > 0 ? dailyExpenses / baseline_daily_income : 1;

  let saving_ratio;
  if (ratio > 0.9) { saving_ratio = 0.05; }
  else if (ratio >= 0.7) { saving_ratio = 0.10; }
  else if (ratio >= 0.5) { saving_ratio = 0.15; }
  else { saving_ratio = 0.20; }

  const todays_saving_target = Math.floor(baseline_daily_income * saving_ratio);
  const buffer_status = baseline_daily_income - todays_saving_target;
  const total_available = buffer_status;

  return {
    todays_saving_target,
    buffer_status,
    total_available,
  };
};

const recalculateDailyTargets = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error('User not found');

  const activeMissions = await missionModel.findByUserId(userId, { status: 'active' });
  const todaysSpending = await transactionModel.getTodaysSpending(userId, user.timezone);
  const todaysIncome = await transactionModel.getTodaysIncome(userId, user.timezone);

  const baseline_daily_income = Math.floor(parseInt(user.average_monthly_income, 10) / 30);
  const baseline_saving_target = calculateBaselineFinancials(user).todays_saving_target;

  const total_mission_daily_target = activeMissions.reduce((sum, mission) => sum + parseInt(mission.daily_target, 10), 0);

  const todays_saving_target = Math.max(baseline_saving_target, total_mission_daily_target);

  const actual_available = todaysIncome - todaysSpending;
  const gain_today = actual_available - todays_saving_target;

  const buffer_status = baseline_daily_income - todaysSpending;
  const total_available = buffer_status + gain_today;

  // TODO: Handle deficit recovery and surplus rewards

  const updatedFields = {
    todays_saving_target,
    gain_today,
    spend_today: todaysSpending,
    buffer_status,
    total_available,
    last_discipline_update: new Date(),
  };

  return userModel.update(userId, updatedFields);
};

const handleNewTransaction = async (userId, transaction) => {
  const user = await userModel.findById(userId);
  if (!user) return;

  let spend_today = parseInt(user.spend_today, 10) || 0;
  let gain_today = parseInt(user.gain_today, 10) || 0;

  if (transaction.type === 'expense') {
    spend_today += parseInt(transaction.amount, 10);
  } else if (transaction.type === 'income') {
    gain_today += parseInt(transaction.amount, 10);
  }

  const baseline_daily_income = Math.floor(parseInt(user.average_monthly_income, 10) / 30);
  const buffer_status = baseline_daily_income - spend_today;
  const total_available = buffer_status + (gain_today - (parseInt(user.todays_saving_target, 10) || 0));

  const updatedFields = { spend_today, gain_today, buffer_status, total_available };
  await userModel.update(userId, updatedFields);

  // TODO: Check for overspend alert
};

const handleMissionChange = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) return;

  const activeMissions = await missionModel.findByUserId(userId, { status: 'active' });
  const baseline_saving_target = calculateBaselineFinancials(user).todays_saving_target;
  const total_mission_daily_target = activeMissions.reduce((sum, mission) => sum + parseInt(mission.daily_target, 10), 0);

  const todays_saving_target = Math.max(baseline_saving_target, total_mission_daily_target);
  const baseline_daily_income = Math.floor(parseInt(user.average_monthly_income, 10) / 30);
  const buffer_status = baseline_daily_income - todays_saving_target;
  const total_available = buffer_status;

  await userModel.update(userId, { todays_saving_target, buffer_status, total_available });
};

module.exports = {
  calculateBaselineFinancials,
  recalculateDailyTargets,
  handleNewTransaction,
  handleMissionChange,
};