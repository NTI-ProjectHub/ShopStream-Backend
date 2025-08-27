const Restaurant = require('../models/restaurant/restaurant.model');
const RestaurantRequest = require('../models/restaurant/restaurant_Request.model');
const Menu = require('../models/menu/menu.model');
const {asyncWrapper} = require('../middlewares/asyncWrapper.middleware');
const dataAccessHelper = require('../utils/Helper/dataAccess');
const { pagination } = require('../utils/pagination');
const {restaurantFilter} = require('../utils/filter')
const { validationResult } = require('express-validator');
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");

// Auth middleware check
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
            success: false,
            message: MESSAGES.UNAUTHORIZED 
        });
    }
    next();
};

exports.getAllRestaurants = asyncWrapper(async (req, res) => {
    const filter = await restaurantFilter(Restaurant, req);
    const { total, page, limit, totalPages , data } = await pagination(Restaurant, req  , filter);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.RESTAURANTS_RETRIEVED_SUCCESSFULLY,
        result: total,
        meta: { 
            page, limit,
            totalPages,
            count: data.length
        },
        data
    });
});

exports.getRestaurantById = asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const restaurant = await dataAccessHelper.getRestaurantById(id);
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND 
        });
    }

    const menu = await dataAccessHelper.getMenuByRestaurantId(id);
    const subMenus = menu ? await dataAccessHelper.getSubMenusByMenuId(menu._id) : [];
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.RESTAURANT_RETRIEVED_SUCCESSFULLY,
        data: {
            restaurant,
            menu: menu || null,
            subMenus
        }
    });
});

exports.getRestaurantByUsername = asyncWrapper(async (req, res) => {
    const { restaurantUsername } = req.params;

    const restaurant = await Restaurant.findOne({ username: restaurantUsername });
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND 
        });
    }

    const menu = await Menu.findOne({ restaurantId: restaurant._id });
    if (!menu) {
        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: MESSAGES.RESTAURANT_FOUND_NO_MENU,
            data: {
                restaurant,
                menu: null,
                subMenus: []
            }
        });
    }

    const subMenus = await dataAccessHelper.getSubMenusByMenuId(menu._id);

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.RESTAURANT_RETRIEVED_SUCCESSFULLY,
        meta: {
            restaurantId: restaurant._id,
            menuId: menu._id,
            counts: {
                restaurant: 1,
                menu: 1,
                subMenus: subMenus.length,
            }
        },
        data: {
            restaurant,
            menu,
            subMenus
        }
    });
});

exports.createRestaurantRequest = asyncWrapper(async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { name, username, description, address, phone } = req.body;

    // Manual validation for required fields
    if (!name || !username || !description || !address || !phone) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false,
            message: MESSAGES.REQUIRED_FIELDS,
            details: "Name, username, description, address, and phone are required"
        });
    }

    // Check if restaurant already exists for this user or username is taken
    const existingRestaurant = await Restaurant.findOne({
        $or: [
            { userId: req.user._id },
            { username: username }
        ]
    });

    if (existingRestaurant) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_ALREADY_EXISTS,
            details: existingRestaurant.userId.equals(req.user._id) 
                ? "You already have a restaurant" 
                : "Username is already taken"
        });
    }

    // Check if there's already a pending request
    const existingRequest = await RestaurantRequest.findOne({
        userId: req.user._id,
        type: "create",
        status: "pending"
    });

    if (existingRequest) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.RESTAURANT_REQUEST_ALREADY_EXISTS
        });
    }

    // Use transaction for data consistency
    const session = await Restaurant.startSession();
    session.startTransaction();

    try {
        // Create Restaurant
        const restaurant = new Restaurant({
            name: name.trim(),
            username: username.toLowerCase().trim(),
            description: description.trim(),
            address: address.trim(),
            phone: phone.trim(),
            userId: req.user._id,
            status: "pending"
        });

        await restaurant.save({ session });

        // Create Restaurant Request
        const restaurantRequest = new RestaurantRequest({
            userId: req.user._id,
            restaurantId: restaurant._id,
            type: "create",
            status: "pending"
        });

        await restaurantRequest.save({ session });

        await session.commitTransaction();

        res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: MESSAGES.RESTAURANT_REQUEST_CREATED,
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
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

exports.removeRestaurantRequest = asyncWrapper(async (req, res) => {
    const { restaurantId } = req.params;

    const restaurant = await dataAccessHelper.getRestaurantById(restaurantId);
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND 
        });
    }

    // Check if user owns this restaurant
    if (!restaurant.userId.equals(req.user._id)) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.RESTAURANT_REQUEST_DELETION_ERROR
        });
    }

    // Check if restaurant is already deleted or has pending delete request
    if (restaurant.status === 'deleted') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.RESTAURANT_ALREADY_DELETED
        });
    }

    const existingRequest = await RestaurantRequest.findOne({
        restaurantId: restaurant._id,
        type: "delete",
        status: "pending"
    });

    if (existingRequest) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
            success: false,
            message: MESSAGES.RESTAURANT_REQUEST_ALREADY_EXISTS
        });
    }

    const restaurantRequest = new RestaurantRequest({
        userId: req.user._id,
        restaurantId: restaurant._id,
        type: "delete",
        status: "pending"
    });

    await restaurantRequest.save();

    res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.RESTAURANT_REQUEST_CREATED,
        meta: {
            userId: req.user._id,
            restaurantId: restaurant._id,
            restaurantRequestId: restaurantRequest._id
        },
        data: {
            restaurantRequest
        }
    });
});

// Additional helper method for updating restaurant status
exports.updateRestaurantStatus = asyncWrapper(async (req, res) => {
    const { restaurantId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'deleted'];
    if (!validStatuses.includes(status)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND
        });
    }

    restaurant.status = status;
    await restaurant.save();

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Restaurant status updated to ${status}`,
        data: {
            restaurant
        }
    });
});

// Error handling middleware (add this to your app.js)
exports.errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: MESSAGES.INTERNAL_ERROR,
        process: "Restaurant Operation",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
};

// Apply auth middleware to all routes that need it
exports.getAllRestaurants = [requireAuth, exports.getAllRestaurants];
exports.getRestaurantById = [requireAuth, exports.getRestaurantById];
exports.getRestaurantByUsername = [requireAuth, exports.getRestaurantByUsername];
exports.createRestaurantRequest = [requireAuth, exports.createRestaurantRequest];
exports.removeRestaurantRequest = [requireAuth, exports.removeRestaurantRequest];
exports.updateRestaurantStatus = [requireAuth, exports.updateRestaurantStatus];