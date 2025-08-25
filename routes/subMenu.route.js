const { getSubMenu, createSubMenu, updateSubMenu, deleteSubMenu } = require('../controllers/subMenu.controller');
const { authenticate } = require('../middlewares/authentication.middleware');
const { roleCheck , verifySubMenuOwner} = require('../middlewares/authorization.middleware')
const router = express.Router();

router.get('/:menuId/:subMenuId' , authenticate , getSubMenu);
router.post('/:menuId', authenticate , roleCheck(['restaurant' , 'admin']) , verifySubMenuOwner , createSubMenu);
router.put('/:menuId/:subMenuId', authenticate , roleCheck(['restaurant' , 'admin']) , verifySubMenuOwner , updateSubMenu);
router.delete('/:menuId/:subMenuId', authenticate, roleCheck(['restaurant' , 'admin']) , verifySubMenuOwner , deleteSubMenu);

module.exports = router;