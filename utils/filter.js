const mongoose = require("mongoose");

// ✅ Generic Filter Builder
const buildFilter = (query, config) => {
  const filter = {};
  for (const [field, handler] of Object.entries(config)) {
    if (query[field] !== undefined) {
      const value = handler(query[field]);
      if (typeof value === "object" && !Array.isArray(value)) {
        // merge nested conditions like { "variations.size": "M" }
        Object.assign(filter, value);
      } else {
        filter[field] = value;
      }
    }
  }
  return filter;
};

// ✅ User filter
exports.userFilter = (req) =>
  buildFilter(req.query, {
    role: (val) => val,
    status: (val) => val,
  });

// ✅ Restaurant filter
exports.restaurantFilter = (req) =>
  buildFilter(req.query, {
    ownerId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    category: (val) => (Array.isArray(val) ? { $in: val } : val),
    rating: (val) => parseFloat(val),
  });

// ✅ Menu filter
exports.menuFilter = (req) =>
  buildFilter(req.query, {
    restaurantId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    category: (val) => (Array.isArray(val) ? { $in: val } : val),
  });

// ✅ SubMenu filter
exports.subMenuFilter = (req) =>
  buildFilter(req.query, {
    menuId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    category: (val) => (Array.isArray(val) ? { $in: val } : val),
  });

// ✅ Item filter
exports.itemFilter = (req) =>
  buildFilter(req.query, {
    parentId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    size: (val) => ({ "variations.size": val }),
    isAvailable: (val) => ({ "variations.isAvailable": val === "true" }),
    category: (val) => (Array.isArray(val) ? { $in: val } : val),
  });

// ✅ Order filter
exports.orderFilter = (req) =>
  buildFilter(req.query, {
    customerId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    restaurantId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    status: (val) => val,
  });

// ✅ Review filter
exports.reviewFilter = (req) =>
  buildFilter(req.query, {
    userId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    restaurantId: (val) =>
      mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null,
    rating: (val) => parseFloat(val),
  });