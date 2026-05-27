const Message = require('../models/Message');
const User = require('../models/User');
const path = require('path');

const getMyMessages = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const box = req.query.box === 'sent' ? 'sent' : 'inbox';

        const filter = box === 'sent'
            ? { sender: req.user._id }
            : { recipient: req.user._id };

        // Exclude messages soft-deleted for the requesting user
        filter.deletedFor = { $ne: req.user._id };

        const [messages, total, unreadCount] = await Promise.all([
            Message.find(filter)
                .populate('sender', 'username displayName avatar')
                .populate('recipient', 'username displayName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments(filter),
            Message.countDocuments({ recipient: req.user._id, isRead: false })
        ]);

        res.json({
            messages,
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit),
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

        // Process uploaded images
        const publicDir = path.join(__dirname, '..', 'public');
        const images = req.files && req.files.length > 0
            ? req.files.map((file) => {
                const relativePath = path.relative(publicDir, file.path).replace(/\\/g, '/');
                return `/${relativePath}`;
              })
            : [];

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

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyMessages,
    createMessage,
    markMessageRead
    ,searchThread, softDeleteMessage
};
