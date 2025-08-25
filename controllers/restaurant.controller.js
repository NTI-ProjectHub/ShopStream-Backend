const Restaurant = require('../models/restaurant.model');
const dataAccessHelper = require('../utils/Helper/dataAccess');
const {pagination} = require('../utils/pagination');

exports.getAllRestaurants = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const { total, page, limit, data } = await pagination(Restaurant, req);
        res.status(200).json({
            message: 'Restaurants found',
            result: total,
            meta: { page, limit },
            data: data
        });
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

        const subMenus = await dataAccessHelper.getSubMenusByMenuId(menu._id);
        res.status(200).json({
            message: 'Restaurant found',
            result: 1,
            meta: {},
            data: {
                restaurant,
                menu,
                subMenus
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Restaurant Retrieval"
        });
    }
}