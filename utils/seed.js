// utils/seed.js
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Restaurant = require("../models/restaurant/restaurant.model");
const Menu = require("../models/menu/menu.model");
const SubMenu = require("../models/menu/subMenu.model");
const MenuItem = require("../models/menu/menuItem.model");
const Order = require("../models/order/order.model");
const OrderItem = require("../models/order/orderItem.model");
const Payment = require("../models/payment.model");
const Review = require("../models/review.model");

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDigits = (len = 10) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

// Safely get enum values for a path (works for array enums too)
function getEnumValuesFromSchema(model, pathName) {
  try {
    const path = model.schema.path(pathName);
    if (!path) return [];
    // array of enums -> caster.enumValues
    if (path.caster && Array.isArray(path.caster.enumValues) && path.caster.enumValues.length) {
      return path.caster.enumValues;
    }
    if (Array.isArray(path.enumValues) && path.enumValues.length) return path.enumValues;
    const opts = path.options || {};
    if (Array.isArray(opts.enum) && opts.enum.length) return opts.enum;
  } catch (err) {
    // ignore
  }
  return [];
}

exports.seed = async function seed() {
  try {
    // Clear old data
    await Promise.all([
      User.deleteMany(),
      Restaurant.deleteMany(),
      Menu.deleteMany(),
      SubMenu.deleteMany(),
      MenuItem.deleteMany(),
      Order.deleteMany(),
      OrderItem.deleteMany(),
      Payment.deleteMany(),
      Review.deleteMany(),
    ]);
    console.log("🧹 Old data cleared");

    // ---------- USERS (10) ----------
    const users = await User.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        name: `User ${i + 1}`,
        username: `user${i + 1}`,
        email: `user${i + 1}@mail.com`,
        password: "password123",
        role: i === 0 ? "admin" : i % 2 === 0 ? "restaurant" : "customer",
      }))
    );
    console.log("✅ Users seeded");

    // ---------- RESTAURANTS (5) ----------
    const restaurantOwners = users.filter((u) => u.role === "restaurant");
    const ownerFallback = users[0];

    const restaurantsToCreate = [
      {
        name: "Pizza Palace",
        coverImage: "https://via.placeholder.com/300x200.png?text=Pizza+Palace",
        username: "pizzapalace",
        description: "Best pizza in town with fresh ingredients.",
        phone: randomDigits(11),
        address: "123 Pizza Street, Food City",
        userId: (restaurantOwners[0] && restaurantOwners[0]._id) || ownerFallback._id,
      },
      {
        name: "Burger House",
        coverImage: "https://via.placeholder.com/300x200.png?text=Burger+House",
        username: "burgerhouse",
        description: "Delicious burgers and fries served daily.",
        phone: randomDigits(11),
        address: "456 Burger Avenue, Snack Town",
        userId: (restaurantOwners[1] && restaurantOwners[1]._id) || ownerFallback._id,
      },
      {
        name: "Sushi Spot",
        coverImage: "https://via.placeholder.com/300x200.png?text=Sushi+Spot",
        username: "sushispot",
        description: "Authentic sushi and Japanese cuisine.",
        phone: randomDigits(11),
        address: "789 Sushi Road, Ocean City",
        userId: (restaurantOwners[2] && restaurantOwners[2]._id) || ownerFallback._id,
      },
      {
        name: "Taco Town",
        coverImage: "https://via.placeholder.com/300x200.png?text=Taco+Town",
        username: "tacotown",
        description: "Spicy tacos with fresh salsa and guac.",
        phone: randomDigits(11),
        address: "101 Taco Lane, Fiesta City",
        userId: (restaurantOwners[3] && restaurantOwners[3]._id) || ownerFallback._id,
      },
      {
        name: "Pasta Place",
        coverImage: "https://via.placeholder.com/300x200.png?text=Pasta+Place",
        username: "pastaplace",
        description: "Italian pasta made with love.",
        phone: randomDigits(11),
        address: "202 Pasta Blvd, Italy Town",
        userId: (restaurantOwners[4] && restaurantOwners[4]._id) || ownerFallback._id,
      },
    ];

    const restaurants = await Restaurant.insertMany(restaurantsToCreate);
    console.log("✅ Restaurants seeded");

    // ---------- MENUS (one per restaurant) ----------
    const menus = await Menu.insertMany(
      restaurants.map((r) => ({
        name: `${r.name} Menu`,
        description: `Menu for ${r.name}`,
        restaurantId: r._id,
      }))
    );
    console.log("✅ Menus seeded");

    // ---------- SUBMENUS (10) ----------
    const subMenus = await SubMenu.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        menuId: randomFrom(menus)._id,
        name: `SubMenu ${i + 1}`,
        description: `SubMenu description ${i + 1}`,
        category: randomFrom(["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Drinks"]),
      }))
    );
    console.log("✅ SubMenus seeded");

    // ---------- MENU ITEMS (15) ----------
    const categoryEnum = getEnumValuesFromSchema(MenuItem, "category");
    const parentTypeEnum = getEnumValuesFromSchema(MenuItem, "parentType");

    const safeCategoryList = categoryEnum.length
      ? categoryEnum
      : ["Pizza", "Burger", "Dessert", "Soft Drink", "Cold Drink"];
    const safeParentTypeList = parentTypeEnum.length
      ? parentTypeEnum
      : ["Menu", "Submenu"];

    const menuItemsToCreate = Array.from({ length: 15 }, (_, i) => {
      const chosenParentType = randomFrom(safeParentTypeList);
      const isMenuType = String(chosenParentType).toLowerCase().startsWith("menu");
      const parentId = isMenuType ? randomFrom(menus)._id : randomFrom(subMenus)._id;

      // IMPORTANT: produce an image URL that ends with a real extension to satisfy the validator
      // use picsum with explicit .jpg in the path
      const imageUrl = `https://picsum.photos/seed/seed_${i + 1}/400/300.jpg`;

      return {
        parentType: chosenParentType,
        parentId,
        name: `Item ${i + 1} - ${Math.floor(Math.random() * 10000)}`,
        description: `Item description ${i + 1}`,
        category: [randomFrom(safeCategoryList)],
        variations: [
          { size: "Small", price: randomNum(5, 15) },
          { size: "Medium", price: randomNum(10, 25) },
          { size: "Large", price: randomNum(15, 35) },
        ],
        image: imageUrl,
      };
    });

    const menuItems = await MenuItem.insertMany(menuItemsToCreate);
    console.log("✅ MenuItems seeded");

    // ---------- ORDERS (10) ----------
    const customers = users.filter((u) => u.role === "customer");
    const customersPool = customers.length ? customers : [users[0]];

    const ordersToCreate = Array.from({ length: 10 }, (_, i) => {
      const pm = randomFrom(["cash", "card", "online"]);
      return {
        customerId: randomFrom(customersPool)._id,
        restaurantId: randomFrom(restaurants)._id,
        totalPrice: randomNum(20, 100),
        deliveryAddress: `Delivery Street ${i + 1}`,
        timeToDeliver: randomNum(20, 60),
        status: randomFrom(["pending", "approved", "preparing", "ready", "completed", "cancelled"]),
        PaymentMethod: pm,
        paymentMethod: pm,
      };
    });

    const orders = await Order.insertMany(ordersToCreate);
    console.log("✅ Orders seeded");

    // ---------- ORDER ITEMS (20-30) ----------
    const orderItemsToCreate = [];
    for (const ord of orders) {
      const itemsCount = randomNum(1, 3);
      for (let j = 0; j < itemsCount; j++) {
        const mi = randomFrom(menuItems);
        const chosenVariation = (mi.variations && mi.variations.length) ? randomFrom(mi.variations) : { size: "Medium", price: 10 };
        orderItemsToCreate.push({
          orderId: ord._id,
          itemId: mi._id,
          menuItemId: mi._id,
          variationSize: chosenVariation.size,
          variation: chosenVariation,
          quantity: randomNum(1, 4),
          price: chosenVariation.price,
          specialInstructions: null,
        });
      }
    }

    await OrderItem.insertMany(orderItemsToCreate);
    console.log("✅ OrderItems seeded");

    // ---------- PAYMENTS (10) ----------
    const paymentsToCreate = Array.from({ length: 10 }, () => {
      const m = randomFrom(["online", "cash", "card", "bank transfer"]);
      return {
        orderId: randomFrom(orders)._id,
        paymentMethod: m,
        method: m,
        amount: randomNum(20, 200),
        status: randomFrom(["pending", "completed", "failed"]),
      };
    });
    await Payment.insertMany(paymentsToCreate);
    console.log("✅ Payments seeded");

    // ---------- REVIEWS (10) ----------
    const reviewTexts = [
      "Amazing service!",
      "Food could be better.",
      "Will definitely order again.",
      "Not worth the price.",
      "Loved it!",
      "Average experience.",
      "Great taste, fast delivery.",
      "Customer support was helpful.",
      "Delicious and fresh.",
      "Won’t recommend.",
    ];

    const reviewsToCreate = Array.from({ length: 10 }, () => ({
      customerId: randomFrom(customersPool)._id,
      restaurantId: randomFrom(restaurants)._id,
      rating: randomNum(1, 5),
      comment: randomFrom(reviewTexts),
    }));

    await Review.insertMany(reviewsToCreate);
    console.log("✅ Reviews seeded");

    console.log("🎉 All seeding completed!");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  }
};