const Notification = require('../models/Notification');

let io = null;

function setSocketIO(socketIO) {
    io = socketIO;
}

const createNotification = async ({ userId, actorId = null, artworkId = null, type, message, metadata = null }) => {
    if (!userId || !type || !message) {
        return null;
    }

    if (actorId && userId.toString() === actorId.toString()) {
        return null;
    }

    try {
        const notification = await Notification.create({
            user: userId,
            actor: actorId,
            artwork: artworkId,
            type,
            message,
            metadata,
        });

        // Emit real-time event via Socket.IO
        if (io) {
            const populated = await Notification.findById(notification._id)
                .populate('actor', 'username displayName avatar')
                .populate('artwork', 'title images')
                .lean();

            io.to(`user:${userId}`).emit('notification:new', populated);

            // Also emit to admins room if it's a report
            if (type.includes('_report')) {
                io.to('admins').emit('notification:new', populated);
            }
        }

        return notification;
    } catch (_error) {
        return null;
    }
};

module.exports = {
    createNotification,
    setSocketIO,
};
