const Order = require("../models/order/order.model");
const OrderItem = require("../models/order/orderItem.model");
const {
  getRestaurantByUserId,
  getMenuItemById,
} = require("../utils/Helper/dataAccess");
const { pagination } = require("../utils/pagination");

// Constants
const MESSAGES = {
  INTERNAL_ERROR: "Internal server error",
  UNAUTHORIZED: "You have to login first",
  FORBIDDEN: "You do not have permission to access this resource",
  ALL_FIELDS_REQUIRED: "All fields are required",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
  ORDER_PLACED: "Order placed successfully",
  ORDER_NOT_PLACED: "Order not placed",
};

const STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  FAILED: "failed",
  UNAUTHORIZED: "unauthorized",
};

const STATUS_CODES = {
  PENDING: 200,
  CONFIRMED: 201,
  PREPARING: 202,
  OUT_FOR_DELIVERY: 203,
  DELIVERED: 204,
  CANCELLED: 205,
  FAILED: 206,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

exports.placeOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        message: MESSAGES.UNAUTHORIZED,
        status: STATUS_CODES.UNAUTHORIZED,
        process: "Order Placement",
      });
    }

    const { orderItems, deliveryAddress, PaymentMethod } = req.body;

    if (!validateOrderRequest(req.body)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: MESSAGES.ALL_FIELDS_REQUIRED,
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Placement",
      });
    }

    const fetchedItems = await fetchMenuItems(orderItems);
    const { totalPrice, unAvailableItems, validOrderItems } = validateMenuItems(
      fetchedItems,
      orderItems
    );

    if (unAvailableItems.length > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: MESSAGES.ORDER_NOT_PLACED,
        status: STATUS_CODES.BAD_REQUEST,
        result: unAvailableItems.length,
        unAvailableItems,
        process: "Order Placement",
      });
    }

    const savedOrderItems = await saveOrderItems(validOrderItems);
    const restaurantId = getRestaurantIdFromItems(fetchedItems);

    const order = new Order({
      customerId: req.user._id,
      adminId: req.user.role === "admin" ? req.user._id : null,
      restaurantId,
      totalPrice,
      deliveryAddress,
      PaymentMethod,
      orderItems: savedOrderItems.map((oi) => oi._id),
      status: STATUS.PENDING,
    });

    await order.save();

    res.status(201).json({
      message: MESSAGES.ORDER_PLACED,
      status: "success",
      meta: { orderItems: orderItems.length },
      data: { orderId: order._id, totalPrice },
      process: "Order Placement",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Placement",
      error: error.message,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        message: MESSAGES.UNAUTHORIZED,
        status: STATUS_CODES.UNAUTHORIZED,
        process: "Order Cancellation",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Order not found",
        status: STATUS_CODES.NOT_FOUND,
        process: "Order Cancellation",
      });
    }

    // Only admin, restaurant, or customer who placed the order can cancel
    const authorized =
      req.user.role === "admin" ||
      (req.user.role === "customer" &&
        order.customerId.toString() === req.user._id.toString()) ||
      (req.user.role === "restaurant" &&
        order.restaurantId.toString() === req.user._id.toString());

    if (!authorized) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        message: MESSAGES.FORBIDDEN,
        status: STATUS_CODES.FORBIDDEN,
        process: "Order Cancellation",
      });
    }

    // Prevent cancelling delivered orders
    if ([STATUS.DELIVERED, STATUS.CANCELLED].includes(order.status)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: `Cannot cancel order with status "${order.status}"`,
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Cancellation",
      });
    }

    order.status = STATUS.CANCELLED;
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      status: "success",
      data: { orderId: order._id, status: order.status },
      process: "Order Cancellation",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Cancellation",
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "You must login first" });

    let filter = {};
    if (req.user.role === "customer") filter.customerId = req.user._id;
    else if (req.user.role === "restaurant") {
      const restaurant = await getRestaurantByUserId(req.user._id);
      if (!restaurant)
        return res.status(404).json({ message: "Restaurant not found" });
      filter.restaurantId = restaurant._id;
    }

    const { total, page, limit, data } = await pagination(Order, req, filter);

    res.status(200).json({
      message: "Orders found",
      status: "success",
      result: total,
      meta: { page, limit },
      data,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Internal server error",
      process: "Order Retrieval",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "You must login first" });

    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let authorized = false;

    if (req.user.role === "admin") authorized = true;
    else if (
      req.user.role === "customer" &&
      order.customerId.toString() === req.user._id.toString()
    ) {
      authorized = true;
    } else if (req.user.role === "restaurant") {
      const restaurant = await getRestaurantByUserId(req.user._id);
      if (
        restaurant &&
        order.restaurantId.toString() === restaurant._id.toString()
      ) {
        authorized = true;
      }
    }

    if (!authorized)
      return res
        .status(403)
        .json({ message: "You are not authorized to access this order" });

    res.status(200).json({
      message: "Order found",
      status: "success",
      result: 1,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order by id:", error);
    res.status(500).json({
      message: "Internal server error",
      process: "Order Retrieval",
      error: error.message,
    });
  }
};

//#region  ---------- helpers ----------
const validateOrderRequest = ({
  orderItems,
  deliveryAddress,
  PaymentMethod,
}) => {
  if (
    !orderItems ||
    orderItems.length === 0 ||
    !deliveryAddress ||
    !PaymentMethod
  ) {
    return false;
  }
  return true;
};

const fetchMenuItems = async (orderItems) => {
  const itemsPromises = orderItems.map(({ item }) => getMenuItemById(item.id));
  return await Promise.all(itemsPromises);
};

const validateMenuItems = (fetchedItems, orderItems) => {
  let totalPrice = 0;
  const unAvailableItems = [];
  const validOrderItems = [];

  fetchedItems.forEach((menuItem, index) => {
    // Steps:
    // 1) Check if the menu item exists
    // 2) Check if the menu item is available
    // 3) Calculate the total price

    const requested = orderItems[index];
    if (!menuItem) {
      unAvailableItems.push({
        item: requested.item.id,
        message: "Menu Item not found",
      });
    } else if (!menuItem.isAvailable) {
      unAvailableItems.push({
        item: menuItem._id,
        message: "Menu Item is not available",
      });
    } else {
      totalPrice += menuItem.price * requested.quantity;
      validOrderItems.push({ menuItem, requested });
    }
  });

  return { totalPrice, unAvailableItems, validOrderItems };
};

const saveOrderItems = async (validOrderItems) => {
  const orderItemsDocs = validOrderItems.map(({ menuItem, requested }) => {
    return new OrderItem({
      itemId: menuItem._id,
      quantity: requested.quantity,
      price: menuItem.price,
    });
  });
  return await Promise.all(orderItemsDocs.map((oi) => oi.save()));
};

const getRestaurantIdFromItems = (fetchedItems) => {
  return fetchedItems[0].restaurantId;
};
//#endregion