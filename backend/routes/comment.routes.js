const express = require('express');
const router = express.Router();
const { createComment, getComments, getReplies, deleteComment, getAdminComments, reportComment, getReportedComments, resolveCommentReport } = require('../controllers/comment.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

router.route('/')
    .post(protect, createComment)
    .get(getComments);

router.route('/replies')
    .get(getReplies);

router.get('/admin/list', protect, admin, getAdminComments);
router.get('/admin/reported', protect, admin, getReportedComments);
router.patch('/admin/reports/:id/resolve', protect, admin, resolveCommentReport);

router.route('/:id')
    .delete(protect, deleteComment);

router.post('/:id/report', protect, reportComment);

module.exports = router;
