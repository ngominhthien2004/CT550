const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middlewares/auth.middleware');
const {
  createSeries,
  getMySeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
  addArtworkToSeries,
  removeArtworkFromSeries,
  reorderSeriesArtworks,
  uploadSeriesCover,
} = require('../controllers/series.controller');
const { getMaxUploadFileSizeBytes } = require('../config/env');

// Accepted image formats for cover uploads
const IMAGE_EXTNAMES = /\.(jpg|jpeg|png|webp)$/i;
const IMAGE_MIMETYPES = /^image\/(jpeg|png|webp)$/;

function resolveCoverUploadDirectory(req) {
  const userId = req.user?._id?.toString() || 'unknown';
  return path.join('public', 'uploads', userId, 'covers');
}

// Multer Storage Config for cover images
const coverStorage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      const uploadDir = resolveCoverUploadDirectory(req);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    cb(
      null,
      `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    );
  },
});

function checkCoverFileType(req, file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();

  if (IMAGE_EXTNAMES.test(extname) && IMAGE_MIMETYPES.test(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Images only! Accepted formats: jpg, jpeg, png, webp'));
}

const coverUpload = multer({
  storage: coverStorage,
  limits: {
    fileSize: getMaxUploadFileSizeBytes(),
    files: 1,
  },
  fileFilter: checkCoverFileType,
});

// Public routes — no auth required
router.route('/:id')
  .get(getSeriesById);

// Protected routes — all require auth
router.use(protect);

router.route('/')
  .get(getMySeries)
  .post(createSeries);

router.route('/:id')
  .put(updateSeries)
  .delete(deleteSeries);

router.put('/:id/cover', coverUpload.single('coverImage'), uploadSeriesCover);
router.post('/:id/artworks', addArtworkToSeries);
router.delete('/:id/artworks/:artworkId', removeArtworkFromSeries);
router.put('/:id/reorder', reorderSeriesArtworks);

module.exports = router;
