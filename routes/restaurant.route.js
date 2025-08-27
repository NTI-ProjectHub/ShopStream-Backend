const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const router = express.Router();
const {authenticate} = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');

router.get('/', authenticate, restaurantController.getAllRestaurants);
router.get('/:id', authenticate, restaurantController.getRestaurantById);
router.post('/', authenticate, roleCheck(['restaurant']), restaurantController.createRestaurantRequest);
router.delete('/:id', authenticate, roleCheck(['restaurant']), restaurantController.removeRestaurantRequest);

module.exports = router;
