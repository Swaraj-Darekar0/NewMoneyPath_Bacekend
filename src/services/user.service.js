const userModel = require('../models/user.model');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

const auditLogModel = require('../models/auditLog.model');

const getUserProfile = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  // Calculate derived fields
  const daysUntilPremiumExpires = user.premium_expires_at
    ? Math.ceil((user.premium_expires_at - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return { ...user, daysUntilPremiumExpires };
};

const updateUserProfile = async (userId, updates) => {
  // Validate updates (only allow specific fields to be updated)
  const allowedUpdates = ['timezone', 'enable_analytics', 'enable_transaction_tracking', 'data_retention_period'];
  const isValidOperation = Object.keys(updates).every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    throw new AuthorizationError('Invalid updates!', {
      allowedUpdates,
      providedUpdates: Object.keys(updates),
    });
  }

  const updatedUser = await userModel.update(userId, updates);
  if (!updatedUser) {
    throw new NotFoundError('User not found.');
  }

  return updatedUser;
};

const deleteUserData = async (userId) => {
  // Soft delete user
  const success = await userModel.softDelete(userId);
  if (!success) {
    throw new NotFoundError('User not found.');
  }

  // TODO: Delete or anonymize related data (missions, transactions)
  await auditLogModel.create({
    user_id: userId,
    action: 'user_data_deleted',
    entity_type: 'user',
    entity_id: userId,
  });

  return { message: 'User data scheduled for deletion.' };
};

const checkPremiumStatus = async (userId) => {
  const isPremium = await userModel.isPremium(userId);
  const user = await userModel.findById(userId);

  return {
    isPremium,
    expiresAt: user ? user.premium_expires_at : null,
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserData,
  checkPremiumStatus,
};
