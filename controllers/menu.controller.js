const Menu = require('../models/menu/menu.model');
const Restaurant = require('../models/restaurant.model');
const {getMenuById , getMenuItemsByMenuId, getMenuByUserId} = require('../utils/Helper/dataAccess');
const {checkRestaurantAuthorization} = require('../middlewares/authorization.middleware')
const cloud = require('../utils/cloud');
const MenuItem = require('../models/menu/menuItem.model');
const {pagination} = require('../utils/pagination');

exports.getRestaurantMenuItems = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'You have to login first' });
        }

        console.log("User ID from req.user:", req.user._id);

        // ✅ Find menu for this user
        const menu = await getMenuByUserId(req.user._id);
        if (!menu) {
            return res.status(404).json({ message: "Menu not found for this restaurant" });
        }
        console.log("Menu ID from user:", menu._id);

        // ✅ Use pagination directly instead of extra query
        const { total, page, limit, data } = await pagination(MenuItem, req, { menuId: menu._id });

        if (total === 0) {
            return res.status(404).json({ message: "This menu has no items" });
        }

        return res.status(200).json({
            message: 'Menu items found',
            result: total,
            meta: { page, limit },
            data: data
        });

    } catch (error) {
        console.error("Menu Retrieval Error:", error);
        return res.status(500).json({
            message: 'Internal server error',
            process: "Menu Retrieval"
        });
    }
};

// restaurant make new menu
exports.createMenu = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }

        const { name, description } = req.body;

        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (!restaurant.menuId) {
            return res.status(400).json({ message: "This restaurant already have a menu" });
        }
        const menu = new Menu({
            restaurantId: req.user._id,
            name,
            description,
            image: req.menuImage || null, // store the Cloudinary link
        });
        await menu.save();

        restaurant.menuId = menu._id;
        await restaurant.save();

        return res.status(201).json({
            message: 'Menu created successfully',
            result: 1,
            meta: {},
            data: menu
        });

    } catch (error) {
        console.error("Menu Creation Error:", error);
        return res.status(500).json({
            message: 'Internal server error',
            process: "Menu Creation"
        });
    }
};

exports.updateMenu = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
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
            message: 'Menu updated successfully',
            result: 1,
            meta: {},
            data: menu
        });
    } catch (error) {
        console.error("Menu Update Error:", error);
        return res.status(error.status || 500).json({
            message: error.message || 'Internal server error',
            process: "Menu Update"
        });

    }
}

exports.deleteMenu = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const menu = await getMenuAndAuthorize(req, req.params.menuId);
        if (menu.image) {
            await cloud.deleteCloud(menu.image);
        }
        await menu.deleteOne();
        return res.status(200).json({
            message: 'Menu deleted successfully',
            result: 1,
            meta: {},
            data: menu
        });
    } catch (error) {
        console.error("Menu Deletion Error:", error);
        return res.status(error.status || 500).json({
            message: error.message || 'Internal server error',
            process: "Menu Deletion"
        });
    }
}

async function getMenuAndAuthorize(req, menuId) {
    const menu = await getMenuById(menuId);
    if (!menu) {
        const error = new Error('Menu not found');
        error.status = 404;
        throw error;
    }
    checkRestaurantAuthorization(req, menu);
    return menu;
}