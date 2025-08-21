const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {authenticate} = require('../middlewares/authentication.middleware');

router.post('/' , authenticate , orderController.placeOrder);
router.get('/' , authenticate , orderController.getOrders);
router.get('/:id' , authenticate , orderController.getOrder);

module.exports = router;
