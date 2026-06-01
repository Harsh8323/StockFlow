const mongoose = require('mongoose');

// Two top-level types so the UI can quickly tell automatic from human actions:
//   system  — emitted automatically by the platform (order events, initial stock)
//   manual  — created by a human via the inventory adjustment form
const LOG_TYPES = ['system', 'manual'];

// All possible reasons. Some are exclusively system-emitted, others are
// chosen by the admin in the adjustment form.
const LOG_REASONS = [
  'initial',          // system: product was created with stock > 0
  'order_placed',     // system: stock deducted by a new order
  'order_cancelled',  // system: stock restored from a cancelled order
  'restock',          // manual: supplier delivery, replenishment
  'damage',           // manual: damaged or lost stock
  'return',           // manual: customer return added back to stock
  'correction',       // manual: fixing an incorrect count
  'other',            // manual: catch-all
];

const SYSTEM_REASONS = new Set(['initial', 'order_placed', 'order_cancelled']);
const MANUAL_REASONS = new Set(['restock', 'damage', 'return', 'correction', 'other']);

const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    // Snapshot at log time so logs survive product rename/delete.
    productName: { type: String, required: true, trim: true },
    sku:         { type: String, required: true, trim: true, uppercase: true },

    type: {
      type: String,
      enum: { values: LOG_TYPES, message: `Type must be one of ${LOG_TYPES.join(', ')}` },
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: { values: LOG_REASONS, message: `Reason must be one of ${LOG_REASONS.join(', ')}` },
      required: true,
      index: true,
    },

    // Signed change: positive = stock in, negative = stock out.
    change:      { type: Number, required: true },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter:  { type: Number, required: true, min: 0 },

    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },

    notes: { type: String, default: '', trim: true, maxlength: 500 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Allowed to be null for very early system events (rare).
      default: null,
    },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ createdAt: -1 });
inventoryLogSchema.index({ product: 1, createdAt: -1 });

inventoryLogSchema.statics.LOG_TYPES = LOG_TYPES;
inventoryLogSchema.statics.LOG_REASONS = LOG_REASONS;
inventoryLogSchema.statics.SYSTEM_REASONS = SYSTEM_REASONS;
inventoryLogSchema.statics.MANUAL_REASONS = MANUAL_REASONS;

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
