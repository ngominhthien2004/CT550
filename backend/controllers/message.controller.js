const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { getSocketIO } = require('../utils/socket');
const { createNotification } = require('../utils/notification');

// Hard cap on any single message response — prevents unbounded queries
// when the caller polls with an old `since` timestamp.
const HARD_MESSAGE_LIMIT = 1000;
// `since` polls are limited to the most recent 7 days; older timestamps
// are clamped forward so a buggy or hostile client cannot drain the
// entire inbox in one request.
const MAX_SINCE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getMyMessages = async (req, res, next) => {
    try {
        const rawPage = parseInt(req.query.page, 10);
        const rawLimit = parseInt(req.query.limit, 10);
        const page = Number.isNaN(rawPage) ? 1 : Math.max(rawPage, 1);
        const requestedLimit = Number.isNaN(rawLimit) ? 20 : Math.max(rawLimit, 1);
        const limit = Math.min(requestedLimit, HARD_MESSAGE_LIMIT);
        const skip = (page - 1) * limit;
        const box = req.query.box === 'sent' ? 'sent' : 'inbox';

        const filter = box === 'sent'
            ? { sender: req.user._id }
            : { recipient: req.user._id };

        // Exclude messages soft-deleted for the requesting user
        filter.deletedFor = { $ne: req.user._id };

        // Support ?since=<ISO timestamp> for polling new messages only.
        // Clamp the timestamp to a 7-day window so callers cannot request
        // arbitrarily old history in a single request.
        const since = req.query.since;
        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                const earliestAllowed = new Date(Date.now() - MAX_SINCE_AGE_MS);
                const effectiveSince = sinceDate < earliestAllowed ? earliestAllowed : sinceDate;
                filter.createdAt = { $gt: effectiveSince };
            }
        }

        const query = Message.find(filter)
            .populate('sender', 'username displayName avatar')
            .populate('recipient', 'username displayName avatar')
            .sort({ createdAt: -1 });

        // Always apply a hard upper bound on rows returned. When `since`
        // is set we also skip client-side pagination because the query
        // is already capped to a sliding 7-day window.
        if (since) {
            query.limit(HARD_MESSAGE_LIMIT);
        } else {
            query.skip(skip).limit(limit);
        }

        const [messages, total, unreadCount] = await Promise.all([
            query,
            Message.countDocuments(filter),
            Message.countDocuments({ recipient: req.user._id, isRead: false })
        ]);

        res.json({
            messages,
            total,
            unreadCount,
            page: since ? 1 : page,
            pages: since ? 1 : Math.ceil(total / limit),
            box
        });
    } catch (error) {
        next(error);
    }
};

const createMessage = async (req, res, next) => {
    try {
        const { recipientId, content } = req.body;

        if (!recipientId) {
            res.status(400);
            return next(new Error('recipientId is required'));
        }

        if (recipientId === req.user._id.toString()) {
            res.status(400);
            return next(new Error('Cannot send message to yourself'));
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404);
            return next(new Error('Recipient not found'));
        }

        // Process uploaded images — upload to Cloudinary for persistent storage
        let images = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(async (file) => {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: process.env.CLOUDINARY_FOLDER || 'illuwrl-messages',
                        resource_type: 'auto',
                    });
                    return result.secure_url;
                } catch (err) {
                    console.error('Cloudinary upload failed for message image:', file.path, err.message);
                    // Fallback to local path
                    const publicDir = path.join(__dirname, '..', 'public');
                    const relativePath = path.relative(publicDir, file.path).replace(/\\/g, '/');
                    return `/${relativePath}`;
                }
            });
            images = await Promise.all(uploadPromises);
        }

        // Content is optional if images are present
        const msgContent = content && content.trim() ? content.trim() : '';

        if (!msgContent && images.length === 0) {
            res.status(400);
            return next(new Error('Content or images are required'));
        }

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            content: msgContent,
            images,
        });

        const populated = await Message.findById(message._id)
            .populate('sender', 'username displayName avatar')
            .populate('recipient', 'username displayName avatar');

        // Emit real-time DM event to recipient
        const io = getSocketIO();
        if (io) {
            io.to(`user:${recipientId}`).emit('message:new', populated);
        }

        // Create notification record for the new message
        const preview = msgContent
            ? (msgContent.length > 100 ? msgContent.substring(0, 100) + '...' : msgContent)
            : (images.length > 0 ? '[Image]' : '');
        createNotification({
            userId: recipientId,
            actorId: req.user._id,
            type: 'message',
            message: preview || 'Sent you a message',
            metadata: { messageId: message._id, senderUsername: req.user.username },
        });

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

