const express = require('express');

const {
  getInventoryStats,
  listLogs,
  createAdjustment,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/stats', getInventoryStats);
router.get('/logs', listLogs);
router.post('/adjustments', authorize('admin'), createAdjustment);

module.exports = router;
