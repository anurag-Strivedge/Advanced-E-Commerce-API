# Advanced E-Commerce API

A production-ready, scalable e-commerce API built with Node.js, Express, and MongoDB. This API demonstrates advanced concepts including complex state management, atomic transactions, inventory reservation, and asynchronous job processing.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [System Workflow](#system-workflow)
- [Database Models](#database-models)
- [Key Implementation Details](#key-implementation-details)
- [Testing](#testing)

## Features

### Core Features
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - User and Admin roles with different permissions
- **Complex State Management** - Order lifecycle management (PENDING_PAYMENT → PAID → SHIPPED → DELIVERED)
- **Inventory Reservation** - Atomic stock locking to prevent race conditions
- **Database Transactions** - Multi-step atomic operations across multiple collections
- **Asynchronous Job Processing** - Background email queue system
- **Automatic Order Cancellation** - Timeout-based order cancellation with stock release
- **Pagination & Filtering** - Efficient data retrieval with query options
- **Input Validation** - Comprehensive request validation using Joi
- **Centralized Error Handling** - Consistent error responses across the API

### Technical Highlights
- **Atomic Stock Reservation** - Products have both `stock` and `reservedStock` fields to handle concurrent checkouts
- **Transaction-based Checkout** - All checkout operations are wrapped in MongoDB transactions
- **Payment Processing Simulation** - Mock payment flow with success/failure handling
- **Auto-expiring Orders** - Orders automatically cancel after 15 minutes if not paid
- **Service-Layer Architecture** - Clean separation of concerns (Controllers → Services → Models)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcryptjs
- **Security**: express-rate-limit, CORS
- **API Documentation**: Swagger/OpenAPI 3.0 (swagger-ui-express, swagger-jsdoc)

## Project Structure

```
ecommerce-api/
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB connection configuration
│   │   └── swagger.js               # Swagger/OpenAPI configuration
│   ├── models/
│   │   ├── User.js                  # User model with role support
│   │   ├── Product.js               # Product model with stock tracking
│   │   ├── Cart.js                  # Shopping cart model
│   │   ├── Order.js                 # Order model with status enum
│   │   └── Payment.js               # Payment transaction records
│   ├── controllers/
│   │   ├── authController.js        # Authentication endpoints
│   │   ├── productController.js     # Product CRUD operations
│   │   ├── cartController.js        # Cart management
│   │   ├── orderController.js       # Order processing
│   │   └── adminController.js       # Admin operations
│   ├── services/
│   │   ├── authService.js           # Authentication business logic
│   │   ├── productService.js        # Product business logic
│   │   ├── cartService.js           # Cart business logic
│   │   ├── orderService.js          # Order processing & transactions
│   │   └── adminService.js          # Admin business logic
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication & authorization
│   │   ├── validate.js              # Request validation wrapper
│   │   └── errorHandler.js          # Centralized error handling
│   ├── validators/
│   │   ├── authValidator.js         # Auth request schemas
│   │   ├── productValidator.js      # Product request schemas
│   │   ├── cartValidator.js         # Cart request schemas
│   │   └── orderValidator.js        # Order request schemas
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth routes
│   │   ├── productRoutes.js         # /api/products routes
│   │   ├── cartRoutes.js            # /api/cart routes
│   │   ├── orderRoutes.js           # /api/orders routes
│   │   └── adminRoutes.js           # /api/admin routes
│   ├── utils/
│   │   ├── jwt.js                   # JWT token utilities
│   │   └── asyncQueue.js            # Background job queue
│   └── app.js                       # Main application entry point
├── .env.example                     # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TASK_NODE JS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce-api
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRES_IN=7d
   ORDER_PAYMENT_TIMEOUT_MINUTES=15
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify the server is running**
   ```bash
   curl http://localhost:5000/health
   ```

## MongoDB Transaction Support

### Important Note About Transactions

The API uses MongoDB transactions for atomic operations (checkout, payment processing). However, **transactions require a MongoDB replica set**.

**✅ Already Fixed:** The code automatically detects your MongoDB setup and works in both modes!

### For Local Development (No Action Needed)

If you're using standalone MongoDB (most common for local development), you'll see this message:
```
⚠️  MongoDB transactions not supported. Using fallback mode for development.
```

**This is normal!** The API will work perfectly - it just uses sequential operations instead of transactions.

### For Production (Recommended)

For production deployment, use **MongoDB Atlas** (FREE tier available):
- Full transaction support
- Managed service
- Automatic backups
- See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed instructions

**Read the full guide:** [MONGODB_SETUP.md](MONGODB_SETUP.md)

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | 5000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | 7d | No |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | Minutes before order auto-cancels | 15 | No |

## API Documentation

### Interactive Swagger Documentation

**The easiest way to explore and test the API is through our interactive Swagger documentation:**

🚀 **Access Swagger UI:** `http://localhost:5000/api-docs`

#### Features of Swagger Documentation:

- **Interactive Testing** - Test all endpoints directly from your browser
- **Automatic Authorization** - Save your JWT token once, use it for all requests
- **Multiple Examples** - Pre-configured request examples for each endpoint
- **Complete Schema Documentation** - View all request/response schemas
- **Error Examples** - See examples of validation and error responses
- **Try It Out** - Execute real API calls and see responses instantly

#### How to Use Swagger:

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:5000/api-docs
   ```

3. **Authenticate (for protected endpoints):**
   - Click the "Authorize" button at the top right
   - Login or register to get a JWT token
   - Enter your token in the format: `Bearer <your_token>`
   - Click "Authorize" and "Close"
   - All subsequent requests will include your token automatically

4. **Test an endpoint:**
   - Expand any endpoint (e.g., "POST /auth/register")
   - Click "Try it out"
   - Modify the request body if needed (or use provided examples)
   - Click "Execute"
   - View the response below

5. **Use Examples:**
   - Most endpoints have multiple example payloads
   - Click the "Example Value" dropdown to select different examples
   - Examples include: User/Admin registration, different product types, various order scenarios

#### Swagger Features Included:

- **5 API Groups:**
  - Authentication (2 endpoints)
  - Products (4 endpoints)
  - Cart (3 endpoints)
  - Orders (4 endpoints)
  - Admin (2 endpoints)

- **Comprehensive Documentation:**
  - Detailed descriptions for each endpoint
  - Request parameter documentation
  - Request body schemas with validation rules
  - Multiple response examples (success and error cases)
  - Status code explanations

- **Schema Definitions:**
  - User, Product, Cart, Order, Payment models
  - Pagination schema
  - Error response formats

### Base URL
```
http://localhost:5000/api
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints Overview

#### Authentication (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and get JWT token | Public |

#### Products (`/products`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/products` | Get all products (paginated, searchable) | Public |
| POST | `/products` | Create a new product | Admin |
| PUT | `/products/:id` | Update a product | Admin |
| DELETE | `/products/:id` | Delete a product | Admin |

#### Cart (`/cart`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/cart` | Get user's cart | User |
| POST | `/cart/items` | Add/update item in cart | User |
| DELETE | `/cart/items/:productId` | Remove item from cart | User |

#### Orders (`/orders`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/orders/checkout` | Create order from cart | User |
| POST | `/orders/:id/pay` | Process payment for order | User |
| GET | `/orders` | Get user's order history | User |
| GET | `/orders/:id` | Get single order details | User |

#### Admin (`/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/orders` | Get all orders (filterable) | Admin |
| PATCH | `/admin/orders/:id/status` | Update order status | Admin |

### Detailed API Examples

#### 1. Register a New User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Create a Product (Admin)

**Request:**
```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Wireless Headphones",
  "price": 79.99,
  "description": "High-quality wireless headphones with noise cancellation",
  "stock": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Wireless Headphones",
    "price": 79.99,
    "description": "High-quality wireless headphones with noise cancellation",
    "stock": 100,
    "reservedStock": 0,
    "availableStock": 100,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 4. Get Products with Pagination

**Request:**
```http
GET /api/products?page=1&limit=10&sortBy=price&order=asc&search=headphones
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Wireless Headphones",
      "price": 79.99,
      "description": "High-quality wireless headphones",
      "stock": 100,
      "reservedStock": 5,
      "availableStock": 95
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### 5. Add Item to Cart

**Request:**
```http
POST /api/cart/items
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "productId": "64a1b2c3d4e5f6g7h8i9j0k2",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "items": [
      {
        "productId": {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
          "name": "Wireless Headphones",
          "price": 79.99
        },
        "quantity": 2
      }
    ]
  }
}
```

#### 6. Checkout (Create Order)

**Request:**
```http
POST /api/orders/checkout
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully. Please complete payment within the deadline.",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
    "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "items": [
      {
        "productId": "64a1b2c3d4e5f6g7h8i9j0k2",
        "quantity": 2,
        "priceAtPurchase": 79.99
      }
    ],
    "totalAmount": 159.98,
    "status": "PENDING_PAYMENT",
    "paymentDeadline": "2024-01-15T10:45:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 7. Process Payment

**Request:**
```http
POST /api/orders/64a1b2c3d4e5f6g7h8i9j0k4/pay
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
      "status": "PAID",
      "totalAmount": 159.98
    },
    "payment": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k5",
      "orderId": "64a1b2c3d4e5f6g7h8i9j0k4",
      "transactionId": "TXN-1705315800000-ABC123",
      "amount": 159.98,
      "status": "SUCCESS"
    }
  }
}
```

#### 8. Get User Orders

**Request:**
```http
GET /api/orders?page=1&limit=10&status=PAID
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
      "items": [...],
      "totalAmount": 159.98,
      "status": "PAID",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

