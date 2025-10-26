const { supabase } = require('../config/supabase');
const { AuthenticationError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required: Missing or invalid Authorization header.');
    }

    const token = authHeader.split(' ')[1];

    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      throw new AuthenticationError('Invalid token.', { type: 'INVALID_TOKEN', supabaseError: error.message });
    }

    if (!user) {
      throw new AuthenticationError('User not found.', { type: 'USER_NOT_FOUND' });
    }

    // Attach the Supabase user object to the request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
