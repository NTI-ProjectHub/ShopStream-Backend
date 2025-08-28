const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment.model');
const Order = require('../models/order/order.model');
const { asyncWrapper } = require('../middlewares/asyncWrapper.middleware');
const MESSAGES = require('../constants/messages');
const STATUS_CODES = require('../constants/status_Codes');

// Create payment intent for an order
exports.createPaymentIntent = asyncWrapper(async (req, res) => {
    const { orderId, paymentMethodId } = req.body;

    if (!orderId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Order ID is required"
        });
    }

    // Find the order
    const order = await Order.findById(orderId)
        .populate('customerId', 'name email')
        .populate('restaurantId', 'name');

    if (!order) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.ORDER_NOT_FOUND
        });
    }

    // Check if user owns this order (unless admin)
    if (req.user.role !== 'admin' && order.customerId._id.toString() !== req.user._id.toString()) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.FORBIDDEN
        });
    }

    // Check if order is in valid state for payment
    if (!['pending', 'approved'].includes(order.status)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Order cannot be paid in its current status",
            currentStatus: order.status
        });
    }

    // Check if payment already exists and is completed
    const existingPayment = await Payment.findOne({ orderId, status: 'completed' });
    if (existingPayment) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Order has already been paid"
        });
    }

    try {
        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalPrice * 100), // Convert to cents
            currency: 'usd', // Change based on your currency
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            return_url: `${process.env.CLIENT_URL}/payment/success`,
            metadata: {
                orderId: order._id.toString(),
                customerId: order.customerId._id.toString(),
                restaurantId: order.restaurantId._id.toString()
            }
        });

        // Create or update payment record
        let payment = await Payment.findOne({ orderId });
        if (payment) {
            payment.amount = order.totalPrice;
            payment.status = 'pending';
        } else {
            payment = new Payment({
                orderId,
                paymentMethod: 'online',
                amount: order.totalPrice,
                status: 'pending'
            });
        }

        payment.stripePaymentIntentId = paymentIntent.id;
        await payment.save();

        // Handle different payment intent statuses
        if (paymentIntent.status === 'requires_action') {
            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: "Payment requires additional authentication",
                data: {
                    requires_action: true,
                    payment_intent: {
                        id: paymentIntent.id,
                        client_secret: paymentIntent.client_secret
                    }
                }
            });
        } else if (paymentIntent.status === 'succeeded') {
            // Payment succeeded immediately
            payment.status = 'completed';
            await payment.save();

            // Update order status to approved if it was pending
            if (order.status === 'pending') {
                order.status = 'approved';
                await order.save();
            }

            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: "Payment successful",
                data: {
                    payment_intent: {
                        id: paymentIntent.id,
                        status: paymentIntent.status
                    },
                    payment,
                    order: {
                        id: order._id,
                        status: order.status,
                        totalPrice: order.totalPrice
                    }
                }
            });
        } else {
            // Payment failed
            payment.status = 'failed';
            await payment.save();

            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Payment failed",
                data: {
                    payment_intent: {
                        id: paymentIntent.id,
                        status: paymentIntent.status
                    }
                }
            });
        }
    } catch (error) {
        console.error('Stripe payment error:', error);

        // Update payment status to failed
        const payment = await Payment.findOne({ orderId });
        if (payment) {
            payment.status = 'failed';
            await payment.save();
        }

        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error.message || "Payment processing failed"
        });
    }
});

// Confirm payment intent (for 3D Secure or other authentication)
exports.confirmPaymentIntent = asyncWrapper(async (req, res) => {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Payment intent ID is required"
        });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        const payment = await Payment.findOne({ stripePaymentIntentId: payment_intent_id });
        if (!payment) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Payment record not found"
            });
        }

        const order = await Order.findById(payment.orderId);

        if (paymentIntent.status === 'succeeded') {
            payment.status = 'completed';
            await payment.save();

            // Update order status
            if (order && order.status === 'pending') {
                order.status = 'approved';
                await order.save();
            }

            return res.status(STATUS_CODES.OK).json({
                success: true,
                message: "Payment confirmed successfully",
                data: {
                    payment,
                    order: {
                        id: order._id,
                        status: order.status
                    }
                }
            });
        } else {
            payment.status = 'failed';
            await payment.save();

            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Payment confirmation failed",
                status: paymentIntent.status
            });
        }
    } catch (error) {
        console.error('Payment confirmation error:', error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error confirming payment"
        });
    }
});

