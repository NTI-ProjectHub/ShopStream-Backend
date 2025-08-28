const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const router = express.Router();
const { authenticate } = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');
const upload = require('../config/multer.Config');
const cloud = require('../middlewares/cloud');

// 🔹 Restaurants
router.get('/', authenticate, restaurantController.getAllRestaurants);
router.get('/:id', authenticate, restaurantController.getRestaurantById);

// 🔹 Restaurant Requests
router.post('/requests', authenticate, roleCheck(['restaurant']), upload.single('coverImage'), cloud.uploadCloud, restaurantController.createRestaurantRequest);

router.delete('/requests/:id', authenticate, roleCheck(['restaurant']), restaurantController.removeRestaurantRequest);

module.exports = router;