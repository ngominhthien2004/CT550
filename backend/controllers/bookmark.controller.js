const Bookmark = require('../models/Bookmark');
const Artwork = require('../models/Artwork');

const createBookmark = async (req, res, next) => {
    try {
        const { artworkId, folder } = req.body;

        if (!artworkId) {
            res.status(400);
            return next(new Error('artworkId is required'));
        }

        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        const bookmark = await Bookmark.create({
            user: req.user._id,
            artwork: artworkId,
            folder: folder || 'default'
        });

        artwork.bookmarkCount += 1;
        await artwork.save();

        const populated = await Bookmark.findById(bookmark._id)
            .populate('artwork', 'title images type ageRating')
            .populate('user', 'username displayName avatar');

        res.status(201).json(populated);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('Artwork already bookmarked'));
        }
        next(error);
    }
};

const getMyBookmarks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { user: req.user._id };

        const [bookmarks, total] = await Promise.all([
            Bookmark.find(filter)
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
            Bookmark.countDocuments(filter)
        ]);

        res.json({
            bookmarks,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const deleteBookmark = async (req, res, next) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            res.status(404);
            return next(new Error('Bookmark not found'));
        }

        const isOwner = bookmark.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to delete this bookmark'));
        }

        await bookmark.deleteOne();
        await Artwork.findByIdAndUpdate(bookmark.artwork, {
            $inc: { bookmarkCount: -1 }
        });

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBookmark,
    getMyBookmarks,
    deleteBookmark
};
