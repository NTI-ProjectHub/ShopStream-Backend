const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['online', 'cash', 'card', 'bank transfer'],
        default: 'online'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
},
{ timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;