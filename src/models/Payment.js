const mongoose = require('mongoose');

const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: 'Payment status must be either SUCCESS or FAILED',
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
paymentSchema.index({ orderId: 1 });
// transactionId already has unique index (line 18)

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
