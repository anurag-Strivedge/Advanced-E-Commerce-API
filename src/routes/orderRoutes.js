const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getOrdersSchema,
  getOrderByIdSchema,
  payOrderSchema,
} = require('../validators/orderValidator');

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Create an order from cart (Checkout)
 *     description: |
 *       Create an order from the user's cart using atomic database transactions. This endpoint:
 *       - Validates all items in the cart
 *       - Reserves stock atomically (moves from available to reserved)
 *       - Creates order with PENDING_PAYMENT status
 *       - Sets 15-minute payment deadline
 *       - Schedules automatic cancellation if not paid in time
 *
 *       **Important:** Cart must have items before checkout. Stock is reserved but not decremented until payment is processed.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: Order created successfully. Please complete payment within the deadline.
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               message: Order created successfully. Please complete payment within the deadline.
 *               data:
 *                 _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                 userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                 items:
 *                   - productId: 64a1b2c3d4e5f6g7h8i9j0k2
 *                     quantity: 2
 *                     priceAtPurchase: 79.99
 *                 totalAmount: 159.98
 *                 status: PENDING_PAYMENT
 *                 paymentDeadline: 2024-01-15T10:45:00.000Z
 *                 createdAt: 2024-01-15T10:30:00.000Z
 *                 updatedAt: 2024-01-15T10:30:00.000Z
 *       400:
 *         description: Cart is empty or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               emptyCart:
 *                 summary: Cart is empty
 *                 value:
 *                   success: false
 *                   message: Cart is empty
 *               insufficientStock:
 *                 summary: Insufficient stock
 *                 value:
 *                   success: false
 *                   message: Insufficient stock for Wireless Headphones. Only 5 items available
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Product Wireless Headphones not found
 */
router.post(
  '/checkout',
  authenticate,
  authorize('USER'),
  orderController.checkout
);

/**
 * @swagger
 * /orders/{id}/pay:
 *   post:
 *     summary: Process payment for an order
 *     description: |
 *       Process payment for a PENDING_PAYMENT order using atomic database transactions. This endpoint:
 *       - Updates order status to PAID
 *       - Decrements actual product stock
 *       - Releases reserved stock
 *       - Creates payment record
 *       - Clears user's cart
 *       - Queues confirmation email (asynchronous)
 *
 *       **Important:**
 *       - Order must be in PENDING_PAYMENT status
 *       - Payment must be completed before the deadline
 *       - All operations are atomic (all succeed or all fail)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Payment processed successfully
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
 *                   example: Payment processed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *             example:
 *               success: true
 *               message: Payment processed successfully
 *               data:
 *                 order:
 *                   _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                   userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                   items:
 *                     - productId: 64a1b2c3d4e5f6g7h8i9j0k2
 *                       quantity: 2
 *                       priceAtPurchase: 79.99
 *                   totalAmount: 159.98
 *                   status: PAID
 *                   paymentDeadline: 2024-01-15T10:45:00.000Z
 *                   createdAt: 2024-01-15T10:30:00.000Z
 *                   updatedAt: 2024-01-15T10:32:00.000Z
 *                 payment:
 *                   _id: 64a1b2c3d4e5f6g7h8i9j0k5
 *                   orderId: 64a1b2c3d4e5f6g7h8i9j0k4
 *                   transactionId: TXN-1705315920000-ABC123
 *                   amount: 159.98
 *                   status: SUCCESS
 *                   createdAt: 2024-01-15T10:32:00.000Z
 *       400:
 *         description: Invalid order status or payment deadline passed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidStatus:
 *                 summary: Invalid order status
 *                 value:
 *                   success: false
 *                   message: Cannot process payment for order with status PAID
 *               deadlinePassed:
 *                 summary: Payment deadline passed
 *                 value:
 *                   success: false
 *                   message: Payment deadline has passed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Order belongs to different user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Unauthorized access to order
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/pay',
  authenticate,
  authorize('USER'),
  validate(payOrderSchema),
  orderController.processPayment
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user's order history
 *     description: |
 *       Get paginated list of authenticated user's orders with optional status filtering.
 *       Orders are sorted by creation date (newest first).
 *
 *       **Available Status Values:**
 *       - PENDING_PAYMENT - Awaiting payment
 *       - PAID - Payment completed
 *       - SHIPPED - Order has been shipped
 *       - DELIVERED - Order has been delivered
 *       - CANCELLED - Order was cancelled
 *     tags: [Orders]
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               allOrders:
 *                 summary: Get all user orders
 *                 value:
 *                   success: true
 *                   message: Orders retrieved successfully
 *                   data:
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                       userId: 64a1b2c3d4e5f6g7h8i9j0k1
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
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalItems: 1
 *                     itemsPerPage: 10
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *               paidOrders:
 *                 summary: Get only paid orders
 *                 value:
 *                   success: true
 *                   message: Orders retrieved successfully
 *                   data:
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                       status: PAID
 *                       totalAmount: 159.98
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalItems: 1
 *                     itemsPerPage: 10
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  authenticate,
  authorize('USER'),
  validate(getOrdersSchema),
  orderController.getUserOrders
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order details
 *     description: Get detailed information about a specific order. User can only access their own orders.
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order retrieved successfully
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
 *                   example: Order retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               message: Order retrieved successfully
 *               data:
 *                 _id: 64a1b2c3d4e5f6g7h8i9j0k4
 *                 userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                 items:
 *                   - productId:
 *                       _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                       name: Wireless Headphones
 *                       price: 79.99
 *                       description: High-quality wireless headphones
 *                     quantity: 2
 *                     priceAtPurchase: 79.99
 *                 totalAmount: 159.98
 *                 status: PAID
 *                 paymentDeadline: 2024-01-15T10:45:00.000Z
 *                 createdAt: 2024-01-15T10:30:00.000Z
 *                 updatedAt: 2024-01-15T10:32:00.000Z
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Order belongs to different user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Unauthorized access to order
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticate,
  authorize('USER'),
  validate(getOrderByIdSchema),
  orderController.getOrderById
);

module.exports = router;
