const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: props => `${props.value} is not a valid username!`
        },
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    address: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\+?[1-9]\d{1,14}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    coverImage: {
        type: String,
        required: true
    },
    type:{
        type: [String],
        enum: {
            values: [
            "Food",
            "Grocery",
            "Convenience",
            "Alcohol",
            "Health",
            "Retail",
            "Pet",
            "Flowers",
            "Personal Care",
            "Electronics"
            ],
            message: "{VALUE} is not a valid type!"
        },
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value!"
        }
    },
    completedOrders: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'open', 'closed'],
        default: 'pending'
    },
},
{timestamps: true}
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;