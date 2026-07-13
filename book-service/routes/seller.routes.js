const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
    getMyProfile,
    updateProfile,
    becomeSeller
} = require('../controllers/seller.controller');

const router = express.Router();

router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateProfile);
router.post('/become', protect, becomeSeller);

module.exports = router;
