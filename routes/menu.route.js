const express = require('express');
const menuController = require('../controllers/menu.controller');
const router = express.Router();
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');
const upload = require('../config/multer.Config');
const cloud = require('../middlewares/cloud');


router.get('/:restaurantId/menu-items', authenticate, menuController.getRestaurantMenu);
router.post('/:restaurantId/menu', authenticate, roleCheck(['restaurant','admin']), upload.single('menuImage'), cloud.uploadCloud, menuController.createMenu);
router.put('/:menuId', authenticate, roleCheck(['restaurant','admin']), upload.single('menuImage'), cloud.uploadCloud, menuController.updateMenu);
router.delete('/:menuId', authenticate, roleCheck(['restaurant','admin']), menuController.deleteMenu);

module.exports = router;