#### 9. Admin: Update Order Status

**Request:**
```http
PATCH /api/admin/orders/64a1b2c3d4e5f6g7h8i9j0k4/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
    "status": "SHIPPED",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

## System Workflow

### Complete Order Flow

```
1. User Registration/Login
   ↓
2. Browse Products (Public)
   ↓
3. Add Products to Cart
   ↓
4. Checkout (Creates Order)
   │
   ├─→ Stock Reserved (atomic transaction)
   ├─→ Order Status: PENDING_PAYMENT
   ├─→ Payment Deadline: Current Time + 15 minutes
   └─→ Auto-cancellation scheduled
   ↓
5. Process Payment
   │
   ├─→ Order Status: PAID
   ├─→ Reserved Stock → Actual Stock Decrement
   ├─→ Cart Cleared
   └─→ Confirmation Email Queued
   ↓
6. Admin Updates Status
   │
   ├─→ PAID → SHIPPED
   └─→ SHIPPED → DELIVERED
```

### Stock Reservation Mechanism

```
Product: Wireless Headphones
├─ stock: 100 (total physical inventory)
├─ reservedStock: 0 (temporarily locked during checkout)
└─ availableStock: 100 (calculated: stock - reservedStock)

User A checks out 5 units:
├─ stock: 100 (unchanged)
├─ reservedStock: 5 (incremented)
└─ availableStock: 95 (calculated)