const searchThread = async (req, res, next) => {
    try {
        const threadId = req.params.threadId;
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

        if (!threadId) {
            res.status(400);
            return next(new Error('threadId required'));
        }

        // participant-only check: there must be at least one message between users or allow if other id provided
        if (threadId === req.user._id.toString()) {
            res.status(400);
            return next(new Error('Invalid thread'));
        }

        const baseFilter = {
            deletedFor: { $ne: req.user._id },
            $or: [
                { sender: req.user._id, recipient: threadId },
                { sender: threadId, recipient: req.user._id },
            ],
        };

        if (q) {
            baseFilter.content = { $regex: q, $options: 'i' };
        }

        const messages = await Message.find(baseFilter)
            .populate('sender', 'username displayName avatar')
            .populate('recipient', 'username displayName avatar')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        next(error);
    }
};

const softDeleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            res.status(404);
            return next(new Error('Message not found'));
        }

        const userId = req.user._id.toString();
        const participant = [message.sender.toString(), message.recipient.toString()].includes(userId);
        if (!participant) {
            res.status(403);
            return next(new Error('Not authorized to delete this message'));
        }

        // Add to deletedFor if not already present
        if (!message.deletedFor) message.deletedFor = [];
        if (!message.deletedFor.map(String).includes(userId)) {
            message.deletedFor.push(req.user._id);
            await message.save();
        }

        res.json({ message: 'Message hidden for user' });
    } catch (error) {
        next(error);
    }
};

const markMessageRead = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            res.status(404);
            return next(new Error('Message not found'));
        }

        if (message.recipient.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to update this message'));
        }

        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        // Sync related notification + push real-time read receipt
        await Notification.updateMany(
            { user: req.user._id, type: 'message', 'metadata.messageId': message._id },
            { $set: { isRead: true } }
        );
        const io = getSocketIO();
        if (io) {
            io.to(`user:${message.sender}`).emit('message:read', {
                readerId: req.user._id,
                count: 1,
            });
        }

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        next(error);
    }
};

const markThreadRead = async (req, res, next) => {
    try {
        const peerId = req.params.peerId;
        if (!peerId || peerId === req.user._id.toString()) {
            res.status(400);
            return next(new Error('Invalid thread'));
        }
        const me = req.user._id;
        const now = new Date();

        // Collect unread incoming messages from this peer (skip soft-deleted)
        const unread = await Message.find(
            { recipient: me, sender: peerId, isRead: false, deletedFor: { $ne: me } },
            { _id: 1 }
        );
        const ids = unread.map((m) => m._id);
        let modifiedCount = 0;
        if (ids.length > 0) {
            const result = await Message.updateMany(
                { _id: { $in: ids } },
                { $set: { isRead: true, readAt: now } }
            );
            modifiedCount = result.modifiedCount || ids.length;

            // Keep message notifications in sync (bell clears when the DM is read)
            await Notification.updateMany(
                { user: me, type: 'message', 'metadata.messageId': { $in: ids } },
                { $set: { isRead: true } }
            );
        }

        const unreadCount = await Message.countDocuments({ recipient: me, isRead: false });

        // Real-time read receipt to the peer (the sender of those messages)
        const io = getSocketIO();
        if (io && modifiedCount > 0) {
            io.to(`user:${peerId}`).emit('message:read', {
                readerId: me,
                count: modifiedCount,
            });
        }

        res.json({ modifiedCount, unreadCount, threadId: peerId });
    } catch (error) {
        next(error);
    }
};

const markAllRead = async (req, res, next) => {
    try {
        const me = req.user._id;
        const now = new Date();

        const unread = await Message.find(
            { recipient: me, isRead: false, deletedFor: { $ne: me } },
            { _id: 1 }
        );
        const ids = unread.map((m) => m._id);
        let modifiedCount = 0;
        if (ids.length > 0) {
            const result = await Message.updateMany(
                { _id: { $in: ids } },
                { $set: { isRead: true, readAt: now } }
            );
            modifiedCount = result.modifiedCount || ids.length;

            await Notification.updateMany(
                { user: me, type: 'message', 'metadata.messageId': { $in: ids } },
                { $set: { isRead: true } }
            );
        }

        const unreadCount = await Message.countDocuments({ recipient: me, isRead: false });

        // Broadcast read receipts to each sender who had messages newly read
        if (modifiedCount > 0) {
            const io = getSocketIO();
            if (io) {
                const senders = await Message.distinct('sender', { recipient: me, isRead: true, readAt: now });
                for (const senderId of senders) {
                    if (String(senderId) !== String(me)) {
                        io.to(`user:${senderId}`).emit('message:read', { readerId: me, count: 1 });
                    }
                }
            }
        }

        res.json({ modifiedCount, unreadCount });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyMessages,
    createMessage,
    markMessageRead,
    markThreadRead,
    markAllRead,
    searchThread,
    softDeleteMessage
};
