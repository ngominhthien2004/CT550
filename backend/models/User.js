const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const socialLinksSchema = mongoose.Schema({
    x: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
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

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 24
    },
    displayName: { type: String },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'rather_not_say'], default: 'rather_not_say' },
    location: { type: String, default: '' },
    birthYear: { type: Number, default: null },
    birthdayMonth: { type: Number, default: null },
    birthdayDay: { type: Number, default: null },
    website: { type: String, default: '' },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isSuspended: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Middleware to hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
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
