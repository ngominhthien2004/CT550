const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    acceptRequest,
    approveRequest,
    cancelRequest,
    completeRequest,
    createFanLetter,
    createRequest,
    createRequestChatMessage,
    createRequestTerm,
    createRevision,
    getAdminReportedRequests,
    getRequestById,
    getRequestChat,
    getRequestEvents,
    getRequestTerms,
    listMyRequests,
    listPublicRequests,
    rejectRequest,
    reportRequest,
    requestExtension,
    resolveReport,
    startRequest,
    submitDraft,
    updateRequestTerm,
} = require('../controllers/request.controller');
const { protect, admin } = require('../middlewares/auth.middleware');
const { getMaxUploadFileSizeBytes } = require('../config/env');

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        try {
            const userId = req.user?._id?.toString() || 'unknown';
            const uploadDir = path.join('public', 'uploads', userId, 'requests');
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
    const filetypes = /jpg|jpeg|png|webp|gif|pdf|psd|clip|zip/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/|application\/pdf|application\/zip|octet-stream/.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    return cb(new Error('Unsupported request file type'));
}

const upload = multer({
    storage,
    limits: {
        fileSize: getMaxUploadFileSizeBytes(),
        files: 15,
    },
    fileFilter(req, file, cb) {
        checkFileType(file, cb);
    },
});

router.route('/terms')
    .get(getRequestTerms)
    .post(protect, createRequestTerm);

router.route('/terms/:id')
    .patch(protect, updateRequestTerm);

router.get('/public', listPublicRequests);
router.get('/mine', protect, listMyRequests);

router.route('/')
    .post(protect, upload.array('referenceImages', 15), createRequest);

// Admin routes
router.get('/admin/reported', protect, admin, getAdminReportedRequests);
router.post('/admin/:id/resolve-report', protect, admin, resolveReport);

router.get('/:id', protect, getRequestById);
router.post('/:id/accept', protect, acceptRequest);
router.post('/:id/reject', protect, rejectRequest);
router.post('/:id/start', protect, startRequest);
router.post('/:id/cancel', protect, cancelRequest);
router.post('/:id/extension', protect, requestExtension);
router.post('/:id/draft', protect, upload.fields([{ name: 'draftFiles', maxCount: 5 }]), submitDraft);
router.post('/:id/revisions', protect, createRevision);
router.post('/:id/complete', protect, upload.fields([{ name: 'finalFiles', maxCount: 5 }, { name: 'giftFiles', maxCount: 5 }]), completeRequest);
router.post('/:id/approve', protect, approveRequest);
router.post('/:id/fan-letter', protect, createFanLetter);
router.route('/:id/chat')
    .get(protect, getRequestChat)
    .post(protect, upload.fields([{ name: 'attachments', maxCount: 10 }]), createRequestChatMessage);
router.get('/:id/events', protect, getRequestEvents);
router.post('/:id/report', protect, reportRequest);

module.exports = router;
