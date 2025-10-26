const transactionModel = require('../models/transaction.model');
const missionModel = require('../models/mission.model');
const userModel = require('../models/user.model');
const paymentModel = require('../models/payment.model');
const dateUtils = require('../utils/dates');

const getUserAnalytics = async (userId, dateRange) => {
  const { startDate, endDate } = dateRange;

  // 1. Daily Stats
  const transactions = await transactionModel.getTransactionsByDateRange(userId, startDate, endDate);
  const total_income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseInt(t.amount, 10), 0);
  const total_spending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseInt(t.amount, 10), 0);
  const net_savings = total_income - total_spending;
  const numberOfDays = dateUtils.calculateDaysSince(startDate, endDate) + 1;
  const average_daily_spending = numberOfDays > 0 ? Math.floor(total_spending / numberOfDays) : 0;
  const average_daily_income = numberOfDays > 0 ? Math.floor(total_income / numberOfDays) : 0;

  // 2. Category Breakdown
  const spendingByCategory = transactions
    .filter(t => t.type === 'expense' && t.category)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseInt(t.amount, 10);
      return acc;
    }, {});
  const category_breakdown = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total_spending > 0 ? ((amount / total_spending) * 100).toFixed(2) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Mission Progress
  const allMissions = await missionModel.findByUserId(userId);
  const total_missions_active = allMissions.filter(m => m.status === 'active').length;
  const total_missions_completed = allMissions.filter(m => m.status === 'completed').length;
  const total_amount_saved_in_missions = allMissions.reduce((sum, m) => sum + parseInt(m.amount_saved, 10), 0);
  const totalMissions = total_missions_active + total_missions_completed;
  const completion_rate = totalMissions > 0 ? ((total_missions_completed / totalMissions) * 100).toFixed(2) : 0;

  // 4. Trends (simplified for now, requires fetching previous period data)
  const trends = {
    spending_trend: 0,
    savings_trend: 0,
  };

  return {
    daily_stats: {
      total_income,
      total_spending,
      net_savings,
      average_daily_spending,
      average_daily_income,
    },
    category_breakdown,
    mission_progress: {
      active: total_missions_active,
      completed: total_missions_completed,
      total_saved: total_amount_saved_in_missions,
      completion_rate: parseFloat(completion_rate),
    },
    trends,
  };
};

const getTransactionHistoryPaginated = async (userId, page = 1, limit = 50, filters) => {
  const offset = (page - 1) * limit;

  // This requires a new model function to get a count of transactions with filters
  // and another to fetch with limit and offset.
  // For now, we will simulate this.

  const allTransactions = await transactionModel.findByUserId(userId, filters);
  const total_count = allTransactions.length;
  const total_pages = Math.ceil(total_count / limit);
  const transactions = allTransactions.slice(offset, offset + limit);

  return {
    transactions,
    pagination: {
      current_page: page,
      total_pages,
      total_count,
      has_next: page < total_pages,
      has_previous: page > 1,
    },
  };
};

const exportUserData = async (userId, format = 'json') => {
  const user = await userModel.findById(userId);
  const missions = await missionModel.findByUserId(userId);
  const transactions = await transactionModel.findByUserId(userId);
  const payments = await paymentModel.findByUserId(userId);

  const data = {
    user,
    missions,
    transactions,
    payments,
  };

  if (format === 'json') {
    return {
      data: JSON.stringify(data, null, 2),
      contentType: 'application/json',
      fileName: `moneypath_export_${userId}.json`,
    };
  } else if (format === 'csv') {
    if (transactions.length === 0) {
      return { data: '', contentType: 'text/csv', fileName: `moneypath_transactions_${userId}.csv` };
    }
    const headers = Object.keys(transactions[0]).join(',');
    const rows = transactions.map(tx => Object.values(tx).join(','));
    return {
      data: [headers, ...rows].join('\n'),
      contentType: 'text/csv',
      fileName: `moneypath_transactions_${userId}.csv`,
    };
  }

  throw new Error('Unsupported format');
};

const deleteAllUserData = async (userId) => {
  // This is a destructive operation. In a real app, this would likely be a soft delete
  // or a more complex archival process.

  // 1. Soft delete the user
  await userModel.softDelete(userId);

  // 2. Anonymize related data (as per guide)
  // For simplicity, we will delete missions and transactions, and anonymize payments.
  const missions = await missionModel.findByUserId(userId);
  for (const mission of missions) {
    await missionModel.delete(mission.id);
  }

  const transactions = await transactionModel.findByUserId(userId);
  for (const transaction of transactions) {
    await transactionModel.deleteById(transaction.id);
  }

  const payments = await paymentModel.findByUserId(userId);
  for (const payment of payments) {
    await paymentModel.update(payment.id, { user_id: null });
  }

  // 3. Log deletion
  await auditLogModel.create({
    user_id: userId,
    action: 'user_data_deleted',
    entity_type: 'user',
    entity_id: userId,
  });

  return { message: 'User data has been deleted or anonymized.' };
};

const updatePrivacySettings = async (userId, settings) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const updatedUser = await userModel.update(userId, settings);

  await auditLogModel.create({
    user_id: userId,
    action: 'privacy_settings_updated',
    entity_type: 'user',
    entity_id: userId,
    old_values: { enable_analytics: user.enable_analytics, enable_transaction_tracking: user.enable_transaction_tracking, data_retention_period: user.data_retention_period },
    new_values: { enable_analytics: updatedUser.enable_analytics, enable_transaction_tracking: updatedUser.enable_transaction_tracking, data_retention_period: updatedUser.data_retention_period },
  });

  return updatedUser;
};

const getPrivacySettings = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  return {
    enable_analytics: user.enable_analytics,
    enable_transaction_tracking: user.enable_transaction_tracking,
    data_retention_period: user.data_retention_period,
  };
};

module.exports = {
  getUserAnalytics,
  getTransactionHistoryPaginated,
  exportUserData,
  deleteAllUserData,
  updatePrivacySettings,
  getPrivacySettings,
};