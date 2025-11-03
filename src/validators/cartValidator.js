const Joi = require('joi');

const addToCartSchema = {
  body: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
    quantity: Joi.number().integer().min(1).required().messages({
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
  }),
};

const removeFromCartSchema = {
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
  }),
};

module.exports = {
  addToCartSchema,
  removeFromCartSchema,
};
