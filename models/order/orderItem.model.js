const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    variationSize: {
        type: String,
        required: true
    },
    specialInstructions: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for better query performance
orderItemSchema.index({ orderId: 1 });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;