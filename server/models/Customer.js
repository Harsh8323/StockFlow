const mongoose = require('mongoose');
const validator = require('validator');

// Loose phone regex: allows + prefix, digits, spaces, dashes, parentheses; 6–25 chars.
const PHONE_REGEX = /^[+]?[\d\s\-()]{6,25}$/;

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: {
        validator: (v) => !v || validator.isEmail(v),
        message: 'Please provide a valid email address',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [PHONE_REGEX, 'Phone number is not valid'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address must be at most 500 characters'],
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes must be at most 1000 characters'],
      default: '',
    },

    // Order-history aggregates — populated/incremented by the Order module in Phase 4.
    totalOrders: { type: Number, default: 0, min: 0 },
    totalSpent:  { type: Number, default: 0, min: 0 },
    lastOrderAt: { type: Date,   default: null },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Partial-unique indexes: only enforce uniqueness when the field has a value.
// This lets multiple customers exist without an email/phone but blocks duplicates.
customerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $gt: '' } },
    name: 'email_unique_when_present',
  }
);
customerSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string', $gt: '' } },
    name: 'phone_unique_when_present',
  }
);
customerSchema.index({ name: 'text', email: 'text', phone: 'text', notes: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
