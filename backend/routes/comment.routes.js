const express = require('express');
const router = express.Router();
const { createComment, getComments, deleteComment } = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .post(protect, createComment)
    .get(getComments);

router.route('/:id')
    .delete(protect, deleteComment);

module.exports = router;
