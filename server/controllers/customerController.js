const Customer = require('../models/Customer');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

const SORT_FIELDS = new Set([
  'name',
  'email',
  'phone',
  'totalOrders',
  'totalSpent',
  'lastOrderAt',
  'createdAt',
  'updatedAt',
]);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes'].includes(s)) return true;
  if (['false', '0', 'no'].includes(s)) return false;
  return undefined;
};

const normalizeCustomerPayload = (raw = {}) => {
  const out = { ...raw };
  if (typeof out.name === 'string')    out.name    = out.name.trim();
  if (typeof out.email === 'string')   out.email   = out.email.trim().toLowerCase();
  if (typeof out.phone === 'string')   out.phone   = out.phone.trim();
  if (typeof out.address === 'string') out.address = out.address.trim();
  if (typeof out.notes === 'string')   out.notes   = out.notes.trim();
  if (out.isActive !== undefined)      out.isActive = parseBool(out.isActive);
  return out;
};

const buildListQuery = (req) => {
  const filter = {};

  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [
      { name: re },
      { email: re },
      { phone: re },
      { notes: re },
    ];
  }

  const isActive = parseBool(req.query.isActive);
  if (isActive !== undefined) filter.isActive = isActive;

  return filter;
};

const buildSort = (req) => {
  const field = SORT_FIELDS.has(String(req.query.sortBy)) ? req.query.sortBy : 'createdAt';
  const order = String(req.query.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  return { [field]: order };
};

// GET /api/customers
const listCustomers = asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = buildListQuery(req);
  const sort   = buildSort(req);

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean(),
    Customer.countDocuments(filter),
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

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate('createdBy', 'name email')
    .lean();
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  res.json({ customer });
});

// GET /api/customers/:id/orders
const getCustomerOrders = asyncHandler(async (req, res) => {
  const exists = await Customer.exists({ _id: req.params.id });
  if (!exists) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = { customer: req.params.id };

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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

// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const payload = normalizeCustomerPayload(req.body);

  if (!payload.name || !payload.phone) {
    res.status(400);
    throw new Error('Name and phone are required');
  }

  const customer = await Customer.create({ ...payload, createdBy: req.user.id });
  await customer.populate('createdBy', 'name email');
  res.status(201).json({ customer });
});

// PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const payload = normalizeCustomerPayload(req.body);

  const updatable = ['name', 'email', 'phone', 'address', 'notes', 'isActive'];
  for (const key of updatable) {
    if (payload[key] !== undefined) customer[key] = payload[key];
  }

  await customer.save();
  await customer.populate('createdBy', 'name email');
  res.json({ customer });
});

// DELETE /api/customers/:id  (admin only — enforced at route level)
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }
  await customer.deleteOne();
  res.json({ message: 'Customer deleted', id: req.params.id });
});

module.exports = {
  listCustomers,
  getCustomer,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
