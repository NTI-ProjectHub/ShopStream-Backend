const Menu = require('../models/menu.model');
const MenuItem = require('../models/menuItem.model');

exports.getRestaurantMenuItems = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const menu = await Menu.findOne({ restaurantId: req.params.id });
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        const menuItems = await MenuItem.find({ menuId: menu._id });
        res.status(200).json({
            message: 'Menu items found',
            menuItems
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Menu Retrieval"
        });
    }
}

// restaurant make new menu
exports.createMenu = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }

        const { name, description } = req.body;

        // Check for existing menu
        const existingMenu = await Menu.findOne({ restaurantId: req.user._id });
        if (existingMenu) {
            return res.status(400).json({ message: "You already have a menu" });
        }

        const menu = new Menu({
            restaurantId: req.user._id,
            name,
            description,
            image: req.menuImage || null, // store the Cloudinary link
        });

        await menu.save();

        return res.status(201).json({
            message: 'Menu created successfully',
            menu
        });

    } catch (error) {
        console.error("Menu Creation Error:", error);
        return res.status(500).json({
            message: 'Internal server error',
            process: "Menu Creation"
        });
    }
};