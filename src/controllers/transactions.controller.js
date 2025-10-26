const transactionService = require('../services/transaction.service');

const syncTransactions = async (req, res, next) => {
  try {
    const { source, transactions } = req.validatedBody;
    let result;
    if (source === 'sms_android') {
      result = await transactionService.syncTransactionsFromSMS(req.user.id, transactions);
    } else if (source === 'aa_ios') {
      result = await transactionService.syncTransactionsFromAA(req.user.id, transactions);
    } else {
      throw new Error('Invalid transaction source.');
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const filters = req.query; // type, date_range, category
    const history = await transactionService.getTransactionHistory(req.user.id, filters);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

const getTodaysSummary = async (req, res, next) => {
  try {
    const summary = await transactionService.getTodaysSummary(req.user.id);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

const manualEntry = async (req, res, next) => {
  try {
    const transaction = await transactionService.manualTransactionEntry(req.user.id, req.validatedBody);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncTransactions,
  getTransactionHistory,
  getTodaysSummary,
  manualEntry,
};