User A completes payment:
├─ stock: 95 (decremented)
├─ reservedStock: 0 (released)
└─ availableStock: 95 (calculated)

OR User A's order times out:
├─ stock: 100 (unchanged)
├─ reservedStock: 0 (released)
└─ availableStock: 100 (calculated)
```

### Order Status Transitions

```
PENDING_PAYMENT
  ├─→ PAID (via payment)
  └─→ CANCELLED (via timeout or manual cancellation)

PAID
  ├─→ SHIPPED (admin action)
  └─→ CANCELLED (admin action)

SHIPPED
  └─→ DELIVERED (admin action)

DELIVERED (final state)
CANCELLED (final state)
```

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['USER', 'ADMIN'],
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```javascript
{
  name: String,
  price: Number,
  description: String,
  stock: Number,
  reservedStock: Number,
  availableStock: Number (virtual field),
  createdAt: Date,
  updatedAt: Date
}
```

### Cart
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    quantity: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    quantity: Number,
    priceAtPurchase: Number
  }],
  totalAmount: Number,
  status: Enum ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  paymentDeadline: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment
```javascript
{
  orderId: ObjectId (ref: Order),
  transactionId: String (unique),
  amount: Number,
  status: Enum ['SUCCESS', 'FAILED'],
  createdAt: Date,
  updatedAt: Date
}
```

## Key Implementation Details

### 1. Atomic Stock Reservation

The checkout process uses MongoDB transactions to ensure atomicity:

```javascript
// Start transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Reserve stock for all items
  for (const item of cartItems) {
    product.reservedStock += item.quantity;
    await product.save({ session });
  }

  // Create order
  await Order.create([orderData], { session });

  // Commit transaction
  await session.commitTransaction();
} catch (error) {
  // Rollback on any error
  await session.abortTransaction();
  throw error;
}
```

### 2. Race Condition Prevention

Multiple users cannot checkout the same item if stock is insufficient:

```javascript
// Check available stock before reservation
const availableStock = product.stock - product.reservedStock;

