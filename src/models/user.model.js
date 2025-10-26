const { pool } = require('../config/database');

const findById = async (userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );
  return rows[0] || null;
};

const create = async (userData) => {
  const {
    id,
    email,
    daily_expenses,
    average_monthly_income,
    timezone,
    todays_saving_target,
    buffer_status,
    total_available,
    refresh_token,
    enable_analytics = true,
    enable_transaction_tracking = true,
    data_retention_period = 365,
  } = userData;

  const { rows } = await pool.query(
    `INSERT INTO users (id, email, daily_expenses, average_monthly_income, timezone, is_premium, premium_expires_at, trial_started_at, todays_saving_target, buffer_status, total_available, refresh_token, enable_analytics, enable_transaction_tracking, data_retention_period)
     VALUES ($1, $2, $3, $4, $5, TRUE, NOW() + INTERVAL '10 days', NOW(), $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id,
      email,
      daily_expenses,
      average_monthly_income,
      timezone,
      todays_saving_target,
      buffer_status,
      total_available,
      refresh_token,
      enable_analytics,
      enable_transaction_tracking,
      data_retention_period,
    ]
  );
  return rows[0];
};

const update = async (userId, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return findById(userId);
  }

  const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

  const query = {
    text: `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values: [userId, ...values],
  };

  const { rows } = await pool.query(query);
  return rows[0];
};


const softDelete = async (userId) => {
  const { rowCount } = await pool.query(
    "UPDATE users SET deleted_at = NOW() WHERE id = $1",
    [userId]
  );
  return rowCount > 0;
};

const isPremium = async (userId) => {
  const { rows } = await pool.query(
    'SELECT is_premium, premium_expires_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  if (!rows[0]) {
    return false;
  }
  const user = rows[0];
  return user.is_premium && user.premium_expires_at > new Date();
};

const updateFinancialFields = async (userId, fields) => {
  const {
    todays_saving_target,
    gain_today,
    spend_today,
    buffer_status,
    total_available,
  } = fields;

  const { rows } = await pool.query(
    `UPDATE users
     SET
       todays_saving_target = $1,
       gain_today = $2,
       spend_today = $3,
       buffer_status = $4,
       total_available = $5,
       last_discipline_update = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      todays_saving_target,
      gain_today,
      spend_today,
      buffer_status,
      total_available,
      userId,
    ]
  );
  return rows[0];
};

const findAllByTimezones = async (timezones) => {
  if (!timezones || timezones.length === 0) {
    return [];
  }
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE timezone = ANY($1) AND deleted_at IS NULL',
    [timezones]
  );
  return rows;
};

const findAll = async () => {
  const { rows } = await pool.query('SELECT * FROM users WHERE deleted_at IS NULL');
  return rows;
};

module.exports = {
  findById,
  findByEmail,
  create,
  update,
  softDelete,
  isPremium,
  updateFinancialFields,
  findAllByTimezones,
  findAll,
};
