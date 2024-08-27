const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// middleware functions
const validateOrderData = (req, res, next) => {
  const validationErrors = [];
  const { data: { deliverTo, mobileNumber, dishes = [] } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    validationErrors.push("Order must include a deliverTo");
  }
  if (!mobileNumber || mobileNumber === "") {
    validationErrors.push("Order must include a mobileNumber");
  }
  if (!dishes) {
    validationErrors.push("Order must include a dish");
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    validationErrors.push("Order must include at least one dish");
  } else {
    dishes.forEach((dish, index) => {
      if (!Number.isInteger(dish.quantity) || !dish.quantity || dish.quantity <= 0) {
        validationErrors.push(
            `dish ${index} must have a quantity that is an integer greater than 0`,
        );
      }
    });
  }

  if (validationErrors.length > 0) {
    return next({
      status: 400,
      message: validationErrors.join(" "),
    });
  }
  return next();
};

const validateOrderId = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    return next({
      status: 404,
      message: `Order not found for id: ${orderId}`,
    });
  }
};

const updateOrderValidation = (req, res, next) => {
  const { orderId } = req.params;
  const {
    data: { id, status },
  } = req.body;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }

  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status || status === "" || !validStatus.includes(status)) {
    return next({
      status: 400,
      message: `Order must have a status of ${validStatus.join(",")} `,
    });
  }
  const existingOrder = orders.find((order) => order.id === orderId);
  if (existingOrder.status === "delivered")
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  return next();
};

const validateDeleteOrder = (req, res, next) => {
  const { orderId } = req.params;
  const fetchedOrder = res.locals.order;
  const { id, status } = fetchedOrder;
  if (id !== orderId) {
    return next({
      status: 404,
      message: `OrderId ${orderId} from urlParam not matching with the id in the object ${id}`,
    });
  }

  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  return next();
};

// handlers

const create = (req, res) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    ...req.body.data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

const read = (req, res) => {
  res.status(200).json({ data: res.locals.order });
};

const update = (req, res) => {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const {orderId} = req.params;
  const foundOrder = res.locals.order;

  const updatedOrder = {
    id: orderId,
    deliverTo: deliverTo || foundOrder.deliverTo,
    mobileNumber: mobileNumber || foundOrder.mobileNumber,
    status: status || foundOrder.status,
    dishes: dishes || foundOrder.dishes,
  };

  Object.assign(foundOrder, updatedOrder);
  res.status(200).json({ data: updatedOrder });
};

const destroy = (req, res) => {
  const fetchedOrder = res.locals.order;
  const idx = orders.findIndex((order) => order.id === fetchedOrder.id);
  if (idx !== -1) {
    orders.splice(idx, 1);
  }
  res.sendStatus(204);
};

const list = (req, res) => {
  res.status(200).json({ data: orders });
};

module.exports = {
  create: [validateOrderData, create],
  read: [validateOrderId, read],
  update: [validateOrderId, updateOrderValidation, validateOrderData, update],
  delete: [validateOrderId, validateDeleteOrder, destroy],
  list,
};
