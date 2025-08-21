const express = require('express');
const userController = require('../controllers/user.controller');
const {authenticate} = require('../middlewares/authentication.middleware');
const router = express.Router();

router.post('/register', userController.register);
router.post('/login', authenticate , userController.login);
router.post('/logout', authenticate , userController.logout);

module.exports = router;



