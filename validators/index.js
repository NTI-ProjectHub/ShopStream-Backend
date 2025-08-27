// validators/index.js
const { validateCategories, VALID_CATEGORIES } = require("./category.Validator");
const { validateVariations } = require("./variation.Validator");

module.exports = {
  validateCategories,
  VALID_CATEGORIES,
  validateVariations
};
