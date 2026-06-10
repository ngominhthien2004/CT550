const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getMyMessages, createMessage, markMessageRead, searchThread, softDeleteMessage } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');
const { checkBlocked } = require('../middlewares/blockCheck.middleware');
const { getMaxUploadFileSizeBytes } = require('../config/env');

const IMAGE_EXTNAMES = /\.(jpg|jpeg|png|webp|gif)$/i;
const IMAGE_MIMETYPES = /^image\/(jpeg|png|webp|gif)$/;

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const userId = req.user?._id?.toString() || 'unknown';
        const uploadDir = path.join('public', 'uploads', userId, 'messages');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(
            null,
            `msg-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        );
    },
});

function checkFileType(req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    if (IMAGE_EXTNAMES.test(extname) && IMAGE_MIMETYPES.test(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error('Images only! Accepted formats: jpg, jpeg, png, webp, gif'));
}

const upload = multer({
    storage,
    limits: {
        fileSize: getMaxUploadFileSizeBytes(),
        files: 5,
    },
    fileFilter: checkFileType,
});

router.route('/')
    .get(protect, getMyMessages)
    .post(protect, checkBlocked({ bodyField: 'recipientId' }), upload.array('images', 5), createMessage);

router.route('/:id/read')
    .patch(protect, markMessageRead);

router.route('/:id/delete')
    .patch(protect, softDeleteMessage);

router.route('/:threadId/search')
    .get(protect, searchThread);

module.exports = router;
