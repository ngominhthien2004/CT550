const User = require('../models/User');
const Follow = require('../models/Follow');
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const { createNotification } = require('../utils/notification');

const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404);
            next(new Error('User not found'));
        }
    } catch (error) {
        next(error);
    }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.displayName = req.body.displayName || user.displayName;
            user.avatar = req.body.avatar || user.avatar;
            user.coverImage = req.body.coverImage || user.coverImage;
            user.bio = req.body.bio || user.bio;
            if (req.body.socialLinks) {
                user.socialLinks = { ...user.socialLinks, ...req.body.socialLinks };
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                displayName: updatedUser.displayName,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
            });
        } else {
            res.status(404);
            next(new Error('User not found'));
        }
    } catch (error) {
        next(error);
    }
};

const followUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const followerId = req.user._id;

        if (targetUserId === followerId.toString()) {
            res.status(400);
            return next(new Error('You cannot follow yourself'));
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            res.status(404);
            return next(new Error('User to follow not found'));
        }

        const followExists = await Follow.findOne({ follower: followerId, following: targetUserId });
        if (followExists) {
            res.status(400);
            return next(new Error('You are already following this user'));
        }

        await Follow.create({ follower: followerId, following: targetUserId });

        await createNotification({
            userId: targetUserId,
            actorId: followerId,
            type: 'follow',
            message: `${req.user.username || req.user.displayName || 'Someone'} followed you.`
        });

        res.status(201).json({ message: 'User followed successfully' });
    } catch (error) {
        next(error);
    }
};

const unfollowUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const followerId = req.user._id;

        const followRecord = await Follow.findOneAndDelete({ follower: followerId, following: targetUserId });
        if (followRecord) {
            res.json({ message: 'User unfollowed successfully' });
        } else {
            res.status(400);
            next(new Error('You are not following this user'));
        }
    } catch (error) {
        next(error);
    }
};

const getFollowers = async (req, res, next) => {
    try {
        const follows = await Follow.find({ following: req.params.id }).populate('follower', 'username displayName avatar');
        res.json(follows);
    } catch (error) {
        next(error);
    }
};

const getFollowing = async (req, res, next) => {
    try {
        const follows = await Follow.find({ follower: req.params.id }).populate('following', 'username displayName avatar');
        res.json(follows);
    } catch (error) {
        next(error);
    }
};

const getFollowStatus = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;

        if (!req.user) {
            return res.json({ isFollowing: false });
        }

        const followRecord = await Follow.findOne({
            follower: req.user._id,
            following: targetUserId
        });

        res.json({
            isFollowing: Boolean(followRecord)
        });
    } catch (error) {
        next(error);
    }
};

const getAdminOverview = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            totalPremium,
            totalArtworks,
            totalComments,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isPremium: true }),
            Artwork.countDocuments(),
            Comment.countDocuments(),
        ]);

        res.json({
            totalUsers,
            totalAdmins,
            totalPremium,
            totalArtworks,
            totalComments,
        });
    } catch (error) {
        next(error);
    }
};

const getAdminUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;
        const { q, role } = req.query;

        const filter = {};
        if (role && ['user', 'admin'].includes(role)) {
            filter.role = role;
        }

        if (q && q.trim()) {
            const keyword = q.trim();
            filter.$or = [
                { username: { $regex: keyword, $options: 'i' } },
                { displayName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('username displayName email role isPremium createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            users,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        next(error);
    }
};

const updateAdminUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        if (typeof req.body.role === 'string') {
            if (!['user', 'admin'].includes(req.body.role)) {
                res.status(400);
                return next(new Error('Invalid role value'));
            }
            user.role = req.body.role;
        }

        if (typeof req.body.isPremium === 'boolean') {
            user.isPremium = req.body.isPremium;
        }

        const updated = await user.save();

        res.json({
            _id: updated._id,
            username: updated.username,
            displayName: updated.displayName,
            email: updated.email,
            role: updated.role,
            isPremium: updated.isPremium,
            createdAt: updated.createdAt,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    getAdminOverview,
    getAdminUsers,
    updateAdminUser,
};
