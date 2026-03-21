const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createArtwork, getArtworks, getArtworkById, deleteArtwork } = require('../controllers/artwork.controller');
const { protect } = require('../middlewares/auth.middleware');

// Multer Storage Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
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
