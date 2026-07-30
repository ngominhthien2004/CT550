const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
    getMyProfile,
    updateProfile,
    becomeSeller,
    getPublicSellerProfile
} = require('../controllers/seller.controller');
const { getSellerPublishedBooks } = require('../controllers/book.controller');

const router = express.Router();

router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateProfile);
router.post('/become', protect, becomeSeller);

router.get('/public/:sellerId', getPublicSellerProfile);
router.get('/public/:sellerId/books', getSellerPublishedBooks);

module.exports = router;
