// validators/categoryValidator.js

// Valid food categories
const VALID_CATEGORIES = [
  "Appetizer", "Main Course", "Side Dish", "Soup", "Salad", "Sandwich",
  "Burger", "Pizza", "Pasta", "Rice Bowl", "Seafood", "Steak & Grill",
  "BBQ", "Noodles", "Street Food", "Fast Food", "Tapas",
  "Dessert", "Bakery", "Cake", "Cookies", "Ice Cream", "Chocolate", "Fruit",
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Halal",
  "Kosher", "Organic", "Healthy", "Kids",
  "Soft Drink", "Juice", "Smoothie", "Water", "Coffee", "Tea", "Milkshake",
  "Beer", "Wine", "Cocktail", "Spirits", "Hot Drink", "Cold Drink",
  "American", "Italian", "French", "Mexican", "Middle Eastern", "Indian",
  "Chinese", "Japanese", "Korean", "Thai", "Mediterranean", "African", "Other Regional",
  "Chef Special", "Seasonal", "Limited Edition", "Combo", "Other"
];

function validateCategories(categories) {
  if (!Array.isArray(categories)) {
    return { valid: false, message: "Categories must be an array" };
  }

  if (categories.length === 0) {
    return { valid: true, sanitized: ["Other"] };
  }

  const invalidCategories = categories.filter(cat => !VALID_CATEGORIES.includes(cat));
  if (invalidCategories.length > 0) {
    return {
      valid: false,
      message: `Invalid categories: ${invalidCategories.join(", ")}. Valid options: ${VALID_CATEGORIES.join(", ")}`
    };
  }

  return { valid: true, sanitized: categories };
}

module.exports = { validateCategories, VALID_CATEGORIES };
