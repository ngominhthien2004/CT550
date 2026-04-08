const express = require('express');
const router = express.Router();
const { getMyMessages, createMessage, markMessageRead } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .get(protect, getMyMessages)
    .post(protect, createMessage);

router.route('/:id/read')
    .patch(protect, markMessageRead);

module.exports = router;
