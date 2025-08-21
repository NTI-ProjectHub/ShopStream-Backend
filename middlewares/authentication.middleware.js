const jwt = require('../utils/jwt.js');
const cookie = require('../utils/cookie.js');
const User = require('../models/user.model.js');

exports.authenticate = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken; 
        if (!accessToken) {
            next();
            return;
        }
        const decoded = jwt.verifyToken(accessToken, 'access');  // { id: 123, role: customer, iat: 1694567890, exp: 1694571490 }
        if(!decoded) {
            next();
            return;
        }
        
        const user = await User.findById(decoded.id);
        if (!user) {
            next();
            return;
        }

        // if access token is expired, check refresh token
        if(jwt.checkExpiry(accessToken)) {
            const refreshToken = user.refreshToken
            if (!refreshToken || refreshToken === '') {
                next();
                return;
            }

            // reset refresh token if expired
            if(jwt.checkExpiry(refreshToken) || user.sessionExpiry < Date.now()) {
                user.refreshToken = '';
                await user.save();
                next();
                return;
            }
            const newAccessToken = jwt.generateAccessToken(user);
            if(!newAccessToken) {
                next();
                return;
            }
            cookie.setCookie(res , 'accessToken' , newAccessToken , 60*1000)
            await user.save();
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}