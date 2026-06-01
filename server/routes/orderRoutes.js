const express = require('express');

const {
  createOrder,
  listOrders,
  listRecentOrders,
  getOrder,
  updateOrderStatus,
  downloadInvoicePdf,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/recent', listRecentOrders);

router.get('/', listOrders);
router.post('/', createOrder);

router.get('/:id', getOrder);
router.get('/:id/invoice', downloadInvoicePdf);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
