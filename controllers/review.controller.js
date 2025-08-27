const Review = require("../models/review.model");
const Restaurant = require("../models/restaurant/restaurant.model");
const { pagination } = require("../utils/pagination");
const { reviewFilter } = require("../utils/filter");
const {asyncWrapper} = require("../middlewares/asyncWrapper.middleware");
const STATUS_CODES = require("../constants/status_Codes");
const MESSAGES = require("../constants/messages");

// ✅ helper to update restaurant's avg rating
const updateRestaurantRating = async (restaurantId) => {
  const stats = await Review.aggregate([
    { $match: { restaurantId } },
    {
      $group: {
        _id: "$restaurantId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length > 0 ? stats[0].avgRating : 0;
  const reviewsCount = stats.length > 0 ? stats[0].count : 0;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    avgRating,
    reviewsCount,
  });
};

// ✅ Filter builder for reviews

// ✅ Create a new review
exports.createReview = asyncWrapper(async (req, res) => {
  const { restaurantId, rating, comment } = req.body;

  // validate restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.RESTAURANT_NOT_FOUND,
    });
  }

  const review = await Review.create({
    customerId: req.user._id, // assuming logged-in user
    restaurantId,
    rating,
    comment,
  });

  // update avg rating
  await updateRestaurantRating(restaurantId);

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.REVIEW_CREATED_SUCCESSFULLY,
    data: review,
  });
});

// ✅ Get all reviews (with pagination + filters)
exports.getAllReviews = asyncWrapper(async (req, res) => {
  const filter = await reviewFilter(req);
  const { total, page, limit, totalPages, data } = await pagination(
    Review,
    req,
    filter
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.REVIEWS_RETRIEVED_SUCCESSFULLY,
    result: total,
    meta: { page, limit, totalPages, count: data.length },
    data,
  });
});

// ✅ Get single review by ID
exports.getReviewById = asyncWrapper(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("customerId", "name email")
    .populate("restaurantId", "name");

  if (!review) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.REVIEW_NOT_FOUND,
    });
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.REVIEW_RETRIEVED_SUCCESSFULLY,
    data: review,
  });
});

// ✅ Update review (only owner can update)
exports.updateReview = asyncWrapper(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.REVIEW_NOT_FOUND,
    });
  }

  // check ownership
  if (review.customerId.toString() !== req.user._id.toString()) {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: MESSAGES.UNAUTHORIZED_ACTION,
    });
  }

  review.rating = req.body.rating ?? review.rating;
  review.comment = req.body.comment ?? review.comment;
  await review.save();

  // update avg rating
  await updateRestaurantRating(review.restaurantId);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.REVIEW_UPDATED_SUCCESSFULLY,
    data: review,
  });
});

// ✅ Delete review (only owner can delete)
exports.deleteReview = asyncWrapper(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: MESSAGES.REVIEW_NOT_FOUND,
    });
  }

  // check ownership
  if (review.customerId.toString() !== req.user._id.toString()) {
    return res.status(STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: MESSAGES.UNAUTHORIZED_ACTION,
    });
  }

  const restaurantId = review.restaurantId;
  await review.deleteOne();

  // update avg rating
  await updateRestaurantRating(restaurantId);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.REVIEW_DELETED_SUCCESSFULLY,
  });
});