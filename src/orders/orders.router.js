const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const ordersController = require("./orders.controller");

router
  .route("/")
  .get(ordersController.list)
  .post(ordersController.create)
  .all(methodNotAllowed);

router
  .route("/:orderId")
  .get(ordersController.read)
  .put(ordersController.update)
  .delete(ordersController.delete)
  .all(methodNotAllowed);

module.exports = router;
