const express = require('express');
const adminController = require('../controllers/admin.controller');
const router = express.Router();
const { authenticate } = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');

// Users
router.get('/users', authenticate, roleCheck(['admin']), adminController.getAllUsers);
router.delete('/users/:id', authenticate, roleCheck(['admin']), adminController.deleteUser);

// Restaurants
router.get('/restaurants', authenticate, roleCheck(['admin']), adminController.getAllRestaurants);
router.get('/restaurants/:id', authenticate, roleCheck(['admin']), adminController.getRestaurant);
router.delete('/restaurants/:id', authenticate, roleCheck(['admin']), adminController.deleteRestaurant);

// Restaurant Requests
router.get('/restaurant-requests', authenticate, roleCheck(['admin']), adminController.getAllRestaurantRequests);
router.get('/restaurant-requests/:id', authenticate, roleCheck(['admin']), adminController.getRestaurantRequest);
router.post('/restaurant-requests/:id/approve', authenticate, roleCheck(['admin']), adminController.approveRestaurantRequest);
router.post('/restaurant-requests/:id/reject', authenticate, roleCheck(['admin']), adminController.rejectRestaurantRequest);

module.exports = router;
