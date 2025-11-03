const adminService = require('../services/adminService');

/**
 * Get all orders (Admin only)
 * GET /admin/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const result = await adminService.getAllOrders(req.query);

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
 * Update order status (Admin only)
 * PATCH /admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await adminService.updateOrderStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};
