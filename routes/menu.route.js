const express = require('express');
const menuController = require('../controllers/menu.controller');
const router = express.Router();
const { authenticate } = require('../middlewares/authentication.middleware');
const { roleCheck } = require('../middlewares/authorization.middleware');
const upload = require('../config/multer.config');
const cloud = require('../middlewares/cloud');

// ✅ Get all menu items for a restaurant
router.get(
  '/:restaurantId/menu-items',
  authenticate,
  menuController.getRestaurantMenu
);

// ✅ Create new menu item
router.post(
  '/:restaurantId/menu',
  authenticate,
  roleCheck(['restaurant', 'admin']),
  upload.single('menuImage'),
  cloud.uploadCloud,
  menuController.createMenu
);

// ✅ Update menu item
router.put(
  '/:menuId',
  authenticate,
  roleCheck(['restaurant', 'admin']),
  upload.single('menuImage'),
  cloud.uploadCloud,
  menuController.updateMenu
);

// ✅ Delete menu item
router.delete(
  '/:menuId',
  authenticate,
  roleCheck(['restaurant', 'admin']),
  menuController.deleteMenu
);

module.exports = router;