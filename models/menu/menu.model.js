const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
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
    image: {
        type: String,
        default: 'No Cover Image'
    },
    subMenus: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubMenu'
        }
    ],
    items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem'
        }
    ]
});

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;