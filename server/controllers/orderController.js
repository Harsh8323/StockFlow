const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const asyncHandler = require('../utils/asyncHandler');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const { computeOrderTotals, derivePaymentStatus, round2 } = require('../utils/orderTotals');
const { writeInventoryLog } = require('../utils/inventoryLog');
const { generateInvoicePdf } = require('../utils/invoicePdf');

const SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'invoiceNumber',
  'totalAmount',
  'orderStatus',
  'paymentStatus',
]);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (v) =>
  v === undefined || v === null || v === ''
    ? []
    : String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const toNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Run an async function inside a Mongo transaction.
 * Falls back to a plain (non-transactional) execution if the connected
 * deployment doesn't support transactions (e.g. local single-node Mongo).
 */
const runWithTransaction = async (fn) => {
  let session;
  try {
    session = await mongoose.startSession();
  } catch {
    return fn(null);
  }

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try { await session.abortTransaction(); } catch { /* ignore */ }

    // Auto-fallback for single-node Mongo deployments.
    const msg = err?.message || '';
    if (
      err?.codeName === 'IllegalOperation' ||
      /Transaction numbers are only allowed/i.test(msg) ||
      /replica set/i.test(msg)
    ) {
      console.warn('[orders] Transactions unavailable, retrying without a session');
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
};

const recomputeCustomerLastOrderAt = async (customerId, session) => {
  const query = Order.findOne({
    customer: customerId,
    orderStatus: { $ne: 'cancelled' },
  })
    .sort({ createdAt: -1 })
    .select('createdAt');
  if (session) query.session(session);
  const latest = await query.lean();
  return latest ? latest.createdAt : null;
};

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
const createOrder = asyncHandler(async (req, res) => {
  const { customer: customerId, items, gstRate, discount, amountPaid, notes } = req.body || {};

  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    res.status(400);
    throw new Error('A valid customer is required');
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Order must include at least one item');
  }

  // Sanitize items
  const normalizedItems = items.map((it, idx) => {
    if (!it || !mongoose.isValidObjectId(it.product)) {
      throw Object.assign(new Error(`Item ${idx + 1}: invalid product id`), { status: 400 });
    }
    const qty = Math.floor(Number(it.quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      throw Object.assign(new Error(`Item ${idx + 1}: quantity must be a positive integer`), { status: 400 });
    }
    return { product: String(it.product), quantity: qty };
  });

  // Reject duplicate product references (the UI should already de-dupe).
  const uniqueProductIds = [...new Set(normalizedItems.map((i) => i.product))];
  if (uniqueProductIds.length !== normalizedItems.length) {
    res.status(400);
    throw new Error('Each product can only appear once in an order');
  }

  const created = await runWithTransaction(async (session) => {
    const customerQuery = Customer.findById(customerId);
    if (session) customerQuery.session(session);
    const customer = await customerQuery;
    if (!customer) {
      throw Object.assign(new Error('Customer not found'), { status: 404 });
    }
    if (customer.isActive === false) {
      throw Object.assign(new Error('Cannot create orders for an inactive customer'), { status: 400 });
    }

    // Fetch all products in one query.
    const productQuery = Product.find({ _id: { $in: uniqueProductIds } });
    if (session) productQuery.session(session);
    const products = await productQuery;
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Build priced items + per-product stock validation.
    const pricedItems = normalizedItems.map((it) => {
      const p = productMap.get(it.product);
      if (!p) {
        throw Object.assign(new Error(`Product ${it.product} not found`), { status: 404 });
      }
      if (p.status === 'discontinued' || p.status === 'inactive') {
        throw Object.assign(
          new Error(`Product "${p.productName}" is ${p.status} and cannot be ordered`),
          { status: 400 }
        );
      }
      if (p.stockQuantity < it.quantity) {
        throw Object.assign(
          new Error(
            `Insufficient stock for "${p.productName}" (requested ${it.quantity}, available ${p.stockQuantity})`
          ),
          { status: 409 }
        );
      }
      return {
        product: p._id,
        productName: p.productName,
        sku: p.sku,
        unitPrice: p.price,
        quantity: it.quantity,
      };
    });

    // Backend computes all money.
    const totals = computeOrderTotals(pricedItems, gstRate, discount);
    const itemsForOrder = pricedItems.map((it, idx) => ({
      ...it,
      lineTotal: totals.lineTotals[idx],
    }));

    const paid = Math.max(0, toNumber(amountPaid, 0));
    const cappedPaid = Math.min(paid, totals.totalAmount);
    const paymentStatus = derivePaymentStatus(cappedPaid, totals.totalAmount);

    // Atomic conditional stock deduction (guards against TOCTOU races even
    // outside a transaction). If any update returns null, abort.
    // We capture each deduction so we can emit inventory log entries below.
    const stockMovements = [];
    for (const it of pricedItems) {
      const update = Product.findOneAndUpdate(
        { _id: it.product, stockQuantity: { $gte: it.quantity } },
        { $inc: { stockQuantity: -it.quantity } },
        { new: true }
      );
      if (session) update.session(session);
      const decremented = await update;
      if (!decremented) {
        throw Object.assign(
          new Error(`Stock changed while creating the order. Please retry with updated quantities.`),
          { status: 409 }
        );
      }
      stockMovements.push({
        product: decremented,
        quantity: it.quantity,
        stockBefore: decremented.stockQuantity + it.quantity,
        stockAfter: decremented.stockQuantity,
      });
    }

    const invoiceNumber = await generateInvoiceNumber(new Date(), session || undefined);

    const [order] = await Order.create(
      [
        {
          invoiceNumber,
          customer: customer._id,
          customerSnapshot: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          },
          items: itemsForOrder,
          subtotal:   totals.subtotal,
          gstRate:    Math.max(0, Math.min(100, toNumber(gstRate, 18))),
          gstAmount:  totals.gstAmount,
          discount:   totals.discount,
          totalAmount: totals.totalAmount,
          amountPaid: cappedPaid,
          paymentStatus,
          orderStatus: 'pending',
          statusHistory: [],
          notes: typeof notes === 'string' ? notes.trim() : '',
          createdBy: req.user.id,
        },
      ],
      session ? { session } : undefined
    );

    // Emit one inventory log entry per item — inside the same transaction.
    for (const mv of stockMovements) {
      await writeInventoryLog({
        product: mv.product,
        type: 'system',
        reason: 'order_placed',
        change: -mv.quantity,
        stockBefore: mv.stockBefore,
        stockAfter: mv.stockAfter,
        relatedOrder: order._id,
        notes: `Order ${order.invoiceNumber}`,
        createdBy: req.user.id,
        session,
      });
    }

    // Update customer aggregates.
    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.totalSpent = round2((customer.totalSpent || 0) + totals.totalAmount);
    customer.lastOrderAt = order.createdAt;
    if (session) await customer.save({ session });
    else await customer.save();

    return order;
  });

  const populated = await Order.findById(created._id)
    .populate('customer', 'name email phone address isActive')
    .populate('createdBy', 'name email')
    .lean();

  res.status(201).json({ order: populated });
});

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------
const buildListQuery = (req) => {
  const filter = {};

  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [
      { invoiceNumber: re },
      { 'customerSnapshot.name': re },
      { 'customerSnapshot.phone': re },
      { 'customerSnapshot.email': re },
      { notes: re },
    ];
  }

  const orderStatuses = toList(req.query.orderStatus);
  if (orderStatuses.length === 1) filter.orderStatus = orderStatuses[0];
  else if (orderStatuses.length > 1) filter.orderStatus = { $in: orderStatuses };

  const paymentStatuses = toList(req.query.paymentStatus);
  if (paymentStatuses.length === 1) filter.paymentStatus = paymentStatuses[0];
  else if (paymentStatuses.length > 1) filter.paymentStatus = { $in: paymentStatuses };

  if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) {
    filter.customer = req.query.customer;
  }

  const from = req.query.from ? new Date(req.query.from) : null;
  const to   = req.query.to   ? new Date(req.query.to)   : null;
  if ((from && !Number.isNaN(+from)) || (to && !Number.isNaN(+to))) {
    filter.createdAt = {};
    if (from && !Number.isNaN(+from)) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(+to)) {
      // Treat `to` as inclusive end-of-day if it's a pure date.
      const end = new Date(to);
      if (req.query.to.length <= 10) end.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const minTotal = toNumber(req.query.minTotal);
  const maxTotal = toNumber(req.query.maxTotal);
  if (minTotal !== undefined || maxTotal !== undefined) {
    filter.totalAmount = {};
    if (minTotal !== undefined) filter.totalAmount.$gte = minTotal;
    if (maxTotal !== undefined) filter.totalAmount.$lte = maxTotal;
  }

  return filter;
};

