const { getMenuById } = require("../utils/Helper/dataAccess");
const SubMenu = require("../models/menu/subMenu.model");
const MenuItem = require("../models/menu/menuItem.model");
const { validationResult } = require('express-validator');
const {checkMenuOwnership} = require("../utils/Helper/checkMenuOwnership");
const cloud = require("../middlewares/cloud");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");
const {asyncWrapper} = require("../middlewares/asyncWrapper.middleware");

exports.getSubMenu = asyncWrapper(async (req, res) => {
    const { menuId, subMenuId } = req.params;

    // Verify menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND,
        });
    }

    // Find submenu
    const subMenu = await SubMenu.findOne({ _id: subMenuId, menuId: menuId });
    if (!subMenu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.SUBMENU_NOT_FOUND,
        });
    }

    // Get menu items for this submenu
    const menuItems = await MenuItem.find({ 
        parentId: subMenuId, 
        parentType: 'Submenu' 
    }).sort({ createdAt: -1 });

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.SUBMENU_FOUND,
        meta: {
            menuId,
            subMenuId,
            itemCount: menuItems.length
        },
        data: {
            subMenu,
            menuItems
        },
    });
});

exports.createSubMenu = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { name, description, category } = req.body;
    const { menuId } = req.params;

    // Validate required fields
    if (!name?.trim() || !description?.trim() || !category?.trim()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.ALL_FIELDS_REQUIRED,
        });
    }

    // Check authorization
    const hasPermission = await checkMenuOwnership(req.user._id, menuId);
    if (!hasPermission) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.FORBIDDEN,
        });
    }

    // Ensure menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND,
        });
    }

    // Check if submenu name already exists in this menu
    const existingSubMenu = await SubMenu.findOne({ 
        menuId, 
        name: name.trim() 
    });
    if (existingSubMenu) {
        return res.status(STATUS_CODES.CONFLICT).json({
            success: false,
            message: MESSAGES.SUBMENU_NAME_EXISTS,
        });
    }

    // Create SubMenu
    const subMenu = new SubMenu({
        menuId,
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        image: req.image || null,
    });

    await subMenu.save();

    return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.SUBMENU_CREATED,
        meta: {
            menuId,
            subMenuId: subMenu._id
        },
        data: {
            subMenu
        },
    });
});

exports.updateSubMenu = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { name, description, category, itemIds } = req.body;
    const { menuId, subMenuId } = req.params;

    // Check authorization
    const hasPermission = await checkMenuOwnership(req.user._id, menuId);
    if (!hasPermission) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.FORBIDDEN,
        });
    }

    // Find SubMenu
    const subMenu = await SubMenu.findOne({ _id: subMenuId, menuId });
    if (!subMenu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.SUBMENU_NOT_FOUND,
        });
    }

    // Check for name conflicts (excluding current submenu)
    if (name && name.trim() !== subMenu.name) {
        const existingSubMenu = await SubMenu.findOne({ 
            menuId, 
            name: name.trim(),
            _id: { $ne: subMenuId }
        });
        if (existingSubMenu) {
            return res.status(STATUS_CODES.CONFLICT).json({
                success: false,
                message: MESSAGES.SUBMENU_NAME_EXISTS,
            });
        }
    }

    // Use transaction for consistency
    const session = await SubMenu.startSession();
    session.startTransaction();

    try {
        // Handle image update
        if (subMenu.image && req.image) {
            try {
                await cloud.deleteCloud(subMenu.image);
            } catch (error) {
                console.warn('Failed to delete old image:', error.message);
            }
        }

        // Update SubMenu fields
        if (name?.trim()) subMenu.name = name.trim();
        if (description?.trim()) subMenu.description = description.trim();
        if (category?.trim()) subMenu.category = category.trim();
        if (req.image) subMenu.image = req.image;

        await subMenu.save({ session });

        let updatedItemsCount = 0;
        // Update MenuItems if itemIds provided
        if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
            const result = await MenuItem.updateMany(
                { _id: { $in: itemIds } },
                {
                    $set: {
                        parentType: "Submenu",
                        parentId: subMenuId,
                    },
                },
                { session }
            );
            updatedItemsCount = result.modifiedCount;
        }

        await session.commitTransaction();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.SUBMENU_UPDATED,
            meta: {
                menuId,
                subMenuId,
                updatedItemsCount
            },
            data: {
                subMenu
            },
        });

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

exports.deleteSubMenu = asyncWrapper(async (req, res) => {
    const { deleteItems = false } = req.body;
    const { menuId, subMenuId } = req.params;

    // Check authorization
    const hasPermission = await checkMenuOwnership(req.user._id, menuId);
    if (!hasPermission) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.FORBIDDEN,
        });
    }

    // Find SubMenu
    const subMenu = await SubMenu.findOne({ _id: subMenuId, menuId });
    if (!subMenu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.SUBMENU_NOT_FOUND,
        });
    }

    // Use transaction for consistency
    const session = await SubMenu.startSession();
    session.startTransaction();

    try {
        // Get existing menu items
        const subMenuItems = await MenuItem.find({ 
            parentId: subMenuId, 
            parentType: 'Submenu' 
        });

        let itemsAction = "none";
        let affectedItemsCount = subMenuItems.length;

        if (deleteItems) {
            // Delete all menu items
            await MenuItem.deleteMany({ 
                parentId: subMenuId, 
                parentType: 'Submenu' 
            }, { session });
            itemsAction = "deleted";
        } else if (subMenuItems.length > 0) {
            // Move items back to parent menu
            await MenuItem.updateMany(
                { parentId: subMenuId, parentType: 'Submenu' },
                {
                    $set: {
                        parentType: "Menu",
                        parentId: menuId,
                    },
                },
                { session }
            );
            itemsAction = "moved_to_menu";
        }

        // Delete image from cloud storage
        if (subMenu.image) {
            try {
                await cloud.deleteCloud(subMenu.image);
            } catch (error) {
                console.warn('Failed to delete image from cloud:', error.message);
            }
        }

        // Delete SubMenu
        await SubMenu.findByIdAndDelete(subMenuId, { session });

        await session.commitTransaction();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.SUBMENU_DELETED,
            meta: {
                menuId,
                subMenuId,
                deletedSubMenu: subMenu.name,
                affectedItemsCount,
                itemsAction
            },
            data: {
                deletedSubMenu: {
                    _id: subMenu._id,
                    name: subMenu.name,
                    category: subMenu.category
                }
            },
        });

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

// Get all submenus for a menu
exports.getSubMenusByMenu = asyncWrapper(async (req, res) => {
    const { menuId } = req.params;

    // Verify menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.MENU_NOT_FOUND,
        });
    }

    const subMenus = await SubMenu.find({ menuId }).sort({ createdAt: -1 });

    // Get item counts for each submenu
    const subMenusWithCounts = await Promise.all(
        subMenus.map(async (subMenu) => {
            const itemCount = await MenuItem.countDocuments({
                parentId: subMenu._id,
                parentType: 'Submenu'
            });
            return {
                ...subMenu.toObject(),
                itemCount
            };
        })
    );

    return res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Found ${subMenus.length} submenus`,
        meta: {
            menuId,
            count: subMenus.length
        },
        data: {
            subMenus: subMenusWithCounts
        }
    });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('SubMenu Controller Error:', err);

    // Handle custom errors
    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            process: "SubMenu Operation"
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
        message: MESSAGES.INTERNAL_ERROR,
        process: "SubMenu Operation",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
};

exports.getSubMenu;
exports.createSubMenu;
exports.updateSubMenu;
exports.deleteSubMenu;
exports.getSubMenusByMenu;
exports.errorHandler;