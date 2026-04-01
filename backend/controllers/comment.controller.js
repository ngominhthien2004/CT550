const Comment = require('../models/Comment');
const Artwork = require('../models/Artwork');

const createComment = async (req, res, next) => {
    try {
        const { artworkId, content } = req.body;

        if (!artworkId || !content || !content.trim()) {
            res.status(400);
            return next(new Error('artworkId and content are required'));
        }

        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        const comment = await Comment.create({
            artwork: artworkId,
            user: req.user._id,
            content: content.trim()
        });

        artwork.commentCount = (artwork.commentCount || 0) + 1;
        await artwork.save();

        const populated = await Comment.findById(comment._id).populate('user', 'username displayName avatar');
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

const getComments = async (req, res, next) => {
    try {
        const { artworkId } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!artworkId) {
            res.status(400);
            return next(new Error('artworkId query is required'));
        }

        const skip = (page - 1) * limit;
        const filter = { artwork: artworkId };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('user', 'username displayName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments(filter)
        ]);

        res.json({
            comments,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            res.status(404);
            return next(new Error('Comment not found'));
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to delete this comment'));
        }

        await comment.deleteOne();
        await Artwork.findByIdAndUpdate(comment.artwork, {
            $inc: { commentCount: -1 }
        });

        res.json({ message: 'Comment removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment
};
