const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const CLOUDINARY_FOLDER =
  process.env.CLOUDINARY_FOLDER || 'stockflow/products';

const destroyAsset = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.warn(`[cloudinary] failed to destroy "${publicId}": ${err.message}`);
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  CLOUDINARY_FOLDER,
  destroyAsset,
};
