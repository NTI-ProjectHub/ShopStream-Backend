const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');
const Menu = require('../models/menu/menu.model');
const MenuItem = require('../models/menu/menuItem.model');
const Order = require('../models/order/order.model');
const OrderItem = require('../models/order/orderItem.model');
const hashPassword = require('./hashPassword');

// === Clear Database ===
exports.clearDB = async () => {
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    Menu.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({})
  ]);
  console.log("✅ Database cleared");
};

// === Seed Users ===
exports.seedCustomer = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Customer",
    username: "customer",
    email: "customer@customer.com",
    password,
    phone: "123456789",
    role: "customer",
  });
  await user.save();
  return user;
};

exports.seedRestaurant = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Restaurant",
    username: "restaurant",
    email: "restaurant@restaurant.com",
    password,
    phone: "123456789",
    role: "restaurant",
  });
  await user.save();

  const restaurant = new Restaurant({
    userId: user._id,
    name: "Dagag bondok",
    description: "Delicious bondok",
    address: "123 Main St",
    phone: user.phone,
    status: "open",
  });
  await restaurant.save();

  return restaurant;
};

exports.seedAdmin = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Admin",
    username: "admin",
    email: "admin@admin.com",
    password,
    phone: "123456789",
    role: "admin",
  });
  await user.save();
  return user;
};

// === Seed Menu + Items ===
exports.seedMenu = async (restaurant) => {
  const menu = new Menu({
    restaurantId: restaurant._id,
    name: "Salta3 Burger",
    description: "Delicious burgers",
  });
  await menu.save();
  return menu;
};

exports.seedMenuItem = async (menu) => {
  const item = new MenuItem({
    menuId: menu._id,
    name: "Salta3 Burger",
    description: "Delicious burgers",
    price: 10,
  });
  await item.save();
  return item;
};

// === Seed Orders ===
exports.seedOrder = async (customer, restaurant, admin, menuItem) => {
  const order = new Order({
    customerId: customer._id,
    restaurantId: restaurant._id,
    adminId: admin._id,
    totalPrice: 20,
    status: "completed",
  });
  await order.save();

  const orderItem = new OrderItem({
    orderId: order._id,
    itemId: menuItem._id,
    quantity: 2,
    price: 10,
  });
  await orderItem.save();

  return { order, orderItem };
};

// === Seed All ===
exports.seedAll = async () => {
  try {
    await exports.clearDB();

    const customer = await exports.seedCustomer();
    const restaurant = await exports.seedRestaurant();
    const admin = await exports.seedAdmin();
    const menu = await exports.seedMenu(restaurant);
    const menuItem = await exports.seedMenuItem(menu);
    const { order, orderItem } = await exports.seedOrder(customer, restaurant, admin, menuItem);

    console.log("✅ Initial data seeded successfully:", {
      customer: customer._id,
      restaurant: restaurant._id,
      admin: admin._id,
      menu: menu._id,
      menuItem: menuItem._id,
      order: order._id,
      orderItem: orderItem._id
    });

    return { customer, restaurant, admin, menu, menuItem, order, orderItem };
  } catch (err) {
    console.error("❌ Error seeding initial data:", err);
    throw err;
  }
};