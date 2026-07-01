const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (String(password).length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  // Role is controlled via env-based admin seeding and admin-only routes.
  // Public registrations always get 'staff'.
  const assignedRole = req.user?.role === 'admin' && User.ROLES.includes(role) ? role : 'staff';

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: assignedRole,
  });

  const token = generateToken(user._id, { role: user.role });

  res.status(201).json({
    token,
    user: user.toSafeJSON(),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id, { role: user.role });

  res.json({
    token,
    user: user.toSafeJSON(),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ user: user.toSafeJSON() });
});

// PUT /api/auth/me — update the authenticated user's profile (name, email).
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email } = req.body || {};

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
      throw new Error('Please enter a valid email address');
    }
    if (normalized !== user.email) {
      const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (taken) {
        res.status(409);
        throw new Error('Email is already in use by another account');
      }
      user.email = normalized;
    }
  }

  await user.save();
  res.json({ user: user.toSafeJSON() });
});

// PUT /api/auth/me/password — change own password.
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new passwords are required');
  }
  if (String(newPassword).length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error('New password must be different from the current one');
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Issue a fresh token — keeps the user logged in with the new credential.
  const token = generateToken(user._id, { role: user.role });
  res.json({ token, user: user.toSafeJSON() });
});

module.exports = { register, login, getMe, updateMe, changePassword };
