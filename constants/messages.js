// utils/messages.js

const MESSAGES = {
  // 🔑 Authentication & Authorization
  AUTHENTICATION_ERROR: "You must be logged in to perform this action",
  AUTHORIZATION_ERROR: "You are not authorized to perform this action",
  UNAUTHORIZED: "You have to login first",
  FORBIDDEN: "You do not have permission to access this resource",

  // ⚠️ Validation
  VALIDATION_ERROR: "Validation error",
  ALL_FIELDS_REQUIRED: "All fields are required",
  REQUIRED_FIELDS: "Name, username, description, address, and phone are required",
  INVALID_CATEGORIES: "Categories must be a non-empty array",
  INVALID_VARIATIONS: "Variations must be a non-empty array with valid structure",
  INVALID_ORDER_ITEMS: "Invalid order items format",
  MIXED_RESTAURANT_ITEMS: "All items must be from the same restaurant",
  INVALID_PAYMENT_METHOD: "Invalid payment method",

  // 🍴 Restaurants
  RESTAURANT_NOT_FOUND: "Restaurant not found",
  RESTAURANT_REQUEST_NOT_FOUND: "Restaurant request not found",
  
  RESTAURANTS_RETRIEVED_SUCCESSFULLY: "Restaurants retrieved successfully",
  RESTAURANT_REQUEST_ALREADY_EXISTS: "Restaurant request already exists",
  RESTAURANT_ALREADY_EXISTS: "Restaurant already exists",
  RESTAURANT_ALREADY_OPEN: "Restaurant already open",
  RESTAURANT_ALREADY_CLOSED: "Restaurant already closed",
  RESTAURANT_ALREADY_DELETED: "Restaurant already deleted",
  RESTAURANT_DELETED: "Restaurant deleted successfully",
  RESTAURANT_RETRIEVED_SUCCESSFULLY: "Restaurant retrieved successfully",
  RESTAURANT_FOUND_NO_MENU: "Restaurant found but no menu available",
  RESTAURANT_DELETION_ERROR: "You can only delete your own restaurant",
  RESTAURANT_REQUEST_CREATED: "Restaurant request created successfully",
  RESTAURANT_REQUEST_DELETED: "Restaurant request deleted successfully",
  RESTAURANT_REQUEST_ALREADY_EXISTS: "Request already exists",
  RESTAURANT_REQUEST_DELETION_ERROR: "You can only request deletion of your own restaurant",


  // 📋 Menus
  MENU_FOUND: "Menu found",
  MENU_CREATED: "Menu created successfully",
  MENU_UPDATED: "Menu updated successfully",
  MENU_DELETED: "Menu deleted successfully",
  MENU_NOT_FOUND: "Menu not found",
  MENU_ALREADY_EXISTS: "This restaurant already has a menu",
  NO_MENU: "This restaurant has no menu",
  NO_SUB_MENUS: "This menu has no sub menus",
  NO_MENU_ITEMS: "This menu has no menu items",

  // 📂 Sub Menus
  SUBMENU_FOUND: "Sub Menu retrieved successfully",
  SUBMENU_CREATED: "Sub Menu created successfully",
  SUBMENU_UPDATED: "Sub Menu updated successfully",
  SUBMENU_DELETED: "Sub Menu deleted successfully",
  SUBMENU_NOT_FOUND: "Sub Menu not found",
  SUBMENU_NAME_EXISTS: "A submenu with this name already exists in this menu",
  PARENT_MENU_NOT_FOUND: "Parent Menu not found",

  // 🛒 Menu Items
  MENU_ITEMS_FOUND: "Menu items found",
  ITEMS_RETRIEVED: "Menu items retrieved successfully",
  ITEM_FOUND: "Menu item retrieved successfully",
  ITEM_CREATED: "Menu item created successfully",
  ITEM_UPDATED: "Menu item updated successfully",
  ITEM_DELETED: "Menu item deleted successfully",
  MENU_ITEM_NOT_FOUND: "Menu item not found",
  MENU_ITEM_NAME_EXISTS: "A menu item with this name already exists",

  // 📦 Orders
  ORDER_PLACED: "Order placed successfully",
  ORDER_NOT_PLACED: "Order not placed",
  ORDER_NOT_FOUND: "Order not found",
  ORDER_ITEMS_NOT_FOUND: "Order items not found",
  ORDER_CANCELLED: "Order cancelled successfully",
  CANNOT_CANCEL_ORDER: "Cannot cancel order with current status",
  ORDERS_RETRIEVED: "Orders retrieved successfully",
  ORDER_RETRIEVED: "Order retrieved successfully",

  // Payment
  PAYMENT_INTENT_CREATED: 'Payment intent created successfully',
  PAYMENT_SUCCESSFUL: 'Payment completed successfully',
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_NOT_FOUND: 'Payment not found',
  REFUND_SUCCESSFUL: 'Refund processed successfully',
  REFUND_FAILED: 'Refund processing failed',
  INVALID_PAYMENT_STATUS: 'Invalid payment status for this operation',

  // ⚙️ General
  INTERNAL_ERROR: "Internal server error",
};

module.exports = MESSAGES;
