const User = require('../../models/user.model');
const Restaurant = require('../../models/restaurant.model');
const Menu = require('../../models/menu.model');
const MenuItem = require('../../models/menuItem.model');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');

exports.getUserById = async (id) => {
    try {
        const user = await User.findById(id);
        if (!user) {
            console.log('No user found for id');
            return null;
        }
        return user;
    } catch (error) {
        console.log('Error in getUserById:', error);
        return null;
    }
};

exports.getRestaurantById = async (id) => {
    try {
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            console.log('No restaurant found for id');
            return null;
        }
        return restaurant;
    } catch (error) {
        console.log('Error in getRestaurantById:', error);
        return null;
    }
};

exports.getRestaurantByUserId = async (id) => {
    try {
        const restaurant = await Restaurant.findOne({ userId: id });
        if (!restaurant) {
            console.log('No restaurant found for user');
            return null;
        }
        return restaurant;
    } catch (error) {
        console.log('Error in getRestaurantByUserId:', error);
        return null;
    }
}

exports.getMenuById = async (id) => {
    try {
        const menu = await Menu.findById(id);
        if (!menu) {
            console.log('No menu found for id');
            return null;
        }
        return menu;
    } catch (error) {
        console.log('Error in getMenuById:', error);
        return null;
    }
};

exports.getMenuByRestaurantId = async (id) => {
    try {
        const menu = await Menu.findOne({ restaurantId: id });
        if (!menu) {
            console.log('No menus found for restaurant');
            return null;
        }
        return menu;
    } catch (error) {
        console.log('Error in getMenuByRestaurantId:', error);
        return null;
    }
};

exports.getMenuByUserId = async (id) => {
    try {
        const restaurant = await exports.getRestaurantByUserId(id);
        if (!restaurant) {
            console.log('No restaurant found for user');
            return null;
        }
        return await Menu.find({ restaurantId: restaurant._id });
    } catch (error) {
        console.log('Error in getMenuByUserId:', error);
        return null;
    }
};

exports.getMenuItemById = async (id) => {
    try {
        const menuItem = await MenuItem.findById(id);
        if (!menuItem) {
            console.log('No menu item found for id');
            return null;
        }
        return menuItem;
    } catch (error) {
        console.log('Error in getMenuItemById:', error);
        return null;
    }
};

exports.getMenuItemsByMenuId = async (id) => {
    try {
        const menuItems = await MenuItem.find({ menuId: id });
        if (!menuItems) {
            console.log('No menu items found for id');
            return null;
        }
        return menuItems;
    } catch (error) {
        console.log('Error in getMenuItemsByMenuId:', error);
        return null;
    }
};

exports.getMenuItemsByRestaurantId = async (id) => {
    try {
        const menu = await exports.getMenuByRestaurantId(id);
        if (!menu) {
            console.log('No menu found for id');
            return null;
        }
        const menuItems = await MenuItem.find({ menuId: menu._id });
        if (!menuItems) {
            console.log('No menu items found for restaurant');
            return null;
        }
        return menuItems;
    } catch (error) {
        console.log('Error in getMenuItemsByRestaurantId:', error);
        return null;
    }
}

exports.getMenuItemsByUserId = async (id) => {
    try {
        const menu = await exports.getMenuByUserId(id);
        if (!menu) {
            console.log('No menus found for user');
            return null;
        }
        let items = await exports.getMenuItemsByMenuId(menu._id);
        if (!items) {
            console.log('No menu items found for user');
            return null;
        }
        return items;
    } catch (error) {
        console.log('Error in getMenuItemsByUserId:', error);
        return null;
    }
}

exports.getOrderById = async (id) => {
    try {
        const order = await Order.findById(id);
        if (!order) {
            console.log('No order found for id');
            return null;
        }
        return order;
    } catch (error) {
        console.log('Error in getOrderById:', error);
        return null;
    }
}

exports.getOrdersByUserId = async (id) => {
    try {
        let orders;
        const role = (await exports.getUserById(id)).role;
        if (!role) {
            console.log('User Not Found / Try to Login first');
            return null;
        }

        if(role === 'admin') {
            orders = await Order.find();
        } else if(role === 'restaurant') {
            orders = await Order.find({ restaurantId: id });
        } else {
            orders = await Order.find({ customerId: id });
        }
        if (!orders) {
            console.log('No orders found for user');
            return null;
        }
        return orders;
    } catch (error) {
        console.log('Error in getOrdersByCustomerId:', error);
        return null;
    }
}

exports.getOrdersByCustomerId = async (id) => {
    try {
        const orders = await Order.find({ customerId: id });
        if (!orders) {
            console.log('No order found for customer');
            return null;
        }
        return orders;
    } catch (error) {
        console.log('Error in getOrdersByCustomerId:', error);
        return null;
    }
}

exports.getOrdersByRestaurantId = async (id) => {
    try {
        const orders = await Order.find({ restaurantId: id });
        if (!orders) {
            console.log('No orders found for restaurant');
            return null;
        }
        return orders;
    } catch (error) {
        console.log('Error in getOrdersByRestaurantId:', error);
        return null;
    }
}

exports.getOrdersByAdminId = async (id) => {
    try {
        const orders = await Order.find({ adminId: id });
        if (!orders) {
            console.log('No orders found for admin');
            return null;
        }
        return orders;
    } catch (error) {
        console.log('Error in getOrdersByAdminId:', error);
        return null;
    }
}

exports.getOrderItemsByOrderId = async (id) => {
    try {
        const orderItems = await OrderItem.find({ orderId: id });
        if (!orderItems) {
            console.log('No order items found for order');
            return null;
        }
        return orderItems;
    } catch (error) {
        console.log('Error in getOrderItemsByOrderId:', error);
        return null;
    }
}

exports.getMenuItemByOrderItemId = async (id) => {
    try {
        const orderItem = await OrderItem.findById(id);
        if (!orderItem) {
            console.log('No order item found for id');
            return null;
        }
        return await exports.getMenuItemById(orderItem.itemId);
    } catch (error) {
        console.log('Error in getMenuItemByOrderItemId:', error);
        return null;
    }
};

exports.getMenuItemsByOrderId = async (id) => {
    try {
        const orderItems = await exports.getOrderItemsByOrderId(id);
        if (!orderItems) {
            console.log('No order items found for order');
            return null;
        }
        let items = [];
        for (const orderItem of orderItems) {
            const item = await exports.getMenuItemByOrderItemId(orderItem._id);
            if (item) {
                items.push(item);
            }
        }
        return items;
    } catch (error) {
        console.log('Error in getMenuItemsByOrderId:', error);
        return null;
    }
};

exports.calculateTotalOrderPrice = async (id) => {
    try {
        const orderItems = await exports.getOrderItemsByOrderId(id);
        if (!orderItems) {
            console.log('No order items found for order');
            return null;
        }
        let totalPrice = 0;
        for (const orderItem of orderItems) {
            const item = await exports.getMenuItemByOrderItemId(orderItem._id);
            if (item) {
                totalPrice += item.price * orderItem.quantity;
            }
        }
        return totalPrice;
    } catch (error) {
        console.log('Error in calculateTotalOrderPrice:', error);
        return null;
    }
};