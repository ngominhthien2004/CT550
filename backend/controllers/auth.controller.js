const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            res.status(400);
            return next(new Error('User already exists'));
        }

        const user = await User.create({ username, email, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar || '',
                displayName: user.displayName || '',
                location: user.location || '',
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            next(new Error('Invalid user data'));
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar || '',
                displayName: user.displayName || '',
                location: user.location || '',
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            next(new Error('Invalid email or password'));
        }
    } catch (error) {
        next(error);
    }
};

const googleCallback = (req, res, next) => {
    // Passport middleware (called before this) puts user data in req.user
    if (!req.user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { _id, username, email, role, token } = req.user;

    // Redirect to frontend callback URL with user data as query params
    res.redirect(
        `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&_id=${encodeURIComponent(_id)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email || '')}&role=${encodeURIComponent(role)}`
    );
};

// Deprecated — kept for backward compatibility
const oauthLogin = async (req, res, next) => {
    res.status(501);
    next(new Error('OAuth logic not implemented yet'));
};

module.exports = { registerUser, loginUser, googleCallback, oauthLogin };
