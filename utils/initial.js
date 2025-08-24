const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');
const Menu = require('../models/menu.model');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const hashPassword = require('./hashPassword');

exports.ClearDB = async() => {
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
}

exports.Customer = async() => {
    const password = await hashPassword.hash("123456");
    const user = new User({
        name: "Customer",
        username: "customer",
        email: "customer@customer.com",
        password: password,
        phone: "123456789",
        role: "customer",
    });
    await user.save();
    return user;
}

exports.Restaurant = async() => {
    const password = await hashPassword.hash("123456");
    const user =  new User({
        name: "Restaurant",
        username: "restaurant",
        email: "restaurant@restaurant.com",
        password: password,
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
}

exports.Admin = async() => {
    const password = await hashPassword.hash("123456");
    const user = new User({
        name: "Admin",
        username: "admin",
        email: "admin@admin.com",
        password: password,
        phone: "123456789",
        role: "admin",
    });
    await user.save();
    return user;
}

exports.Menu = async(restaurant) => {
    const menu = new Menu({
        restaurantId: restaurant._id,
        name: "Salta3 Burger",
        description: "Delicious burgers",
    });
    await menu.save();
    return menu;
}

exports.MenuItem = async(menu) => {
    const menuItem = new MenuItem({
        menuId: menu._id,
        name: "Salta3 Burger",
        description: "Delicious burgers",
        price: 10,
    });
    await menuItem.save();
    return menuItem;
}

exports.Order = async (customer, restaurant, admin, menuItem) => {
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

exports.all = async () => {
  try {
    await exports.ClearDB();
    const customer = await exports.Customer();
    const restaurant = await exports.Restaurant();
    const admin = await exports.Admin();
    const menu = await exports.Menu(restaurant);
    const menuItem = await exports.MenuItem(menu);
    const order = await exports.Order(customer, restaurant, admin, menuItem);
    console.log("✅ Initial data seeded:", { customer, restaurant, admin, menu, menuItem, order });
  } catch (err) {
    console.error("❌ Error seeding initial data:", err);
  }
};
