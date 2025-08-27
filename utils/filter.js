const filter = async (model, filter, options = {}) => {
  try {
    const { projection = {}, limit = 0, skip = 0, sort = {} } = options;
    const results = await model
      .find(filter, projection)
      .limit(limit)
      .skip(skip)
      .sort(sort);
    return results;
  } catch (error) {
    throw new Error(`Error filtering data: ${error.message}`);
  }
};

module.exports = filter;
