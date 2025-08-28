const User = require('../models/user.model');
const Restaurant = require('../models/restaurant/restaurant.model');
const RestaurantRequest = require('../models/restaurant/restaurant_Request.model');


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        res.status(200).json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getAllRestaurants = async(req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

}

exports.getAllRestaurantRequests = async (req, res) => {
    try {
        const restaurantRequests = await RestaurantRequest.find();
        res.status(200).json(restaurantRequests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        await user.remove();
        res.status(200).json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
        await restaurant.remove();
        res.status(200).json({ message: "Restaurant deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getRestaurantRequest = async (req, res) => {
    try {
        const restaurantRequest = await RestaurantRequest.findById(req.params.id);
        if (!restaurantRequest) return res.status(404).json({ message: "Restaurant Request not found" });
        res.status(200).json(restaurantRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.rejectRestaurantRequest = async (req, res) => {
    try {
        const restaurantRequest = await RestaurantRequest.findById(req.params.id);
        if (!restaurantRequest) return res.status(404).json({ message: "Restaurant Request not found" });
        restaurantRequest.status = "rejected";
        await restaurantRequest.save();
        res.status(200).json({ message: "Restaurant Request deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.approveRestaurantRequest = async (req, res) => {
    try {
        const restaurantRequest = await RestaurantRequest.findById(req.params.id);
        if (!restaurantRequest) return res.status(404).json({ message: "Restaurant Request not found" });
        restaurantRequest.status = "approved";
        await restaurantRequest.save();
        res.status(200).json({ message: "Restaurant Request approved" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}