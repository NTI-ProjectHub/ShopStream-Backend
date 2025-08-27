// validators/variationValidator.js

function validateVariations(variations) {
  if (!Array.isArray(variations) || variations.length === 0) {
    return { valid: false, message: "Variations must be a non-empty array" };
  }

  const validSizes = ["Small", "Medium", "Large"];

  for (const [index, variation] of variations.entries()) {
    if (!variation.size || !validSizes.includes(variation.size)) {
      return { valid: false, message: `Variation ${index + 1}: size must be one of: ${validSizes.join(", ")}` };
    }
    if (typeof variation.price !== "number" || variation.price < 0) {
      return { valid: false, message: `Variation ${index + 1}: price must be a non-negative number` };
    }
    if (typeof variation.isAvailable !== "boolean") {
      return { valid: false, message: `Variation ${index + 1}: isAvailable must be a boolean` };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(variation.price.toString())) {
      return { valid: false, message: `Variation ${index + 1}: price format invalid (max 2 decimal places)` };
    }
  }

  return { valid: true };
}

module.exports = { validateVariations };