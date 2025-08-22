const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');

router.post('/' , authenticate , roleCheck(['customer','admin']) , orderController.placeOrder);
router.post('/:id' , authenticate , roleCheck(['customer','admin']) , orderController.addOrderItem);
router.get('/' , authenticate , roleCheck(['customer','restaurant','admin']) , orderController.getOrders);
router.get('/:id' , authenticate , roleCheck(['customer','restaurant','admin']) , orderController.getOrderById);

module.exports = router;
