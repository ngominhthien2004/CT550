const User = require('../models/User');
const Follow = require('../models/Follow');
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

module.exports = { getUserProfile, updateUserProfile, followUser, unfollowUser, getFollowers, getFollowing, getFollowStatus };
