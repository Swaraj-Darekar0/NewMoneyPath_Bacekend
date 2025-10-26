const { pool } = require('../config/database');

const create = async (logData) => {
  const {
    user_id = null,
    action,
    entity_type = null,
    entity_id = null,
    old_values = null,
    new_values = null,
    ip_address = null,
    user_agent = null,
  } = logData;

  const { rows } = await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
    ]
  );
  return rows[0];
};

module.exports = {
  create,
};
