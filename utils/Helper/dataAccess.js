const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose;
const User = require('../../models/user.model');
const Restaurant = require('../../models/restaurant/restaurant.model');
const Menu = require('../../models/menu/menu.model');
const SubMenu = require('../../models/menu/subMenu.model');
const MenuItem = require('../../models/menu/menuItem.model');
const Order = require('../../models/order/order.model');
const OrderItem = require('../../models/order/orderItem.model');

//#region ---------- helpers ----------
const toObjectId = (id) => (typeof id === 'string' ? new ObjectId(id) : id);
const okArray = (arr) => Array.isArray(arr) ? arr : [];
//#endregion

// For read-only fetches we use .lean() so results are JSON-safe
// Single-document getters return `null` if not found
// Multi-document getters return `[]` if none found

//#region ---------- Users ----------
exports.getUserById = async (id) => {
  try {
    return await User.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getUserById:', error);
    return null;
  }
};
//#endregion

//#region ---------- Restaurants ----------
exports.getRestaurantById = async (id) => {
  try {
    return await Restaurant.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getRestaurantById:', error);
    return null;
  }
};

exports.getRestaurantByUserId = async (userId) => {
  try {
    const doc = await Restaurant.findOne({ userId: toObjectId(userId) }).lean();
    if (!doc) {
      console.log('No restaurant found for user');
      return null;
    }
    return doc;
  } catch (error) {
    console.log('Error in getRestaurantByUserId:', error);
    return null;
  }
};
//#endregion

//#region ---------- Menus ----------
exports.getMenuById = async (id) => {
  try {
    return await Menu.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getMenuById:', error);
    return null;
  }
};

exports.getMenuByRestaurantId = async (restaurantId) => {
  try {
    const doc = await Menu.findOne({ restaurantId: toObjectId(restaurantId) }).lean();
    if (!doc) {
      console.log('No menus found for restaurant');
      return null;
    }
    return doc;
  } catch (error) {
    console.log('Error in getMenuByRestaurantId:', error);
    return null;
  }
};

// Returns ALL menus for a user (via their restaurant)
exports.getMenuByUserId = async (userId) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: userId });
    if (!restaurant) {
        return null;
    }
    const menu = await Menu.findOne({ restaurantId: restaurant._id });
    return menu;
  } catch (error) {
    console.log('Error in getMenuByUserId:', error);
    return [];
  }
};
//#endregion

//#region ---------- SubMenus ----------
exports.getSubMenuById = async (id) => {
  try {
    return await SubMenu.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getSubMenuById:', error);
    return null;
  }
};

