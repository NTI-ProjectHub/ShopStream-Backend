const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const Menu = require("../models/menu.model");
const MenuItem = require("../models/menuItem.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const hashPassword = require("./hashPassword");

exports.ClearDB = async () => {
  await User.deleteMany({});
  await Restaurant.deleteMany({});
  await Menu.deleteMany({});
  await MenuItem.deleteMany({});
  await Order.deleteMany({});
  await OrderItem.deleteMany({});
};

// Customer
exports.Customer = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Customer",
    username: "customer",
    email: "customer@customer.com",
    password: password,
    phone: "+201234567890",
    role: "customer",
  });
  await user.save();
  return user;
};

// Admin
exports.Admin = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Admin",
    username: "admin",
    email: "admin@admin.com",
    password: password,
    phone: "+201111111111",
    role: "admin",
  });
  await user.save();
  return user;
};

// مطعم 1
exports.Restaurant1 = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Restaurant One",
    username: "restaurant1",
    email: "res1@restaurant.com",
    password: password,
    phone: "+201000000001",
    role: "restaurant",
  });
  await user.save();

  const restaurant = new Restaurant({
    userId: user._id,
    name: "El Tahrir Shawarma",
    description: "Best shawarma in town",
    address: "12 Tahrir St, Cairo",
    phone: user.phone,
    status: "open",
  });
  await restaurant.save();
  return restaurant;
};

// مطعم 2
exports.Restaurant2 = async () => {
  const password = await hashPassword.hash("123456");
  const user = new User({
    name: "Restaurant Two",
    username: "restaurant2",
    email: "res2@restaurant.com",
    password: password,
    phone: "+201000000002",
    role: "restaurant",
  });
  await user.save();

  const restaurant = new Restaurant({
    userId: user._id,
    name: "Italiano Pizza",
    description: "Authentic Italian Pizza",
    address: "22 October St, Giza",
    phone: user.phone,
    status: "open",
  });
  await restaurant.save();
  return restaurant;
};

// Menu لكل مطعم
exports.Menu = async (restaurant, name) => {
  const menu = new Menu({
    restaurantId: restaurant._id,
    name,
    description: `${restaurant.name} main menu`,
  });
  await menu.save();
  return menu;
};

// MenuItems لكل Menu
exports.MenuItems = async (menu, items) => {
  const savedItems = [];
  for (const item of items) {
    const menuItem = new MenuItem({
      menuId: menu._id,
      name: item.name,
      description: item.description,
      price: {
        amount: item.price,
        currency: "EGP",
      },
      isAvailable: true,
    });
    await menuItem.save();
    savedItems.push(menuItem);
  }
  return savedItems;
};

// Seeding كامل
exports.all = async () => {
  try {
    await exports.ClearDB();

    const customer = await exports.Customer();
    const admin = await exports.Admin();

    // مطعم 1 + Menu + Items
    const restaurant1 = await exports.Restaurant1();
    const menu1 = await exports.Menu(restaurant1, "Shawarma Menu");
    const menuItems1 = await exports.MenuItems(menu1, [
      {
        name: "Chicken Shawarma",
        description: "Juicy chicken wrap",
        price: 70,
      },
      { name: "Beef Shawarma", description: "Tender beef wrap", price: 80 },
      { name: "Shawarma Combo", description: "Mix chicken + beef", price: 120 },
    ]);

    // مطعم 2 + Menu + Items
    const restaurant2 = await exports.Restaurant2();
    const menu2 = await exports.Menu(restaurant2, "Pizza Menu");
    const menuItems2 = await exports.MenuItems(menu2, [
      {
        name: "Margherita Pizza",
        description: "Cheese & tomato classic",
        price: 90,
      },
      {
        name: "Pepperoni Pizza",
        description: "Spicy pepperoni slices",
        price: 110,
      },
      {
        name: "BBQ Chicken Pizza",
        description: "Grilled chicken & BBQ sauce",
        price: 130,
      },
    ]);

    console.log("✅ Seeded:", {
      customer,
      admin,
      restaurant1,
      menu1,
      menuItems1,
      restaurant2,
      menu2,
      menuItems2,
    });
  } catch (err) {
    console.error("❌ Error seeding initial data:", err);
  }
};
