const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');

router.post('/create-intent', 
    authenticate, 
    roleCheck(['customer', 'admin']), 
    paymentController.createPaymentIntent
);

// Confirm payment intent (for 3D Secure)
router.post('/confirm-intent', 
    authenticate, 
    roleCheck(['customer', 'admin']), 
    paymentController.confirmPaymentIntent
);

// Get payment by order ID
router.get('/order/:orderId', 
    authenticate, 
    roleCheck(['customer', 'restaurant', 'admin']), 
    paymentController.getPaymentByOrder
);

// Get all payments (Admin only)
router.get('/', 
    authenticate, 
    roleCheck(['admin']), 
    paymentController.getAllPayments
);

// Process refund (Admin and Restaurant)
router.post('/refund/:orderId', 
    authenticate, 
    roleCheck(['admin', 'restaurant']), 
    paymentController.processRefund
);

// Stripe webhook (no authentication needed)
// router.post('/webhook', 
//     express.raw({ type: 'application/json' }), 
//     paymentController.handleWebhook
// );

module.exports = router;