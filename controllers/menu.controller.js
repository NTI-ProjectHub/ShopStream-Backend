const Menu = require("../models/menu/menu.model");
const SubMenu = require("../models/menu/subMenu.model");
const Restaurant = require("../models/restaurant/restaurant.model");
const MenuItem = require("../models/menu/menuItem.model");
const {
  getMenuById,
  getMenuByRestaurantId,
} = require("../utils/Helper/dataAccess");
const {
  checkRestaurantAuthorization,
} = require("../middlewares/authorization.middleware");
const cloud = require("../middlewares/cloud");
const { pagination } = require("../utils/pagination");
const { validationResult } = require('express-validator');
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");
const {asyncWrapper} = require("../middlewares/asyncWrapper.middleware");


// Auth middleware check
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
            success: false,
            message: MESSAGES.AUTHENTICATION_ERROR 
        });
    }
    next();
};

exports.getRestaurantMenu = asyncWrapper(async (req, res) => {
    const { restaurantId } = req.params;

    // Find menu for this restaurant
    const menu = await getMenuByRestaurantId(restaurantId);
    if (!menu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false,
            message: MESSAGES.NO_MENU 
        });
    }

    let subMenus = [];
    let menuItemsQuery = { parentId: menu._id, parentType: 'Menu' };

    // Get submenus if they exist
    const subMenusData = await SubMenu.find({ menuId: menu._id });
    if (subMenusData.length > 0) {
        subMenus = subMenusData;
        // Update query to include both menu items directly under menu and under submenus
        menuItemsQuery = {
            $or: [
                { parentId: menu._id, parentType: 'Menu' },
                { parentId: { $in: subMenus.map(sm => sm._id) }, parentType: 'Submenu' }
            ]
        };
    }

    // Get paginated menu items
    const { total, page, limit, data } = await pagination(MenuItem, req, menuItemsQuery);

    const response = {
        success: true,
        message: total > 0 ? MESSAGES.MENU_ITEMS_FOUND : MESSAGES.NO_MENU_ITEMS,
        result: total,
        meta: { 
            page, 
            limit, 
            totalItems: total,
            hasSubMenus: subMenus.length > 0
        },
        data: {
            menu,
            subMenus: subMenus.length > 0 ? subMenus : [],
            menuItems: data,
        }
    };

    return res.status(STATUS_CODES.OK).json(response);
});

exports.createMenu = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { restaurantId } = req.params;
    const { name, description } = req.body;

    // Find and verify restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND 
        });
    }

    // Check authorization - user must own the restaurant
    if (req.user._id.toString() !== restaurant.userId.toString()) {
        return res.status(STATUS_CODES.FORBIDDEN).json({ 
            success: false,
            message: MESSAGES.AUTHORIZATION_ERROR 
        });
    }

    // Check if menu already exists
    const existingMenu = await Menu.findOne({ restaurantId: restaurant._id });
    if (existingMenu) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false,
            message: MESSAGES.MENU_ALREADY_EXISTS 
        });
    }

    // Create new menu - Fixed: should use restaurant._id, not req.user._id
    const menu = new Menu({
        restaurantId: restaurant._id, // This was the bug - was using req.user._id
        name: (name && name.trim()) || restaurant.name,
        description: (description && description.trim()) || restaurant.description,
        image: req.menuImage || null,
    });

    await menu.save();

    return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.MENU_CREATED,
        meta: {
            restaurantId: restaurant._id,
            menuId: menu._id
        },
        data: menu,
    });
});

exports.updateMenu = asyncWrapper(async (req, res) => {
    const { menuId } = req.params;
    const { name, description } = req.body;

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const menu = await getMenuAndAuthorize(req, menuId);

    // Handle image update
    if (menu.image && req.menuImage) {
        try {
            await cloud.deleteCloud(menu.image);
        } catch (error) {
            console.warn('Failed to delete old image from cloud:', error.message);
            // Continue with update even if cloud deletion fails
        }
    }

    // Update menu fields
    if (req.menuImage) {
        menu.image = req.menuImage;
    }
    if (name && name.trim()) {
        menu.name = name.trim();
    }
    if (description && description.trim()) {
        menu.description = description.trim();
    }

    await menu.save();

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.MENU_UPDATED,
        meta: {
            menuId: menu._id,
            restaurantId: menu.restaurantId
        },
        data: menu,
    });
});

exports.deleteMenu = asyncWrapper(async (req, res) => {
    const { menuId } = req.params;

    const menu = await getMenuAndAuthorize(req, menuId);

    // Use transaction for data consistency
    const session = await Menu.startSession();
    session.startTransaction();

    try {
        // Delete associated data
        await SubMenu.deleteMany({ menuId: menu._id }, { session });
        await MenuItem.deleteMany({ 
            $or: [
                { parentId: menu._id, parentType: 'Menu' },
                { parentId: { $in: await SubMenu.find({ menuId: menu._id }).distinct('_id') } }
            ]
        }, { session });

        // Delete the menu
        await Menu.findByIdAndDelete(menu._id, { session });

        // Delete image from cloud storage
        if (menu.image) {
            try {
                await cloud.deleteCloud(menu.image);
            } catch (error) {
                console.warn('Failed to delete image from cloud:', error.message);
                // Don't fail the transaction for cloud storage issues
            }
        }

        await session.commitTransaction();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.MENU_DELETED,
            meta: {
                menuId: menu._id,
                restaurantId: menu.restaurantId,
                deletedItems: {
                    menu: 1,
                    // Could add counts of deleted submenus and items here
                }
            },
            data: {
                deletedMenu: {
                    _id: menu._id,
                    name: menu.name,
                    restaurantId: menu.restaurantId
                }
            }
        });

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// Get menu by ID (additional utility endpoint)
exports.getMenuById = asyncWrapper(async (req, res) => {
    const { menuId } = req.params;

    const menu = await Menu.findById(menuId).populate('restaurantId', 'name username');
    if (!menu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND
        });
    }

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.MENU_FOUND,
        data: menu
    });
});

// Helper function for authorization
async function getMenuAndAuthorize(req, menuId) {
    const menu = await getMenuById(menuId);
    if (!menu) {
        const error = new Error(MESSAGES.MENU_NOT_FOUND);
        error.status = STATUS_CODES.NOT_FOUND;
        throw error;
    }

    // Get restaurant to check ownership
    const restaurant = await Restaurant.findById(menu.restaurantId);
    if (!restaurant) {
        const error = new Error(MESSAGES.RESTAURANT_NOT_FOUND);
        error.status = STATUS_CODES.NOT_FOUND;
        throw error;
    }

    // Check if user owns the restaurant
    if (req.user._id.toString() !== restaurant.userId.toString()) {
        const error = new Error(MESSAGES.AUTHORIZATION_ERROR);
        error.status = STATUS_CODES.FORBIDDEN;
        throw error;
    }

    return menu;
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Menu Controller Error:', err);

    // Handle custom errors
    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            process: "Menu Operation"
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // Default error
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.INTERNAL_SERVER_ERROR,
        process: "Menu Operation",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
};

// Apply middleware to routes
exports.getRestaurantMenu = [requireAuth, exports.getRestaurantMenu];
exports.createMenu = [requireAuth, exports.createMenu];
exports.updateMenu = [requireAuth, exports.updateMenu];
exports.deleteMenu = [requireAuth, exports.deleteMenu];
exports.getMenuById = [requireAuth, exports.getMenuById];
exports.errorHandler = errorHandler;