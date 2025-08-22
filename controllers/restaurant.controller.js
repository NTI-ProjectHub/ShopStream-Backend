const Restaurant = require('../models/restaurant.model');
const Menu = require('../models/menu.model');
const dataAccessHelper = require('../utils/Helper/dataAccess');

exports.getAllRestaurants = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Restaurant Retrieval"
        });
    }
}

exports.getRestaurantById = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const restaurant = await dataAccessHelper.getRestaurantById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const menu = await dataAccessHelper.getMenuByRestaurantId(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }

        const menuItems = await dataAccessHelper.getMenuItemsByMenuId(menu._id);
        if (!menuItems) {
            return res.status(404).json({ message: 'Menu items not found' });
        }
        res.status(200).json({
            message: 'Restaurant found',
            restaurant,
            menu,
            menuItems
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Restaurant Retrieval"
        });
    }
}
