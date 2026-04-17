const Comment = require('../models/Comment');
const Artwork = require('../models/Artwork');
const { createNotification } = require('../utils/notification');

const createComment = async (req, res, next) => {
    try {
        const { artworkId, content, parentCommentId, stickerUrl } = req.body;
        const normalizedContent = typeof content === 'string' ? content.trim() : '';
        const normalizedStickerUrl = typeof stickerUrl === 'string' ? stickerUrl.trim() : '';

        if (!artworkId) {
            res.status(400);
            return next(new Error('artworkId is required'));
        }

        if (!normalizedContent && !normalizedStickerUrl) {
            res.status(400);
            return next(new Error('At least one of content or stickerUrl is required'));
        }

        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        let parentComment = null;
        if (parentCommentId) {
            parentComment = await Comment.findById(parentCommentId).select('_id artwork user');
            if (!parentComment) {
                res.status(404);
                return next(new Error('Parent comment not found'));
            }

            if (parentComment.artwork.toString() !== artworkId.toString()) {
                res.status(400);
                return next(new Error('Parent comment must belong to the same artwork'));
            }
        }

        const comment = await Comment.create({
            artwork: artworkId,
            user: req.user._id,
            content: normalizedContent || undefined,
            parentComment: parentComment ? parentComment._id : null,
            stickerUrl: normalizedStickerUrl || undefined
        });

        artwork.commentCount = (artwork.commentCount || 0) + 1;
        await artwork.save();

        const notificationUserId = parentComment ? parentComment.user : artwork.user;
        const notificationMessage = parentComment
            ? `${req.user.username || req.user.displayName || 'Someone'} replied to your comment.`
            : `${req.user.username || req.user.displayName || 'Someone'} commented on your artwork.`;

        await createNotification({
            userId: notificationUserId,
            actorId: req.user._id,
            artworkId,
            type: 'comment',
            message: notificationMessage
        });

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
        const filter = { artwork: artworkId, parentComment: null };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('user', 'username displayName avatar')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments(filter)
        ]);

        const commentIds = comments.map((comment) => comment._id);
        let replyCountMap = new Map();

        if (commentIds.length > 0) {
            const replyCounts = await Comment.aggregate([
                {
                    $match: {
                        parentComment: { $in: commentIds }
                    }
                },
                {
                    $group: {
                        _id: '$parentComment',
                        count: { $sum: 1 }
                    }
                }
            ]);
            replyCountMap = new Map(replyCounts.map((item) => [item._id.toString(), item.count]));
        }

        const commentsWithReplyCount = comments.map((comment) => ({
            ...comment,
            replyCount: replyCountMap.get(comment._id.toString()) || 0
        }));

        res.json({
            comments: commentsWithReplyCount,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const getReplies = async (req, res, next) => {
    try {
        const { commentId } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;

        if (!commentId) {
            res.status(400);
            return next(new Error('commentId query is required'));
        }

        const parentComment = await Comment.findById(commentId).select('_id artwork');
        if (!parentComment) {
            res.status(404);
            return next(new Error('Comment not found'));
        }

        const skip = (page - 1) * limit;
        const filter = { artwork: parentComment.artwork, parentComment: parentComment._id };

        const [replies, total] = await Promise.all([
            Comment.find(filter)
                .populate('user', 'username displayName avatar')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit),
            Comment.countDocuments(filter)
        ]);

        res.json({
            replies,
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
        const comment = await Comment.findById(req.params.id).select('_id user artwork parentComment');

        if (!comment) {
            res.status(404);
            return next(new Error('Comment not found'));
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to delete this comment'));
        }

        let deletedCount = 1;
        if (!comment.parentComment) {
            const directReplies = await Comment.find({ parentComment: comment._id }).select('_id').lean();
            const deleteIds = [comment._id, ...directReplies.map((reply) => reply._id)];
            const deleteResult = await Comment.deleteMany({ _id: { $in: deleteIds } });
            deletedCount = deleteResult.deletedCount || 0;
        } else {
            await comment.deleteOne();
        }

        await Artwork.findByIdAndUpdate(comment.artwork, {
            $inc: { commentCount: -deletedCount }
        });

        res.json({ message: 'Comment removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
    getReplies,
    deleteComment
};
