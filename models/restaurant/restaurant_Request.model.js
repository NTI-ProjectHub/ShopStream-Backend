const mongoose = require('mongoose');
const Restaurant = require('./restaurant.model');

const restaurantRequestSchema = new mongoose.Schema({
    userId: {
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
    type: {
        type: String,
        enum: ['create' , 'delete'],
        default: 'create'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
},
{
    timestamps: true
});

const RestaurantRequest = mongoose.model('RestaurantRequest', restaurantRequestSchema);

module.exports = RestaurantRequest;
