const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authenticate } = require("../middlewares/authentication.middleware");
// CREATE a review (logged-in user only)
router.post("/", authenticate, reviewController.createReview);

// GET all reviews (supports filters + pagination)
router.get("/", reviewController.getAllReviews);

// GET single review by id
router.get("/:id", reviewController.getReviewById);

// UPDATE review (owner only)
router.put("/:id", authenticate, reviewController.updateReview);

// DELETE review (owner only)
router.delete("/:id", authenticate, reviewController.deleteReview);

module.exports = router;
