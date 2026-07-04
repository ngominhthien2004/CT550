const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.status(401);
            return next(new Error('Not authorized, user no longer exists'));
        }

        if (user.isSuspended) {
            res.status(403);
            return next(new Error('Your account has been suspended. Please contact support for more information.'));
        }

        req.user = user;
        return next();
    } catch (error) {
        res.status(401);
        return next(new Error('Not authorized, token failed'));
    }
};

const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Token invalid or expired — just continue without user
    }
    next();
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized as an admin'));
    }
};

module.exports = { protect, admin, optionalAuth };
