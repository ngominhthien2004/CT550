const AppError = require('../utils/AppError');
const Comment = require('../models/Comment');
const CommentReport = require('../models/CommentReport');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const UserBlock = require('../models/UserBlock');
const { createNotification } = require('../utils/notification');
const { buildDateFilter } = require('../utils/dateFilter');
const { getOrSet, del, delByPrefix, TTL, buildKey } = require('../utils/cache');

const createComment = async (req, res, next) => {
    try {
        const { artworkId, content, parentCommentId, emoji } = req.body;
        const normalizedContent = typeof content === 'string' ? content.trim() : '';
        const normalizedEmoji = typeof emoji === 'string' ? emoji.trim() : '';

        if (!artworkId) {
            res.status(400);
            return next(new AppError('artworkId is required', 'VALIDATION_ERROR', 400));
        }

        if (!normalizedContent && !normalizedEmoji) {
            res.status(400);
            return next(new AppError('At least one of content or emoji is required', 'VALIDATION_ERROR', 400));
        }

        const artwork = await Artwork.findById(artworkId).select('user series');
        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        // Check block relationships with artwork owner
        const artworkOwnerId = artwork.user?.toString();
        if (artworkOwnerId && artworkOwnerId !== req.user._id.toString()) {
            const [theyBlockedMe, iBlockedThem] = await Promise.all([
                UserBlock.findOne({ blocker: artworkOwnerId, blocked: req.user._id }),
                UserBlock.findOne({ blocker: req.user._id, blocked: artworkOwnerId }),
            ]);
            if (theyBlockedMe) {
                res.status(403);
                return next(new Error('You cannot comment: you have been blocked by the artwork owner'));
            }
            if (iBlockedThem) {
                res.status(403);
                return next(new Error('You cannot comment: you have blocked the artwork owner'));
            }
        }

        let parentComment = null;
        if (parentCommentId) {
            parentComment = await Comment.findById(parentCommentId).select('_id artwork user');
            if (!parentComment) {
                res.status(404);
                return next(new AppError('Parent comment not found', 'COMMENT_NOT_FOUND', 404));
            }

            if (parentComment.artwork.toString() !== artworkId.toString()) {
                res.status(400);
                return next(new Error('Parent comment must belong to the same artwork'));
            }
        }

        // If replying, also check parent comment owner
        if (parentComment) {
            const parentOwnerId = parentComment.user?.toString();
            if (parentOwnerId && parentOwnerId !== req.user._id.toString()) {
                const [theyBlockedMe, iBlockedThem] = await Promise.all([
                    UserBlock.findOne({ blocker: parentOwnerId, blocked: req.user._id }),
                    UserBlock.findOne({ blocker: req.user._id, blocked: parentOwnerId }),
                ]);
                if (theyBlockedMe || iBlockedThem) {
                    res.status(403);
                    return next(new Error('You cannot reply: block relationship exists with the comment author'));
                }
            }
        }

        const comment = await Comment.create({
            artwork: artworkId,
            user: req.user._id,
            content: normalizedContent || undefined,
            parentComment: parentComment ? parentComment._id : null,
            emoji: normalizedEmoji || undefined
        });

        await Artwork.findByIdAndUpdate(artworkId, { $inc: { commentCount: 1 } });

        // Invalidate admin overview cache
        delByPrefix('admin:overview');

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

        // Invalidate comments cache for this artwork
        del(`comments:${artworkId}:`);

        // Invalidate replies cache for the parent comment
        if (parentCommentId) {
            del(`replies:${parentCommentId}:`);
        }

        // Invalidate series detail cache if the artwork belongs to a series
        if (artwork.series) {
            delByPrefix(`series:detail:${artwork.series.toString()}`);
        }

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
            return next(new AppError('artworkId query is required', 'VALIDATION_ERROR', 400));
        }

        const cacheKey = `comments:${artworkId}:${page}:${limit}`;
        const data = await getOrSet(cacheKey, async () => {
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
                    { $match: { parentComment: { $in: commentIds } } },
                    { $group: { _id: '$parentComment', count: { $sum: 1 } } }
                ]);
                replyCountMap = new Map(replyCounts.map((item) => [item._id.toString(), item.count]));
            }

            const commentsWithReplyCount = comments.map((comment) => ({
                ...comment,
                replyCount: replyCountMap.get(comment._id.toString()) || 0
            }));

            return { comments: commentsWithReplyCount, total };
        }, 30); // 30s TTL — comments are dynamic

        res.json({
            comments: data.comments,
            total: data.total,
            page,
            pages: Math.ceil(data.total / limit)
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
            return next(new AppError('commentId query is required', 'VALIDATION_ERROR', 400));
        }

        const parentComment = await Comment.findById(commentId).select('_id artwork');
        if (!parentComment) {
            res.status(404);
            return next(new AppError('Comment not found', 'COMMENT_NOT_FOUND', 404));
        }

        const cacheKey = `replies:${commentId}:${page}:${limit}`;
        const data = await getOrSet(cacheKey, async () => {
            const skip = (page - 1) * limit;
            const filter = { artwork: parentComment.artwork, parentComment: parentComment._id };

            const [replies, total] = await Promise.all([
                Comment.find(filter)
                    .populate('user', 'username displayName avatar')
                    .sort({ createdAt: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Comment.countDocuments(filter)
            ]);

            return { replies, total };
        }, 30); // 30s TTL — same as getComments

        res.json({
            replies: data.replies,
            total: data.total,
            page,
            pages: Math.ceil(data.total / limit)
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
            return next(new AppError('Comment not found', 'COMMENT_NOT_FOUND', 404));
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403);
            return next(new AppError('Not authorized to delete this comment', 'FORBIDDEN', 403));
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

        // Invalidate admin overview cache
        delByPrefix('admin:overview');

        // Invalidate comments cache for the artwork
        const artworkId = comment.artwork;
        del(`comments:${artworkId}:`);

        // Invalidate replies cache
        if (comment.parentComment) {
            del(`replies:${comment.parentComment}:`);
        } else {
            // If it's a top-level comment being deleted, also invalidate all replies to it
            del(`replies:${comment._id}:`);
        }

        // Invalidate series detail cache if the artwork belongs to a series
        const artwork = await Artwork.findById(artworkId).select('series');
        if (artwork?.series) {
            delByPrefix(`series:detail:${artwork.series.toString()}`);
        }

        res.json({ message: 'Comment removed' });
    } catch (error) {
        next(error);
    }
};

const getAdminComments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;
        const { q, artworkId, userId, from, to } = req.query;

        const filter = {};

        if (q) {
            filter.content = { $regex: String(q).trim(), $options: 'i' };
        }
        if (artworkId) {
            filter.artwork = artworkId;
        }
        if (userId) {
            filter.user = userId;
        }

        // Date range filter
        Object.assign(filter, buildDateFilter(req.query));

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate('user', 'username displayName email avatar')
                .populate('artwork', 'title type')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments(filter),
        ]);

        res.json({
            comments,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        next(error);
    }
};

