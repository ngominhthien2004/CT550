const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const Follow = require('../models/Follow');
const UserBlock = require('../models/UserBlock');
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
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            user.gender = req.body.gender || user.gender;
            user.location = req.body.location || user.location;
            user.website = req.body.website || user.website;
            if (req.body.birthYear) user.birthYear = parseInt(req.body.birthYear, 10);
            if (req.body.birthdayMonth) user.birthdayMonth = parseInt(req.body.birthdayMonth, 10);
            if (req.body.birthdayDay) user.birthdayDay = parseInt(req.body.birthdayDay, 10);
            user.occupation = req.body.occupation || user.occupation;
            if (req.body.socialLinks) {
                user.socialLinks = { ...user.socialLinks, ...req.body.socialLinks };
            }

            if (req.files) {
                if (req.files['avatar'] && req.files['avatar'].length > 0) {
                    const avatarFile = req.files['avatar'][0];
                    try {
                        const result = await cloudinary.uploader.upload(avatarFile.path, {
                            folder: 'illuwrl-avatars',
                            resource_type: 'image',
                        });
                        user.avatar = result.secure_url;
                    } catch (err) {
                        console.error('Cloudinary avatar upload failed:', err.message);
                        user.avatar = `/uploads/${req.user._id}/profile/${avatarFile.filename}`;
                    }
                }
                if (req.files['coverImage'] && req.files['coverImage'].length > 0) {
                    const coverFile = req.files['coverImage'][0];
                    try {
                        const result = await cloudinary.uploader.upload(coverFile.path, {
                            folder: 'illuwrl-covers',
                            resource_type: 'image',
                        });
                        user.coverImage = result.secure_url;
                    } catch (err) {
                        console.error('Cloudinary cover upload failed:', err.message);
                        user.coverImage = `/uploads/${req.user._id}/profile/${coverFile.filename}`;
                    }
                }
            } else {
                if (req.body.avatar) user.avatar = req.body.avatar;
                if (req.body.coverImage) user.coverImage = req.body.coverImage;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                displayName: updatedUser.displayName,
                avatar: updatedUser.avatar,
                coverImage: updatedUser.coverImage,
                bio: updatedUser.bio,
                gender: updatedUser.gender,
                location: updatedUser.location,
                website: updatedUser.website,
                birthYear: updatedUser.birthYear,
                birthdayMonth: updatedUser.birthdayMonth,
                birthdayDay: updatedUser.birthdayDay,
                occupation: updatedUser.occupation,
                socialLinks: updatedUser.socialLinks,
                role: updatedUser.role,
            });
        } else {
            res.status(404);
            next(new Error('User not found'));
        }
    } catch (error) {
        next(error);
    }
};

const deleteUserCover = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        user.coverImage = '';
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            displayName: updatedUser.displayName,
            avatar: updatedUser.avatar,
            coverImage: updatedUser.coverImage,
            bio: updatedUser.bio,
        });
    } catch (error) {
        next(error);
    }
};

const followUser = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const followerId = req.user._id;

        // Prevent following if blocked
        if (targetUserId !== followerId.toString()) {
            const [theyBlockedMe, iBlockedThem] = await Promise.all([
                UserBlock.findOne({ blocker: targetUserId, blocked: req.user._id }),
                UserBlock.findOne({ blocker: req.user._id, blocked: targetUserId }),
            ]);
            if (theyBlockedMe) {
                res.status(403);
                return next(new Error('Cannot follow: you have been blocked by this user'));
            }
            if (iBlockedThem) {
                res.status(403);
                return next(new Error('Cannot follow: you have blocked this user'));
            }
        }

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

const blockUser = async (req, res, next) => {
    try {
        const blockedUserId = req.params.id;
        const blockerId = req.user._id;

        if (blockedUserId === blockerId.toString()) {
            res.status(400);
            return next(new Error('You cannot block yourself'));
        }

        const blockedUser = await User.findById(blockedUserId).select('_id');
        if (!blockedUser) {
            res.status(404);
            return next(new Error('User not found'));
        }

        await UserBlock.findOneAndUpdate(
            { blocker: blockerId, blocked: blockedUserId },
            { blocker: blockerId, blocked: blockedUserId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Follow.deleteMany({
            $or: [
                { follower: blockerId, following: blockedUserId },
                { follower: blockedUserId, following: blockerId },
            ],
        });

        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        next(error);
    }
};

const unblockUser = async (req, res, next) => {
    try {
        const blockedUserId = req.params.id;
        const blockerId = req.user._id;

        const result = await UserBlock.findOneAndDelete({
            blocker: blockerId,
            blocked: blockedUserId,
        });

        if (!result) {
            res.status(404);
            return next(new Error('Block record not found'));
        }

        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        next(error);
    }
};

const getBlockedUsers = async (req, res, next) => {
    try {
        const blocks = await UserBlock.find({ blocker: req.user._id })
            .populate('blocked', 'username displayName avatar')
            .sort({ createdAt: -1 });

        res.json(blocks);
    } catch (error) {
        next(error);
    }
};

const getBlockStatus = async (req, res, next) => {
    try {
        const targetId = req.params.id;
        const userId = req.user._id;

        const iBlockThem = await UserBlock.findOne({ blocker: userId, blocked: targetId });
        const theyBlockMe = await UserBlock.findOne({ blocker: targetId, blocked: userId });

        res.json({
            blockedByMe: !!iBlockThem,
            blockedMe: !!theyBlockMe,
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
            totalArtworks,
            totalComments,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            Artwork.countDocuments(),
            Comment.countDocuments(),
        ]);

        res.json({
            totalUsers,
            totalAdmins,
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
                .select('username displayName email role createdAt')
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

// Presence handlers use an in-memory presence store for minimal footprint
const { setPresence, getPresence } = require('../utils/presence.service');

const postPresence = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        // Only allow users to set their own presence
        if (req.user._id.toString() !== targetUserId) {
            res.status(403);
            return next(new Error('Not authorized to set presence for this user'));
        }

        const typing = !!req.body.typing;
        setPresence(targetUserId, { typing });
        res.json({ message: 'Presence updated' });
    } catch (error) {
        next(error);
    }
};

const getPresenceHandler = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;

        // participant-only check could be added; keep minimal authorization
        const presence = getPresence(targetUserId);
        res.json(presence);
    } catch (error) {
        next(error);
    }
};

const searchUsers = async (req, res, next) => {
    try {
        const rawPage = parseInt(req.query.page, 10);
        const rawLimit = parseInt(req.query.limit, 10);
        const page = Number.isNaN(rawPage) ? 1 : Math.max(rawPage, 1);
        const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 50);
        const skip = (page - 1) * limit;
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

        const filter = {};
        if (q) {
            filter.$or = [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('_id username displayName avatar bio')
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
            limit,
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

        const updated = await user.save();

        res.json({
            _id: updated._id,
            username: updated.username,
            displayName: updated.displayName,
            email: updated.email,
            role: updated.role,
            createdAt: updated.createdAt,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserCover,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getBlockStatus,
    getAdminOverview,
    getAdminUsers,
    updateAdminUser,
    searchUsers,
    postPresence,
    getPresenceHandler,
};
