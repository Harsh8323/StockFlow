const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const {
  cloudinary,
  isCloudinaryConfigured,
  CLOUDINARY_FOLDER,
  destroyAsset,
} = require('../config/cloudinary');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const STORAGE_MODE = isCloudinaryConfigured() ? 'cloudinary' : 'disk';

const buildDiskStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 8) || '.jpg';
      const random = crypto.randomBytes(8).toString('hex');
      cb(null, `${Date.now()}-${random}${ext}`);
    },
  });

const buildCloudinaryStorage = () =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const random = crypto.randomBytes(6).toString('hex');
      const base = path
        .parse(file.originalname || 'image')
        .name
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'image';
      return {
        folder: CLOUDINARY_FOLDER,
        public_id: `${base}-${Date.now()}-${random}`,
        resource_type: 'image',
        // ext is inferred from the mime type
      };
    },
  });

const storage =
  STORAGE_MODE === 'cloudinary' ? buildCloudinaryStorage() : buildDiskStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const err = new Error('Only JPG, PNG, WEBP and GIF images are allowed');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

const uploadProductImage = upload.single('productImage');

const safeUploadProductImage = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      res.status(400);
      return next(new Error(err.message));
    }
    res.status(err.status || 400);
    return next(err);
  });
};

/**
 * Normalize the image info from a multer file into { url, publicId }.
 * - cloudinary mode: { url: file.path (secure_url), publicId: file.filename }
 * - disk mode:      { url: '/uploads/<filename>',  publicId: '' }
 */
const fileToImageInfo = (file) => {
  if (!file) return { url: '', publicId: '' };
  if (STORAGE_MODE === 'cloudinary') {
    return { url: file.path || '', publicId: file.filename || '' };
  }
  return { url: `/uploads/${file.filename}`, publicId: '' };
};

/**
 * Best-effort deletion of an uploaded asset, picking the right storage backend.
 * Accepts an object with { url, publicId } or just a url string.
 */
const removeUploadedAsset = async (info) => {
  if (!info) return;
  const url = typeof info === 'string' ? info : info.url || '';
  const publicId = typeof info === 'string' ? '' : info.publicId || '';

  if (publicId) {
    await destroyAsset(publicId);
    return;
  }
  if (url && url.startsWith('/uploads/')) {
    const filename = path.basename(url);
    if (!filename) return;
    const abs = path.join(UPLOAD_DIR, filename);
    try {
      await fs.promises.unlink(abs);
    } catch {
      /* ignore missing files */
    }
  }
};

/**
 * Roll back a freshly-uploaded multer file (no DB write happened).
 */
const rollbackUploadedFile = async (file) => {
  if (!file) return;
  if (STORAGE_MODE === 'cloudinary') {
    await destroyAsset(file.filename);
  } else {
    try {
      await fs.promises.unlink(file.path);
    } catch {
      /* ignore */
    }
  }
};

module.exports = {
  STORAGE_MODE,
  UPLOAD_DIR,
  uploadProductImage: safeUploadProductImage,
  fileToImageInfo,
  removeUploadedAsset,
  rollbackUploadedFile,
};
