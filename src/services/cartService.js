const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Get user's cart
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's cart with populated products
 */
const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate('items.productId');

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

/**
 * Add or update item in cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add/set
 * @returns {Promise<Object>} Updated cart
 */
const addToCart = async (userId, productId, quantity) => {
  // Check if product exists and has sufficient stock
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const availableStock = product.stock - product.reservedStock;

  if (availableStock < quantity) {
    const error = new Error(
      `Insufficient stock. Only ${availableStock} items available`
    );
    error.statusCode = 400;
    throw error;
  }

  // Get or create cart
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = quantity;

    // Check if new quantity exceeds available stock
    if (availableStock < newQuantity) {
      const error = new Error(
        `Insufficient stock. Only ${availableStock} items available`
      );
      error.statusCode = 400;
      throw error;
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({ productId, quantity });
  }

  await cart.save();

  // Populate and return
  await cart.populate('items.productId');
  return cart;
};

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Updated cart
 */
const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    const error = new Error('Cart not found');
    error.statusCode = 404;
    throw error;
  }

  // Filter out the item
  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  await cart.save();
  await cart.populate('items.productId');

  return cart;
};

/**
 * Clear user's cart
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Empty cart
 */
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    const error = new Error('Cart not found');
    error.statusCode = 404;
    throw error;
  }

  cart.items = [];
  await cart.save();

  return cart;
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
};
