const mongoose = require('mongoose');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const SORT_FIELDS = new Set(['name', 'email', 'role', 'createdAt', 'updatedAt']);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes'].includes(s)) return true;
  if (['false', '0', 'no'].includes(s)) return false;
  return undefined;
};

// GET /api/users
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }

  if (req.query.role && User.ROLES.includes(req.query.role)) {
    filter.role = req.query.role;
  }

  const isActive = parseBool(req.query.isActive);
  if (isActive !== undefined) filter.isActive = isActive;

  const sortField = SORT_FIELDS.has(String(req.query.sortBy)) ? req.query.sortBy : 'createdAt';
  const sortOrder = String(req.query.sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    items: items.map((u) => {
      const { password, ...safe } = u;
      return safe;
    }),
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

// GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ user: user.toSafeJSON() });
});

// POST /api/users — admin creates staff or admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, isActive } = req.body || {};

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (String(password).length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const assignedRole = User.ROLES.includes(role) ? role : 'staff';
  const normalizedEmail = String(email).toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: assignedRole,
    isActive: isActive !== undefined ? !!parseBool(isActive) : true,
  });

  res.status(201).json({ user: user.toSafeJSON() });
});

// PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, role, isActive, password } = req.body || {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      res.status(400);
      throw new Error('Name cannot be empty');
    }
    user.name = trimmed;
  }

  if (email !== undefined) {
    const normalized = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }
    if (normalized !== user.email) {
      const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (taken) {
        res.status(409);
        throw new Error('Email is already in use');
      }
      user.email = normalized;
    }
  }

  if (role !== undefined && User.ROLES.includes(role) && role !== user.role) {
    // Demoting the last active admin is not allowed.
    if (user.role === 'admin' && role === 'staff') {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) {
        res.status(409);
        throw new Error('Cannot change role: this is the only active admin');
      }
    }
    user.role = role;
  }

  if (isActive !== undefined) {
    const nextActive = parseBool(isActive);
    if (nextActive === false && String(user._id) === String(req.user.id)) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }
    if (nextActive === false && user.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', isActive: true });
      if (admins <= 1) {
        res.status(409);
        throw new Error('Cannot deactivate the only active admin');
      }
    }
    user.isActive = nextActive;
  }

  if (password !== undefined && String(password).trim()) {
    if (String(password).length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    user.password = password;
  }

  await user.save();
  res.json({ user: user.toSafeJSON() });
});

// DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid user id');
  }

  if (String(id) === String(req.user.id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1) {
      res.status(409);
      throw new Error('Cannot delete the only admin account');
    }
  }

  await user.deleteOne();
  res.json({ message: 'User deleted successfully' });
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
