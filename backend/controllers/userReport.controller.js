const User = require('../models/User');
const UserReport = require('../models/UserReport');
const CommentReport = require('../models/CommentReport');
const ArtworkReport = require('../models/ArtworkReport');
const { createNotification } = require('../utils/notification');

// ─── Report User ────────────────────────────────────────────────────────────────
const reportUser = async (req, res, next) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            res.status(404);
            return next(new Error('User not found'));
        }

        // Cannot report yourself
        if (targetUser._id.toString() === req.user._id.toString()) {
            res.status(400);
            return next(new Error('You cannot report yourself'));
        }

        // Check existing pending report from the same user
        const existingReport = await UserReport.findOne({
            reportedUser: targetUser._id,
            reportedBy: req.user._id,
            status: 'pending',
        });
        if (existingReport) {
            res.status(400);
            return next(new Error('You have already reported this user'));
        }

        const report = await UserReport.create({
            reportedUser: targetUser._id,
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
                type: 'system:user_report',
                message: `User reported: ${targetUser.username}`,
                metadata: { reportId: report._id, reportType: 'user' },
            })
        ));

        res.status(201).json({ message: 'User report submitted for review' });
    } catch (error) {
        next(error);
    }
};

// ─── Get My Reports ─────────────────────────────────────────────────────────────
const getMyReports = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const userId = req.user._id;

        const [commentReports, userReports, artworkReports] = await Promise.all([
            CommentReport.find({ reportedBy: userId })
                .populate('comment', 'content emoji artwork')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .lean(),
            UserReport.find({ reportedBy: userId })
                .populate('reportedUser', 'username displayName')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .lean(),
            ArtworkReport.find({ reportedBy: userId })
                .populate('artwork', 'title type images')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        // Normalize with targetType field
        const normalizedComment = commentReports.map((r) => ({ ...r, targetType: 'comment' }));
        const normalizedUser = userReports.map((r) => ({ ...r, targetType: 'user' }));
        const normalizedArtwork = artworkReports.map((r) => ({ ...r, targetType: 'artwork' }));

        const all = [...normalizedComment, ...normalizedUser, ...normalizedArtwork];
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total = all.length;
        const paginated = all.slice(skip, skip + limit);

        res.json({
            reports: paginated,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get User Reports ────────────────────────────────────────────────────
const getAdminUserReports = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const status = req.query.status || '';
        const filter = status ? { status } : {};

        const [reports, total] = await Promise.all([
            UserReport.find(filter)
                .populate('reportedUser', 'username displayName email')
                .populate('reportedBy', 'username displayName')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserReport.countDocuments(filter),
        ]);

        res.json({
            reports,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Resolve User Report ─────────────────────────────────────────────────
const resolveUserReport = async (req, res, next) => {
    try {
        const { id: reportId } = req.params;
        const { action, note } = req.body;

        const report = await UserReport.findById(reportId);
        if (!report) {
            res.status(404);
            return next(new Error('Report not found'));
        }

        report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();

        if (action === 'warn') {
            report.resolutionNote = note
                ? `WARNING: ${note}`
                : 'WARNING: User reported for violating platform guidelines';

            // Send warning notification to the reported user
            await createNotification({
                userId: report.reportedUser,
                actorId: req.user._id,
                type: 'warning',
                message: note || 'Your account has been flagged for violating platform guidelines. Please review our community rules.',
            });
        } else {
            report.resolutionNote = note || '';
        }

        // If action is 'ban', suspend the reported user and notify them
        if (action === 'ban') {
            await User.findByIdAndUpdate(report.reportedUser, { isSuspended: true });
            await createNotification({
                userId: report.reportedUser,
                actorId: req.user._id,
                type: 'suspended',
                message: note || 'Your account has been suspended due to a violation of our terms of service.',
            });
        }

        await report.save();

        res.json({ message: `User report ${report.status}`, reportId: report._id });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get Moderation Case Detail ──────────────────────────────────────────
const getModerationCaseDetail = async (req, res, next) => {
    try {
        const { type, id } = req.query;

        if (!type || !id) {
            res.status(400);
            return next(new Error('type and id query parameters are required'));
        }

        let report = null;

        if (type === 'artwork') {
            report = await ArtworkReport.findById(id)
                .populate('artwork')
                .populate('reportedBy', 'username displayName email')
                .populate('resolvedBy', 'username displayName')
                .lean();
            if (report && report.artwork) {
                report.targetCurrentStatus = report.artwork.isHidden ? 'hidden' : 'visible';
            }
        } else if (type === 'comment') {
            report = await CommentReport.findById(id)
                .populate({
                    path: 'comment',
                    populate: [
                        { path: 'artwork', select: 'title type' },
                        { path: 'user', select: 'username displayName' },
                        { path: 'parentComment', select: 'content user' },
                    ],
                })
                .populate('reportedBy', 'username displayName email')
                .populate('resolvedBy', 'username displayName')
                .lean();
        } else if (type === 'user') {
            report = await UserReport.findById(id)
                .populate('reportedUser', 'username displayName email isSuspended')
                .populate('reportedBy', 'username displayName email')
                .populate('resolvedBy', 'username displayName')
                .lean();

            // Attach report count for the reported user
            if (report && report.reportedUser) {
                const reportCount = await UserReport.countDocuments({
                    reportedUser: report.reportedUser._id,
                });
                report.targetReportCount = reportCount;
            }
        } else {
            res.status(400);
            return next(new Error('Invalid type. Must be artwork, comment, or user'));
        }

        if (!report) {
            res.status(404);
            return next(new Error('Report not found'));
        }

        res.json({ report });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    reportUser,
    getMyReports,
    getAdminUserReports,
    resolveUserReport,
    getModerationCaseDetail,
};