// Get payment by order ID
exports.getPaymentByOrder = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.ORDER_NOT_FOUND
        });
    }

    // Authorization check
    const authorized = await checkPaymentAuthorization(order, req.user);
    if (!authorized.success) {
        return res.status(authorized.statusCode).json({
            success: false,
            message: authorized.message
        });
    }

    const payment = await Payment.findOne({ orderId })
        .populate('orderId', 'totalPrice status deliveryAddress');

    if (!payment) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: "Payment not found for this order"
        });
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment
    });
});

// Get all payments (Admin only)
exports.getAllPayments = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
            { path: 'orderId', select: 'totalPrice status customerId restaurantId createdAt' }
        ]
    };

    const payments = await Payment.paginate(filter, options);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Payments retrieved successfully",
        result: payments.totalDocs,
        meta: {
            page: payments.page,
            limit: payments.limit,
            totalPages: payments.totalPages,
            totalDocs: payments.totalDocs
        },
        data: payments.docs
    });
});

// Process refund
exports.processRefund = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;
    const { reason, amount } = req.body; // Optional partial refund amount

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.ORDER_NOT_FOUND
        });
    }

    const payment = await Payment.findOne({ orderId, status: 'completed' });
    if (!payment) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: "No completed payment found for this order"
        });
    }

    if (!payment.stripePaymentIntentId) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Cannot refund: No Stripe payment intent found"
        });
    }

    try {
        // Calculate refund amount (partial or full)
        const refundAmount = amount ? 
            Math.min(Math.round(amount * 100), Math.round(payment.amount * 100)) : 
            Math.round(payment.amount * 100);

        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: refundAmount,
            reason: reason === 'duplicate' ? 'duplicate' : 'requested_by_customer',
            metadata: {
                orderId: order._id.toString(),
                refundReason: reason || 'Customer request'
            }
        });

        // Update order status to cancelled if full refund
        if (refundAmount === Math.round(payment.amount * 100)) {
            order.status = 'cancelled';
            await order.save();
        }

        res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Refund processed successfully",
            data: {
                refund: {
                    id: refund.id,
                    amount: refund.amount / 100,
                    status: refund.status
                },
                order: {
                    id: order._id,
                    status: order.status
                }
            }
        });
    } catch (error) {
        console.error('Refund error:', error);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: error.message || "Refund processing failed"
        });
    }
});

// // Stripe webhook handler
// exports.handleWebhook = asyncWrapper(async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(
//             req.body,
//             sig,
//             process.env.STRIPE_WEBHOOK_SECRET
//         );
//     } catch (err) {
//         console.error('Webhook signature verification failed:', err.message);
//         return res.status(400).json({ error: 'Invalid signature' });
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             const paymentIntent = event.data.object;
//             await handlePaymentSuccess(paymentIntent);
//             break;
        
//         case 'payment_intent.payment_failed':
//             const failedPayment = event.data.object;
//             await handlePaymentFailure(failedPayment);
//             break;

//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     res.status(200).json({ received: true });
// });

// // Helper Functions
// const checkPaymentAuthorization = async (order, user) => {
//     if (user.role === 'admin') {
//         return { success: true };
//     }

//     if (user.role === 'customer' && order.customerId.toString() === user._id.toString()) {
//         return { success: true };
//     }

//     if (user.role === 'restaurant') {
//         const Restaurant = require('../models/restaurant/restaurant.model');
//         const restaurant = await Restaurant.findOne({ userId: user._id });
        
//         if (restaurant && order.restaurantId.toString() === restaurant._id.toString()) {
//             return { success: true };
//         }
//     }

//     return {
//         success: false,
//         statusCode: STATUS_CODES.FORBIDDEN,
//         message: MESSAGES.FORBIDDEN
//     };
// };

const handlePaymentSuccess = async (paymentIntent) => {
    try {
        const payment = await Payment.findOne({ 
            stripePaymentIntentId: paymentIntent.id 
        });
        
        if (payment && payment.status !== 'completed') {
            payment.status = 'completed';
            await payment.save();

            // Update order status
            const order = await Order.findById(payment.orderId);
            if (order && order.status === 'pending') {
                order.status = 'approved';
                await order.save();
            }
        }
    } catch (error) {
        console.error('Error handling payment success webhook:', error);
    }
};

const handlePaymentFailure = async (paymentIntent) => {
    try {
        const payment = await Payment.findOne({ 
            stripePaymentIntentId: paymentIntent.id 
        });
        
        if (payment) {
            payment.status = 'failed';
            await payment.save();
        }
    } catch (error) {
        console.error('Error handling payment failure webhook:', error);
    }
};