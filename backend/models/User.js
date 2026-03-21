const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const socialLinksSchema = mongoose.Schema({
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    portfolio: { type: String, default: '' }
}, { _id: false });

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        // Optional because of OAuth
    },
    googleId: { type: String },
    facebookId: { type: String },
    twitterId: { type: String },

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    displayName: { type: String },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
