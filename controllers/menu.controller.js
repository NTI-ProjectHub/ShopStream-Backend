const { get } = require("mongoose");
const Menu = require("../models/menu.model");
const MenuItem = require("../models/menuItem.model");
const Restaurant = require("../models/restaurant.model");
const dataAccessHelper = require("../utils/Helper/dataAccess");
const {
  checkRestaurantAuthorization,
} = require("../middlewares/authorization.middleware");
const cloud = require("../utils/cloud");

exports.getRestaurantMenuItems = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "You have to login first" });
    }

    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    const menu = await Menu.findOne({ restaurantId: restaurantId });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    const menuItems = await dataAccessHelper.getMenuItemsByMenuId(menu._id);

    if (!menuItems || menuItems.length === 0) {
      return res.status(404).json({ message: "This menu has no items" });
    }

    const formattedItems = menuItems.map((item) => ({
      id: item._id,
      name: item.name,
      description: item.description,
      price: {
        amount: item.price?.amount,
        currency: item.price?.currency,
      },
      imageUrl: item.image,
      label: item.isAvailable ? "Available" : "Not Available",
    }));

    const response = {
      restaurantId: restaurant._id,
      menuId: menu._id,
      menuName: menu.name,
      items: formattedItems,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      process: "Menu Retrieval",
    });
  }
};

// restaurant make new menu
exports.createMenu = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "You Have To login First" });
    }

    const { name, description } = req.body;

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const existingMenu = await dataAccessHelper.getMenuByRestaurantId(
      req.params.restaurantId
    );
    if (existingMenu) {
      return res
        .status(400)
        .json({ message: "This restaurant already have a menu" });
    }
    const menu = new Menu({
      restaurantId: req.user._id,
      name,
      description,
      image: req.menuImage || null, // store the Cloudinary link
    });

    await menu.save();

    return res.status(201).json({
      message: "Menu created successfully",
      menu,
    });
  } catch (error) {
    console.error("Menu Creation Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      process: "Menu Creation",
    });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "You Have To login First" });
    }
    const menu = await getMenuAndAuthorize(req, req.params.menuId);
    const { name, description } = req.body;
    if (menu.image && req.menuImage) {
      await cloud.deleteCloud(menu.image);
    }
    if (req.menuImage) {
      menu.image = req.menuImage;
    }
    menu.name = name || menu.name;
    menu.description = description || menu.description;
    await menu.save();
    return res.status(200).json({
      message: "Menu updated successfully",
      menu,
    });
  } catch (error) {
    console.error("Menu Update Error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal server error",
      process: "Menu Update",
    });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "You Have To login First" });
    }
    const menu = await getMenuAndAuthorize(req, req.params.menuId);
    if (menu.image) {
      await cloud.deleteCloud(menu.image);
    }
    await menu.deleteOne();
    return res.status(200).json({
      message: "Menu deleted successfully",
      menu,
    });
  } catch (error) {
    console.error("Menu Deletion Error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal server error",
      process: "Menu Deletion",
    });
  }
};

async function getMenuAndAuthorize(req, menuId) {
  const menu = await dataAccessHelper.getMenuById(menuId);
  if (!menu) {
    const error = new Error("Menu not found");
    error.status = 404;
    throw error;
  }
  checkRestaurantAuthorization(req, menu);
  return menu;
}
