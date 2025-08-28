// server pagination if no query sent
exports.pagination = async (model, req, query = {}, filter = {}) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

  const skip = (page - 1) * limit;

  // combine filters safely
  const conditions = { $and: [query, filter] };

  const total = await model.countDocuments(conditions);
  const data = await model.find(conditions).skip(skip).limit(limit).lean();

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  };
};