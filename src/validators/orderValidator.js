const Joi = require('joi');

const getOrdersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
    status: Joi.string()
      .valid(
        'PENDING_PAYMENT',
        'PAID',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED'
      )
      .messages({
        'any.only':
          'Status must be one of: PENDING_PAYMENT, PAID, SHIPPED, DELIVERED, CANCELLED',
      }),
  }),
};

const getOrderByIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid order ID format',
        'any.required': 'Order ID is required',
      }),
  }),
};

const payOrderSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid order ID format',
        'any.required': 'Order ID is required',
      }),
  }),
};

const updateOrderStatusSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid order ID format',
        'any.required': 'Order ID is required',
      }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('SHIPPED', 'DELIVERED', 'CANCELLED')
      .required()
      .messages({
        'any.only': 'Status must be one of: SHIPPED, DELIVERED, CANCELLED',
        'any.required': 'Status is required',
      }),
  }),
};

module.exports = {
  getOrdersSchema,
  getOrderByIdSchema,
  payOrderSchema,
  updateOrderStatusSchema,
};
