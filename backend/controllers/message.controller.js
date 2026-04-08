const Message = require('../models/Message');
const User = require('../models/User');

const getMyMessages = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const box = req.query.box === 'sent' ? 'sent' : 'inbox';

        const filter = box === 'sent'
            ? { sender: req.user._id }
            : { recipient: req.user._id };

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

        if (!recipientId || !content || !content.trim()) {
            res.status(400);
            return next(new Error('recipientId and content are required'));
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

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            content: content.trim()
        });

        const populated = await Message.findById(message._id)
            .populate('sender', 'username displayName avatar')
            .populate('recipient', 'username displayName avatar');

        res.status(201).json(populated);
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
};