// ─── Report Comment ─────────────────────────────────────────────────────────────
const reportComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            res.status(404);
            return next(new AppError('Comment not found', 'COMMENT_NOT_FOUND', 404));
        }

        // Check existing pending report from the same user
        const existingReport = await CommentReport.findOne({
            comment: comment._id,
            reportedBy: req.user._id,
            status: 'pending',
        });
        if (existingReport) {
            res.status(400);
            return next(new Error('You have already reported this comment'));
        }

        const report = await CommentReport.create({
            comment: comment._id,
            reportedBy: req.user._id,
            reason: req.body.reason || 'other',
            description: req.body.description || '',
        });

        // Notify all admins
        const admins = await User.find({ role: 'admin' }).select('_id').limit(20);
        await Promise.all(admins.map((admin) =>
            createNotification({
                userId: admin._id,
                actorId: req.user._id,
                artworkId: comment.artwork,
                type: 'system:comment_report',
                message: `Comment reported: "${comment.content ? comment.content.substring(0, 50) : 'emoji'}"`,
                metadata: { reportId: report._id, reportType: 'comment' },
            })
        ));

        res.status(201).json({ message: 'Comment report submitted for review' });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get Reported Comments ───────────────────────────────────────────────
const getReportedComments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const status = req.query.status || '';
        const filter = status ? { status } : {};

        // Date range filter
        Object.assign(filter, buildDateFilter(req.query));

        const [reports, total] = await Promise.all([
            CommentReport.find(filter)
                .populate('comment', 'content emoji artwork user')
                .populate('reportedBy', 'username displayName')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CommentReport.countDocuments(filter),
        ]);

        // Populate nested fields for each report's comment
        const populatedReports = await CommentReport.populate(reports, [
            { path: 'comment.artwork', select: 'title type' },
            { path: 'comment.user', select: 'username displayName' },
        ]);

        res.json({
            reports: populatedReports,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Resolve Comment Report ──────────────────────────────────────────────
const resolveCommentReport = async (req, res, next) => {
    try {
        const { id: reportId } = req.params;
        const { action, note } = req.body;

        const report = await CommentReport.findById(reportId);
        if (!report) {
            res.status(404);
            return next(new Error('Report not found'));
        }

        report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        report.resolutionNote = note || '';
        await report.save();

        // If action is 'delete', remove the reported comment
        if (action === 'delete') {
            const comment = await Comment.findById(report.comment);
            if (comment) {
                await comment.deleteOne();
            }
        }

        res.json({ message: `Comment report ${report.status}`, reportId: report._id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
    getReplies,
    deleteComment,
    getAdminComments,
    reportComment,
    getReportedComments,
    resolveCommentReport,
};
