const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  addToCartSchema,
  removeFromCartSchema,
} = require('../validators/cartValidator');

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's cart
 *     description: Retrieve the authenticated user's shopping cart with populated product details. Creates an empty cart if one doesn't exist.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                   example: Cart retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64a1b2c3d4e5f6g7h8i9j0k3
 *                     userId:
 *                       type: string
 *                       example: 64a1b2c3d4e5f6g7h8i9j0k1
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             $ref: '#/components/schemas/Product'
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *             examples:
 *               cartWithItems:
 *                 summary: Cart with items
 *                 value:
 *                   success: true
 *                   message: Cart retrieved successfully
 *                   data:
 *                     _id: 64a1b2c3d4e5f6g7h8i9j0k3
 *                     userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                     items:
 *                       - productId:
 *                           _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                           name: Wireless Headphones
 *                           price: 79.99
 *                           description: High-quality wireless headphones
 *                           stock: 100
 *                           reservedStock: 2
 *                           availableStock: 98
 *                         quantity: 2
 *                     createdAt: 2024-01-15T10:00:00.000Z
 *                     updatedAt: 2024-01-15T10:30:00.000Z
 *               emptyCart:
 *                 summary: Empty cart
 *                 value:
 *                   success: true
 *                   message: Cart retrieved successfully
 *                   data:
 *                     _id: 64a1b2c3d4e5f6g7h8i9j0k3
 *                     userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                     items: []
 *                     createdAt: 2024-01-15T10:00:00.000Z
 *                     updatedAt: 2024-01-15T10:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', authenticate, authorize('USER'), cartController.getCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add item to cart or update quantity
 *     description: Add a product to the cart or update its quantity if it already exists. Validates stock availability before adding.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: Product ID (24-character hex string)
 *                 example: 64a1b2c3d4e5f6g7h8i9j0k2
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to add/set (replaces existing quantity)
 *                 example: 2
 *           examples:
 *             addNewItem:
 *               summary: Add new item to cart
 *               value:
 *                 productId: 64a1b2c3d4e5f6g7h8i9j0k2
 *                 quantity: 2
 *             updateQuantity:
 *               summary: Update existing item quantity
 *               value:
 *                 productId: 64a1b2c3d4e5f6g7h8i9j0k2
 *                 quantity: 5
 *     responses:
 *       200:
 *         description: Item added/updated successfully
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
 *                   example: Item added to cart successfully
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             example:
 *               success: true
 *               message: Item added to cart successfully
 *               data:
 *                 _id: 64a1b2c3d4e5f6g7h8i9j0k3
 *                 userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                 items:
 *                   - productId:
 *                       _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                       name: Wireless Headphones
 *                       price: 79.99
 *                     quantity: 2
 *       400:
 *         description: Validation error or insufficient stock
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
 *                       - Quantity must be at least 1
 *               insufficientStock:
 *                 summary: Insufficient stock
 *                 value:
 *                   success: false
 *                   message: Insufficient stock. Only 10 items available
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
 *               message: Product not found
 */
router.post(
  '/items',
  authenticate,
  authorize('USER'),
  validate(addToCartSchema),
  cartController.addToCart
);

/**
 * @swagger
 * /cart/items/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific product from the user's cart.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID to remove (24-character hex string)
 *         example: 64a1b2c3d4e5f6g7h8i9j0k2
 *     responses:
 *       200:
 *         description: Item removed successfully
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
 *                   example: Item removed from cart successfully
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             example:
 *               success: true
 *               message: Item removed from cart successfully
 *               data:
 *                 _id: 64a1b2c3d4e5f6g7h8i9j0k3
 *                 userId: 64a1b2c3d4e5f6g7h8i9j0k1
 *                 items: []
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Cart not found
 */
router.delete(
  '/items/:productId',
  authenticate,
  authorize('USER'),
  validate(removeFromCartSchema),
  cartController.removeFromCart
);

module.exports = router;
