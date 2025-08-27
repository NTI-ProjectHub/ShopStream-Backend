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

const variationSchema = new mongoose.Schema({
  isAvailable: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    default: "Medium",
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
});

const menuItemSchema = new mongoose.Schema(
  {
    parentType: {
      type: String,
      enum: ["Menu", "Submenu"],
      required: true, // This should be required
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "parentType",
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
    category: {
      type: [String],
      required: true,
      enum: foodCategories,
      default: ["Other"],
      validate: {
        validator: function(v) {
          return v && v.length > 0; // Ensure at least one category
        },
        message: 'At least one category is required'
      }
    },
    variations: {
      type: [variationSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0; // Ensure at least one variation
        },
        message: 'At least one variation is required'
      }
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
  },
  { timestamps: true }
);

// Corrected indexes - these should match your actual schema fields
menuItemSchema.index({ parentId: 1, parentType: 1 }); // Compound index for efficient queries
menuItemSchema.index({ category: 1 }); // For category filtering
menuItemSchema.index({ name: 1, parentId: 1 }, { unique: true }); // Prevent duplicate names within same parent
menuItemSchema.index({ createdAt: -1 }); // For sorting by creation date

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;