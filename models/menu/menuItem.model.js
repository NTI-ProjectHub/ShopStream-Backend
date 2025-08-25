const mongoose = require("mongoose");

// categories
const foodCategories = [
  // Food
  "Appetizer",
  "Main Course",
  "Side Dish",
  "Soup",
  "Salad",
  "Sandwich",
  "Burger",
  "Pizza",
  "Pasta",
  "Rice Bowl",
  "Seafood",
  "Steak & Grill",
  "BBQ",
  "Noodles",
  "Street Food",
  "Fast Food",
  "Tapas",

  // Dessert
  "Dessert",
  "Bakery",
  "Cake",
  "Cookies",
  "Ice Cream",
  "Chocolate",
  "Fruit",

  // Dietary
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Halal",
  "Kosher",
  "Organic",
  "Healthy",
  "Kids",

  // Drinks
  "Soft Drink",
  "Juice",
  "Smoothie",
  "Water",
  "Coffee",
  "Tea",
  "Milkshake",
  "Beer",
  "Wine",
  "Cocktail",
  "Spirits",
  "Hot Drink",
  "Cold Drink",

  // Regional
  "American",
  "Italian",
  "French",
  "Mexican",
  "Middle Eastern",
  "Indian",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Mediterranean",
  "African",
  "Other Regional",

  // Specials
  "Chef Special",
  "Seasonal",
  "Limited Edition",
  "Combo",

  "Other",
];

const menuItemSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    subMenuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubMenu",
      default: null,
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
    category: {
      type: [String],
      required: true,
      enum: foodCategories,
      default: ["Other"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (v) =>
          Number.isFinite(v) && /^\d+(\.\d{1,2})?$/.test(v.toString()),
        message: (props) =>
          `${props.value} is not a valid price format (max 2 decimals)`,
      },
    },
    image: {
      type: String,
      default: null,
      validate: {
        validator: (v) =>
          !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v),
        message: (props) => `${props.value} is not a valid image URL`,
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ menuId: 1 });
menuItemSchema.index({ subMenuId: 1 });
menuItemSchema.index({ category: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
