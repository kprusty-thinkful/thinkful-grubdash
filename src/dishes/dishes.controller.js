const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// middleware functions
const validateRequestBody = (req, res, next) => {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const validationErrors = [];

  if (!name || name === "") validationErrors.push("Dish must include a name");
  if (!description || description === "")
    validationErrors.push("Dish must include a description");
  if (!price) validationErrors.push("Dish must include a price");
  if (!Number.isInteger(price) || Number(price) <= 0)
    validationErrors.push(
      "Dish must have a price that is an integer greater than 0",
    );
  if (!image_url || image_url === "")
    validationErrors.push("Dish must include a image_url");

  if (validationErrors.length) {
    res.status(400).json({ error: validationErrors.join(" ") });
  }
  return next();
};

const validateIfDishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }
};

const validateIdWithBodyId = (req, res, next) => {
  const { dishId } = req.params;
  const id = req.body.data.id;
  if (!id) {
    return next();
  }
  if (dishId !== id)
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  return next();
};

// handlers
const create = (req, res) => {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: Number(price),
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const read = (req, res) => {
  res.status(200).json({ data: res.locals.dish });
};

const update = (req, res) => {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.status(200).json({ data: foundDish });
};

const list = (req, res) => {
  res.json({ data: dishes });
};

module.exports = {
  create: [validateRequestBody, create],
  read: [validateIfDishExists, read],
  update: [
    validateIfDishExists,
    validateIdWithBodyId,
    validateRequestBody,
    update,
  ],
  list,
};
