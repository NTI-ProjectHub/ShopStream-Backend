const MenuItem = require('../models/menu/menuItem.model');
const Menu = require('../models/menu/menu.model');
const {getMenuByUserId,getMenuByRestaurantId} = require('../utils/Helper/dataAccess');
exports.createItem = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const { name, description, price } = req.body;
        let menu;
        if(req.user.role === 'restaurant') {
            menu = await getMenuByUserId(req.user._id);
        } else {
            const restaurantId = req.body.restaurantId;
            menu = await getMenuByRestaurantId(restaurantId);
        }

        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }

        if(menu.subMenus && menu.subMenus.length > 0) {
            const subMenu = menu.subMenus.find(subMenu => subMenu._id.toString() === req.body.subMenuId);
            subMenu.items.push(menuItem._id);
            await subMenu.save();
        } else {
            const menuItem = new MenuItem({
                menuId: menu._id,
                name,
                description,
                price,
            });
            await menuItem.save();

            menu.items.push(menuItem._id);
            await menu.save();
        }
        res.status(201).json({
            message: 'Menu item created successfully',
            result: 1,
            meta: {},
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Item Creation"
        });
    }
}

exports.updateItem = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const { name, description, price , isAvailable } = req.body;
        let menuItem;
        if(req.user.role === 'restaurant') {
            menuItem = await MenuItem.findById(req.params.itemId);
        } else {
            const restaurantId = req.body.restaurantId;
            menuItem = await MenuItem.findOne({ restaurantId:restaurantId });
            if(!menuItem) {
                return res.status(404).json({ message: 'Menu item not found' });
            }
        }
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        menuItem.name = name;
        menuItem.description = description;
        menuItem.price = price;
        if(req.menuImage) {
            menuItem.image = req.menuImage;
        }
        menuItem.isAvailable = isAvailable;
        await menuItem.save();
        res.status(200).json({
            message: 'Menu item updated successfully',
            result: 1,
            meta: {},
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Item Update"
        });
    }
}

exports.deleteItem = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const menuItem = await MenuItem.findById(req.params.itemId);
        checkOwner(menuItem , req.user);
        await menuItem.remove();
        res.status(200).json({
            message: 'Menu item deleted successfully',
            menuItem
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Item Deletion"
        });
    }
}

exports.getItemById = async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.itemId);
        checkOwner(menuItem , req.user);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json({
            message: 'Menu item retrieved successfully',
            menuItem
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Item Retrieval"
        });
    }
}

exports.getAllItems = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        let menuItems;
        if(req.user.role === 'restaurant') {
            const menu = await Menu.findOne({ restaurantId: req.user._id });
            if(!menu) {
                return res.status(404).json({ message: 'Menu not found' });
            }

            menuItems = await MenuItem.find({ menuId: menu._id });
        } else {
            menuItems = await MenuItem.find();
        }
        res.status(200).json({
            message: 'Menu items retrieved successfully',
            menuItems
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Items Retrieval"
        });
    }
}

function checkOwner(menuItem , user) {
        const isOwner = user.role === 'restaurant' && menuItem.menuId.toString() === user._id.toString();
        if(user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'You are not authorized to delete this menu item' });
        }
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
}