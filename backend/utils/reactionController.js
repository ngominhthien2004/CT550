const Artwork = require('../models/Artwork');
const { createNotification } = require('./notification');

/**
 * Factory that creates standardized CRUD controllers for artwork reactions (like/bookmark).
 * Eliminates ~97% duplication between bookmark and like controllers.
 *
 * @param {Object} config
 * @param {Model} config.Model - Mongoose model
 * @param {string} config.modelName - Display name e.g. 'Bookmark', 'Like'
 * @param {string} config.counterField - Field on Artwork e.g. 'bookmarkCount', 'likeCount'
 * @param {string} config.notifType - Notification type e.g. 'bookmark', 'like'
 * @param {string} config.verb - Notification verb e.g. 'bookmarked', 'liked'
 * @param {string} config.responseIs - Response key for boolean e.g. 'isBookmarked'
 * @param {string} config.responseId - Response key for ID e.g. 'bookmarkId'
 * @param {string} config.responseItems - Response key for list e.g. 'bookmarks'
 * @param {Function} [config.extraCreateFields] - (req) => object of extra fields for create operations
 * @returns {Object} { create, getMy, getStatus, toggle, delete }
 */
function createReactionController(config) {
  const {
    Model,
    modelName,
    counterField,
    notifType,
    verb,
    responseIs,
    responseId,
    responseItems,
    extraCreateFields,
    onCounterChanged
  } = config;

  const create = async (req, res, next) => {
    try {
      const { artworkId } = req.body;

      if (!artworkId) {
        res.status(400);
        return next(new Error('artworkId is required'));
      }

      const artwork = await Artwork.findById(artworkId).select('user');
      if (!artwork) {
        res.status(404);
        return next(new Error('Artwork not found'));
      }

      const docFields = { user: req.user._id, artwork: artworkId };
      if (extraCreateFields) {
        Object.assign(docFields, extraCreateFields(req));
      }

      const doc = await Model.create(docFields);

      await Artwork.findByIdAndUpdate(artworkId, { $inc: { [counterField]: 1 } });

      if (onCounterChanged) {
        await onCounterChanged(artworkId);
      }

      await createNotification({
        userId: artwork.user,
        actorId: req.user._id,
        artworkId,
        type: notifType,
        message: `${req.user.username || req.user.displayName || 'Someone'} ${verb} your artwork.`
      });

      const populated = await Model.findById(doc._id)
        .populate('artwork', 'title images type ageRating')
        .populate('user', 'username displayName avatar');

      res.status(201).json(populated);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400);
        return next(new Error(`Artwork already ${verb}`));
      }
      next(error);
    }
  };

  const getMy = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const filter = { user: req.user._id };

      const [items, total] = await Promise.all([
        Model.find(filter)
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
        Model.countDocuments(filter)
      ]);

      res.json({
        [responseItems]: items,
        total,
        page,
        pages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  };

  const getStatus = async (req, res, next) => {
    try {
      const { artworkId } = req.params;

      const doc = await Model.findOne({
        user: req.user._id,
        artwork: artworkId
      });

      res.json({
        [responseIs]: !!doc,
        [responseId]: doc ? doc._id.toString() : null
      });
    } catch (error) {
      next(error);
    }
  };

  const toggle = async (req, res, next) => {
    try {
      const { artworkId } = req.body;

      if (!artworkId) {
        res.status(400);
        return next(new Error('artworkId is required'));
      }

      const existing = await Model.findOne({
        user: req.user._id,
        artwork: artworkId
      });

      if (existing) {
        await existing.deleteOne();
        await Artwork.findByIdAndUpdate(existing.artwork, { $inc: { [counterField]: -1 } });

        if (onCounterChanged) {
          await onCounterChanged(existing.artwork.toString());
        }

        return res.json({
          [responseIs]: false,
          [responseId]: null,
          message: `${modelName} removed`
        });
      }

      const artwork = await Artwork.findById(artworkId).select('user');
      if (!artwork) {
        res.status(404);
        return next(new Error('Artwork not found'));
      }

      const docFields = { user: req.user._id, artwork: artworkId };
      if (extraCreateFields) {
        Object.assign(docFields, extraCreateFields(req));
      }

      const doc = await Model.create(docFields);

      await Artwork.findByIdAndUpdate(artworkId, { $inc: { [counterField]: 1 } });

      if (onCounterChanged) {
        await onCounterChanged(artworkId);
      }

      await createNotification({
        userId: artwork.user,
        actorId: req.user._id,
        artworkId,
        type: notifType,
        message: `${req.user.username || req.user.displayName || 'Someone'} ${verb} your artwork.`
      });

      return res.status(201).json({
        [responseIs]: true,
        [responseId]: doc._id.toString(),
        message: `Artwork ${verb}`
      });
    } catch (error) {
      if (error.code === 11000) {
        const existing = await Model.findOne({
          user: req.user._id,
          artwork: req.body.artworkId
        });

        return res.json({
          [responseIs]: true,
          [responseId]: existing ? existing._id.toString() : null,
          message: `Artwork already ${verb}`
        });
      }

      next(error);
    }
  };

  const del = async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);

      if (!doc) {
        res.status(404);
        return next(new Error(`${modelName} not found`));
      }

      const isOwner = doc.user.toString() === req.user._id.toString();
      if (!isOwner && req.user.role !== 'admin') {
        res.status(403);
        return next(new Error(`Not authorized to delete this ${modelName.toLowerCase()}`));
      }

      await doc.deleteOne();
      await Artwork.findByIdAndUpdate(doc.artwork, {
        $inc: { [counterField]: -1 }
      });

      if (onCounterChanged) {
        await onCounterChanged(doc.artwork.toString());
      }

      res.json({ message: `${modelName} removed` });
    } catch (error) {
      next(error);
    }
  };

  return { create, getMy, getStatus, toggle, delete: del };
}

module.exports = { createReactionController };
