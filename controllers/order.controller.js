const Order = require("../models/order/order.model");
const OrderItem = require("../models/order/orderItem.model");
const Menu = require("../models/menu/menu.model");
const Submenu = require("../models/menu/subMenu.model");
const {
  getRestaurantByUserId,
  getMenuItemById,
} = require("../utils/Helper/dataAccess");
const { pagination } = require("../utils/pagination");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/status_Codes");
const PAYMENT_METHODS = require("../constants/paymentMethods");

// Order Status Constants
const STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

exports.placeOrder = async (req, res) => {
  try {

    const { orderItems, deliveryAddress, PaymentMethod, deliveryFee, timeToDeliver, notes } = req.body;

    // Validate request
    const validationError = validateOrderRequest(req.body);
    if (validationError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: validationError,
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Placement",
      });
    }

    // Fetch menu items
    const fetchedItems = await fetchMenuItems(orderItems);
    
    // Validate menu items and calculate total
    const { totalPrice: itemsTotal, unAvailableItems, validOrderItems, restaurantId } = 
      await validateMenuItems(fetchedItems, orderItems);

    if (unAvailableItems.length > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: MESSAGES.ORDER_NOT_PLACED,
        status: STATUS_CODES.BAD_REQUEST,
        result: unAvailableItems.length,
        unAvailableItems,
        process: "Order Placement",
      });
    }

    // Calculate final total price (items + delivery fee)
    const finalDeliveryFee = deliveryFee || 0;
    const totalPrice = itemsTotal + finalDeliveryFee;

    // Create order
    const order = new Order({
      customerId: req.user._id,
      adminId: req.user.role === "admin" ? req.user._id : null,
      restaurantId,
      totalPrice,
      deliveryAddress,
      deliveryFee: finalDeliveryFee,
      timeToDeliver: timeToDeliver || 0,
      PaymentMethod,
      status: STATUS.PENDING,
      notes: notes || null,
    });

    const savedOrder = await order.save();

    // Save order items with orderId
    const savedOrderItems = await saveOrderItems(validOrderItems, savedOrder._id);

    res.status(STATUS_CODES.CREATED).json({
      message: MESSAGES.ORDER_PLACED,
      status: "success",
      result: {
        order: "Order placed successfully",
        orderItems: `${orderItems.length} items ordered successfully`,
      },
      meta: { 
        orderItems: orderItems.length,
        itemsTotal,
        deliveryFee: finalDeliveryFee,
        totalPrice,
        orderId: savedOrder._id
      },
      data: { 
        orderId: savedOrder._id, 
        totalPrice,
        deliveryFee: finalDeliveryFee,
        timeToDeliver: savedOrder.timeToDeliver,
        status: savedOrder.status,
        orderItems: savedOrderItems
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Placement",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;
    const orderId = req.params.id;

    if (!status || !Object.values(STATUS).includes(status)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Invalid status provided",
        validStatuses: Object.values(STATUS),
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Status Update",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: MESSAGES.ORDER_NOT_FOUND,
        status: STATUS_CODES.NOT_FOUND,
        process: "Order Status Update",
      });
    }

    // Authorization check
    const authorized = await checkOrderAuthorization(order, req.user, 'update');
    if (!authorized.success) {
      return res.status(authorized.statusCode).json({
        message: authorized.message,
        status: authorized.statusCode,
        process: "Order Status Update",
      });
    }

    // Prevent invalid status transitions
    const validTransition = validateStatusTransition(order.status, status);
    if (!validTransition) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: `Cannot change status from "${order.status}" to "${status}"`,
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Status Update",
      });
    }

    order.status = status;
    await order.save();

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Order status updated successfully",
      status: "success",
      data: { 
        orderId: order._id, 
        status: order.status,
        updatedAt: order.updatedAt
      },
      process: "Order Status Update",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Status Update",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: MESSAGES.ORDER_NOT_FOUND,
        status: STATUS_CODES.NOT_FOUND,
        process: "Order Cancellation",
      });
    }

    // Authorization check
    const authorized = await checkOrderAuthorization(order, req.user, 'cancel');
    if (!authorized.success) {
      return res.status(authorized.statusCode).json({
        message: authorized.message,
        status: authorized.statusCode,
        process: "Order Cancellation",
      });
    }

    // Prevent cancelling completed or already cancelled orders
    if ([STATUS.COMPLETED, STATUS.CANCELLED].includes(order.status)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: MESSAGES.CANNOT_CANCEL_ORDER,
        currentStatus: order.status,
        status: STATUS_CODES.BAD_REQUEST,
        process: "Order Cancellation",
      });
    }

    order.status = STATUS.CANCELLED;
    await order.save();

    return res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.ORDER_CANCELLED,
      status: "success",
      data: { 
        orderId: order._id, 
        status: order.status,
        cancelledAt: order.updatedAt
      },
      process: "Order Cancellation",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Cancellation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ // Using 401 directly instead of STATUS_CODES.UNAUTHORIZED
        message: MESSAGES.UNAUTHORIZED,
        status: 401,
        process: "Order Retrieval",
      });
    }

    let filter = {};
    
    // Add status filter if provided
    if (req.query.status && Object.values(STATUS).includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Role-based filtering
    if (req.user.role === "customer") {
      filter.customerId = req.user._id;
    } else if (req.user.role === "restaurant") {
      const restaurant = await getRestaurantByUserId(req.user._id);
      if (!restaurant) {
        return res.status(404).json({ // Using 404 directly
          message: MESSAGES.RESTAURANT_NOT_FOUND,
          status: 404,
          process: "Order Retrieval",
        });
      }
      filter.restaurantId = restaurant._id;
    }
    // Admin can see all orders (no additional filter)

    // Use the improved pagination
    const result = await pagination(
      Order, 
      req, 
      filter, // Base query
      {}, // Empty filter query since we built filter above
      [
        { path: 'customerId', select: 'name email phone' },
        { path: 'restaurantId', select: 'name address phone' }
      ]
    );

    // Handle pagination errors
    if (!result.success) {
      return res.status(500).json({
        message: "Error retrieving orders",
        status: 500,
        process: "Order Retrieval",
        error: result.error
      });
    }

    res.status(200).json({
      message: MESSAGES.ORDERS_RETRIEVED,
      status: "success",
      result: { total: result.total, page: result.page, limit: result.limit },
      meta: { 
        totalOrders: result.total,
        currentPage: result.page,
        itemsPerPage: result.limit,
        role: req.user.role
      },
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: 500,
      process: "Order Retrieval",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'name address phone');
      
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        message: MESSAGES.ORDER_NOT_FOUND,
        status: STATUS_CODES.NOT_FOUND,
        process: "Order Retrieval",
      });
    }

    // Authorization check
    const authorized = await checkOrderAuthorization(order, req.user, 'view');
    if (!authorized.success) {
      return res.status(authorized.statusCode).json({
        message: authorized.message,
        status: authorized.statusCode,
        process: "Order Retrieval",
      });
    }

    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('itemId', 'name description category variations');

    res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.ORDER_RETRIEVED,
      status: "success",
      result: {
        order: "Order found successfully",
        orderItems: `${orderItems.length} items found successfully`,
      },
      meta: {
        orderItems: orderItems.length,
        totalPrice: order.totalPrice,
        status: order.status,
      },
      data: {
        order, 
        orderItems
      },
    });
  } catch (error) {
    console.error("Error fetching order by id:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: MESSAGES.INTERNAL_ERROR,
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      process: "Order Retrieval",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

//#region ---------- Helper Functions ----------

const validateOrderRequest = ({ orderItems, deliveryAddress, PaymentMethod, deliveryFee, timeToDeliver }) => {
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return "Order items must be a non-empty array";
  }

  if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length === 0) {
    return "Delivery address is required";
  }

  if (!PaymentMethod || !PAYMENT_METHODS.includes(PaymentMethod.toLowerCase())) {
    return `Invalid payment method. Valid options: ${PAYMENT_METHODS.join(', ')}`;
  }

  // Validate deliveryFee if provided
  if (deliveryFee !== undefined && (typeof deliveryFee !== 'number' || deliveryFee < 0)) {
    return "Delivery fee must be a non-negative number";
  }

  // Validate timeToDeliver if provided
  if (timeToDeliver !== undefined && (typeof timeToDeliver !== 'number' || timeToDeliver < 0)) {
    return "Time to deliver must be a non-negative number (in minutes)";
  }

  // Validate order items structure
  for (const item of orderItems) {
    if (!item.item || !item.item.id || !item.quantity || item.quantity <= 0) {
      return "Each order item must have a valid item ID and quantity greater than 0";
    }
    if (!item.variation) {
      return "Each order item must specify a variation";
    }
  }

  return null; // No validation errors
};

