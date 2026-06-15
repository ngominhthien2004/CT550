const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    createArtwork, getArtworks, getArtworkById,
    getAdminArtworks, deleteArtwork,
    updateNovelContent,
    getChapters, getChapter, createChapter, updateChapter, deleteChapter,
    saveReadingProgress, getReadingProgress,
    reportArtwork,
    getReportedArtworks,
    resolveArtworkReport,
    hideArtwork,
    unhideArtwork,
    getHiddenArtworks,
} = require('../controllers/artwork.controller');
const { protect, admin, optionalAuth } = require('../middlewares/auth.middleware');
const { getMaxUploadFileSizeBytes } = require('../config/env');

const ALLOWED_ARTWORK_TYPES = new Set(['illust', 'manga', 'gif', 'novel']);
const MAX_ARTWORK_IMAGES = 50;

// Accepted image formats (non-animated posts)
const IMAGE_EXTNAMES = /\.(jpg|jpeg|png|webp|gif)$/i;
const IMAGE_MIMETYPES = /^image\/(jpeg|png|webp|gif)$/;

// GIF-specific checks for animated posts
const GIF_EXTNAME = /.gif$/i;
const GIF_MIMETYPE = /^image\/gif$/i;

function resolveUploadDirectory(req) {
    const userId = req.user?._id?.toString() || 'unknown';
    const rawType = (req.body?.type || 'illust').toString().toLowerCase();
    const artworkType = ALLOWED_ARTWORK_TYPES.has(rawType) ? rawType : 'illust';
    return path.join('public', 'uploads', userId, artworkType);
}

// Multer Storage Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        try {
            const uploadDir = resolveUploadDirectory(req);
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        );
    },
});

function checkFileType(req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    const rawType = (req.body?.type || '').toString().toLowerCase();

    // If the artwork is declared as a GIF post, only accept .gif/mime image/gif
    if (rawType === 'gif') {
        if (GIF_EXTNAME.test(extname) && GIF_MIMETYPE.test(file.mimetype)) {
            return cb(null, true);
        }
        return cb(new Error('GIF uploads required for GIF posts. Please upload .gif files (image/gif).'));
    }

    // For non-GIF artwork types, accept standard image formats only (reject archives like .zip)
    if (IMAGE_EXTNAMES.test(extname) && IMAGE_MIMETYPES.test(file.mimetype)) {
        return cb(null, true);
    }

    // Explicitly reject common archive types to avoid accepting Pixiv-style ugoira archives
    if (extname === '.zip' || file.mimetype === 'application/zip') {
        return cb(new Error('ZIP archives are not accepted. Please upload GIFs for animated posts or standard images for still posts.'));
    }

    cb(new Error('Images only! Accepted formats: jpg, jpeg, png, webp, gif'));
}

const upload = multer({
    storage,
    limits: {
        fileSize: getMaxUploadFileSizeBytes(),
        files: MAX_ARTWORK_IMAGES,
    },
    fileFilter: checkFileType,
});

router.route('/')
    .post(protect, upload.array('images', MAX_ARTWORK_IMAGES), createArtwork)
    .get(getArtworks);

router.route('/admin/list')
    .get(protect, admin, getAdminArtworks);

router.route('/:id')
    .get(optionalAuth, getArtworkById)
    .delete(protect, deleteArtwork);

// Novel content update
router.route('/:id/novel-content')
    .put(protect, updateNovelContent);

// Chapter management
router.route('/:id/chapters')
    .get(getChapters)
    .post(protect, createChapter);

router.route('/:id/chapters/:chapterId')
    .get(getChapter)
    .put(protect, updateChapter)
    .delete(protect, deleteChapter);

// Reading progress
router.route('/:id/reading-progress')
    .get(protect, getReadingProgress)
    .post(protect, saveReadingProgress);

// ─── Artwork Report Routes ────────────────────────────────────────────────────
router.post('/:id/report', protect, reportArtwork);
router.get('/admin/reported', protect, admin, getReportedArtworks);
router.patch('/admin/reports/:id/resolve', protect, admin, resolveArtworkReport);
router.patch('/admin/:id/hide', protect, admin, hideArtwork);
router.patch('/admin/:id/unhide', protect, admin, unhideArtwork);
router.get('/admin/hidden', protect, admin, getHiddenArtworks);

module.exports = router;
