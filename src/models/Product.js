const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for available stock
productSchema.virtual('availableStock').get(function () {
  return this.stock - this.reservedStock;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for efficient searching and sorting
productSchema.index({ name: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
