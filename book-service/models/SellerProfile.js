const mongoose = require('mongoose');

const sellerProfileSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '', maxlength: 1000 },
    payoutEmail: { type: String, default: '', lowercase: true, trim: true },
    totalSales: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false }
}, {
    timestamps: true
});

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema, 'book_sellerprofiles');

module.exports = SellerProfile;
