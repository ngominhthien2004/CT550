const UserBlock = require('../models/UserBlock');

/**
 * Middleware that checks if a block relationship exists between the current user
 * and a target user. Rejects the request if either direction is blocked.
 *
 * @param {Object} options
 * @param {string} [options.paramName] - Name of the route param containing target user ID (e.g., 'id')
 * @param {string} [options.bodyField] - Name of the request body field containing target user ID (e.g., 'recipientId')
 * @param {boolean} [options.bidirectional] - If true, check both directions (default: true)
 */
const checkBlocked = (options = {}) => {
    return async (req, res, next) => {
        try {
            let targetId;

            if (options.paramName) {
                targetId = req.params[options.paramName];
            } else if (options.bodyField) {
                targetId = req.body[options.bodyField];
            }

            if (!targetId || targetId === req.user._id.toString()) {
                return next();
            }

            const checks = [];
            const bidirectional = options.bidirectional !== false;

            // Check if target has blocked current user
            checks.push(
                UserBlock.findOne({ blocker: targetId, blocked: req.user._id })
                    .then((block) => block ? 'blockedByTarget' : null)
            );

            // Check if current user has blocked target
            if (bidirectional) {
                checks.push(
                    UserBlock.findOne({ blocker: req.user._id, blocked: targetId })
                        .then((block) => block ? 'blockedByMe' : null)
                );
            }

            const [theyBlockedMe, iBlockedThem] = await Promise.all(checks);

            if (theyBlockedMe) {
                res.status(403);
                return next(new Error('You cannot perform this action: you have been blocked by this user'));
            }

            if (iBlockedThem) {
                res.status(403);
                return next(new Error('You cannot perform this action: you have blocked this user'));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if the target user (from artwork owner resolved in req) 
 * has blocked the current user or vice versa.
 * Call this AFTER the artwork has been loaded into req.artwork.
 */
const checkArtworkBlock = async (req, res, next) => {
    try {
        if (!req.artwork) return next();

        const artworkOwnerId = req.artwork.user?.toString() || req.artwork.user;
        if (!artworkOwnerId || artworkOwnerId === req.user._id.toString()) return next();

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

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { checkBlocked, checkArtworkBlock };