exports.getSubMenusByMenuId = async (menuId) => {
  try {
    const docs = await SubMenu.find({ menuId: toObjectId(menuId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getSubMenusByMenuId:', error);
    return [];
  }
};

exports.getSubMenusByRestaurantId = async (restaurantId) => {
  try {
    const menu = await exports.getMenuByRestaurantId(restaurantId);
    if (!menu) {
      console.log('No menu found for restaurant');
      return [];
    }
    const docs = await SubMenu.find({ menuId: menu._id }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getSubMenusByRestaurantId:', error);
    return [];
  }
};
//#endregion

//#region ---------- MenuItems ----------
exports.getMenuItemById = async (id) => {
  try {
    return await MenuItem.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getMenuItemById:', error);
    return null;
  }
};

exports.getMenuItemsByMenuId = async (menuId) => {
  try {
    const docs = await MenuItem.find({ menuId: toObjectId(menuId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getMenuItemsByMenuId:', error);
    return [];
  }
};

exports.getMenuItemsByRestaurantId = async (restaurantId) => {
  try {
    const menu = await exports.getMenuByRestaurantId(restaurantId);
    if (!menu) {
      console.log('No menu found for restaurant');
      return [];
    }
    const docs = await MenuItem.find({ menuId: menu._id }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getMenuItemsByRestaurantId:', error);
    return [];
  }
};

exports.getMenuItemsByUserId = async (userId) => {
  try {
    const menus = await exports.getMenuByUserId(userId); // array
    if (!menus || menus.length === 0) {
      console.log('No menus found for user');
      return [];
    }
    const menuIds = menus.map(m => m._id);
    const docs = await MenuItem.find({ menuId: { $in: menuIds } }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getMenuItemsByUserId:', error);
    return [];
  }
};
//#endregion

//#region ---------- Orders ----------
exports.getOrderById = async (id) => {
  try {
    return await Order.findById(toObjectId(id)).lean();
  } catch (error) {
    console.log('Error in getOrderById:', error);
    return null;
  }
};

/**
 * Get orders by user id, depending on role:
 * - admin      -> all orders
 * - restaurant -> orders where restaurantId = restaurant._id (mapped from user)
 * - customer   -> orders where customerId = user._id
 */
exports.getOrdersByUserId = async (userId) => {
  try {
    const user = await exports.getUserById(userId);
    if (!user) {
      console.log('User Not Found / Try to Login first');
      return [];
    }

    if (user.role === 'admin') {
      return await Order.find({}).lean();
    }

    if (user.role === 'restaurant') {
      const restaurant = await exports.getRestaurantByUserId(userId);
      if (!restaurant) return [];
      return await Order.find({ restaurantId: restaurant._id }).lean();
    }

    // customer
    return await Order.find({ customerId: toObjectId(userId) }).lean();
  } catch (error) {
    console.log('Error in getOrdersByUserId:', error);
    return [];
  }
};

exports.getOrdersByCustomerId = async (customerId) => {
  try {
    const docs = await Order.find({ customerId: toObjectId(customerId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getOrdersByCustomerId:', error);
    return [];
  }
};

exports.getOrdersByRestaurantId = async (restaurantId) => {
  try {
    const docs = await Order.find({ restaurantId: toObjectId(restaurantId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getOrdersByRestaurantId:', error);
    return [];
  }
};

exports.getOrdersByAdminId = async (adminId) => {
  try {
    const docs = await Order.find({ adminId: toObjectId(adminId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getOrdersByAdminId:', error);
    return [];
  }
};
//#endregion

//#region ---------- Order Items ----------
exports.getOrderItemsByOrderId = async (orderId) => {
  try {
    const docs = await OrderItem.find({ orderId: toObjectId(orderId) }).lean();
    return okArray(docs);
  } catch (error) {
    console.log('Error in getOrderItemsByOrderId:', error);
    return [];
  }
};

exports.getMenuItemByOrderItemId = async (orderItemId) => {
  try {
    const orderItem = await OrderItem.findById(toObjectId(orderItemId)).lean();
    if (!orderItem) {
      console.log('No order item found for id');
      return null;
    }
    return await exports.getMenuItemById(orderItem.itemId);
  } catch (error) {
    console.log('Error in getMenuItemByOrderItemId:', error);
    return null;
  }
};

// Optimized (no N+1)
exports.getMenuItemsByOrderId = async (orderId) => {
  try {
    const orderItems = await exports.getOrderItemsByOrderId(orderId);
    if (!orderItems || orderItems.length === 0) return [];

    const itemIds = orderItems.map(oi => oi.itemId);
    const items = await MenuItem.find({ _id: { $in: itemIds } }).lean();
    return okArray(items);
  } catch (error) {
    console.log('Error in getMenuItemsByOrderId:', error);
    return [];
  }
};
//#endregion

//#region ---------- Functoions ----------
exports.calculateTotalOrderPrice = async (orderId) => {
  try {
    const orderItems = await exports.getOrderItemsByOrderId(orderId);
    if (!orderItems || orderItems.length === 0) return 0;

    const itemIds = orderItems.map(oi => oi.itemId);
    const items = await MenuItem.find({ _id: { $in: itemIds } }).select({ _id: 1, price: 1 }).lean();

    const priceMap = new Map(items.map(i => [i._id.toString(), Number(i.price) || 0]));

    let total = 0;
    for (const oi of orderItems) {
      const key = oi.itemId?.toString?.() || String(oi.itemId);
      const price = priceMap.get(key) || 0;
      total += price * (Number(oi.quantity) || 0);
    }
    return total;
  } catch (error) {
    console.log('Error in calculateTotalOrderPrice:', error);
    return 0;
  }
};

exports.addItemToMenu = async (menuId, itemId) => {
  try {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      console.log('Menu Not Found');
      return false;
    }
    menu.items.push(itemId);
    await menu.save();
    return true;
  } catch (error) {
    console.log('Error in addItemToMenu:', error);
    return false;
  }
}

exports.addItemToSubMenu = async (subMenuId, itemId) => {
  try {
    const subMenu = await SubMenu.findById(subMenuId);
    if (!subMenu) {
      console.log('SubMenu Not Found');
      return false;
    }
    subMenu.items.push(itemId);
    await subMenu.save();
    return true;
  } catch (error) {
    console.log('Error in addItemToSubMenu:', error);
    return false;
  }
}

exports.deleteItemFromMenu = async (menuId, itemId) => {
  try {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      console.log('Menu Not Found');
      return false;
    }
    menu.items = menu.items.filter(id => id.toString() !== itemId.toString());
    await menu.save();
    return true;
  } catch (error) {
    console.log('Error in deleteItemFromMenu:', error);
    return false;
  }
}

exports.deleteItemFromSubMenu = async (subMenuId, itemId) => {
  try {
    const subMenu = await SubMenu.findById(subMenuId);
    if (!subMenu) {
      console.log('SubMenu Not Found');
      return false;
    }
    subMenu.items = subMenu.items.filter(id => id.toString() !== itemId.toString());
    await subMenu.save();
    return true;
  } catch (error) {
    console.log('Error in deleteItemFromSubMenu:', error);
    return false;
  }
}

exports.moveItemsToSubMenu = async (menuId, itemIds, subMenuId) => {
  try {
    if (!itemIds || itemIds.length === 0) {
      console.log('No itemIds provided');
      return false;
    }

    const menu = await Menu.findById(menuId);
    if (!menu) {
      console.log('Menu Not Found');
      return false;
    }
    const subMenu = await SubMenu.findById(subMenuId);
    if (!subMenu) {
      console.log('SubMenu Not Found');
      return false;
    }

    menu.items = menu.items.filter(id => !itemIds.includes(id.toString()));
    await menu.save();
    for (const itemId of itemIds) {
      await exports.addItemToSubMenu(subMenuId, itemId);
      await exports.deleteItemFromMenu(menuId, itemId);
    }

    return true;
  } catch (error) {
    console.log('Error in moveItemsToSubMenu:', error);
    return false;
  }
}
//#endregion