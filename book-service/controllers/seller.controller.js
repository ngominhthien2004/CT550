const SellerProfile = require('../models/SellerProfile');

const getMyProfile = async (req, res, next) => {
    try {
        const profile = await SellerProfile.findOne({ user: req.user._id })
            .populate('user', '_id username displayName avatar');

        if (!profile) {
            res.status(404);
            return next(new Error('Seller profile not found'));
        }

        res.json(profile);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { bio, payoutEmail } = req.body;

        let profile = await SellerProfile.findOne({ user: req.user._id });
        if (!profile) {
            profile = new SellerProfile({ user: req.user._id });
        }

        if (bio !== undefined) {
            profile.bio = String(bio).trim();
        }

        if (payoutEmail !== undefined) {
            profile.payoutEmail = String(payoutEmail).toLowerCase().trim();
        }

        await profile.save();

        const populatedProfile = await SellerProfile.findById(profile._id)
            .populate('user', '_id username displayName avatar');

        res.json(populatedProfile);
    } catch (error) {
        next(error);
    }
};

const becomeSeller = async (req, res, next) => {
    try {
        let profile = await SellerProfile.findOne({ user: req.user._id });

        if (!profile) {
            profile = await SellerProfile.create({ user: req.user._id });
        }

        const populatedProfile = await SellerProfile.findById(profile._id)
            .populate('user', '_id username displayName avatar');

        res.status(201).json(populatedProfile);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyProfile,
    updateProfile,
    becomeSeller
};
