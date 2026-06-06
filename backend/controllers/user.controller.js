const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const Follow = require('../models/Follow');
const IlluWrlRequest = require('../models/IlluWrlRequest');
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
                isPremium: updatedUser.isPremium,
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

const createIlluWrlRequest = async (req, res, next) => {
    try {
        const recipientId = req.params.id;
        const requesterId = req.user._id;
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

        if (recipientId === requesterId.toString()) {
            res.status(400);
            return next(new Error('You cannot send a request to yourself'));
        }

        if (message.length > 10000) {
            res.status(400);
            return next(new Error('Request message must be 10000 characters or fewer'));
        }

        const recipient = await User.findById(recipientId).select('username displayName');
        if (!recipient) {
            res.status(404);
            return next(new Error('User not found'));
        }

        const blockedRelationship = await UserBlock.findOne({
            $or: [
                { blocker: requesterId, blocked: recipientId },
                { blocker: recipientId, blocked: requesterId },
            ],
        });

        if (blockedRelationship) {
            res.status(403);
            return next(new Error('You cannot send a request to this user'));
        }

        const existingRequest = await IlluWrlRequest.findOne({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
        });

        if (existingRequest) {
            res.status(409);
            return next(new Error('A pending IlluWrl request already exists'));
        }

        const request = await IlluWrlRequest.create({
            requester: requesterId,
            recipient: recipientId,
            message,
        });

        await createNotification({
            userId: recipientId,
            actorId: requesterId,
            type: 'system',
            message: `${req.user.username || req.user.displayName || 'Someone'} sent you an IlluWrl request.`,
        });

        res.status(201).json({
            request,
            message: 'IlluWrl request sent successfully',
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

        await IlluWrlRequest.updateMany(
            {
                status: 'pending',
                $or: [
                    { requester: blockerId, recipient: blockedUserId },
                    { requester: blockedUserId, recipient: blockerId },
                ],
            },
            { status: 'cancelled' }
        );

        res.json({ message: 'User blocked successfully' });
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

const getAiSettings = async (req, res, next) => {
    try {
        const adminUser = await User.findOne({ role: 'admin' }).select('aiDetectionEnabled username email');
        if (!adminUser) {
            res.status(404);
            return next(new Error('No admin user found'));
        }
        res.json({
            aiDetectionEnabled: adminUser.aiDetectionEnabled,
            managedBy: {
                username: adminUser.username,
                email: adminUser.email,
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateAiSettings = async (req, res, next) => {
    try {
        const { aiDetectionEnabled } = req.body;
        if (typeof aiDetectionEnabled !== 'boolean') {
            res.status(400);
            return next(new Error('aiDetectionEnabled must be a boolean'));
        }

        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            res.status(404);
            return next(new Error('No admin user found'));
        }

        adminUser.aiDetectionEnabled = aiDetectionEnabled;
        await adminUser.save();

        res.json({
            message: `AI detection ${aiDetectionEnabled ? 'enabled' : 'disabled'} successfully`,
            aiDetectionEnabled: adminUser.aiDetectionEnabled,
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
    createIlluWrlRequest,
    blockUser,
    getAdminOverview,
    getAdminUsers,
    updateAdminUser,
    searchUsers,
    postPresence,
    getPresenceHandler,
    getAiSettings,
    updateAiSettings,
};
