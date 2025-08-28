const Restaurant = require('../models/restaurant/restaurant.model');
const RestaurantRequest = require('../models/restaurant/restaurant_Request.model');
const Menu = require('../models/menu/menu.model');
const { asyncWrapper } = require('../middlewares/asyncWrapper.middleware');
const dataAccessHelper = require('../utils/Helper/dataAccess');
const { pagination } = require('../utils/pagination');
const { restaurantFilter } = require('../utils/filter');
const { validationResult } = require('express-validator');
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");

// ✅ Get all restaurants (approved only)
exports.getAllRestaurants = asyncWrapper(async (req, res) => {
    const filter = await restaurantFilter(Restaurant, req);
    const { total, page, limit, totalPages, data } = await pagination(
        Restaurant,
        req,
        { status: "approved" },
        filter
    );

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.RESTAURANTS_RETRIEVED_SUCCESSFULLY,
        result: total,
        meta: { page, limit, totalPages, count: data.length },
        data
    });
});

// ✅ Get restaurant by ID
exports.getRestaurantById = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const restaurant = await dataAccessHelper.getRestaurantById(id);

    if (!restaurant || restaurant.status !== "approved") {
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
        data: { restaurant, menu: menu || null, subMenus }
    });
});

// ✅ Get restaurant by username
exports.getRestaurantByUsername = asyncWrapper(async (req, res) => {
    const { restaurantUsername } = req.params;
    const restaurant = await Restaurant.findOne({ username: restaurantUsername });

    if (!restaurant || restaurant.status !== "approved") {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND
        });
    }

    const menu = await Menu.findOne({ restaurantId: restaurant._id });
    const subMenus = menu ? await dataAccessHelper.getSubMenusByMenuId(menu._id) : [];

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: menu
            ? MESSAGES.RESTAURANT_RETRIEVED_SUCCESSFULLY
            : MESSAGES.RESTAURANT_FOUND_NO_MENU,
        meta: {
            restaurantId: restaurant._id,
            menuId: menu?._id || null,
            counts: { restaurant: 1, menu: menu ? 1 : 0, subMenus: subMenus.length }
        },
        data: { restaurant, menu, subMenus }
    });
});

// ✅ Create restaurant request
exports.createRestaurantRequest = asyncWrapper(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VALIDATION_ERROR,
            errors: errors.array()
        });
    }

    const { name, username, description, address, phone } = req.body;
    if (!name || !username || !description || !address || !phone) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.REQUIRED_FIELDS,
        });
    }

    const existingRestaurant = await Restaurant.findOne({
        $or: [{ userId: req.user._id }, { username }]
    });
    if (existingRestaurant) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.RESTAURANT_ALREADY_EXISTS,
        });
    }

    const existingRequest = await RestaurantRequest.findOne({
        userId: req.user._id,
        type: "create",
        status: "pending"
    });
    if (existingRequest) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.RESTAURANT_REQUEST_ALREADY_EXISTS,
        });
    }

    const session = await Restaurant.startSession();
    try {
        await session.withTransaction(async () => {
            const restaurant = await Restaurant.create([{
                name: name.trim(),
                username: username.toLowerCase().trim(),
                description: description.trim(),
                address: address.trim(),
                phone: phone.trim(),
                userId: req.user._id,
                status: "pending"
            }], { session });

            const restaurantRequest = await RestaurantRequest.create([{
                userId: req.user._id,
                restaurantId: restaurant[0]._id,
                type: "create",
                status: "pending"
            }], { session });

            res.status(STATUS_CODES.CREATED).json({
                success: true,
                message: MESSAGES.RESTAURANT_REQUEST_CREATED,
                meta: {
                    userId: req.user._id,
                    restaurantId: restaurant[0]._id,
                    restaurantRequestId: restaurantRequest[0]._id,
                },
                data: { restaurant: restaurant[0], restaurantRequest: restaurantRequest[0] }
            });
        });
    } finally {
        session.endSession();
    }
});

// ✅ Remove restaurant request
exports.removeRestaurantRequest = asyncWrapper(async (req, res) => {
    const { restaurantId } = req.params;
    const restaurant = await dataAccessHelper.getRestaurantById(restaurantId);

    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND
        });
    }
    if (!restaurant.userId.equals(req.user._id)) {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            success: false,
            message: MESSAGES.RESTAURANT_REQUEST_DELETION_ERROR
        });
    }
    if (restaurant.status === "deleted") {
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

    const restaurantRequest = await RestaurantRequest.create({
        userId: req.user._id,
        restaurantId: restaurant._id,
        type: "delete",
        status: "pending"
    });

    res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: MESSAGES.RESTAURANT_REQUEST_CREATED,
        data: { restaurantRequest }
    });
});

// ✅ Update restaurant status
exports.updateRestaurantStatus = asyncWrapper(async (req, res) => {
    const { restaurantId } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "deleted"];

    if (!validStatuses.includes(status)) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        { status },
        { new: true }
    );
    if (!restaurant) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: MESSAGES.RESTAURANT_NOT_FOUND
        });
    }

    res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Restaurant status updated to ${status}`,
        data: { restaurant }
    });
});
