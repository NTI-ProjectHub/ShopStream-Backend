const Restaurant = require('../models/restaurant.model');
const Menu = require('../models/menu.model');

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
        const restaurant = await Restaurant.findById(req.params.id);
        const menu = await Menu.findOne({ restaurantId: req.params.id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json({
            message: 'Restaurant found',
            restaurant,
            menu
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Restaurant Retrieval"
        });
    }
}
