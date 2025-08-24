const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItem.controller');
const {authenticate} = require('../middlewares/authentication.middleware');
const {roleCheck} = require('../middlewares/authorization.middleware');

router.post('/create' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.createItem);
router.get('/getAll' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.getAllItems);
router.get('/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.getItemById);
router.put('/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.updateItem);
router.delete('/:id' , authenticate , roleCheck(['restaurant','admin']) , menuItemController.deleteItem);

module.exports = router;