if (availableStock < requestedQuantity) {
  throw new Error('Insufficient stock');
}
```

### 3. Automatic Order Cancellation

Orders are automatically cancelled after 15 minutes:

```javascript
const scheduleOrderCancellation = (orderId, deadline) => {
  const delay = deadline.getTime() - Date.now();

  setTimeout(async () => {
    // Release reserved stock
    // Update order status to CANCELLED
    await cancelOrder(orderId);
  }, delay);
};
```

### 4. Background Email Queue

Confirmation emails are sent asynchronously:

```javascript
// After successful payment
queueConfirmationEmail({
  orderId: order._id,
  userEmail: user.email,
  totalAmount: order.totalAmount
});

// Processed in background
emailQueue.add(sendConfirmationEmail, emailData);
```

## Testing

### Manual Testing with cURL

1. **Register a User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

2. **Register an Admin**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

3. **Create a Product (Admin)**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "name": "Test Product",
    "price": 29.99,
    "description": "A test product",
    "stock": 50
  }'
```

4. **Add to Cart (User)**
```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "productId": "<product_id>",
    "quantity": 2
  }'
```

5. **Checkout**
```bash
curl -X POST http://localhost:5000/api/orders/checkout \
  -H "Authorization: Bearer <user_token>"
```

6. **Process Payment**
```bash
curl -X POST http://localhost:5000/api/orders/<order_id>/pay \
  -H "Authorization: Bearer <user_token>"
```

### Testing with Postman

Import the included Postman collection (see next section) for a complete set of pre-configured requests.

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [] // Optional: validation errors
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, business logic errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

1. **Password Hashing** - bcryptjs with salt rounds
2. **JWT Authentication** - Secure token-based auth
3. **Rate Limiting** - 100 requests per 15 minutes per IP
4. **Input Validation** - Joi schemas for all inputs
5. **Role-Based Access Control** - User/Admin permissions
6. **CORS Protection** - Configured CORS middleware
7. **Environment Variables** - Sensitive data in .env

## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` in production
- [ ] Use MongoDB Atlas or managed MongoDB service
- [ ] Enable MongoDB replica set for transactions
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up proper logging (Winston, Morgan)
- [ ] Implement rate limiting per user
- [ ] Add request/response logging
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure SSL/TLS
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Replace in-memory queue with Redis/Bull
- [ ] Implement proper email service (SendGrid, AWS SES)
- [ ] Add database backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive unit and integration tests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Node.js, Express, and MongoDB
