const Notification = require('../models/Notification');

const createNotification = async ({ userId, actorId = null, artworkId = null, type, message, metadata = null }) => {
    if (!userId || !type || !message) {
        return null;
    }

    if (actorId && userId.toString() === actorId.toString()) {
        return null;
    }

    try {
        return await Notification.create({
            user: userId,
            actor: actorId,
            artwork: artworkId,
            type,
            message,
            metadata,
        });
    } catch (_error) {
        return null;
    }
};

module.exports = {
    createNotification
};
