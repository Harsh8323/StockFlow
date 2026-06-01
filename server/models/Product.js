const mongoose = require('mongoose');

const STATUSES = ['active', 'inactive', 'discontinued'];

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name must be at most 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, 'SKU must be at least 2 characters'],
      maxlength: [40, 'SKU must be at most 40 characters'],
      match: [/^[A-Z0-9_-]+$/i, 'SKU can only contain letters, numbers, dashes and underscores'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [80, 'Category must be at most 80 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: 'Stock quantity must be a number',
      },
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: [0, 'Reorder level cannot be negative'],
      default: 0,
    },
    supplierName: {
      type: String,
      trim: true,
      maxlength: [120, 'Supplier name must be at most 120 characters'],
      default: '',
    },
    productImage: {
      type: String,
      default: '',
    },
    productImagePublicId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of ${STATUSES.join(', ')}` },
      default: 'active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('isLowStock').get(function isLowStock() {
  return Number(this.stockQuantity) < Number(this.reorderLevel);
});

productSchema.index({ productName: 'text', sku: 'text', supplierName: 'text' });

productSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Product', productSchema);
