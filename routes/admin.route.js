const express = require('express');
const adminController = require('../controllers/admin.controller');
const router = express.Router();
const {authenticate} = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');

router.get('/users', authenticate, roleCheck(['admin']), adminController.getAllUsers);
router.get('/restaurants', authenticate, roleCheck(['admin']), adminController.getAllRestaurants);
router.get('/restaurants/:id', authenticate, roleCheck(['admin']), adminController.getRestaurant);
router.get('/restaurant-requests', authenticate, roleCheck(['admin']), adminController.getAllRestaurantRequests);
router.get('/restaurant-requests/:id', authenticate, roleCheck(['admin']), adminController.getRestaurantRequest);
router.post('/restaurant-requests/:id/approve', authenticate, roleCheck(['admin']), adminController.approveRestaurantRequest);
router.post('/restaurant-requests/:id/reject', authenticate, roleCheck(['admin']), adminController.rejectRestaurantRequest);
router.delete('/users/:id', authenticate, roleCheck(['admin']), adminController.deleteUser);
router.delete('/restaurants/:id', authenticate, roleCheck(['admin']), adminController.deleteRestaurant);

module.exports = router;
