const Restaurant = require("../models/restaurant/restaurant.model");
const Menu = require("../models/menu/menu.model");
const MenuItem = require("../models/menu/menuItem.model");
const SubMenu = require("../models/menu/subMenu.model");
const { pagination } = require('../utils/pagination');
const { validationResult } = require('express-validator');
const cloud = require("../middlewares/cloud");
const { validateCategories, validateVariations } = require("../validators/index");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");
const {asyncWrapper} = require("../middlewares/asyncWrapper.middleware");


// Auth check
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
            success: false,
            message: MESSAGES.AUTHENTICATION_ERROR 
        });
    }
    next();
};

exports.getAllItems = asyncWrapper(async (req, res) => {
    const { menuId } = req.params;

    const menuContext = await findMenuContext(menuId);
    if (!menuContext) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND
        });
    }

    // Check authorization
    const authResult = await checkMenuItemOwnership(req.user, menuContext.restaurantId);
    if (!authResult.authorized) {
        return res.status(authResult.status).json({
            success: false,
            message: authResult.message
        });
    }

    // Build query based on menu type
    const query = {
        parentType: menuContext.type,
        parentId: menuContext.data._id
    };

    const { total, page, limit, data } = await pagination(MenuItem, req, query);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ITEMS_RETRIEVED,
        result: total,
        meta: {
            page,
            limit,
            menuType: menuContext.type,
            menuId: menuContext.data._id,
            restaurantId: menuContext.restaurantId
        },
        data
    });
});

exports.createItem = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { menuId } = req.params;
    const { name, description, category, variations } = req.body;

    // Validate required fields
    if (!name?.trim() || !description?.trim() || !category || !variations) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.ALL_FIELDS_REQUIRED
        });
    }

    const menuContext = await findMenuContext(menuId);
    if (!menuContext) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND
        });
    }

    // Check authorization
    const authResult = await checkMenuItemOwnership(req.user, menuContext.restaurantId);
    if (!authResult.authorized) {
        return res.status(authResult.status).json({
            success: false,
            message: authResult.message
        });
    }

    // Validate categories
    const categoryValidation = validateCategories(category);
    if (!categoryValidation.valid) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: categoryValidation.message
        });
    }

    // Validate variations
    const variationValidation = validateVariations(variations);
    if (!variationValidation.valid) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: variationValidation.message
        });
    }

    // Check for duplicate names within the same parent
    const existingItem = await MenuItem.findOne({
        parentType: menuContext.type,
        parentId: menuContext.data._id,
        name: name.trim()
    });

    if (existingItem) {
        return res.status(STATUS_CODES.CONFLICT).json({
            success: false,
            message: MESSAGES.MENU_ITEM_NAME_EXISTS
        });
    }

    // Create menu item
    const menuItem = new MenuItem({
        parentType: menuContext.type,
        parentId: menuContext.data._id,
        name: name.trim(),
        description: description.trim(),
        category: categoryValidation.sanitized,
        variations: variations,
        image: req.menuImage || null,
    });

    await menuItem.save();
    
    return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.ITEM_CREATED,
        meta: {
            itemId: menuItem._id,
            parentType: menuContext.type,
            parentId: menuContext.data._id
        },
        data: menuItem,
    });
});

