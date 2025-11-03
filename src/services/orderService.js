const mongoose = require('mongoose');
const Order = require('../models/Order');
const { ORDER_STATUS } = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { PAYMENT_STATUS } = require('../models/Payment');
const { queueConfirmationEmail } = require('../utils/asyncQueue');
const User = require('../models/User');

/**
 * Helper function to check if transactions are supported
 */
const supportsTransactions = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    // Check if running as replica set or mongos
    return serverStatus.repl !== undefined || serverStatus.process === 'mongos';
  } catch (error) {
    return false;
  }
};

/**
 * Create an order from user's cart (Checkout)
 * This uses transactions to ensure atomic stock reservation when available
 * Falls back to sequential operations for development environments
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created order
 */
const checkout = async (userId) => {
  const useTransactions = await supportsTransactions();

  if (useTransactions) {
    return checkoutWithTransaction(userId);
  } else {
    console.warn('⚠️  MongoDB transactions not supported. Using fallback mode for development.');
    return checkoutWithoutTransaction(userId);
  }
};

/**
 * Checkout with transactions (production)
 */
const checkoutWithTransaction = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .session(session);

    if (!cart || cart.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    // Validate all products and check stock availability
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id).session(
        session
      );

      if (!product) {
        const error = new Error(
          `Product ${item.productId.name} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      const availableStock = product.stock - product.reservedStock;

      if (availableStock < item.quantity) {
        const error = new Error(
          `Insufficient stock for ${product.name}. Only ${availableStock} items available`
        );
        error.statusCode = 400;
        throw error;
      }

      // Reserve stock atomically
      product.reservedStock += item.quantity;
      await product.save({ session });

      // Add to order items
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      totalAmount += product.price * item.quantity;
    }

    // Calculate payment deadline (15 minutes from now)
    const paymentDeadline = new Date(
      Date.now() +
        (process.env.ORDER_PAYMENT_TIMEOUT_MINUTES || 15) * 60 * 1000
    );

    // Create order
    const order = await Order.create(
      [
        {
          userId,
          items: orderItems,
          totalAmount,
          status: ORDER_STATUS.PENDING_PAYMENT,
          paymentDeadline,
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    // Schedule automatic cancellation if not paid within deadline
    scheduleOrderCancellation(order[0]._id, paymentDeadline);

    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Checkout without transactions (development fallback)
 */
const checkoutWithoutTransaction = async (userId) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    // Validate all products and check stock availability
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);

      if (!product) {
        const error = new Error(
          `Product ${item.productId.name} not found`
        );
        error.statusCode = 404;
        throw error;
      }

      const availableStock = product.stock - product.reservedStock;

      if (availableStock < item.quantity) {
        const error = new Error(
          `Insufficient stock for ${product.name}. Only ${availableStock} items available`
        );
        error.statusCode = 400;
        throw error;
      }

      // Reserve stock
      product.reservedStock += item.quantity;
      await product.save();

      // Add to order items
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });

      totalAmount += product.price * item.quantity;
    }

    // Calculate payment deadline (15 minutes from now)
    const paymentDeadline = new Date(
      Date.now() +
        (process.env.ORDER_PAYMENT_TIMEOUT_MINUTES || 15) * 60 * 1000
    );

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      status: ORDER_STATUS.PENDING_PAYMENT,
      paymentDeadline,
    });

    // Schedule automatic cancellation if not paid within deadline
    scheduleOrderCancellation(order._id, paymentDeadline);

    return order;
  } catch (error) {
    throw error;
  }
};

/**
 * Process payment for an order
 * This uses transactions to ensure atomic stock update and order status change when available
 * Falls back to sequential operations for development environments
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Payment result
 */
const processPayment = async (orderId, userId) => {
  const useTransactions = await supportsTransactions();

  if (useTransactions) {
    return processPaymentWithTransaction(orderId, userId);
  } else {
    console.warn('⚠️  MongoDB transactions not supported. Using fallback mode for development.');
    return processPaymentWithoutTransaction(orderId, userId);
  }
};

/**
 * Process payment with transactions (production)
 */
const processPaymentWithTransaction = async (orderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find order
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      const error = new Error('Unauthorized access to order');
      error.statusCode = 403;
      throw error;
    }

    // Check if order is pending payment
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      const error = new Error(
        `Cannot process payment for order with status: ${order.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if payment deadline has passed
    if (new Date() > order.paymentDeadline) {
      const error = new Error('Payment deadline has passed');
      error.statusCode = 400;
      throw error;
    }

    // Process each item: decrement reserved stock and update actual stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }

      // Decrement reserved stock and actual stock
      product.reservedStock -= item.quantity;
      product.stock -= item.quantity;

      if (product.reservedStock < 0 || product.stock < 0) {
        const error = new Error('Stock calculation error');
        error.statusCode = 500;
        throw error;
      }

      await product.save({ session });
    }

    // Update order status
    order.status = ORDER_STATUS.PAID;
    await order.save({ session });

    // Create payment record
    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)
      .toUpperCase()}`;

    const payment = await Payment.create(
      [
        {
          orderId: order._id,
          transactionId,
          amount: order.totalAmount,
          status: PAYMENT_STATUS.SUCCESS,
        },
      ],
      { session }
    );

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    // Queue confirmation email (async, doesn't affect transaction)
    const user = await User.findById(userId);
    if (user) {
      queueConfirmationEmail({
        orderId: order._id.toString(),
        userEmail: user.email,
        totalAmount: order.totalAmount,
      });
    }

    return {
      order,
      payment: payment[0],
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process payment without transactions (development fallback)
 */
const processPaymentWithoutTransaction = async (orderId, userId) => {
  try {
    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      const error = new Error('Unauthorized access to order');
      error.statusCode = 403;
      throw error;
    }

    // Check if order is pending payment
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      const error = new Error(
        `Cannot process payment for order with status: ${order.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if payment deadline has passed
    if (new Date() > order.paymentDeadline) {
      const error = new Error('Payment deadline has passed');
      error.statusCode = 400;
      throw error;
    }

    // Process each item: decrement reserved stock and update actual stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }

      // Decrement reserved stock and actual stock
      product.reservedStock -= item.quantity;
      product.stock -= item.quantity;

      if (product.reservedStock < 0 || product.stock < 0) {
        const error = new Error('Stock calculation error');
        error.statusCode = 500;
        throw error;
      }

      await product.save();
    }

    // Update order status
    order.status = ORDER_STATUS.PAID;
    await order.save();

    // Create payment record
    const transactionId = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)
      .toUpperCase()}`;

    const payment = await Payment.create({
      orderId: order._id,
      transactionId,
      amount: order.totalAmount,
      status: PAYMENT_STATUS.SUCCESS,
    });

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] }
    );

    // Queue confirmation email (async, doesn't affect transaction)
    const user = await User.findById(userId);
    if (user) {
      queueConfirmationEmail({
        orderId: order._id.toString(),
        userEmail: user.email,
        totalAmount: order.totalAmount,
      });
    }

    return {
      order,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's orders with pagination and filtering
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Orders list with pagination
 */
const getUserOrders = async (userId, options) => {
  const { page = 1, limit = 10, status } = options;

  // Build query
  const query = { userId };

  if (status) {
    query.status = status;
  }

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Execute query
  const [orders, total] = await Promise.all([
    Order.find(query)
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
 * Get a single order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Order
 */
const getOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate('items.productId');

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify order belongs to user
  if (order.userId.toString() !== userId) {
    const error = new Error('Unauthorized access to order');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

/**
 * Cancel an order and release reserved stock
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Cancelled order
 */
const cancelOrder = async (orderId) => {
  const useTransactions = await supportsTransactions();

  if (useTransactions) {
    return cancelOrderWithTransaction(orderId);
  } else {
    return cancelOrderWithoutTransaction(orderId);
  }
};

/**
 * Cancel order with transactions (production)
 */
const cancelOrderWithTransaction = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      return null;
    }

    // Only cancel if order is in PENDING_PAYMENT status
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      await session.abortTransaction();
      return null;
    }

    // Release reserved stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);

      if (product) {
        product.reservedStock -= item.quantity;

        // Ensure reserved stock doesn't go negative
        if (product.reservedStock < 0) {
          product.reservedStock = 0;
        }

        await product.save({ session });
      }
    }

    // Update order status
    order.status = ORDER_STATUS.CANCELLED;
    await order.save({ session });

    await session.commitTransaction();

    console.log(`Order ${orderId} automatically cancelled due to payment timeout`);

    return order;
  } catch (error) {
    await session.abortTransaction();
    console.error(`Error cancelling order ${orderId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel order without transactions (development fallback)
 */
const cancelOrderWithoutTransaction = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return null;
    }

    // Only cancel if order is in PENDING_PAYMENT status
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      return null;
    }

    // Release reserved stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (product) {
        product.reservedStock -= item.quantity;

        // Ensure reserved stock doesn't go negative
        if (product.reservedStock < 0) {
          product.reservedStock = 0;
        }

        await product.save();
      }
    }

    // Update order status
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    console.log(`Order ${orderId} automatically cancelled due to payment timeout`);

    return order;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error.message);
    throw error;
  }
};

/**
 * Schedule automatic order cancellation
 * @param {string} orderId - Order ID
 * @param {Date} deadline - Payment deadline
 */
const scheduleOrderCancellation = (orderId, deadline) => {
  const delay = deadline.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      try {
        await cancelOrder(orderId);
      } catch (error) {
        console.error('Error in scheduled order cancellation:', error.message);
      }
    }, delay);
  }
};

module.exports = {
  checkout,
  processPayment,
  getUserOrders,
  getOrderById,
  cancelOrder,
};
