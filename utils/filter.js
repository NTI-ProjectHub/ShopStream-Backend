exports.restaurantFilter = async (model, req) => {
  const query = req.query;
  const allowedFilters = ["type", "status", "rating"]; // whitelist allowed query params
  const filter = {};

  allowedFilters.forEach((field) => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });

  return filter;
};

exports.orderFilter = async (model, req) => {
  const query = req.query;
  const allowedFilters = ["status", "rating"]; // whitelist allowed query params
  const filter = {};

  allowedFilters.forEach((field) => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });

  return filter;
};

exports.reviewFilter = async (req) => {
  const query = req.query;
  const allowedFilters = ["restaurantId", "customerId", "rating"];
  const filter = {};

  allowedFilters.forEach((field) => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });

  return filter;
};

