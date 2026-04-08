const Like = require('../models/Like');
const Artwork = require('../models/Artwork');
const { createNotification } = require('../utils/notification');

const createLike = async (req, res, next) => {
    try {
        const { artworkId } = req.body;

        if (!artworkId) {
            res.status(400);
            return next(new Error('artworkId is required'));
        }

        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        const like = await Like.create({
            user: req.user._id,
            artwork: artworkId
        });

        artwork.likeCount += 1;
        await artwork.save();

        await createNotification({
            userId: artwork.user,
            actorId: req.user._id,
            artworkId,
            type: 'like',
            message: `${req.user.username || req.user.displayName || 'Someone'} liked your artwork.`
        });

        const populated = await Like.findById(like._id)
            .populate('artwork', 'title images type ageRating')
            .populate('user', 'username displayName avatar');

        res.status(201).json(populated);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('Artwork already liked'));
        }
        next(error);
    }
};

const getMyLikes = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { user: req.user._id };

        const [likes, total] = await Promise.all([
            Like.find(filter)
                .populate({
                    path: 'artwork',
                    populate: [
                        { path: 'user', select: 'username displayName avatar' },
                        { path: 'tags', select: 'name' }
                    ]
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Like.countDocuments(filter)
        ]);

        res.json({
            likes,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const getLikeStatus = async (req, res, next) => {
    try {
        const { artworkId } = req.params;

        const like = await Like.findOne({
            user: req.user._id,
            artwork: artworkId
        });

        res.json({
            isLiked: !!like,
            likeId: like ? like._id.toString() : null
        });
    } catch (error) {
        next(error);
    }
};

const toggleLike = async (req, res, next) => {
    try {
        const { artworkId } = req.body;

        if (!artworkId) {
            res.status(400);
            return next(new Error('artworkId is required'));
        }

        const existing = await Like.findOne({
            user: req.user._id,
            artwork: artworkId
        });

        if (existing) {
            await existing.deleteOne();

            const artwork = await Artwork.findById(existing.artwork);
            if (artwork) {
                artwork.likeCount = Math.max(0, (artwork.likeCount || 0) - 1);
                await artwork.save();
            }

            return res.json({
                isLiked: false,
                likeId: null,
                message: 'Like removed'
            });
        }

        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        const like = await Like.create({
            user: req.user._id,
            artwork: artworkId
        });

        artwork.likeCount += 1;
        await artwork.save();

        await createNotification({
            userId: artwork.user,
            actorId: req.user._id,
            artworkId,
            type: 'like',
            message: `${req.user.username || req.user.displayName || 'Someone'} liked your artwork.`
        });

        return res.status(201).json({
            isLiked: true,
            likeId: like._id.toString(),
            message: 'Artwork liked'
        });
    } catch (error) {
        if (error.code === 11000) {
            const existing = await Like.findOne({
                user: req.user._id,
                artwork: req.body.artworkId
            });

            return res.json({
                isLiked: true,
                likeId: existing ? existing._id.toString() : null,
                message: 'Artwork already liked'
            });
        }

        next(error);
    }
};

const deleteLike = async (req, res, next) => {
    try {
        const like = await Like.findById(req.params.id);

        if (!like) {
            res.status(404);
            return next(new Error('Like not found'));
        }

        const isOwner = like.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to delete this like'));
        }

        await like.deleteOne();
        await Artwork.findByIdAndUpdate(like.artwork, {
            $inc: { likeCount: -1 }
        });

        res.json({ message: 'Like removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLike,
    getMyLikes,
    getLikeStatus,
    toggleLike,
    deleteLike
};