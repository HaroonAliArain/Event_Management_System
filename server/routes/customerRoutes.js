const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { validateObjectId, sanitizePayload } = require('../middleware/validate');

// Customer collection routes
router
  .route('/')
  .get(getAllCustomers)
  .post(sanitizePayload, createCustomer);

// Single customer item routes
router
  .route('/:id')
  .get(validateObjectId('id'), getCustomerById)
  .put(validateObjectId('id'), sanitizePayload, updateCustomer)
  .delete(validateObjectId('id'), deleteCustomer);

module.exports = router;
