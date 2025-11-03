const Product = require('../models/Product');

/**
 * Create a new product (Admin only)
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Update an existing product (Admin only)
 * @param {string} productId - Product ID
 * @param {Object} updateData - Product update data
 * @returns {Promise<Object>} Updated product
 */
const updateProduct = async (productId, updateData) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    product[key] = updateData[key];
  });

  await product.save();
  return product;
};

/**
 * Delete a product (Admin only)
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Deleted product
 */
const deleteProduct = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  await Product.findByIdAndDelete(productId);
  return product;
};

/**
 * Get all products with pagination, sorting, and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Products list with pagination
 */
const getProducts = async (options) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search = '' } = options;

  // Build query
  const query = {};

  // Search by name if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  // Execute query
  const [products, total] = await Promise.all([
    Product.find(query).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get a single product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product
 */
const getProductById = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
};
