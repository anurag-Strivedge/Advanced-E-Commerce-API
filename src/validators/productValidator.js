const Joi = require('joi');

const createProductSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200).trim().required().messages({
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required',
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
    description: Joi.string().max(2000).trim().required().messages({
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required',
    }),
    stock: Joi.number().integer().min(0).required().messages({
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required',
    }),
  }),
};

const updateProductSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(200).trim().messages({
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
    }),
    price: Joi.number().min(0).messages({
      'number.min': 'Price cannot be negative',
    }),
    description: Joi.string().max(2000).trim().messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
    stock: Joi.number().integer().min(0).messages({
      'number.min': 'Stock cannot be negative',
    }),
  }).min(1),
};

const deleteProductSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
  }),
};

const getProductsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
    sortBy: Joi.string()
      .valid('name', 'price', 'createdAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: name, price, createdAt',
      }),
    order: Joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'Order must be either asc or desc',
    }),
    search: Joi.string().trim().allow('').messages({
      'string.base': 'Search must be a string',
    }),
  }),
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  getProductsSchema,
};
