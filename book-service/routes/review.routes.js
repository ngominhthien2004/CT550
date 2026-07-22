const express = require('express');
const router = express.Router();
const { listReviews, createReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');

// Book-scoped routes: GET + POST reviews for a book
router.get('/books/:id/reviews', optionalAuth, listReviews);
router.post('/books/:id/reviews', protect, createReview);

// Review-scoped routes: update/delete a specific review
router.put('/reviews/:id', protect, updateReview);
router.delete('/reviews/:id', protect, deleteReview);

module.exports = router;
