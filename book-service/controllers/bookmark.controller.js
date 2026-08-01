const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');

const toggleBookmark = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      res.status(400);
      return next(new Error('bookId is required'));
    }

    const existing = await Bookmark.findOne({
      user: req.user._id,
      bookId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({
        isBookmarked: false,
        bookmarkId: null,
        message: 'Bookmark removed',
      });
    }

    const doc = await Bookmark.create({
      user: req.user._id,
      bookId,
    });

    return res.status(201).json({
      isBookmarked: true,
      bookmarkId: doc._id.toString(),
      message: 'Book bookmarked',
    });
  } catch (error) {
    if (error.code === 11000) {
      // Already bookmarked (race condition)
      const existing = await Bookmark.findOne({
        user: req.user._id,
        bookId: req.body.bookId,
      });
      return res.json({
        isBookmarked: true,
        bookmarkId: existing ? existing._id.toString() : null,
        message: 'Already bookmarked',
      });
    }
    next(error);
  }
};

const getBookmarkStatus = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const doc = await Bookmark.findOne({
      user: req.user._id,
      bookId,
    });
    res.json({
      isBookmarked: !!doc,
      bookmarkId: doc ? doc._id.toString() : null,
    });
  } catch (error) {
    next(error);
  }
};

// Batch status lookup. Accepts `?ids=a,b,c` (comma-separated) or repeated
// query params. Returns only the bookIds the user has bookmarked; every
// missing key is treated as not-bookmarked by the frontend.
const getBookmarkStatuses = async (req, res, next) => {
  try {
    const rawIds = req.query.ids;
    const parts = Array.isArray(rawIds)
      ? rawIds.flatMap((part) => String(part).split(','))
      : typeof rawIds === 'string'
        ? rawIds.split(',')
        : [];

    const validIds = [...new Set(
      parts
        .map((id) => id.trim())
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    )];

    if (validIds.length === 0) {
      return res.json({ statuses: {} });
    }

    const docs = await Bookmark.find({
      user: req.user._id,
      bookId: { $in: validIds },
    }).select('bookId');

    const statuses = {};
    docs.forEach((doc) => {
      statuses[doc.bookId.toString()] = true;
    });

    res.json({ statuses });
  } catch (error) {
    next(error);
  }
};

const getMyBookmarks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [items, total] = await Promise.all([
      Bookmark.find(filter)
        .populate('user', 'username displayName avatar')
        .populate({
          path: 'bookId',
          select: 'title price coverImages coverImage seller rating tags',
          populate: { path: 'seller', select: '_id username displayName' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bookmark.countDocuments(filter),
    ]);

    res.json({
      bookmarks: items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const deleteBookmark = async (req, res, next) => {
  try {
    const doc = await Bookmark.findById(req.params.id);
    if (!doc) {
      res.status(404);
      return next(new Error('Bookmark not found'));
    }

    const isOwner = doc.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to delete this bookmark'));
    }

    await doc.deleteOne();
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleBookmark,
  getBookmarkStatus,
  getBookmarkStatuses,
  getMyBookmarks,
  deleteBookmark,
};