const listOrders = asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = buildListQuery(req);
  const sortField = SORT_FIELDS.has(String(req.query.sortBy)) ? req.query.sortBy : 'createdAt';
  const sortOrder = String(req.query.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .lean(),
    Order.countDocuments(filter),
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

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone address isActive')
    .populate('createdBy', 'name email')
    .populate('statusHistory.changedBy', 'name email')
    .populate('items.product', 'productName sku productImage status')
    .lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({ order });
});

// ---------------------------------------------------------------------------
// PUT /api/orders/:id/status
// Body: { orderStatus?, paymentStatus?, amountPaid?, notes? }
// ---------------------------------------------------------------------------
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, amountPaid, notes } = req.body || {};

  const updated = await runWithTransaction(async (session) => {
    const query = Order.findById(req.params.id);
    if (session) query.session(session);
    const order = await query;
    if (!order) {
      throw Object.assign(new Error('Order not found'), { status: 404 });
    }

    let didStatusChange = false;
    let didCancel = false;

    // ----- Order status transition -----
    if (typeof orderStatus === 'string' && orderStatus !== order.orderStatus) {
      if (!Order.ORDER_STATUSES.includes(orderStatus)) {
        throw Object.assign(
          new Error(`Invalid status. Allowed: ${Order.ORDER_STATUSES.join(', ')}`),
          { status: 400 }
        );
      }
      if (Order.FINAL_STATUSES.has(order.orderStatus)) {
        throw Object.assign(
          new Error(`Order is ${order.orderStatus} and cannot change status`),
          { status: 400 }
        );
      }
      if (!Order.isValidTransition(order.orderStatus, orderStatus)) {
        throw Object.assign(
          new Error(`Cannot transition from "${order.orderStatus}" to "${orderStatus}"`),
          { status: 400 }
        );
      }

      const from = order.orderStatus;
      order.orderStatus = orderStatus;
      order.statusHistory.push({
        from,
        to: orderStatus,
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
      });
      didStatusChange = true;

      // Cancellation side effects.
      if (orderStatus === 'cancelled') {
        didCancel = true;
        order.cancelledAt = new Date();

        // Restore stock for each item. If a product was deleted, log & skip.
        for (const item of order.items) {
          const restoreQuery = Product.findByIdAndUpdate(
            item.product,
            { $inc: { stockQuantity: item.quantity } },
            { new: true }
          );
          if (session) restoreQuery.session(session);
          const restored = await restoreQuery;
          if (!restored) {
            console.warn(
              `[orders] Could not restore stock for ${item.productName} (product missing) on cancel of ${order.invoiceNumber}`
            );
            continue;
          }
          await writeInventoryLog({
            product: restored,
            type: 'system',
            reason: 'order_cancelled',
            change: item.quantity,
            stockBefore: restored.stockQuantity - item.quantity,
            stockAfter: restored.stockQuantity,
            relatedOrder: order._id,
            notes: `Order ${order.invoiceNumber} cancelled`,
            createdBy: req.user.id,
            session,
          });
        }

        // Adjust customer aggregates.
        const customerQuery = Customer.findById(order.customer);
        if (session) customerQuery.session(session);
        const customer = await customerQuery;
        if (customer) {
          customer.totalOrders = Math.max(0, (customer.totalOrders || 0) - 1);
          customer.totalSpent = Math.max(0, round2((customer.totalSpent || 0) - order.totalAmount));
          customer.lastOrderAt = await recomputeCustomerLastOrderAt(customer._id, session);
          if (session) await customer.save({ session });
          else await customer.save();
        }
      }
    }

    // ----- Payment status / amount paid -----
    let paymentChanged = false;
    if (amountPaid !== undefined && amountPaid !== null && amountPaid !== '') {
      const paid = Math.max(0, toNumber(amountPaid, 0));
      const capped = Math.min(paid, order.totalAmount);
      if (capped !== order.amountPaid) {
        order.amountPaid = capped;
        paymentChanged = true;
      }
    }
    if (typeof paymentStatus === 'string' && paymentStatus !== order.paymentStatus) {
      if (!Order.PAYMENT_STATUSES.includes(paymentStatus)) {
        throw Object.assign(
          new Error(`Invalid payment status. Allowed: ${Order.PAYMENT_STATUSES.join(', ')}`),
          { status: 400 }
        );
      }
      order.paymentStatus = paymentStatus;
      // Keep amountPaid in sync if caller specified a status without an amount.
      if (paymentStatus === 'paid' && order.amountPaid < order.totalAmount) {
        order.amountPaid = order.totalAmount;
      } else if (paymentStatus === 'unpaid') {
        order.amountPaid = 0;
      }
      paymentChanged = true;
    } else if (paymentChanged) {
      order.paymentStatus = derivePaymentStatus(order.amountPaid, order.totalAmount);
    }

    if (!didStatusChange && !paymentChanged) {
      throw Object.assign(new Error('No status or payment changes provided'), { status: 400 });
    }

    if (session) await order.save({ session });
    else await order.save();

    return { order, didCancel };
  });

  const populated = await Order.findById(updated.order._id)
    .populate('customer', 'name email phone address isActive')
    .populate('createdBy', 'name email')
    .populate('statusHistory.changedBy', 'name email')
    .populate('items.product', 'productName sku productImage status')
    .lean();

  res.json({ order: populated, cancelled: updated.didCancel });
});

// ---------------------------------------------------------------------------
// GET /api/orders/recent  — for dashboard
// ---------------------------------------------------------------------------
const listRecentOrders = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 25);
  const items = await Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('customer', 'name')
    .lean();
  res.json({ items });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id/invoice  →  application/pdf stream
// ---------------------------------------------------------------------------
const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const order = await Order.findById(id).lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const organization = {
    name:    process.env.ORG_NAME    || 'StockFlow',
    tagline: process.env.ORG_TAGLINE || 'Order & Inventory Management',
    email:   process.env.ORG_EMAIL   || '',
    phone:   process.env.ORG_PHONE   || '',
    address: process.env.ORG_ADDRESS || '',
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${order.invoiceNumber}.pdf"`
  );

  generateInvoicePdf({ order, organization }, res);
});

module.exports = {
  createOrder,
  listOrders,
  listRecentOrders,
  getOrder,
  updateOrderStatus,
  downloadInvoicePdf,
};
