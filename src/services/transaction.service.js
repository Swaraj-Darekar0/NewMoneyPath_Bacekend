const transactionModel = require('../models/transaction.model');
const userModel = require('../models/user.model');
const { encrypt } = require('../utils/encryption');
const { AuthorizationError, ValidationError, NotFoundError } = require('../utils/errors');
const disciplineService = require('./discipline.service');
// const dateUtils = require('../utils/dates'); // To be integrated later

const categorizeTransaction = (transaction) => {
  const description = transaction.description ? transaction.description.toLowerCase() : '';
  
  if (description.includes('swiggy') || description.includes('zomato') || description.includes('restaurant') || description.includes('food')) {
    return 'food';
  }
  if (description.includes('uber') || description.includes('ola') || description.includes('petrol') || description.includes('metro') || description.includes('travel')) {
    return 'transport';
  }
  if (description.includes('electricity') || description.includes('phone') || description.includes('internet') || description.includes('rent') || description.includes('bill')) {
    return 'bills';
  }
  if (description.includes('netflix') || description.includes('movie') || description.includes('game') || description.includes('entertainment')) {
    return 'entertainment';
  }
  // Add more categories as needed
  return null; // Uncategorized
};

const processAndCreateTransaction = async (userId, transactionData) => {
  const { amount, type, category, transaction_date, source, source_identifier, metadata } = transactionData;

  const finalCategory = category || categorizeTransaction({ description: metadata?.description || '' });
  const encrypted_metadata = metadata ? encrypt(JSON.stringify(metadata)) : null;

  const newTransaction = await transactionModel.create({
    user_id: userId,
    amount,
    type,
    category: finalCategory,
    transaction_date: new Date(transaction_date),
    source,
    source_identifier,
    encrypted_metadata,
  });

  // Trigger discipline engine update
  disciplineService.handleNewTransaction(userId, newTransaction);

  return newTransaction;
};

const syncTransactionsFromSMS = async (userId, transactions) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  // Guide says premium is required for auto-tracking, but for now, we'll allow it.
  // if (!(await userModel.isPremium(userId))) {
  //   throw new AuthorizationError('Premium subscription required for auto-tracking.');
  // }

  let syncedCount = 0;
  let duplicateCount = 0;

  for (const tx of transactions) {
    try {
      const createdTx = await processAndCreateTransaction(userId, { ...tx, source: 'sms_android' });
      if (createdTx.id === tx.id) { // Assuming tx.id is source_identifier for deduplication check
        duplicateCount++;
      } else {
        syncedCount++;
      }
    } catch (error) {
      // Log error for individual transaction but continue processing others
      console.error('Error syncing SMS transaction:', error);
    }
  }

  // TODO: Calculate today's spending and trigger discipline engine update

  return { synced: syncedCount, duplicates: duplicateCount };
};

const syncTransactionsFromAA = async (userId, transactionsData) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  // TODO: Validate user has AA consent approved

  let syncedCount = 0;
  let duplicateCount = 0;

  for (const tx of transactionsData) {
    try {
      const createdTx = await processAndCreateTransaction(userId, { ...tx, source: 'aa_ios' });
      if (createdTx.id === tx.id) { // Assuming tx.id is source_identifier for deduplication check
        duplicateCount++;
      } else {
        syncedCount++;
      }
    } catch (error) {
      console.error('Error syncing AA transaction:', error);
    }
  }

  // TODO: Trigger discipline engine update

  return { synced: syncedCount, duplicates: duplicateCount };
};

const getTransactionHistory = async (userId, filters) => {
  // TODO: Integrate dateUtils for timezone-aware date filtering
  const transactions = await transactionModel.findByUserId(userId, filters);
  
  // Group by date as per guide
  const groupedTransactions = {};
  transactions.forEach(tx => {
    const date = tx.transaction_date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(tx);
  });

  return groupedTransactions;
};

const getTodaysSummary = async (userId) => {
  // TODO: Integrate dateUtils for timezone-aware today calculation
  const todaysTransactions = await transactionModel.getTodaysTransactions(userId);
  const totalIncome = await transactionModel.getTodaysIncome(userId);
  const totalSpending = await transactionModel.getTodaysSpending(userId);

  return {
    total_income: totalIncome,
    total_spending: totalSpending,
    net: totalIncome - totalSpending,
    transaction_count: todaysTransactions.length,
    transactions: todaysTransactions,
  };
};

const manualTransactionEntry = async (userId, transactionData) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  // TODO: Check if user is premium after trial expires for manual entry

  const newTransaction = await processAndCreateTransaction(userId, { ...transactionData, source: 'manual' });

  // TODO: Trigger discipline engine update
  // disciplineService.handleNewTransaction(userId, newTransaction);

  return newTransaction;
};

module.exports = {
  syncTransactionsFromSMS,
  syncTransactionsFromAA,
  getTransactionHistory,
  getTodaysSummary,
  manualTransactionEntry,
  categorizeTransaction,
};
