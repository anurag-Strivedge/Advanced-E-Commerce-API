const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate total items in cart
cartSchema.methods.getTotalItems = function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
