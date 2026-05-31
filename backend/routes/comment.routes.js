const express = require('express');
const router = express.Router();
const { createComment, getComments, getReplies, deleteComment, getAdminComments } = require('../controllers/comment.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

router.route('/')
    .post(protect, createComment)
    .get(getComments);

router.route('/replies')
    .get(getReplies);

router.get('/admin/list', protect, admin, getAdminComments);

router.route('/:id')
    .delete(protect, deleteComment);

module.exports = router;
