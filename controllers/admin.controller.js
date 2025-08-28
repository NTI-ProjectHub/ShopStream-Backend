const User = require('../models/user.model');
const Restaurant = require('../models/restaurant/restaurant.model');
const RestaurantRequest = require('../models/restaurant/restaurant_Request.model');
const { userFilter, restaurantFilter, restaurantRequestFilter } = require('../utils/filter');
const { pagination } = require('../utils/pagination');

// ✅ Get all users with filter + pagination
exports.getAllUsers = async (req, res) => {
  try {
    const filter = await userFilter(User, req);
    const result = await pagination(User, req, {}, filter);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single user (unchanged if you want it)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all restaurants with filter + pagination
exports.getAllRestaurants = async (req, res) => {
  try {
    const filter = await restaurantFilter(Restaurant, req);
    const result = await pagination(Restaurant, req, {}, filter);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single restaurant
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all restaurant requests with filter + pagination
exports.getAllRestaurantRequests = async (req, res) => {
  try {
    const filter = await restaurantRequestFilter(RestaurantRequest, req);
    const result = await pagination(RestaurantRequest, req, {}, filter);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single request
exports.getRestaurantRequest = async (req, res) => {
  try {
    const restaurantRequest = await RestaurantRequest.findById(req.params.id);
    if (!restaurantRequest) return res.status(404).json({ message: "Restaurant Request not found" });
    res.status(200).json(restaurantRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.remove();
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete restaurant
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    await restaurant.remove();
    res.status(200).json({ message: "Restaurant deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Reject request
exports.rejectRestaurantRequest = async (req, res) => {
  try {
    const restaurantRequest = await RestaurantRequest.findById(req.params.id);
    if (!restaurantRequest) return res.status(404).json({ message: "Restaurant Request not found" });
    restaurantRequest.status = "rejected";
    await restaurantRequest.save();
    res.status(200).json({ message: "Restaurant Request rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Approve request
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
};