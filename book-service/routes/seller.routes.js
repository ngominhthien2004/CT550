const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
    getMyProfile,
    updateProfile,
    becomeSeller,
    getPublicSellerProfile,
    getSellerDashboardStats
} = require('../controllers/seller.controller');
const { getSellerPublishedBooks } = require('../controllers/book.controller');

const router = express.Router();

router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateProfile);
router.post('/become', protect, becomeSeller);

// Dashboard stats — placed before the `/public/:sellerId` routes to be safe.
router.get('/dashboard/stats', protect, getSellerDashboardStats);

router.get('/public/:sellerId', getPublicSellerProfile);
router.get('/public/:sellerId/books', getSellerPublishedBooks);

module.exports = router;
