const cartService = require('../services/cartService');

/**
 * Get user's cart
 * GET /cart
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * POST /cart/items
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(
      req.user.userId,
      productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /cart/items/:productId
 */
const removeFromCart = async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(
      req.user.userId,
      req.params.productId
    );

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
