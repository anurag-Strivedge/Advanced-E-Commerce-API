const mongoose = require('mongoose');

// Order status enum
const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ORDER_STATUS),
        message: 'Invalid order status',
      },
      default: ORDER_STATUS.PENDING_PAYMENT,
    },
    paymentDeadline: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentDeadline: 1 });

// Static method to get order statuses
orderSchema.statics.getStatuses = function () {
  return ORDER_STATUS;
};

const Order = mongoose.model('Order', orderSchema);

// Export both the model and status enum
module.exports = Order;
module.exports.ORDER_STATUS = ORDER_STATUS;
