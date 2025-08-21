const Order = require('../models/order.model');

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

exports.getOrder = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        const order = await Order.findById(req.params.id);
        if(req.user.role !== 'admin') {
            if(order.customerId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'You Can Only See Your Orders' });
            }
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Order Retrieval"
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: 'You Have To login First' });
        }
        let orders;
        if(req.user.role === 'admin') {
            orders = await Order.find();
        } else {
            orders = await Order.find({ customerId: req.user._id });
        }
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            process: "Order Retrieval"
        });
    }
};