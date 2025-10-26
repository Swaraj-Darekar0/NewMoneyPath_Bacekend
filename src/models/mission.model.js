const { pool } = require('../config/database');

// Helper function to calculate derived fields
const calculateDerivedFields = (mission) => {
  if (!mission) return null;

  const daysSinceCreation = Math.floor((new Date() - new Date(mission.created_at)) / (1000 * 60 * 60 * 24));
  const days_remaining = Math.max(0, mission.duration_days - daysSinceCreation);

  const progress_percentage = mission.target_amount > 0
    ? Math.min(100, (mission.amount_saved / mission.target_amount) * 100).toFixed(2)
    : '0.00';

  return {
    ...mission,
    days_remaining,
    progress_percentage,
  };
};

const findById = async (missionId) => {
  const { rows } = await pool.query('SELECT * FROM missions WHERE id = $1', [missionId]);
  return calculateDerivedFields(rows[0] || null);
};

const findByUserId = async (userId, filters = {}) => {
  let query = 'SELECT * FROM missions WHERE user_id = $1';
  const values = [userId];
  let valueIndex = 2;

  if (filters.status) {
    query += ` AND status = $${valueIndex++}`;
    values.push(filters.status);
  }
  if (filters.priority) {
    query += ` AND priority = $${valueIndex++}`;
    values.push(filters.priority);
  }

  query += ' ORDER BY priority, order_index ASC';

  const { rows } = await pool.query(query, values);
  return rows.map(calculateDerivedFields);
};

const create = async (missionData) => {
  const {
    user_id,
    name,
    target_amount,
    duration_days,
    priority,
  } = missionData;

  const daily_target = Math.floor(target_amount / duration_days);

  // Get the max order_index for the given priority and user
  const maxOrderRes = await pool.query(
    'SELECT MAX(order_index) as max_idx FROM missions WHERE user_id = $1 AND priority = $2',
    [user_id, priority]
  );
  const order_index = (maxOrderRes.rows[0].max_idx || -1) + 1;

  const { rows } = await pool.query(
    `INSERT INTO missions (user_id, name, target_amount, duration_days, priority, daily_target, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user_id, name, target_amount, duration_days, priority, daily_target, order_index]
  );
  return calculateDerivedFields(rows[0]);
};

const update = async (missionId, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return findById(missionId);
  }

  // Recalculate daily_target if needed
  if (updates.target_amount || updates.duration_days) {
    const mission = await findById(missionId);
    const newTarget = updates.target_amount || mission.target_amount;
    const newDuration = updates.duration_days || mission.duration_days;
    updates.daily_target = Math.floor(newTarget / newDuration);
  }

  const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');

  const query = {
    text: `UPDATE missions SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values: [missionId, ...values],
  };

  const { rows } = await pool.query(query);
  return calculateDerivedFields(rows[0]);
};

const remove = async (missionId) => {
  const { rowCount } = await pool.query('DELETE FROM missions WHERE id = $1', [missionId]);
  return rowCount > 0;
};

const archive = async (missionId) => {
  return update(missionId, { status: 'archived' });
};

const complete = async (missionId) => {
  return update(missionId, { status: 'completed', completed_at: new Date() });
};

const updateSavings = async (missionId, amountToAdd) => {
  const { rows } = await pool.query(
    `UPDATE missions
     SET amount_saved = amount_saved + $1
     WHERE id = $2
     RETURNING *`,
    [amountToAdd, missionId]
  );
  const updatedMission = rows[0];

  if (updatedMission.amount_saved >= updatedMission.target_amount) {
    return complete(missionId);
  }

  return calculateDerivedFields(updatedMission);
};

const reorder = async (userId, priority, missionIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < missionIds.length; i++) {
      const missionId = missionIds[i];
      await client.query(
        'UPDATE missions SET order_index = $1 WHERE id = $2 AND user_id = $3 AND priority = $4',
        [i, missionId, userId, priority]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  findById,
  findByUserId,
  create,
  update,
  delete: remove, // renamed to avoid keyword conflict
  archive,
  complete,
  updateSavings,
  reorder,
  calculateDerivedFields,
};
