const mongoose = require('mongoose');

const subMenuSchema = new mongoose.Schema({
    menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
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
    category: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Drinks'],
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    image: {
        type: String,
        default: 'No Image'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
});

const SubMenu = mongoose.model('SubMenu', subMenuSchema);

module.exports = SubMenu;