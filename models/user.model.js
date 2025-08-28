const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: props => `${props.value} is not a valid username!`
        },
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePicture: {
        type: String,
        default: 'No Profile Picture'
    },
    phone: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'restaurant' ,'admin'],
        default: 'customer'
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    suspendedUntil: {
        type: Date,
        default: null
    }
} , 
{timestamps: true}
);

const User = mongoose.model('User', userSchema);

module.exports = User;
