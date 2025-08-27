// Helper function to find menu or submenu
const Menu = require('../models/menu.model');
const SubMenu = require('../models/subMenu.model');
exports.findMenuContext = async (menuId) =>{
    // First try to find as Menu
    let menu = await Menu.findById(menuId);
    if (menu) {
        return {
            data: menu,
            type: "Menu",
            restaurantId: menu.restaurantId
        };
    }

    // Then try to find as SubMenu
    let subMenu = await SubMenu.findById(menuId);
    if (subMenu) {
        const parentMenu = await Menu.findById(subMenu.menuId);
        if (!parentMenu) {
            throw new Error("Parent menu not found for submenu");
        }
        return {
            data: subMenu,
            type: "Submenu", 
            restaurantId: parentMenu.restaurantId,
            parentMenuId: parentMenu._id
        };
    }

    return null;
}