const express = require('express');
const router = express.Router();
const { getMyNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .get(protect, getMyNotifications);

router.route('/read-all')
    .patch(protect, markAllNotificationsRead);

router.route('/:id/read')
    .patch(protect, markNotificationRead);

module.exports = router;
