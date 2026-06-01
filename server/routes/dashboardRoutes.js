const express = require('express');

const {
  getStats,
  getSalesOverTime,
  getTopProducts,
  getStatusBreakdown,
  getTopCustomers,
  getRevenueByCategory,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/sales-over-time', getSalesOverTime);
router.get('/top-products', getTopProducts);
router.get('/top-customers', getTopCustomers);
router.get('/status-breakdown', getStatusBreakdown);
router.get('/revenue-by-category', getRevenueByCategory);

module.exports = router;
