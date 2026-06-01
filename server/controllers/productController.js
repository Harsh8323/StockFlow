const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const {
  fileToImageInfo,
  removeUploadedAsset,
  rollbackUploadedFile,
} = require('../middleware/uploadMiddleware');
const { writeInventoryLog } = require('../utils/inventoryLog');

const SORT_FIELDS = new Set([
  'productName',
  'sku',
  'category',
  'price',
  'stockQuantity',
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

const toNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const buildListQuery = (req) => {
  const filter = {};

  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [
      { productName: re },
      { sku: re },
      { category: re },
      { supplierName: re },
    ];
  }

  if (req.query.category) {
    filter.category = String(req.query.category).trim();
  }

  if (req.query.status) {
    const statuses = String(req.query.status)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) filter.status = statuses[0];
    else if (statuses.length > 1) filter.status = { $in: statuses };
  }

  const lowStock = parseBool(req.query.lowStock);
  if (lowStock === true) {
    filter.$expr = { $lt: ['$stockQuantity', '$reorderLevel'] };
  }

  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  return filter;
};

const buildSort = (req) => {
  const field = SORT_FIELDS.has(String(req.query.sortBy)) ? req.query.sortBy : 'createdAt';
  const order = String(req.query.sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  return { [field]: order };
};

// Coerce body numeric fields parsed from multipart/form-data.
const normalizeProductPayload = (raw = {}) => {
  const out = { ...raw };
  if (out.price !== undefined) out.price = toNumber(out.price, NaN);
  if (out.stockQuantity !== undefined) out.stockQuantity = toNumber(out.stockQuantity, NaN);
  if (out.reorderLevel !== undefined) out.reorderLevel = toNumber(out.reorderLevel, NaN);
  if (typeof out.sku === 'string') out.sku = out.sku.trim().toUpperCase();
  if (typeof out.productName === 'string') out.productName = out.productName.trim();
  if (typeof out.category === 'string') out.category = out.category.trim();
  if (typeof out.supplierName === 'string') out.supplierName = out.supplierName.trim();
  if (typeof out.description === 'string') out.description = out.description.trim();
  return out;
};

// GET /api/products
const listProducts = asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = buildListQuery(req);
  const sort = buildSort(req);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
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

// GET /api/products/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)) });
});

// GET /api/products/low-stock
const listLowStock = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const items = await Product.find({
    $expr: { $lt: ['$stockQuantity', '$reorderLevel'] },
  })
    .sort({ stockQuantity: 1 })
    .limit(limit)
    .lean({ virtuals: true });
  res.json({ items });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('createdBy', 'name email')
    .lean({ virtuals: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ product });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);

  if (req.file) {
    const { url, publicId } = fileToImageInfo(req.file);
    payload.productImage = url;
    payload.productImagePublicId = publicId;
  }

  const failWith = async (status, message) => {
    if (req.file) await rollbackUploadedFile(req.file);
    res.status(status);
    throw new Error(message);
  };

  if (!payload.productName || !payload.sku || !payload.category || payload.price === undefined) {
    await failWith(400, 'productName, sku, category and price are required');
  }
  if (!Number.isFinite(payload.price) || payload.price < 0) {
    await failWith(400, 'Price must be a non-negative number');
  }
  if (payload.stockQuantity !== undefined && (!Number.isFinite(payload.stockQuantity) || payload.stockQuantity < 0)) {
    await failWith(400, 'Stock quantity must be a non-negative number');
  }

  try {
    const product = await Product.create({ ...payload, createdBy: req.user.id });

    // Log the opening balance for full audit trail.
    if (product.stockQuantity > 0) {
      await writeInventoryLog({
        product,
        type: 'system',
        reason: 'initial',
        change: product.stockQuantity,
        stockBefore: 0,
        stockAfter: product.stockQuantity,
        notes: 'Initial stock at product creation',
        createdBy: req.user.id,
      });
    }

    res.status(201).json({ product: await product.populate('createdBy', 'name email') });
  } catch (err) {
    if (req.file) await rollbackUploadedFile(req.file);
    throw err;
  }
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    if (req.file) await rollbackUploadedFile(req.file);
    res.status(404);
    throw new Error('Product not found');
  }

  const payload = normalizeProductPayload(req.body);

  // Capture stock before any mutation so we can emit a movement log if it changes.
  const stockBefore = product.stockQuantity;

  // Whitelist updatable fields
  const updatable = [
    'productName',
    'sku',
    'category',
    'description',
    'price',
    'stockQuantity',
    'reorderLevel',
    'supplierName',
    'status',
  ];
  for (const key of updatable) {
    if (payload[key] !== undefined) product[key] = payload[key];
  }

  // Image handling: if a new file uploaded, replace and delete the old one.
  let oldImage = null;
  if (req.file) {
    oldImage = {
      url: product.productImage,
      publicId: product.productImagePublicId,
    };
    const { url, publicId } = fileToImageInfo(req.file);
    product.productImage = url;
    product.productImagePublicId = publicId;
  } else if (payload.removeImage === 'true' || payload.removeImage === true) {
    oldImage = {
      url: product.productImage,
      publicId: product.productImagePublicId,
    };
    product.productImage = '';
    product.productImagePublicId = '';
  }

  try {
    await product.save();
  } catch (err) {
    if (req.file) await rollbackUploadedFile(req.file);
    throw err;
  }

  if (oldImage) await removeUploadedAsset(oldImage);

  // Log direct stock edits via the product form — kept separate from manual
  // adjustments (which always carry a chosen reason).
  if (product.stockQuantity !== stockBefore) {
    await writeInventoryLog({
      product,
      type: 'manual',
      reason: 'correction',
      change: product.stockQuantity - stockBefore,
      stockBefore,
      stockAfter: product.stockQuantity,
      notes: 'Stock changed via product edit form',
      createdBy: req.user.id,
    });
  }

  await product.populate('createdBy', 'name email');
  res.json({ product });
});

// DELETE /api/products/:id  (admin only — enforced at route level)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const oldImage = {
    url: product.productImage,
    publicId: product.productImagePublicId,
  };
  await product.deleteOne();
  await removeUploadedAsset(oldImage);

  res.json({ message: 'Product deleted', id: req.params.id });
});

module.exports = {
  listProducts,
  listCategories,
  listLowStock,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
