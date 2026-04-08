const express = require('express');
const router = express.Router();
const { getMyNotifications, markNotificationRead } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .get(protect, getMyNotifications);

router.route('/:id/read')
    .patch(protect, markNotificationRead);

module.exports = router;
