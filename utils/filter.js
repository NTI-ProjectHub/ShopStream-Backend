const mongoose = require("mongoose");

// ✅ Generic Filter Builder with better validation
const buildFilter = (query, config) => {
  const filter = {};
  
  for (const [field, handler] of Object.entries(config)) {
    const value = query[field];
    
    // Skip if value is undefined, null, or empty string
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    try {
      const result = handler(value);
      
      // Only add to filter if result is valid
      if (result !== null && result !== undefined) {
        if (typeof result === "object" && !Array.isArray(result) && !mongoose.Types.ObjectId.isValid(result)) {
          // Merge nested conditions like { "variations.size": "M" }
          Object.assign(filter, result);
        } else {
          filter[field] = result;
        }
      }
    } catch (error) {
      console.warn(`Filter error for field ${field}:`, error.message);
      // Skip invalid filters rather than breaking
      continue;
    }
  }
  
  return filter;
};

// ✅ Helper functions for common validations
const validateObjectId = (val) => {
  if (!val || typeof val !== 'string') return null;
  return mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null;
};

const validateNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const validateBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
  return null;
};

const validateArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    // Handle comma-separated values
    return val.split(',').map(item => item.trim()).filter(item => item);
  }
  return [val];
};

const validateEnum = (val, validValues) => {
  return validValues.includes(val) ? val : null;
};

// ✅ User filter
exports.userFilter = async (Model, req) => {
  const validRoles = ['customer', 'restaurant', 'admin'];
  const validStatuses = ['active', 'suspended'];
  
  return buildFilter(req.query, {
    role: (val) => validateEnum(val, validRoles),
    status: (val) => validateEnum(val, validStatuses),
    name: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    username: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    email: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
  });
};

// ✅ Restaurant filter
exports.restaurantFilter = async (Model, req) => {
  const validStatuses = ['pending', 'approved', 'rejected', 'deleted'];
  const validTypes = [
    "Food", "Grocery", "Convenience", "Alcohol", "Health", 
    "Retail", "Pet", "Flowers", "Personal Care", "Electronics"
  ];
  
  return buildFilter(req.query, {
    name: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    username: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    status: (val) => validateEnum(val, validStatuses),
    type: (val) => {
      const types = validateArray(val);
      const validTypesFiltered = types.filter(type => validTypes.includes(type));
      return validTypesFiltered.length > 0 ? { $in: validTypesFiltered } : null;
    },
    rating: (val) => {
      const num = validateNumber(val);
      return num !== null && num >= 0 && num <= 5 ? { $gte: num } : null;
    },
    address: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    userId: (val) => validateObjectId(val),
  });
};

// ✅ Restaurant Request filter
exports.restaurantRequestFilter = async (Model, req) => {
  const validTypes = ['create', 'delete'];
  const validStatuses = ['pending', 'approved', 'rejected'];
  
  return buildFilter(req.query, {
    userId: (val) => validateObjectId(val),
    restaurantId: (val) => validateObjectId(val),
    adminId: (val) => validateObjectId(val),
    type: (val) => validateEnum(val, validTypes),
    status: (val) => validateEnum(val, validStatuses),
  });
};

// ✅ Menu filter
exports.menuFilter = async (Model, req) => {
  return buildFilter(req.query, {
    restaurantId: (val) => validateObjectId(val),
    name: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
  });
};

// ✅ SubMenu filter
exports.subMenuFilter = async (Model, req) => {
  const validCategories = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Drinks'];
  
  return buildFilter(req.query, {
    menuId: (val) => validateObjectId(val),
    name: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    category: (val) => {
      const categories = validateArray(val);
      const validCategoriesFiltered = categories.filter(cat => validCategories.includes(cat));
      return validCategoriesFiltered.length > 0 ? { $in: validCategoriesFiltered } : null;
    },
    isAvailable: (val) => validateBoolean(val),
  });
};

