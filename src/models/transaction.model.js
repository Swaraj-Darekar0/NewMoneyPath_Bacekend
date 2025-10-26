const { pool } = require('../config/database');

const findById = async (transactionId) => {
  const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
  return rows[0] || null;
};

const findByUserId = async (userId, filters = {}) => {
  let query = 'SELECT * FROM transactions WHERE user_id = $1';
  const values = [userId];
  let valueIndex = 2;

  if (filters.type) {
    query += ` AND type = $${valueIndex++}`;
    values.push(filters.type);
  }
  if (filters.category) {
    query += ` AND category = $${valueIndex++}`;
    values.push(filters.category);
  }
  if (filters.startDate) {
    query += ` AND transaction_date >= $${valueIndex++}`;
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND transaction_date <= $${valueIndex++}`;
    values.push(filters.endDate);
  }

  query += ' ORDER BY transaction_date DESC, created_at DESC';

  const { rows } = await pool.query(query, values);
  return rows;
};

const create = async (transactionData) => {
  const {
    user_id,
    amount,
    type,
    category,
    transaction_date,
    source,
    source_identifier,
    encrypted_metadata,
  } = transactionData;

  // Deduplication: Check if source_identifier already exists for this user
  if (source_identifier) {
    const existingTx = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND source_identifier = $2',
      [user_id, source_identifier]
    );
    if (existingTx.rows.length > 0) {
      // If duplicate found, return existing transaction (idempotency)
      return existingTx.rows[0];
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO transactions (user_id, amount, type, category, transaction_date, source, source_identifier, encrypted_metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user_id,
      amount,
      type,
      category,
      transaction_date,
      source,
      source_identifier,
      encrypted_metadata,
    ]
  );
  return rows[0];
};

const getTodaysTransactions = async (userId, userTimezone) => {
  // Requires date utility to get start/end of day in user's timezone
  // For now, a simplified version assuming UTC for transaction_date
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date < $3 ORDER BY transaction_date DESC',
    [userId, today.toISOString(), tomorrow.toISOString()]
  );
  return rows;
};

const getTodaysSpending = async (userId, userTimezone) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const { rows } = await pool.query(
    `SELECT SUM(amount) as total_spending FROM transactions WHERE user_id = $1 AND type = 'expense' AND transaction_date >= $2 AND transaction_date < $3`,
    [userId, today.toISOString(), tomorrow.toISOString()]
  );
  return parseInt(rows[0].total_spending || '0', 10);
};

const getTodaysIncome = async (userId, userTimezone) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const { rows } = await pool.query(
    `SELECT SUM(amount) as total_income FROM transactions WHERE user_id = $1 AND type = 'income' AND transaction_date >= $2 AND transaction_date < $3`,
    [userId, today.toISOString(), tomorrow.toISOString()]
  );
  return parseInt(rows[0].total_income || '0', 10);
};

const getTransactionsByDateRange = async (userId, startDate, endDate) => {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND transaction_date >= $2 AND transaction_date <= $3 ORDER BY transaction_date DESC',
    [userId, startDate, endDate]
  );
  return rows;
};

const deleteOldTransactions = async (beforeDate) => {
  const { rowCount } = await pool.query(
    'DELETE FROM transactions WHERE transaction_date < $1',
    [beforeDate]
  );
  return rowCount;
};

const deleteById = async (transactionId) => {
  const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1', [transactionId]);
  return rowCount > 0;
};


const update = async (transactionId, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return findById(transactionId);
  }

  const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

  const query = {
    text: `UPDATE transactions SET ${setClause} WHERE id = $1 RETURNING *`,
    values: [transactionId, ...values],
  };

  const { rows } = await pool.query(query);
  return rows[0];
};

module.exports = {
  findById,
  findByUserId,
  create,
  getTodaysTransactions,
  getTodaysSpending,
  getTodaysIncome,
  getTransactionsByDateRange,
  deleteOldTransactions,
  update,
  deleteById,
};

