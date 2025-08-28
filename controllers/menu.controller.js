const Menu = require("../models/menu/menu.model");
const SubMenu = require("../models/menu/subMenu.model");
const Restaurant = require("../models/restaurant/restaurant.model");
const MenuItem = require("../models/menu/menuItem.model");
const { getMenuById, getMenuByRestaurantId } = require("../utils/Helper/dataAccess");
const cloud = require("../middlewares/cloud");
const { pagination } = require("../utils/pagination");
const { validationResult } = require("express-validator");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");
const { asyncWrapper } = require("../middlewares/asyncWrapper.middleware");

/**
 * GET /restaurants/:restaurantId/menu
 */
const getRestaurantMenu = asyncWrapper(async (req, res) => {
  const { restaurantId } = req.params;

  const menu = await getMenuByRestaurantId(restaurantId);
  if (!menu) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.NO_MENU,
    });
  }

  let subMenus = [];
  let menuItemsQuery = { parentId: menu._id, parentType: "Menu" };

  const subMenusData = await SubMenu.find({ menuId: menu._id });
  if (subMenusData.length > 0) {
    subMenus = subMenusData;
    menuItemsQuery = {
      $or: [
        { parentId: menu._id, parentType: "Menu" },
        { parentId: { $in: subMenus.map((sm) => sm._id) }, parentType: "Submenu" },
      ],
    };
  }

  const { total, page, limit, data } = await pagination(MenuItem, req, menuItemsQuery);

  return res.status(STATUS_CODES.OK).json({
    success: true,
    message: total > 0 ? MESSAGES.MENU_ITEMS_FOUND : MESSAGES.NO_MENU_ITEMS,
    result: total,
    meta: {
      page,
      limit,
      totalItems: total,
      hasSubMenus: subMenus.length > 0,
    },
    data: {
      menu,
      subMenus,
      menuItems: data,
    },
  });
});

/**
 * POST /restaurants/:restaurantId/menu
 */
const createMenu = asyncWrapper(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.VALIDATION_ERROR,
      errors: errors.array(),
    });
  }

  const { restaurantId } = req.params;
  const { name, description } = req.body;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.RESTAURANT_NOT_FOUND,
    });
  }

  if (req.user._id.toString() !== restaurant.userId.toString()) {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: MESSAGES.AUTHORIZATION_ERROR,
    });
  }

  const existingMenu = await Menu.findOne({ restaurantId: restaurant._id });
  if (existingMenu) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.MENU_ALREADY_EXISTS,
    });
  }

  const menu = new Menu({
    restaurantId: restaurant._id,
    name: name?.trim() || restaurant.name,
    description: description?.trim() || restaurant.description,
    image: req.menuImage || null,
  });

  await menu.save();

  return res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.MENU_CREATED,
    meta: {
      restaurantId: restaurant._id,
      menuId: menu._id,
    },
    data: menu,
  });
});

/**
 * PUT /menus/:menuId
 */
const updateMenu = asyncWrapper(async (req, res) => {
  const { menuId } = req.params;
  const { name, description } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.VALIDATION_ERROR,
      errors: errors.array(),
    });
  }

  const menu = await getMenuAndAuthorize(req, menuId);

  if (menu.image && req.menuImage) {
    try {
      await cloud.deleteCloud(menu.image);
    } catch (error) {
      console.warn("Failed to delete old image:", error.message);
    }
  }

  if (req.menuImage) menu.image = req.menuImage;
  if (name?.trim()) menu.name = name.trim();
  if (description?.trim()) menu.description = description.trim();

  await menu.save();

  return res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU_UPDATED,
    meta: { menuId: menu._id, restaurantId: menu.restaurantId },
    data: menu,
  });
});

/**
 * DELETE /menus/:menuId
 */
const deleteMenu = asyncWrapper(async (req, res) => {
  const { menuId } = req.params;

  const menu = await getMenuAndAuthorize(req, menuId);

  const session = await Menu.startSession();
  session.startTransaction();

  try {
    await SubMenu.deleteMany({ menuId: menu._id }, { session });
    await MenuItem.deleteMany(
      {
        $or: [
          { parentId: menu._id, parentType: "Menu" },
          { parentId: { $in: await SubMenu.find({ menuId: menu._id }).distinct("_id") } },
        ],
      },
      { session }
    );

    await Menu.findByIdAndDelete(menu._id, { session });

    if (menu.image) {
      try {
        await cloud.deleteCloud(menu.image);
      } catch (error) {
        console.warn("Failed to delete image from cloud:", error.message);
      }
    }

    await session.commitTransaction();

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.MENU_DELETED,
      meta: { menuId: menu._id, restaurantId: menu.restaurantId },
      data: { deletedMenu: { _id: menu._id, name: menu.name, restaurantId: menu.restaurantId } },
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * GET /menus/:menuId
 */
const getMenuByIdController = asyncWrapper(async (req, res) => {
  const { menuId } = req.params;

  const menu = await Menu.findById(menuId).populate("restaurantId", "name username");
  if (!menu) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.MENU_NOT_FOUND,
    });
  }

  return res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU_FOUND,
    data: menu,
  });
});

// 🔹 Helper for ownership checks
async function getMenuAndAuthorize(req, menuId) {
  const menu = await getMenuById(menuId);
  if (!menu) {
    const error = new Error(MESSAGES.MENU_NOT_FOUND);
    error.status = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  const restaurant = await Restaurant.findById(menu.restaurantId);
  if (!restaurant) {
    const error = new Error(MESSAGES.RESTAURANT_NOT_FOUND);
    error.status = STATUS_CODES.NOT_FOUND;
    throw error;
  }

  if (req.user._id.toString() !== restaurant.userId.toString()) {
    const error = new Error(MESSAGES.AUTHORIZATION_ERROR);
    error.status = STATUS_CODES.FORBIDDEN;
    throw error;
  }

  return menu;
}

// 🔹 Exports
module.exports = {
  getRestaurantMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuById: getMenuByIdController,
};