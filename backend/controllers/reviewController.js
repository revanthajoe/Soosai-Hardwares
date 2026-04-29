const { Review, Product } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { logger } = require('../config/logger');

const getReviewsByProductId = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (isNaN(parseInt(productId))) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  const reviews = await Review.findByProductId(parseInt(productId));

  // Calculate average rating
  let averageRating = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    averageRating = (sum / reviews.length).toFixed(1);
  }

  res.status(200).json({
    success: true,
    data: {
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
    },
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { authorName, rating, comment } = req.body;

  if (isNaN(parseInt(productId))) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  if (!authorName || !rating) {
    return res.status(400).json({ success: false, message: 'Name and rating are required' });
  }

  const numRating = parseInt(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const product = await Product.findById(parseInt(productId));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const review = await Review.create({
    product_id: parseInt(productId),
    author_name: authorName.trim(),
    rating: numRating,
    comment: comment ? comment.trim() : '',
  });

  logger.info(`Review created for product ${productId} by ${authorName}`);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: review,
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid review ID' });
  }

  await Review.delete(parseInt(id));

  logger.info(`Review deleted: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

module.exports = {
  getReviewsByProductId,
  createReview,
  deleteReview,
};
