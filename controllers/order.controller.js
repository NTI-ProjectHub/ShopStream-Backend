const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const dataAccessHelper = require('../utils/Helper/dataAccess');


exports.placeOrder = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const { restaurantId , totalPrice } = req.body;
        const order = new Order({
            customerId: req.user._id,
            adminId: req.user.role === 'admin' ? req.user._id : null,
            restaurantId,
            totalPrice
        });
        await order.save();
        res.status(201).json({ 
            message: 'Order Placed Successfully' , 
            orderId: order._id
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Order Placement"
        });
    }
}

exports.addOrderItem = async (req, res) => {
    try {
        const {itemId , quantity} = req.body;
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const order = await dataAccessHelper.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const item = await dataAccessHelper.getItemById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        if(!item.isAvailable) {
            return res.status(400).json({ message: 'Item Is Not Available' });
        }
        const orderItem = new OrderItem({
            orderId: order._id,
            itemId,
            quantity,
            price: item.price
        });
        order.totalPrice += orderItem.price * orderItem.quantity;
        await order.save();
        await orderItem.save();
        return res.status(201).json({ 
            message: 'Order Item Added Successfully' , 
            orderItemId: orderItem._id
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Internal server error',
            process: "Order Item Addition"
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const orders = await dataAccessHelper.getOrdersByUserId(req.user._id);
        if (!orders) {
            return res.status(404).json({ message: 'No orders found' });
        }
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Order Retrieval"
        });
    }
};