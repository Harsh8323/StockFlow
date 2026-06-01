const mongoose = require('mongoose');

const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

const asyncHandler = require('../utils/asyncHandler');
const { writeInventoryLog } = require('../utils/inventoryLog');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (v) =>
  v === undefined || v === null || v === ''
    ? []
    : String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

// ---------------------------------------------------------------------------
// GET /api/inventory/stats
// ---------------------------------------------------------------------------
const getInventoryStats = asyncHandler(async (req, res) => {
  const [aggregate, lowStockCount, outOfStockCount, totalActive] = await Promise.all([
    Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalStockValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
          totalUnits: { $sum: '$stockQuantity' },
        },
      },
    ]),
    Product.countDocuments({
      $expr: { $lt: ['$stockQuantity', '$reorderLevel'] },
      status: 'active',
    }),
    Product.countDocuments({ stockQuantity: 0, status: 'active' }),
    Product.countDocuments({ status: 'active' }),
  ]);

  res.json({
    totalActiveProducts: totalActive,
    totalStockValue: aggregate[0]?.totalStockValue || 0,
    totalUnits: aggregate[0]?.totalUnits || 0,
    lowStockCount,
    outOfStockCount,
  });
});

// ---------------------------------------------------------------------------
// GET /api/inventory/logs
// ---------------------------------------------------------------------------
const listLogs = asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ productName: re }, { sku: re }, { notes: re }];
  }

  if (req.query.product && mongoose.isValidObjectId(req.query.product)) {
    filter.product = req.query.product;
  }

  const types = toList(req.query.type);
  if (types.length === 1) filter.type = types[0];
  else if (types.length > 1) filter.type = { $in: types };

  const reasons = toList(req.query.reason);
  if (reasons.length === 1) filter.reason = reasons[0];
  else if (reasons.length > 1) filter.reason = { $in: reasons };

  if (req.query.direction === 'in')  filter.change = { $gt: 0 };
  if (req.query.direction === 'out') filter.change = { $lt: 0 };

  const from = req.query.from ? new Date(req.query.from) : null;
  const to   = req.query.to   ? new Date(req.query.to)   : null;
  if ((from && !Number.isNaN(+from)) || (to && !Number.isNaN(+to))) {
    filter.createdAt = {};
    if (from && !Number.isNaN(+from)) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(+to)) {
      const end = new Date(to);
      if (req.query.to.length <= 10) end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [items, total] = await Promise.all([
    InventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrder', 'invoiceNumber orderStatus')
      .populate('createdBy', 'name email')
      .populate('product', 'productImage status')
      .lean(),
    InventoryLog.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNext: skip + items.length < total,
      hasPrev: page > 1,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/inventory/adjustments   (admin only — enforced at route level)
// Body: { product, direction: 'in'|'out', quantity, reason, notes? }
// ---------------------------------------------------------------------------
const createAdjustment = asyncHandler(async (req, res) => {
  const { product: productId, direction, quantity, reason, notes } = req.body || {};

  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400);
    throw new Error('A valid product is required');
  }
  if (!['in', 'out'].includes(direction)) {
    res.status(400);
    throw new Error('direction must be "in" or "out"');
  }
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < 1) {
    res.status(400);
    throw new Error('Quantity must be a positive integer');
  }
  if (!InventoryLog.MANUAL_REASONS.has(reason)) {
    res.status(400);
    throw new Error(
      `reason must be one of ${[...InventoryLog.MANUAL_REASONS].join(', ')}`
    );
  }

  const change = direction === 'in' ? qty : -qty;

  // Atomic, race-safe stock change. For "out" we require enough stock first.
  const updateFilter =
    direction === 'out'
      ? { _id: productId, stockQuantity: { $gte: qty } }
      : { _id: productId };

  const product = await Product.findOneAndUpdate(
    updateFilter,
    { $inc: { stockQuantity: change } },
    { new: true }
  );

  if (!product) {
    // Distinguish "missing" from "insufficient stock".
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.status(409);
    throw new Error('Insufficient stock for this adjustment');
  }

  const stockAfter = product.stockQuantity;
  const stockBefore = stockAfter - change;

  const log = await writeInventoryLog({
    product,
    type: 'manual',
    reason,
    change,
    stockBefore,
    stockAfter,
    notes,
    createdBy: req.user.id,
  });

  // Re-populate user/order for the response shape used by the UI.
  const populatedLog = await InventoryLog.findById(log._id)
    .populate('relatedOrder', 'invoiceNumber orderStatus')
    .populate('createdBy', 'name email')
    .populate('product', 'productImage status')
    .lean();

  res.status(201).json({ product, log: populatedLog });
});

module.exports = {
  getInventoryStats,
  listLogs,
  createAdjustment,
};
