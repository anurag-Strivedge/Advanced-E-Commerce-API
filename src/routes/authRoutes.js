const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account (USER or ADMIN). Returns user details and a JWT token that can be used for authentication.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password (will be hashed)
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 default: USER
 *                 description: User role (defaults to USER)
 *                 example: USER
 *           examples:
 *             registerUser:
 *               summary: Register as USER
 *               value:
 *                 name: John Doe
 *                 email: john@example.com
 *                 password: password123
 *                 role: USER
 *             registerAdmin:
 *               summary: Register as ADMIN
 *               value:
 *                 name: Admin User
 *                 email: admin@example.com
 *                 password: admin123
 *                 role: ADMIN
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 64a1b2c3d4e5f6g7h8i9j0k1
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         role:
 *                           type: string
 *                           example: USER
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGExYjJjM2Q0ZTVmNmc3aDhpOWowazEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMxNTgwMCwiZXhwIjoxNzA1OTIwNjAwfQ.abc123xyz
 *       400:
 *         description: Validation error or user already exists
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
 *                       - Name must be at least 2 characters long
 *                       - Email is required
 *               userExists:
 *                 summary: User already exists
 *                 value:
 *                   success: false
 *                   message: User already exists with this email
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user with email and password. Returns user details and a JWT token for accessing protected endpoints.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: password123
 *           examples:
 *             userLogin:
 *               summary: Login as USER
 *               value:
 *                 email: john@example.com
 *                 password: password123
 *             adminLogin:
 *               summary: Login as ADMIN
 *               value:
 *                 email: admin@example.com
 *                 password: admin123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 64a1b2c3d4e5f6g7h8i9j0k1
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         role:
 *                           type: string
 *                           example: USER
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication (use in Authorization header as "Bearer <token>")
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGExYjJjM2Q0ZTVmNmc3aDhpOWowazEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwNTMxNTgwMCwiZXhwIjoxNzA1OTIwNjAwfQ.abc123xyz
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid email or password
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 body:
 *                   - Email is required
 *                   - Password is required
 */
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
