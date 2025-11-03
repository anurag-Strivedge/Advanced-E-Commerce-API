const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getOrdersSchema,
  updateOrderStatusSchema,
} = require('../validators/orderValidator');

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     description: |
 *       Get a paginated list of ALL orders in the system with optional status filtering.
 *       Includes user details for each order. Only accessible by admins.
 *
 *       **Use Cases:**
 *       - Monitor all orders in the system
 *       - Filter orders by status (e.g., find all pending payments)
 *       - Track order fulfillment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_PAYMENT, PAID, SHIPPED, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *         example: PAID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Orders retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Order'
 *                       - type: object
 *                         properties:
 *                           userId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               allOrders:
 *                 summary: Get all orders
 *                 value:
 *                   success: true
 *                   message: Orders retrieved successfully
 *                   data:
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                       userId:
 *                         _id: 64a1b2c3d4e5f6g7h8i9j0k1
 *                         name: John Doe
 *                         email: john@example.com
 *                       items:
 *                         - productId:
 *                             _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                             name: Wireless Headphones
 *                             price: 79.99
 *                           quantity: 2
 *                           priceAtPurchase: 79.99
 *                       totalAmount: 159.98
 *                       status: PAID
 *                       paymentDeadline: 2024-01-15T10:45:00.000Z
 *                       createdAt: 2024-01-15T10:30:00.000Z
 *                       updatedAt: 2024-01-15T10:32:00.000Z
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k5
 *                       userId:
 *                         _id: 64a1b2c3d4e5f6g7h8i9j0k6
 *                         name: Jane Smith
 *                         email: jane@example.com
 *                       totalAmount: 39.99
 *                       status: SHIPPED
 *                       createdAt: 2024-01-15T09:00:00.000Z
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalItems: 2
 *                     itemsPerPage: 10
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *               paidOrders:
 *                 summary: Filter by PAID status
 *                 value:
 *                   success: true
 *                   message: Orders retrieved successfully
 *                   data:
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                       userId:
 *                         name: John Doe
 *                         email: john@example.com
 *                       totalAmount: 159.98
 *                       status: PAID
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalItems: 1
 *                     itemsPerPage: 10
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/orders',
  authenticate,
  authorize('ADMIN'),
  validate(getOrdersSchema),
  adminController.getAllOrders
);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     description: |
 *       Update the status of an order. Only admins can perform this action.
 *
 *       **Valid Status Transitions:**
 *       - PENDING_PAYMENT → CANCELLED
 *       - PAID → SHIPPED, CANCELLED
 *       - SHIPPED → DELIVERED
 *       - DELIVERED → (final state, no transitions)
 *       - CANCELLED → (final state, no transitions)
 *
 *       **Status Meanings:**
 *       - PENDING_PAYMENT: Order created, awaiting payment
 *       - PAID: Payment completed successfully
 *       - SHIPPED: Order has been shipped to customer
 *       - DELIVERED: Order has been delivered
 *       - CANCELLED: Order was cancelled
 *
 *       **Important:** Invalid status transitions will be rejected with a 400 error.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Order ID (24-character hex string)
 *         example: 64a1b2c3d4e5f6g7h8i9j0k4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SHIPPED, DELIVERED, CANCELLED]
 *                 description: New status for the order
 *                 example: SHIPPED
 *           examples:
 *             markAsShipped:
 *               summary: Mark order as shipped
 *               value:
 *                 status: SHIPPED
 *             markAsDelivered:
 *               summary: Mark order as delivered
 *               value:
 *                 status: DELIVERED
 *             cancelOrder:
 *               summary: Cancel an order
 *               value:
 *                 status: CANCELLED
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             examples:
 *               shipped:
 *                 summary: Order marked as shipped
 *                 value:
 *                   success: true
 *                   message: Order status updated successfully
 *                   data:
 *                     _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                     userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                     totalAmount: 159.98
 *                     status: SHIPPED
 *                     updatedAt: 2024-01-15T14:00:00.000Z
 *               delivered:
 *                 summary: Order marked as delivered
 *                 value:
 *                   success: true
 *                   message: Order status updated successfully
 *                   data:
 *                     _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                     status: DELIVERED
 *                     updatedAt: 2024-01-16T10:00:00.000Z
 *       400:
 *         description: Validation error or invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 summary: Validation failed
 *                 value:
 *                   success: false
 *                   message: Validation failed
 *                   errors:
 *                     body:
 *                       - Status must be one of SHIPPED, DELIVERED, CANCELLED
 *               invalidTransition:
 *                 summary: Invalid status transition
 *                 value:
 *                   success: false
 *                   message: Invalid status transition from DELIVERED to SHIPPED
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  adminController.updateOrderStatus
);

module.exports = router;
