const orderService = require('../services/orderService');

/**
 * Create an order from cart (Checkout)
 * POST /orders/checkout
 */
const checkout = async (req, res, next) => {
  try {
    const order = await orderService.checkout(req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment within the deadline.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process payment for an order
 * POST /orders/:id/pay
 */
const processPayment = async (req, res, next) => {
  try {
    const result = await orderService.processPayment(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * GET /orders
 */
const getUserOrders = async (req, res, next) => {
  try {
    const result = await orderService.getUserOrders(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order by ID
 * GET /orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  processPayment,
  getUserOrders,
  getOrderById,
};
