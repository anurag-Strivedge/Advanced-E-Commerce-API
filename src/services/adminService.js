const Order = require('../models/Order');
const { ORDER_STATUS } = require('../models/Order');

/**
 * Get all orders with pagination and filtering (Admin only)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Orders list with pagination
 */
const getAllOrders = async (options) => {
  const { page = 1, limit = 10, status } = options;

  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
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
 * Update order status (Admin only)
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New order status
 * @returns {Promise<Object>} Updated order
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate status transition
  const validTransitions = {
    [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PAID]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };

  const allowedStatuses = validTransitions[order.status];

  if (!allowedStatuses.includes(newStatus)) {
    const error = new Error(
      `Invalid status transition from ${order.status} to ${newStatus}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Update status
  order.status = newStatus;
  await order.save();

  return order;
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
