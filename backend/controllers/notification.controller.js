const Notification = require('../models/Notification');

const getMyNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const unreadOnly = String(req.query.unread || '').toLowerCase() === 'true';

        const filter = {
            user: req.user._id,
            ...(unreadOnly ? { isRead: false } : {})
        };

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .populate('actor', 'username displayName avatar')
                .populate('artwork', 'title images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: req.user._id, isRead: false })
        ]);

        res.json({
            notifications,
            unreadCount,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            res.status(404);
            return next(new Error('Notification not found'));
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to update this notification'));
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyNotifications,
    markNotificationRead
};
