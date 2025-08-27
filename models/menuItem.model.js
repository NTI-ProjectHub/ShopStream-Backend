const mongoose = require("mongoose");
const { dropSearchIndex } = require("./user.model");

const menuItemSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500,
  },
  price: {
    type: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        enum: ["USD", "EUR", "EGP"],
        default: "EGP",
      },
    },
    required: true,
  },
  image: {
    type: String,
    default: "No Image",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
