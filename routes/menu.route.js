const express = require('express');
const menuController = require('../controllers/menu.controller');
const router = express.Router();
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');
const upload = require('../config/multer.Config');
const cloud = require('../utils/uploadMenu');


router.get('/:restaurantId', authenticate, menuController.getRestaurantMenuItems);
router.post('/:restaurantId', authenticate, roleCheck(['restaurant','admin']) , upload.single('menuImage') , cloud.uploadCloud , menuController.createMenu);


module.exports = router;