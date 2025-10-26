
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');
const { AuthenticationError } = require('../utils/errors');

const signup = async (req, res, next) => {
  try {
    const { email, password, onboardingData } = req.validatedBody; // Use validatedBody from validation middleware
    const { user, token } = await authService.signUp(email, password, onboardingData);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody; // Use validatedBody from validation middleware
    const { user, token } = await authService.login(email, password);
    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id; // userId from authenticated user
    const result = await authService.logout(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required.');
    }
    const { token: newToken } = await authService.refreshSession(refreshToken);
    res.status(200).json({ token: newToken });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // userId from authenticated user
    const user = await userModel.findById(userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  getProfile,
};
