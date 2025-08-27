const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');

// Place a new order
router.post('/', authenticate, roleCheck(['customer', 'admin']), orderController.placeOrder);

// Update order status (Restaurants , Admins)
router.patch('/:id/status', authenticate, roleCheck(['restaurant', 'admin']), orderController.updateOrderStatus);

// Cancel an order
router.patch('/:id/cancel', authenticate, roleCheck(['customer', 'restaurant', 'admin']), orderController.cancelOrder);

// Get all orders
router.get('/', authenticate, roleCheck(['customer', 'restaurant', 'admin']), orderController.getOrders);

// Get specific order by ID
router.get('/:id', authenticate, roleCheck(['customer', 'restaurant', 'admin']), orderController.getOrderById);

module.exports = router;