const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User object and token
 */
const register = async (userData) => {
  const { name, email, password, role } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User already exists with this email');
    error.statusCode = 400;
    throw error;
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'USER',
  });

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Login a user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} User object and token
 */
const login = async (credentials) => {
  const { email, password } = credentials;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

module.exports = {
  register,
  login,
};