exports.updateItem = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }
    
    const { itemId } = req.params;
    const { name, description, variations, category } = req.body;
    
    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_ITEM_NOT_FOUND
        });
    }

    // Get menu context for authorization
    let restaurantId;
    if (menuItem.parentType === "Menu") {
        const menu = await Menu.findById(menuItem.parentId);
        if (!menu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated menu not found"
            });
        }
        restaurantId = menu.restaurantId;
    } else {
        const subMenu = await SubMenu.findById(menuItem.parentId);
        if (!subMenu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated submenu not found"
            });
        }
        const menu = await Menu.findById(subMenu.menuId);
        if (!menu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated parent menu not found"
            });
        }
        restaurantId = menu.restaurantId;
    }

    // Check authorization
    const authResult = await checkMenuItemOwnership(req.user, restaurantId);
    if (!authResult.authorized) {
        return res.status(authResult.status).json({
            success: false,
            message: authResult.message
        });
    }

    // Check for name conflicts (excluding current item)
    if (name && name.trim() !== menuItem.name) {
        const existingItem = await MenuItem.findOne({
            parentType: menuItem.parentType,
            parentId: menuItem.parentId,
            name: name.trim(),
            _id: { $ne: itemId }
        });

        if (existingItem) {
            return res.status(STATUS_CODES.CONFLICT).json({
                success: false,
                message: MESSAGES.MENU_ITEM_NAME_EXISTS
            });
        }
    }

    // Validate and update fields
    if (name?.trim()) {
        menuItem.name = name.trim();
    }
    
    if (description?.trim()) {
        menuItem.description = description.trim();
    }

    if (category) {
        const categoryValidation = validateCategories(category);
        if (!categoryValidation.valid) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: categoryValidation.message
            });
        }
        menuItem.category = categoryValidation.sanitized;
    }

    if (variations) {
        const variationValidation = validateVariations(variations);
        if (!variationValidation.valid) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: variationValidation.message
            });
        }
        menuItem.variations = variations;
    }
    
    // Handle image update
    if (menuItem.image && req.menuImage) {
        try {
            await cloud.deleteCloud(menuItem.image);
        } catch (error) {
            console.warn('Failed to delete old image:', error.message);
        }
    }
    
    if (req.menuImage) {
        menuItem.image = req.menuImage;
    }

    await menuItem.save();
    
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ITEM_UPDATED,
        meta: {
            itemId: menuItem._id,
            parentType: menuItem.parentType,
            parentId: menuItem.parentId
        },
        data: menuItem,
    });
});

exports.deleteItem = asyncWrapper(async (req, res) => {
    const { itemId } = req.params;
    
    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_ITEM_NOT_FOUND
        });
    }

    // Get menu context for authorization (same logic as update)
    let restaurantId;
    if (menuItem.parentType === "Menu") {
        const menu = await Menu.findById(menuItem.parentId);
        if (!menu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated menu not found"
            });
        }
        restaurantId = menu.restaurantId;
    } else {
        const subMenu = await SubMenu.findById(menuItem.parentId);
        if (!subMenu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated submenu not found"
            });
        }
        const menu = await Menu.findById(subMenu.menuId);
        if (!menu) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Associated parent menu not found"
            });
        }
        restaurantId = menu.restaurantId;
    }

    // Check authorization
    const authResult = await checkMenuItemOwnership(req.user, restaurantId);
    if (!authResult.authorized) {
        return res.status(authResult.status).json({
            success: false,
            message: authResult.message
        });
    }

    // Delete image from cloud storage
    if (menuItem.image) {
        try {
            await cloud.deleteCloud(menuItem.image);
        } catch (error) {
            console.warn('Failed to delete image from cloud:', error.message);
        }
    }

    await MenuItem.findByIdAndDelete(itemId);
    
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ITEM_DELETED,
        meta: {
            deletedItemId: itemId,
            itemName: menuItem.name
        },
        data: {
            deletedItem: {
                _id: menuItem._id,
                name: menuItem.name,
                parentType: menuItem.parentType,
                parentId: menuItem.parentId
            }
        }
    });
});

exports.getItemById = asyncWrapper(async (req, res) => {
    const { itemId } = req.params;

    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_ITEM_NOT_FOUND
        });
    }

    // Optional authorization check for private access
    if (req.user) {
        let restaurantId;
        if (menuItem.parentType === "Menu") {
            const menu = await Menu.findById(menuItem.parentId);
            restaurantId = menu?.restaurantId;
        } else {
            const subMenu = await SubMenu.findById(menuItem.parentId);
            const menu = subMenu ? await Menu.findById(subMenu.menuId) : null;
            restaurantId = menu?.restaurantId;
        }

        if (restaurantId) {
            const authResult = await checkMenuItemOwnership(req.user, restaurantId);
            if (!authResult.authorized) {
                return res.status(authResult.status).json({
                    success: false,
                    message: authResult.message
                });
            }
        }
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ITEM_FOUND,
        meta: {
            itemId: menuItem._id,
            parentType: menuItem.parentType,
            parentId: menuItem.parentId
        },
        data: menuItem,
    });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('MenuItem Controller Error:', err);

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
        message: MESSAGES.INTERNAL_ERROR,
        process: "MenuItem Operation",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
};

// Apply middleware to routes
exports.getAllItems = [requireAuth, exports.getAllItems];
exports.createItem = [requireAuth, exports.createItem];
exports.updateItem = [requireAuth, exports.updateItem];
exports.deleteItem = [requireAuth, exports.deleteItem];
exports.getItemById = [requireAuth, exports.getItemById];
exports.errorHandler = errorHandler;