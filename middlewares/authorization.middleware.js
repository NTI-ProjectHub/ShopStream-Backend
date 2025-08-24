// Authorization middleware (Customer, Restaurant, Admin)
const User = require('../models/user.model');

exports.roleCheck = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'You have to login first' });
            }
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'You do not have permission to access this resource' });
            }
            next(); // Only call next() once
        } catch (error) {
            return res.status(500).json({ 
                message: 'Internal server error',
                process: "User Authorization"
            });
        }
    }
};

exports.checkRestaurantAuthorization = function (req, menu) {
    if (menu.restaurantId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        const error = new Error('You are not authorized to perform this action');
        error.status = 403;
        throw error;
    }
}