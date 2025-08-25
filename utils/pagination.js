// server pagination if no query sent
exports.pagination = async (model, req, query = {}) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await model.countDocuments(query);
    const data = await model.find(query).skip(skip).limit(limit).lean(); // 👈 use .lean() to avoid circular refs

    return {
        total,
        page,
        limit,
        data
    };
};