const productService = require('../services/productService');

/**
 * Create a new product
 * POST /products (Admin only)
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product
 * PUT /products/:id (Admin only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * DELETE /products/:id (Admin only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products
 * GET /products (Public)
 */
const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
};
