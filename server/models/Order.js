const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

const FINAL_STATUSES = new Set(['delivered', 'cancelled']);

/**
 * Valid forward transitions for order status.
 * Cancellation from any non-final state is handled separately (it triggers a
 * stock restore in the controller).
 */
const STATUS_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'cancelled'],
  delivered:  [],
  cancelled:  [],
};

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Snapshot of the product at order time so historical orders stay accurate
    // even if the underlying product is renamed, repriced, or deleted later.
    productName: { type: String, required: true, trim: true },
    sku:         { type: String, required: true, trim: true, uppercase: true },
    unitPrice:   { type: Number, required: true, min: 0 },
    quantity:    { type: Number, required: true, min: 1 },
    lineTotal:   { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true },
    phone:   { type: String, default: '' },
    email:   { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from:      { type: String, enum: ORDER_STATUSES, required: true },
    to:        { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date,   default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes:     { type: String, default: '', trim: true, maxlength: 500 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerSnapshot: { type: customerSnapshotSchema, required: true },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must include at least one item',
      },
    },

    // Money — all computed on the backend.
    subtotal:    { type: Number, required: true, min: 0 },
    gstRate:     { type: Number, required: true, min: 0, max: 100, default: 18 },
    gstAmount:   { type: Number, required: true, min: 0 },
    discount:    { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    amountPaid:   { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: { values: PAYMENT_STATUSES, message: `Payment status must be one of ${PAYMENT_STATUSES.join(', ')}` },
      default: 'unpaid',
      index: true,
    },

    orderStatus: {
      type: String,
      enum: { values: ORDER_STATUSES, message: `Order status must be one of ${ORDER_STATUSES.join(', ')}` },
      default: 'pending',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    cancelledAt:   { type: Date, default: null },

    notes: { type: String, default: '', trim: true, maxlength: 1000 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customerSnapshot.name': 'text', invoiceNumber: 'text', notes: 'text' });

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;
orderSchema.statics.PAYMENT_STATUSES = PAYMENT_STATUSES;
orderSchema.statics.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
orderSchema.statics.FINAL_STATUSES = FINAL_STATUSES;

orderSchema.statics.isValidTransition = function isValidTransition(from, to) {
  if (from === to) return false;
  return (STATUS_TRANSITIONS[from] || []).includes(to);
};

module.exports = mongoose.model('Order', orderSchema);
