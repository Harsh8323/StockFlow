const express = require('express');

const {
  listCustomers,
  getCustomer,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listCustomers);
router.post('/', createCustomer);

router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

router.get('/:id/orders', getCustomerOrders);

module.exports = router;
