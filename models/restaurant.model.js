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
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        default: null
    },
},
{timestamps: true}
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;