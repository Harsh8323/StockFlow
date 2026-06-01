const express = require('express');

const {
  listProducts,
  listCategories,
  listLowStock,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProductImage } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/categories', listCategories);
router.get('/low-stock', listLowStock);

router.get('/', listProducts);
router.post('/', uploadProductImage, createProduct);

router.get('/:id', getProduct);
router.put('/:id', uploadProductImage, updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
