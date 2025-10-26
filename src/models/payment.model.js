const { pool } = require('../config/database');

const findById = async (paymentId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  return rows[0] || null;
};

const findByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
};

const findByRazorpayOrderId = async (orderId) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE razorpay_order_id = $1', [orderId]);
  return rows[0] || null;
};

const create = async (paymentData) => {
  const {
    user_id,
    razorpay_order_id,
    amount,
    currency = 'INR',
    status = 'created',
  } = paymentData;

  const { rows } = await pool.query(
    `INSERT INTO payments (user_id, razorpay_order_id, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, razorpay_order_id, amount, currency, status]
  );
  return rows[0];
};

const updateStatus = async (paymentId, status, additionalData = {}) => {
  const fields = ['status'];
  const values = [status];
  let setClause = 'status = $2';
  let valueIndex = 3;

  if (status === 'paid') {
    fields.push('paid_at');
    values.push(new Date());
    setClause += `, paid_at = $${valueIndex++}`; 
  }
  if (additionalData.razorpay_payment_id) {
    fields.push('razorpay_payment_id');
    values.push(additionalData.razorpay_payment_id);
    setClause += `, razorpay_payment_id = $${valueIndex++}`; 
  }
  if (additionalData.payment_method) {
    fields.push('payment_method');
    values.push(additionalData.payment_method);
    setClause += `, payment_method = $${valueIndex++}`; 
  }

  const query = {
    text: `UPDATE payments SET ${setClause} WHERE id = $1 RETURNING *`,
    values: [paymentId, ...values],
  };

  const { rows } = await pool.query(query);
  return rows[0];
};

const getSuccessfulPayments = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE user_id = $1 AND status = 'paid' ORDER BY paid_at DESC`,
    [userId]
  );
  return rows;
};


const update = async (paymentId, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return findById(paymentId);
  }

  const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

  const query = {
    text: `UPDATE payments SET ${setClause} WHERE id = $1 RETURNING *`,
    values: [paymentId, ...values],
  };

  const { rows } = await pool.query(query);
  return rows[0];
};

module.exports = {
  findById,
  findByUserId,
  findByRazorpayOrderId,
  create,
  updateStatus,
  getSuccessfulPayments,
  update,
};