// ✅ MenuItem filter
exports.menuItemFilter = async (Model, req) => {
  const validCategories = [
    // Food
    "Appetizer", "Main Course", "Side Dish", "Soup", "Salad", "Sandwich",
    "Burger", "Pizza", "Pasta", "Rice Bowl", "Seafood", "Steak & Grill",
    "BBQ", "Noodles", "Street Food", "Fast Food", "Tapas",
    // Dessert
    "Dessert", "Bakery", "Cake", "Cookies", "Ice Cream", "Chocolate", "Fruit",
    // Dietary
    "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Halal",
    "Kosher", "Organic", "Healthy", "Kids",
    // Drinks
    "Soft Drink", "Juice", "Smoothie", "Water", "Coffee", "Tea", "Milkshake",
    "Beer", "Wine", "Cocktail", "Spirits", "Hot Drink", "Cold Drink",
    // Regional
    "American", "Italian", "French", "Mexican", "Middle Eastern", "Indian",
    "Chinese", "Japanese", "Korean", "Thai", "Mediterranean", "African", "Other Regional",
    // Specials
    "Chef Special", "Seasonal", "Limited Edition", "Combo", "Other"
  ];
  
  const validSizes = ["Small", "Medium", "Large"];
  const validParentTypes = ["Menu", "Submenu"];
  
  return buildFilter(req.query, {
    parentId: (val) => validateObjectId(val),
    parentType: (val) => validateEnum(val, validParentTypes),
    name: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
    category: (val) => {
      const categories = validateArray(val);
      const validCategoriesFiltered = categories.filter(cat => validCategories.includes(cat));
      return validCategoriesFiltered.length > 0 ? { $in: validCategoriesFiltered } : null;
    },
    // Variation-based filters
    size: (val) => {
      const sizes = validateArray(val);
      const validSizesFiltered = sizes.filter(size => validSizes.includes(size));
      return validSizesFiltered.length > 0 ? { "variations.size": { $in: validSizesFiltered } } : null;
    },
    isAvailable: (val) => {
      const available = validateBoolean(val);
      return available !== null ? { "variations.isAvailable": available } : null;
    },
    minPrice: (val) => {
      const price = validateNumber(val);
      return price !== null && price >= 0 ? { "variations.price": { $gte: price } } : null;
    },
    maxPrice: (val) => {
      const price = validateNumber(val);
      return price !== null && price >= 0 ? { "variations.price": { $lte: price } } : null;
    },
  });
};

// ✅ Order filter
exports.orderFilter = async (Model, req) => {
  const validStatuses = ['pending', 'approved', 'preparing', 'ready', 'completed', 'cancelled'];
  const validPaymentMethods = ['cash', 'card', 'online', 'wallet'];
  
  return buildFilter(req.query, {
    customerId: (val) => validateObjectId(val),
    restaurantId: (val) => validateObjectId(val),
    adminId: (val) => validateObjectId(val),
    status: (val) => {
      const statuses = validateArray(val);
      const validStatusesFiltered = statuses.filter(status => validStatuses.includes(status));
      return validStatusesFiltered.length > 0 ? { $in: validStatusesFiltered } : null;
    },
    paymentMethod: (val) => validateEnum(val.toLowerCase(), validPaymentMethods),
    minTotal: (val) => {
      const price = validateNumber(val);
      return price !== null && price >= 0 ? { totalPrice: { $gte: price } } : null;
    },
    maxTotal: (val) => {
      const price = validateNumber(val);
      return price !== null && price >= 0 ? { totalPrice: { $lte: price } } : null;
    },
    // Date range filters
    startDate: (val) => {
      const date = new Date(val);
      return !isNaN(date) ? { createdAt: { $gte: date } } : null;
    },
    endDate: (val) => {
      const date = new Date(val);
      return !isNaN(date) ? { createdAt: { $lte: date } } : null;
    },
  });
};

// ✅ Review filter
exports.reviewFilter = async (req) => {
  return buildFilter(req.query, {
    customerId: (val) => validateObjectId(val),
    restaurantId: (val) => validateObjectId(val),
    rating: (val) => {
      const num = validateNumber(val);
      return num !== null && num >= 0 && num <= 5 ? num : null;
    },
    minRating: (val) => {
      const num = validateNumber(val);
      return num !== null && num >= 0 && num <= 5 ? { rating: { $gte: num } } : null;
    },
    maxRating: (val) => {
      const num = validateNumber(val);
      return num !== null && num >= 0 && num <= 5 ? { rating: { $lte: num } } : null;
    },
    comment: (val) => typeof val === 'string' ? new RegExp(val.trim(), 'i') : null,
  });
};

// ✅ Payment filter
exports.paymentFilter = async (Model, req) => {
  const validMethods = ['online', 'cash', 'card', 'bank transfer'];
  const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
  
  return buildFilter(req.query, {
    orderId: (val) => validateObjectId(val),
    paymentMethod: (val) => validateEnum(val, validMethods),
    status: (val) => {
      const statuses = validateArray(val);
      const validStatusesFiltered = statuses.filter(status => validStatuses.includes(status));
      return validStatusesFiltered.length > 0 ? { $in: validStatusesFiltered } : null;
    },
    minAmount: (val) => {
      const amount = validateNumber(val);
      return amount !== null && amount >= 0 ? { amount: { $gte: amount } } : null;
    },
    maxAmount: (val) => {
      const amount = validateNumber(val);
      return amount !== null && amount >= 0 ? { amount: { $lte: amount } } : null;
    },
  });
};