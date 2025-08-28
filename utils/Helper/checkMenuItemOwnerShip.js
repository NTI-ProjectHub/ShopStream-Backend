const MESSAGES = require('../../constants/messages');
const Restaurant = require('../../models/restaurant.model');


// Helper function for ownership checking
exports.checkMenuItemOwnership = async (user, restaurantId) => {
    if (user.role === "admin") {
        return { authorized: true };
    }

    if (user.role === "restaurant") {
        const userRestaurant = await Restaurant.findOne({ userId: user._id });
        if (!userRestaurant) {
            return { authorized: false, message: "User restaurant not found" };
        }

        if (restaurantId.toString() !== userRestaurant._id.toString()) {
            return { authorized: false, message: MESSAGES.AUTHORIZATION_ERROR };
        }

        return { authorized: true };
    }

    return { authorized: false, message: "Insufficient permissions" };
}