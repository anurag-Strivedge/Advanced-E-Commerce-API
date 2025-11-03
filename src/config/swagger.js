const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Advanced E-Commerce API',
      version: '1.0.0',
      description: `
# Advanced E-Commerce API Documentation

A production-ready, scalable e-commerce API built with Node.js, Express, and MongoDB.

## Key Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - User and Admin roles
- **Complex State Management** - Order lifecycle management
- **Inventory Reservation** - Atomic stock locking
- **Database Transactions** - Multi-step atomic operations
- **Asynchronous Processing** - Background email queue
- **Pagination & Filtering** - Efficient data retrieval
- **Input Validation** - Comprehensive request validation

## System Workflow

1. User registers/logs in
2. Browses products (public)
3. Adds products to cart
4. Checks out (creates order with PENDING_PAYMENT status)
5. Stock is reserved atomically
6. Processes payment
7. Order status changes to PAID
8. Stock is decremented, cart cleared
9. Confirmation email queued
10. Admin updates order status (SHIPPED → DELIVERED)

## Order Status Flow

\`\`\`
PENDING_PAYMENT → PAID → SHIPPED → DELIVERED
              ↓
          CANCELLED
\`\`\`

## Authentication

Most endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

Use the /auth/register and /auth/login endpoints to get a token.
      `,
      contact: {
        name: 'API Support',
        email: 'support@ecommerce-api.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.ecommerce.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k1',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k2',
            },
            name: {
              type: 'string',
              example: 'Wireless Headphones',
            },
            price: {
              type: 'number',
              format: 'float',
              example: 79.99,
            },
            description: {
              type: 'string',
              example: 'High-quality wireless headphones with noise cancellation',
            },
            stock: {
              type: 'number',
              example: 100,
            },
            reservedStock: {
              type: 'number',
              example: 5,
            },
            availableStock: {
              type: 'number',
              example: 95,
              description: 'Virtual field calculated as stock - reservedStock',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k2',
            },
            quantity: {
              type: 'number',
              example: 2,
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k3',
            },
            userId: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k1',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k2',
            },
            quantity: {
              type: 'number',
              example: 2,
            },
            priceAtPurchase: {
              type: 'number',
              format: 'float',
              example: 79.99,
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k4',
            },
            userId: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k1',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 159.98,
            },
            status: {
              type: 'string',
              enum: ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING_PAYMENT',
            },
            paymentDeadline: {
              type: 'string',
              format: 'date-time',
              description: 'Order will auto-cancel after this time if not paid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k5',
            },
            orderId: {
              type: 'string',
              example: '64a1b2c3d4e5f6g7h8i9j0k4',
            },
            transactionId: {
              type: 'string',
              example: 'TXN-1705315800000-ABC123',
            },
            amount: {
              type: 'number',
              format: 'float',
              example: 159.98,
            },
            status: {
              type: 'string',
              enum: ['SUCCESS', 'FAILED'],
              example: 'SUCCESS',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'number',
              example: 1,
            },
            totalPages: {
              type: 'number',
              example: 5,
            },
            totalItems: {
              type: 'number',
              example: 50,
            },
            itemsPerPage: {
              type: 'number',
              example: 10,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Access denied. No token provided.',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Access denied. Insufficient permissions.',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: {
                  body: ['Name is required', 'Email must be valid'],
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and login endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints (Admin) and product browsing (Public)',
      },
      {
        name: 'Cart',
        description: 'Shopping cart management endpoints',
      },
      {
        name: 'Orders',
        description: 'Order creation, payment processing, and order history',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints for order management',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
