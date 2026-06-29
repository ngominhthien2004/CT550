const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middlewares/auth.middleware');
const { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/banner.controller');

// Multer setup for banner images
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join('public', 'uploads', 'banners');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(ext) && /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed: jpg, jpeg, png, webp, gif'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Public routes
router.get('/', getActiveBanners);

// Admin routes
router.get('/admin', protect, admin, getAllBanners);
router.post('/', protect, admin, upload.single('image'), createBanner);
router.put('/:id', protect, admin, upload.single('image'), updateBanner);
router.delete('/:id', protect, admin, deleteBanner);

module.exports = router;
