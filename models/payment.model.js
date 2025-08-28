const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentIntentId: {
        type: String,
        sparse: true // Allows multiple null values
    },
    stripeRefundId: {
        type: String,
        sparse: true
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundReason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Add pagination plugin
paymentSchema.plugin(mongoosePaginate);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;