const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'; // Default to 7 days

// if (!JWT_SECRET) {
//   throw new Error('JWT_SECRET must be provided in environment variables.');
// }

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token.');
  }
};

const refreshToken = (token) => {
  const decoded = verifyToken(token); // This will throw if token is invalid/expired
  // Generate a new token with the same payload, but new expiry
  return generateToken({ userId: decoded.userId, email: decoded.email });
};

module.exports = {
  generateToken,
  verifyToken,
  refreshToken,
};
