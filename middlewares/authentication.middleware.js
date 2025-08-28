const jwt = require('../utils/jwt.js');
const cookie = require('../utils/cookie.js');
const User = require('../models/user.model.js');

exports.authenticate = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken 
        || req.headers['authorization']?.split(' ')[1]; 

        if (!accessToken) {
            return next(); // Allow unauthenticated users to continue
        }

        const decoded = jwt.verifyToken(accessToken, 'access');
        if (!decoded) {
            return next();
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return next();
        }

        // Handle expired access token
        if (jwt.checkExpiry(accessToken)) {
            const refreshToken = user.refreshToken;
            if (!refreshToken || refreshToken === '' || jwt.checkExpiry(refreshToken) || user.sessionExpiry < Date.now()) {
                user.refreshToken = '';
                await user.save();
                return next();
            }

            const newAccessToken = jwt.generateAccessToken(user);
            if (newAccessToken) {
                cookie.setCookie(res, 'accessToken', newAccessToken, 60 * 1000);
                await user.save();
            }
        }

        req.user = user;
        return next();

    } catch (error) {
        return res.status(500).json({ 
            message: 'Internal server error',
            process: "User Authentication"
        });
    }
};