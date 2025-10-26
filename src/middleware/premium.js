const userModel = require('../models/user.model');
const { AuthorizationError } = require('../utils/errors');

const requirePremium = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AuthorizationError('Authentication required.');
    }

    const isPremium = await userModel.isPremium(req.user.id);

    if (!isPremium) {
      throw new AuthorizationError('Premium subscription required.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requirePremium,
};
