const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const router = express.Router();
const {authenticate} = require('../middlewares/authentication.middleware');

router.get('/', authenticate, restaurantController.getAllRestaurants);
router.get('/:id', authenticate, restaurantController.getRestaurantById);

module.exports = router;
