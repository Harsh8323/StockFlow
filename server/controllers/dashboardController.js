const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const asyncHandler = require('../utils/asyncHandler');

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const startOfMonth = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
};

const NON_CANCELLED = { orderStatus: { $ne: 'cancelled' } };

// ---------------------------------------------------------------------------
// GET /api/dashboard/stats
// Top KPI strip — revenue, orders, customers, low stock + month-over-month.
// ---------------------------------------------------------------------------
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);
  const prevMonthStart = startOfMonth(prevMonthEnd);

  const [
    monthAgg,
    prevMonthAgg,
    allTimeAgg,
    monthCount,
    prevMonthCount,
    pendingCount,
    customersCount,
    activeProducts,
    lowStockCount,
    outOfStockCount,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...NON_CANCELLED, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { ...NON_CANCELLED, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: NON_CANCELLED },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    ]),
    Order.countDocuments({ ...NON_CANCELLED, createdAt: { $gte: monthStart } }),
    Order.countDocuments({
      ...NON_CANCELLED,
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    }),
    Order.countDocuments({ orderStatus: 'pending' }),
    Customer.countDocuments({ isActive: true }),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({
      status: 'active',
      $expr: { $lt: ['$stockQuantity', '$reorderLevel'] },
    }),
    Product.countDocuments({ status: 'active', stockQuantity: 0 }),
  ]);

  const monthRevenue = monthAgg[0]?.revenue || 0;
  const prevMonthRevenue = prevMonthAgg[0]?.revenue || 0;

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  res.json({
    revenue: {
      thisMonth: monthRevenue,
      lastMonth: prevMonthRevenue,
      pctChange: pctChange(monthRevenue, prevMonthRevenue),
      allTime: allTimeAgg[0]?.revenue || 0,
    },
    orders: {
      thisMonth: monthCount,
      lastMonth: prevMonthCount,
      pctChange: pctChange(monthCount, prevMonthCount),
      pending: pendingCount,
      allTime: allTimeAgg[0]?.orders || 0,
    },
    customers: { active: customersCount },
    inventory: {
      activeProducts,
      lowStockCount,
      outOfStockCount,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/sales-over-time?days=30
// Daily revenue + order count buckets, zero-filled.
// ---------------------------------------------------------------------------
const getSalesOverTime = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 180);

  const end = endOfDay(new Date());
  const start = startOfDay(new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const buckets = await Order.aggregate([
    { $match: { ...NON_CANCELLED, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
  ]);

  // Index buckets by key for zero-fill below.
  const byKey = new Map(
    buckets.map((b) => [`${b._id.y}-${b._id.m}-${b._id.d}`, { revenue: b.revenue, orders: b.orders }])
  );

  const series = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    const entry = byKey.get(key) || { revenue: 0, orders: 0 };
    series.push({
      date: day.toISOString().slice(0, 10),
      revenue: entry.revenue,
      orders: entry.orders,
    });
  }

  res.json({ days, from: start, to: end, series });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/top-products?days=30&limit=5
// Best-selling products by units & revenue across non-cancelled orders.
// ---------------------------------------------------------------------------
const getTopProducts = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

  const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

  const items = await Order.aggregate([
    { $match: { ...NON_CANCELLED, createdAt: { $gte: from } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $last: '$items.productName' },
        sku: { $last: '$items.sku' },
        units: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        sku: 1,
        units: 1,
        revenue: 1,
        productImage: { $arrayElemAt: ['$product.productImage', 0] },
        stockQuantity: { $arrayElemAt: ['$product.stockQuantity', 0] },
      },
    },
  ]);

  res.json({ days, limit, items });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/status-breakdown
// Pie/donut data for current order pipeline & payment pipeline.
// ---------------------------------------------------------------------------
const getStatusBreakdown = asyncHandler(async (req, res) => {
  const [orderStatus, paymentStatus] = await Promise.all([
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: NON_CANCELLED },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    orderStatus: orderStatus.map((s) => ({ status: s._id, count: s.count, value: s.value })),
    paymentStatus: paymentStatus.map((s) => ({ status: s._id, count: s.count, value: s.value })),
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/top-customers?days=30&limit=10
// Customers ranked by spend across non-cancelled orders in the given window.
// ---------------------------------------------------------------------------
const getTopCustomers = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

  const items = await Order.aggregate([
    { $match: { ...NON_CANCELLED, createdAt: { $gte: from } } },
    {
      $group: {
        _id: '$customer',
        name:        { $last: '$customerSnapshot.name' },
        email:       { $last: '$customerSnapshot.email' },
        phone:       { $last: '$customerSnapshot.phone' },
        revenue:     { $sum: '$totalAmount' },
        orders:      { $sum: 1 },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        revenue: 1,
        orders: 1,
        lastOrderAt: 1,
        isActive: { $arrayElemAt: ['$customer.isActive', 0] },
      },
    },
  ]);

  res.json({ days, limit, items });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/revenue-by-category?days=30
// Revenue & units grouped by product category for non-cancelled orders.
// ---------------------------------------------------------------------------
const getRevenueByCategory = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

  const items = await Order.aggregate([
    { $match: { ...NON_CANCELLED, createdAt: { $gte: from } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $addFields: {
        category: {
          $ifNull: [{ $arrayElemAt: ['$product.category', 0] }, 'Uncategorized'],
        },
      },
    },
    {
      $group: {
        _id: '$category',
        revenue: { $sum: '$items.lineTotal' },
        units:   { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, category: '$_id', revenue: 1, units: 1 } },
  ]);

  res.json({ days, items });
});

module.exports = {
  getStats,
  getSalesOverTime,
  getTopProducts,
  getStatusBreakdown,
  getTopCustomers,
  getRevenueByCategory,
};
