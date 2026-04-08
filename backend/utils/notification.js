const Notification = require('../models/Notification');

const createNotification = async ({ userId, actorId = null, artworkId = null, type, message }) => {
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
            message
        });
    } catch (_error) {
        return null;
    }
};

module.exports = {
    createNotification
};
