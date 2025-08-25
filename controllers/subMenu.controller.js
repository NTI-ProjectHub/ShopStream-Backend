const { getMenuById, getMenuByUserId } = require('../utils/Helper/dataAccess');
const SubMenu = require('../models/menu/subMenu.model');
const MenuItem = require('../models/menu/menuItem.model');

// Constants
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  GATEWAY_TIMEOUT: 504,
};

const MESSAGES = {
  ALL_FIELDS_REQUIRED: "All fields are required!",
  SUBMENU_FOUND: "Sub Menu fetched successfully",
  SUBMENU_CREATED: "Sub Menu created successfully",
  SUBMENU_UPDATED: "Sub Menu updated successfully",
  SUBMENU_DELETED: "Sub Menu deleted successfully",
  SUBMENU_NOT_FOUND: "Sub Menu not found!",
  MENU_NOT_FOUND: "Parent Menu not found!",
  INTERNAL_ERROR: "Internal Server Error",
  FORBIDDEN: "You are not authorized to perform this action"
};

exports.getSubMenu = async(req, res) => {
  try {
    const { menuId , subMenuId } = req.params;
    const menu = await getMenuById(menuId);
    if (!menu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.MENU_NOT_FOUND,
        process: "getting Sub Menu"
      });
    }

    if(!menu.subMenus.find(subMenu => subMenu._id.toString() === subMenuId)) {
      return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({
        message: MESSAGES.SUBMENU_NOT_FOUND,
        process: "getting Sub Menu"
      });
    };

    const subMenu = await SubMenu.findById(subMenuId).populate("items");
    if (!subMenu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.SUBMENU_NOT_FOUND,
        process: "getting Sub Menu"
      });
    }
    const subMenuItems = subMenu.items.map(item => ({
      ...item._doc,
    }));

    return res.status(HTTP_STATUS.OK).json({
      message: MESSAGES.SUBMENU_FOUND,
      status: "success",
      data: {
        subMenu: {
          subMenu,
          items: subMenuItems
        }
      }
    });
  } catch (error) {
    console.error("Error getting sub menu:", { error: error.message, params: req.params });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      process: "getting Sub Menu",
      error: error.message
    });
  }
};

exports.createSubMenu = async (req, res) => {
  try {
    const isRestaurant = req.user.role === 'restaurant';
    if(isRestaurant) {
      const owns = await isSubMenuOwner(req.user , req.params.menuId);
      if(!owns) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: MESSAGES.FORBIDDEN,
          process: "creating Sub Menu"
        });
      }
    }

    const { name, description, category, Items } = req.body;
    const { menuId } = req.params;

    // Validate required fields
    if (!name || !description || !category || !menuId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: MESSAGES.ALL_FIELDS_REQUIRED,
        process: "creating Sub Menu"
      });
    }

    // Validate Items
    const menuItems = Array.isArray(Items) ? Items.map(i => i._id) : [];
    const image = req.image || undefined;

    // Ensure menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.MENU_NOT_FOUND,
        process: "creating Sub Menu"
      });
    }

    // Create SubMenu
    const subMenu = new SubMenu({
      menuId,
      name,
      description,
      image,
      category,
      items: menuItems
    });

    await subMenu.save();

    // Update parent Menu
    menu.subMenus.push(subMenu._id);
    await menu.save();

    return res
    .status(HTTP_STATUS.CREATED)
    .json({
      message: MESSAGES.SUBMENU_CREATED,
      status: "success",
      data: {
        subMenu,
        items: menuItems
      }
    });
  } catch (error) {
    console.error("Error creating sub menu:", { error: error.message, body: req.body, params: req.params });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      process: "creating Sub Menu",
      error: error.message
    });
  }
};

exports.updateSubMenu = async (req, res) => {
  try {
    const isRestaurant = req.user.role === 'restaurant';
    if(isRestaurant) {
      const owns = await isSubMenuOwner(req.user , req.params.menuId);
      if(!owns) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: MESSAGES.FORBIDDEN,
          process: "creating Sub Menu"
        });
      }
    }

    const { name, description, category, Items } = req.body;
    const { menuId, subMenuId } = req.params;
    const image = req.image || undefined;

    // Validate required fields
    if (!name || !description || !category || !menuId || !subMenuId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: MESSAGES.ALL_FIELDS_REQUIRED,
        process: "editing Sub Menu"
      });
    }

    // Validate Items
    const menuItems = Array.isArray(Items) ? Items.map(i => i._id) : [];

    // Ensure menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.MENU_NOT_FOUND,
        process: "editing Sub Menu"
      });
    }

    // Find SubMenu
    const subMenu = await SubMenu.findById(subMenuId);
    if (!subMenu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.SUBMENU_NOT_FOUND,
        process: "editing Sub Menu"
      });
    }

    // Update SubMenu
    subMenu.name = name;
    subMenu.description = description;
    subMenu.image = image || subMenu.image;
    subMenu.category = category;
    subMenu.items = menuItems;
    await subMenu.save();

    return res.status(HTTP_STATUS.OK).json({
      message: MESSAGES.SUBMENU_UPDATED,
      status: "success",
      data: {
        subMenu,
        items: menuItems
      }
    });

  } catch(error) {
    console.error("Error editing sub menu:", { error: error.message, body: req.body, params: req.params });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      process: "editing Sub Menu",
      error: error.message
    });
  }
};

exports.deleteSubMenu = async (req, res) => {
  try {
    const isRestaurant = req.user.role === 'restaurant';
    if(isRestaurant) {
      const owns = await isSubMenuOwner(req.user , req.params.menuId);
      if(!owns) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: MESSAGES.FORBIDDEN,
          process: "creating Sub Menu"
        });
      }
    }
    const { all } = req.body;
    const { menuId, subMenuId } = req.params;

    // Validate required fields
    if (!menuId || !subMenuId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: MESSAGES.ALL_FIELDS_REQUIRED,
        process: "deleting Sub Menu"
      });
    }

    // Ensure menu exists
    const menu = await getMenuById(menuId);
    if (!menu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.MENU_NOT_FOUND,
        process: "deleting Sub Menu"
      });
    }

    // Find SubMenu
    const subMenu = await SubMenu.findById(subMenuId);
    if (!subMenu) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MESSAGES.SUBMENU_NOT_FOUND,
        process: "deleting Sub Menu"
      });

    }

    // Remove SubMenu reference from Menu
    menu.subMenus = menu.subMenus.filter(id => id.toString() !== subMenuId);
    if(all) {
      // Delete all items
      await MenuItem.deleteMany({ subMenuId });
    } else {
      subMenu.items.forEach(item => {
        menu.items.push(item._id);
      });
    }
    await menu.save();

    // Delete SubMenu
    await SubMenu.findByIdAndDelete(subMenuId);

    return res.status(HTTP_STATUS.OK).json({
      message: MESSAGES.SUBMENU_DELETED,
      status: "success",
      meta: {
        menuId,
        subMenuId
      }
    });
  } catch (error) {
    console.error("Error deleting sub menu:", { error: error.message, params: req.params });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      process: "deleting Sub Menu",
      error: error.message
    });
  }
}

async function isSubMenuOwner(restaurant, subMenuId) {
  // Fetch the restaurant's single menu
  const menu = await getMenuByUserId(restaurant._id);
  if (!menu) return false;

  // Check if this subMenuId exists in the menu
  const ownsSubMenu = menu.subMenus.some(id => id.toString() === subMenuId.toString());
  return ownsSubMenu;
}