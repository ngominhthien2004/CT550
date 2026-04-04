const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createArtwork, getArtworks, getArtworkById, deleteArtwork } = require('../controllers/artwork.controller');
const { protect } = require('../middlewares/auth.middleware');

const ALLOWED_ARTWORK_TYPES = new Set(['illust', 'manga', 'ugoira', 'novel']);

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

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

router.route('/')
    .post(protect, upload.array('images', 10), createArtwork)
    .get(getArtworks);

router.route('/:id')
    .get(getArtworkById)
    .delete(protect, deleteArtwork);

module.exports = router;
