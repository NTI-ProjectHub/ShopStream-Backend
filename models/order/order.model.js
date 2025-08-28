const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    deliveryFee:{
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true
    },
    timeToDeliver: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'card', 'online', 'wallet'],
        lowercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'preparing', 'ready', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;