const Restaurant = require('../models/restaurant/restaurant.model');
const RestaurantRequest = require('../models/restaurant/restaurant_Request.model');
const Menu = require('../models/menu/menu.model');
const dataAccessHelper = require('../utils/Helper/dataAccess');
const {pagination} = require('../utils/pagination');

const MESSAGES = {
    RESTAURANT_NOT_FOUND: "Restaurant not found",
    RESTAURANT_REQUEST_NOT_FOUND: "Restaurant request not found",
    RESTAURANT_REQUEST_ALREADY_EXISTS: "Restaurant request already exists",
    RESTAURANT_ALREADY_EXISTS: "Restaurant already exists",
    RESTAURANT_ALREADY_OPEN: "Restaurant already open",
    RESTAURANT_ALREADY_CLOSED: "Restaurant already closed",
    RESTAURANT_ALREADY_DELETED: "Restaurant already deleted",
}

exports.getAllRestaurants = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "You have to login first" });
        }

        const { total, page, limit, data } = await pagination(Restaurant, req);

        res.status(200).json({
            message: "Restaurants found",
            result: total,
            meta: { page, limit, count: data.length },
            data
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            process: "Restaurant Retrieval",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

exports.getRestaurantById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "You have to login first" });
        }

        const restaurant = await dataAccessHelper.getRestaurantById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const menu = await dataAccessHelper.getMenuByRestaurantId(req.params.id);
        const subMenus = menu ? await dataAccessHelper.getSubMenusByMenuId(menu._id) : [];

        res.status(200).json({
            message: "Restaurant found",
            result: 1,
            data: {
                restaurant,
                menu: menu || null,
                subMenus
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            process: "Restaurant Retrieval",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

exports.createRestaurantRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "You have to login first" });
        }

        const { name, description, address, phone, coverImage } = req.body;

        // === Validation ===
        if (!name || !address || !phone) {
            return res.status(400).json({ message: "Name, address, and phone are required" });
        }

        // ===
        const existingRestaurant = await Restaurant.findOne({userId: req.user._id});
        if (existingRestaurant) {
            return res.status(400).json({ message: "Restaurant already exists" });
        }

        // === Create Restaurant ===
        const restaurant = new Restaurant({
            name,
            description,
            address,
            phone,
            coverImage,
            userId: req.user._id,
            status: "pending"
        });

        await restaurant.save();

        // === Create Restaurant Request ===
        const restaurantRequest = new RestaurantRequest({
            userId: req.user._id,
            restaurantId: restaurant._id,
            type: "create",
            status: restaurant.status
        });

        await restaurantRequest.save();

        // === Response ===
        res.status(201).json({
            message: "Create request saved successfully",
            result: 1,
            meta: {
                userId: req.user._id,
                restaurantId: restaurant._id,
                restaurantRequestId: restaurantRequest._id,
                status: restaurantRequest.status
            },
            data: {
                restaurant,
                restaurantRequest
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            process: "Restaurant Creation",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

exports.removeRestaurantRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "You have to login first" });
        }

        const restaurant = await dataAccessHelper.getRestaurantById(req.params.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const existingRequest = await RestaurantRequest.findOne({restaurantId: restaurant._id, type: "delete"});
        if (existingRequest) {
            return res.status(400).json({ message: "Delete request already exists" });
        }

        const restaurantRequest = new RestaurantRequest({
            userId: req.user._id,
            restaurantId: restaurant._id,
            type: "delete",
            status: "pending"
        });

        res.status(200).json({
            message: "Restaurant request removed",
            result: 1,
            meta: {
                userId: req.user._id,
                restaurantRequestId: restaurantRequest._id
            },
            data: {
                restaurantRequest
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            process: "Restaurant Request Removal",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};