const fetchMenuItems = async (orderItems) => {
  try {
    const itemsPromises = orderItems.map(({ item }) => getMenuItemById(item.id));
    const results = await Promise.allSettled(itemsPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Error fetching menu item ${orderItems[index].item.id}:`, result.reason);
        return null;
      }
    });
  } catch (error) {
    console.error("Error in fetchMenuItems:", error);
    throw error;
  }
};

const validateMenuItems = async (fetchedItems, orderItems) => {
  let totalPrice = 0;
  const unAvailableItems = [];
  const validOrderItems = [];
  let restaurantId = null;

  for (let i = 0; i < fetchedItems.length; i++) {
    const menuItem = fetchedItems[i];
    const requested = orderItems[i];

    if (!menuItem) {
      unAvailableItems.push({
        item: requested.item.id,
        message: "Menu Item not found",
      });
      continue;
    }

    if (!menuItem.isAvailable) {
      unAvailableItems.push({
        item: menuItem._id,
        name: menuItem.name,
        message: "Menu Item is not available",
      });
      continue;
    }

    // Get restaurant ID and ensure all items are from the same restaurant
    const itemRestaurantId = await getRestaurantIdFromMenuItem(menuItem);
    if (!restaurantId) {
      restaurantId = itemRestaurantId;
    } else if (restaurantId.toString() !== itemRestaurantId.toString()) {
      unAvailableItems.push({
        item: menuItem._id,
        name: menuItem.name,
        message: MESSAGES.MIXED_RESTAURANT_ITEMS,
      });
      continue;
    }

    // Find the requested variation
    const variation = menuItem.variations.find(v => 
      v.size === requested.variation.size || v._id.toString() === requested.variation.id
    );

    if (!variation) {
      unAvailableItems.push({
        item: menuItem._id,
        name: menuItem.name,
        message: `Variation "${requested.variation.size || requested.variation.id}" not found`,
      });
      continue;
    }

    if (!variation.isAvailable) {
      unAvailableItems.push({
        item: menuItem._id,
        name: menuItem.name,
        variation: variation.size,
        message: "Selected variation is not available",
      });
      continue;
    }

    const itemTotal = variation.price * requested.quantity;
    totalPrice += itemTotal;
    
    validOrderItems.push({ 
      menuItem, 
      requested: {
        ...requested,
        variation,
        price: variation.price,
        itemTotal
      }
    });
  }

  return { totalPrice, unAvailableItems, validOrderItems, restaurantId };
};

const saveOrderItems = async (validOrderItems, orderId) => {
  try {
    const orderItemsDocs = validOrderItems.map(({ menuItem, requested }) => {
      return new OrderItem({
        orderId,
        itemId: menuItem._id,
        quantity: requested.quantity,
        price: requested.variation.price,
        variationSize: requested.variation.size,
      });
    });
    
    return await Promise.all(orderItemsDocs.map(oi => oi.save()));
  } catch (error) {
    console.error("Error saving order items:", error);
    throw error;
  }
};

const getRestaurantIdFromMenuItem = async (menuItem) => {
  try {
    const parentMenu = {
      type: menuItem.parentType,
      id: menuItem.parentId,
    };
    if(parentMenu.type === "Menu"){
      const menu = await Menu.findById(parentMenu.id);
      return menu.restaurantId;
    }
    if(parentMenu.type === "Submenu"){
      const submenu = await Submenu.findById(parentMenu.id);
      const menu =  await Menu.findById(submenu.menuId);
      return menu.restaurantId;
    }

    if (menuItem.restaurantId) {
      return menuItem.restaurantId;
    }
    
    // If menu item doesn't have direct restaurant reference,
    // you might need to traverse through menu/submenu structure
    // This is a placeholder - adjust based on your actual data structure
    return null;
  } catch (error) {
    console.error("Error getting restaurant ID from menu item:", error);
    throw error;
  }
};

const checkOrderAuthorization = async (order, user, action = 'view') => {
  try {
    if (user.role === "admin") {
      return { success: true };
    }

    if (user.role === "customer") {
      if (order.customerId.toString() === user._id.toString()) {
        return { success: true };
      }
      return { 
        success: false, 
        statusCode: STATUS_CODES.FORBIDDEN, 
        message: MESSAGES.FORBIDDEN 
      };
    }

    if (user.role === "restaurant") {
      const restaurant = await getRestaurantByUserId(user._id);
      if (!restaurant) {
        return { 
          success: false, 
          statusCode: STATUS_CODES.NOT_FOUND, 
          message: MESSAGES.RESTAURANT_NOT_FOUND 
        };
      }

      if (order.restaurantId.toString() === restaurant._id.toString()) {
        return { success: true };
      }

      return { 
        success: false, 
        statusCode: STATUS_CODES.FORBIDDEN, 
        message: MESSAGES.FORBIDDEN 
      };
    }

    return { 
      success: false, 
      statusCode: STATUS_CODES.FORBIDDEN, 
      message: MESSAGES.FORBIDDEN 
    };
  } catch (error) {
    console.error("Error in authorization check:", error);
    return { 
      success: false, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, 
      message: MESSAGES.INTERNAL_ERROR 
    };
  }
};

const validateStatusTransition = (currentStatus, newStatus) => {
  const transitions = {
    [STATUS.PENDING]: [STATUS.APPROVED, STATUS.CANCELLED],
    [STATUS.APPROVED]: [STATUS.PREPARING, STATUS.CANCELLED],
    [STATUS.PREPARING]: [STATUS.READY, STATUS.CANCELLED],
    [STATUS.READY]: [STATUS.COMPLETED],
    [STATUS.COMPLETED]: [], // Final state
    [STATUS.CANCELLED]: [], // Final state
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
};
