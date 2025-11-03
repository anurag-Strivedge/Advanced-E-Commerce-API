const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  getProductsSchema,
} = require('../validators/productValidator');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Get a paginated list of products with optional sorting and filtering. This endpoint is public and doesn't require authentication.
 *     tags: [Products]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *         example: price
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: asc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *         example: headphones
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: Products retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             examples:
 *               allProducts:
 *                 summary: Get all products
 *                 value:
 *                   success: true
 *                   message: Products retrieved successfully
 *                   data:
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                       name: Wireless Headphones
 *                       price: 79.99
 *                       description: High-quality wireless headphones with noise cancellation
 *                       stock: 100
 *                       reservedStock: 5
 *                       availableStock: 95
 *                       createdAt: 2024-01-15T10:30:00.000Z
 *                       updatedAt: 2024-01-15T10:30:00.000Z
 *                     - _id: 64a1b2c3d4e5f6g7h8i9j0k3
 *                       name: Smart Watch
 *                       price: 199.99
 *                       description: Feature-rich smartwatch with health monitoring
 *                       stock: 50
 *                       reservedStock: 2
 *                       availableStock: 48
 *                       createdAt: 2024-01-15T11:00:00.000Z
 *                       updatedAt: 2024-01-15T11:00:00.000Z
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 1
 *                     totalItems: 2
 *                     itemsPerPage: 10
 *                     hasNextPage: false
 *                     hasPrevPage: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', validate(getProductsSchema), productController.getProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the system. Requires admin authentication.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - description
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 description: Product name
 *                 example: Wireless Headphones
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *                 example: 79.99
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Product description
 *                 example: High-quality wireless headphones with noise cancellation and 30-hour battery life
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Initial stock quantity
 *                 example: 100
 *           examples:
 *             headphones:
 *               summary: Wireless Headphones
 *               value:
 *                 name: Wireless Headphones
 *                 price: 79.99
 *                 description: High-quality wireless headphones with noise cancellation
 *                 stock: 100
 *             smartwatch:
 *               summary: Smart Watch
 *               value:
 *                 name: Smart Watch
 *                 price: 199.99
 *                 description: Feature-rich smartwatch with health monitoring and GPS
 *                 stock: 50
 *             laptopStand:
 *               summary: Laptop Stand
 *               value:
 *                 name: Laptop Stand
 *                 price: 39.99
 *                 description: Ergonomic aluminum laptop stand with adjustable height
 *                 stock: 200
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: Product created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               message: Product created successfully
 *               data:
 *                 _id: 64a1b2c3d4e5f6g7h8i9j0k2
 *                 name: Wireless Headphones
 *                 price: 79.99
 *                 description: High-quality wireless headphones with noise cancellation
 *                 stock: 100
 *                 reservedStock: 0
 *                 availableStock: 100
 *                 createdAt: 2024-01-15T10:30:00.000Z
 *                 updatedAt: 2024-01-15T10:30:00.000Z
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     description: Update product details. All fields are optional. Requires admin authentication.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID (24-character hex string)
 *         example: 64a1b2c3d4e5f6g7h8i9j0k2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Updated Wireless Headphones
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 69.99
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Updated description with new features
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 120
 *           examples:
 *             updatePrice:
 *               summary: Update price only
 *               value:
 *                 price: 69.99
 *             updateStock:
 *               summary: Update stock only
 *               value:
 *                 stock: 150
 *             updateMultiple:
 *               summary: Update multiple fields
 *               value:
 *                 name: Premium Wireless Headphones
 *                 price: 89.99
 *                 stock: 75
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: Product updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product from the system. Requires admin authentication.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Product ID (24-character hex string)
 *         example: 64a1b2c3d4e5f6g7h8i9j0k2
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: Product deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteProductSchema),
  productController.deleteProduct
);

module.exports = router;
