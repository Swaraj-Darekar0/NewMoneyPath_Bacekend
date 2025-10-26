const analyticsService = require('../services/analytics.service');
const { supabase } = require('../config/supabase');

const deleteUserData = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { data: { user }, error } = await supabase.auth.getUser(req.user.token);

    if (error) {
      throw new Error('Could not re-authenticate user.');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      throw new Error('Invalid password.');
    }

    const result = await analyticsService.deleteAllUserData(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPrivacySettings = async (req, res, next) => {
  try {
    const settings = await analyticsService.getPrivacySettings(req.user.id);
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

const updatePrivacySettings = async (req, res, next) => {
  try {
    const result = await analyticsService.updatePrivacySettings(req.user.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUserData,
  getPrivacySettings,
  updatePrivacySettings,
};