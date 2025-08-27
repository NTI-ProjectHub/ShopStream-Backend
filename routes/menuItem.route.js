const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItem.controller');
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');

router.get('/:menuId/items/' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.getAllItems);
router.post('/:menuId/items/create' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.createItem);
router.get('/:menuId/items/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.getItemById);
router.put('/:menuId/items/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.updateItem);
router.delete('/:menuId/items/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.deleteItem);

module.exports = router;