const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getGoogleClientId, getGoogleClientSecret, getJwtSecret, getFrontendUrl } = require('./env');

const generateToken = (id) => {
    return jwt.sign({ id }, getJwtSecret(), {
        expiresIn: '30d',
    });
};

const googleClientId = getGoogleClientId();
const googleClientSecret = getGoogleClientSecret();
const hasGoogleCredentials = Boolean(googleClientId && googleClientSecret);

if (hasGoogleCredentials) {
    const frontendUrl = getFrontendUrl();
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL
        || `${frontendUrl}/api/auth/google/callback`
        || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;

    passport.use(new GoogleStrategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: callbackUrl,
        proxy: true,
    },
async (accessToken, refreshToken, profile, done) => {
    try {
        const { id: googleId, displayName, emails, photos, username: googleUsername } = profile;
        const email = emails && emails[0] ? emails[0].value : null;
        const avatar = photos && photos[0] ? photos[0].value : '';

        // Try to find existing user by googleId
        let user = await User.findOne({ googleId });

        if (user) {
            // Existing Google user — update avatar/displayName if changed
            if (avatar) user.avatar = avatar;
            if (displayName) user.displayName = displayName;
            await user.save();
        } else {
            // Check if email is already registered (without googleId)
            if (email) {
                user = await User.findOne({ email });
                if (user) {
                    // Link Google account to existing user
                    user.googleId = googleId;
                    if (avatar) user.avatar = avatar;
                    if (displayName) user.displayName = displayName;
                    await user.save();
                }
            }

            if (!user) {
                // Create new user from Google profile
                const baseUsername = googleUsername || (email ? email.split('@')[0] : `user${googleId.slice(-6)}`);
                // Ensure unique username
                let username = baseUsername;
                let counter = 1;
                /* eslint-disable no-await-in-loop */
                while (await User.findOne({ username })) {
                    username = `${baseUsername}${counter}`;
                    counter++;
                }
                /* eslint-enable no-await-in-loop */

                user = await User.create({
                    googleId,
                    email: email || `${googleId}@google-oauth.local`,
                    username,
                    displayName: displayName || username,
                    avatar,
                });
            }
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Return user data matching the existing API response format
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token,
        };

        return done(null, userData);
    } catch (error) {
        return done(error, null);
    }
}));
}

// No serialize/deserialize needed — we use JWT, not sessions

module.exports = passport;
