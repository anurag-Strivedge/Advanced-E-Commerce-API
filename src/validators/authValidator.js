const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('USER', 'ADMIN').default('USER').messages({
      'any.only': 'Role must be either USER or ADMIN',
    }),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
};
