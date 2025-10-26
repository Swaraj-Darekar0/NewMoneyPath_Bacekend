const userModel = require('../models/user.model');
const { supabase } = require('../config/supabase');
const { generateToken, verifyToken } = require('../utils/jwt');
const {
  ValidationError,
  ConflictError,
  AuthenticationError,
  NotFoundError,
  ExternalServiceError,
} = require('../utils/errors');
const { calculateBaselineFinancials } = require('./discipline.service'); // Placeholder for now

const signUp = async (email, password, onboardingData) => {
  // 1. Validate email format and password strength (will be done by validation middleware)
  // 2. Check if email already exists
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email already registered.');
  }

  // 3. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { disableEmailConfirmation: true },
  });

  if (authError) {
    throw new ExternalServiceError('Supabase signup failed.', {
      supabaseError: authError.message,
    });
  }

  if (!authData.session) {
    // This can happen if the user already exists but is not confirmed, or other edge cases.
    console.error('Supabase signUp did not return a session. Full data object:', JSON.stringify(authData, null, 2));
    throw new ConflictError('Could not create a new session. The user may already exist or email confirmation might be required by your Supabase project settings.');
  }

  const userId = authData.user.id;

  // 4. Validate onboardingData (will be done by validation middleware)
  // 5. Calculate baseline financial fields using discipline service
  const financialFields = calculateBaselineFinancials(onboardingData);

  // 6. Create user in database
  const newUser = await userModel.create({
    id: userId,
    email,
    ...onboardingData,
    ...financialFields,
    refresh_token: authData.session.refresh_token,
  });

  // 7. Return Supabase access token
  const token = authData.session.access_token;

  return { user: newUser, token };
};

const login = async (email, password) => {
  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new AuthenticationError('Invalid credentials.', {
      supabaseError: authError.message,
    });
  }

  const userId = authData.user.id;

  // 2. Fetch user from database and update refresh token
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found in our records.');
  }
  await userModel.update(userId, { refresh_token: authData.session.refresh_token });

  const token = authData.session.access_token;

  return { user, token };
};

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new ExternalServiceError('Supabase signout failed.', {
      supabaseError: error.message,
    });
  }
  return { message: 'Logged out successfully.' };
};

const refreshSession = async (refreshToken) => {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error) {
    throw new AuthenticationError('Invalid refresh token.', {
      supabaseError: error.message,
    });
  }

  const { session } = data;
  if (!session) {
    throw new AuthenticationError('Could not refresh session.');
  }

  // Update the new refresh token in the database
  await userModel.update(session.user.id, { refresh_token: session.refresh_token });

  return { token: session.access_token };
};

const verifyPassword = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthenticationError('Invalid credentials for password verification.', {
      supabaseError: error.message,
    });
  }
  return true;
};

module.exports = {
  signUp,
  login,
  logout,
  refreshSession,
  verifyPassword,
};
