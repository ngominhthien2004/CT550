const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, googleCallback, oauthLogin } = require('../controllers/auth.controller');

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
    }),
    googleCallback
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email'],
    session: false,
}));

router.get('/facebook/callback',
    passport.authenticate('facebook', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`,
    }),
    googleCallback
);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/oauth', oauthLogin);

module.exports = router;
