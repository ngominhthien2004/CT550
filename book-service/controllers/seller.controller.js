const SellerProfile = require('../models/SellerProfile');
const Order = require('../models/Order');

const PAID_STATUSES = ['paid', 'fulfilled'];

const getDateRange = (period) => {
    const now = new Date();
    let currentStart;
    let previousStart;

    switch (period) {
        case '7d':
            currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            previousStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
        default:
            currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
        startDate: currentStart,
        previousStartDate: previousStart,
        endDate: now,
    };
};

const toDateKey = (date) => date.toISOString().split('T')[0];

const fillMissingDays = (startDate, endDate, revenueMap) => {
    const filled = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        const key = toDateKey(current);
        filled.push({ date: key, revenue: revenueMap.get(key) || 0 });
        current.setDate(current.getDate() + 1);
    }
    return filled;
};

// Convert an ISO week key like "2026-W31" into the Monday date "YYYY-MM-DD"
// of that week (readable, chronological chart label).
const isoWeekKeyToMonday = (isoWeekKey) => {
    const match = String(isoWeekKey).match(/^(\d{4})-W(\d{1,2})$/);
    if (!match) return String(isoWeekKey);
    const year = Number(match[1]);
    const week = Number(match[2]);
    // Jan 4 is always in ISO week 1; find that week's Monday, then add weeks.
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay(); // 0=Sun .. 6=Sat
    const weekOneMonday = new Date(Date.UTC(year, 0, 4 - ((jan4Day + 6) % 7)));
    const monday = new Date(weekOneMonday);
    monday.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);
    return toDateKey(monday);
};

const parseBucketDate = (label, groupBy) => {
    if (groupBy === 'month') {
        return new Date(`${label}-01T00:00:00.000Z`);
    }
    return new Date(`${label}T00:00:00.000Z`);
};

// Inclusive end date of a trend bucket. Week labels are Monday dates, so the
// end is the following Sunday; month labels are "YYYY-MM", so the end is the
// first day of the next month. Day buckets end on their own day.
const getBucketEndDate = (label, groupBy) => {
    if (groupBy === 'week') {
        return new Date(parseBucketDate(label, groupBy).getTime() + 6 * 24 * 60 * 60 * 1000);
    }
    if (groupBy === 'month') {
        const [year, month] = label.split('-').map(Number);
        return new Date(Date.UTC(year, month, 1));
    }
    return parseBucketDate(label, groupBy);
};

const getSellerDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const validPeriods = ['7d', '30d', '90d'];
        const validGroupBys = ['day', 'week', 'month'];
        const period = validPeriods.includes(req.query.period) ? req.query.period : '30d';
        const groupBy = validGroupBys.includes(req.query.groupBy) ? req.query.groupBy : 'day';
        const range = getDateRange(period);

        // ── Summary (all-time, not period-limited) ──
        const allOrders = await Order.find({ 'items.seller': userId });
        let totalRevenue = 0;
        let totalSales = 0;
        let paidOrders = 0;

        for (const order of allOrders) {
            const isPaid = PAID_STATUSES.includes(order.status);
            if (isPaid) {
                paidOrders += 1;
            }
            for (const item of order.items) {
                if (String(item.seller) === String(userId)) {
                    if (isPaid) {
                        totalRevenue += item.price * item.quantity;
                        totalSales += item.quantity;
                    }
                }
            }
        }

        const totalOrders = allOrders.length;
        const conversionRate = totalOrders === 0
            ? 0
            : Math.round((paidOrders / totalOrders) * 1000) / 10;

        // ── Revenue trend (period-limited) ──
        const bucketFormats = {
            day: '%Y-%m-%d',
            week: '%G-W%V',
            month: '%Y-%m',
        };
        const trendAgg = await Order.aggregate([
            {
                $match: {
                    'items.seller': userId,
                    status: { $in: PAID_STATUSES },
                    createdAt: { $gte: range.previousStartDate, $lte: range.endDate },
                },
            },
            { $unwind: '$items' },
            { $match: { 'items.seller': userId } },
            {
                $group: {
                    _id: { $dateToString: { format: bucketFormats[groupBy], date: '$createdAt' } },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const trendMap = new Map(trendAgg.map((row) => [String(row._id), row.revenue]));

        let labels = [];
        let values = [];
        if (groupBy === 'day') {
            const filled = fillMissingDays(range.previousStartDate, range.endDate, trendMap);
            labels = filled.map((entry) => entry.date);
            values = filled.map((entry) => entry.revenue);
        } else {
            // Week/month: only include buckets that exist, sorted ascending.
            labels = trendAgg.map((row) => (groupBy === 'week' ? isoWeekKeyToMonday(row._id) : String(row._id)));
            values = trendAgg.map((row) => row.revenue);
        }

        let currentTotal = 0;
        let previousTotal = 0;
        for (let i = 0; i < labels.length; i += 1) {
            const bucketEndDate = getBucketEndDate(labels[i], groupBy);
            if (bucketEndDate < range.startDate) {
                previousTotal += values[i];
            } else {
                currentTotal += values[i];
            }
        }
        const changePercent = previousTotal === 0
            ? (currentTotal > 0 ? 100 : 0)
            : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);

        // ── Best selling (top 5, all-time) ──
        const bestSelling = await Order.aggregate([
            { $match: { 'items.seller': userId, status: { $in: PAID_STATUSES } } },
            { $unwind: '$items' },
            { $match: { 'items.seller': userId } },
            {
                $group: {
                    _id: '$items.book',
                    title: { $first: '$items.title' },
                    coverImage: { $first: '$items.coverImage' },
                    soldCount: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
        ]);

        res.json({
            success: true,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalSales,
                totalOrders,
                paidOrders,
                conversionRate,
            },
            revenueTrend: {
                labels,
                values,
                currentTotal: Math.round(currentTotal * 100) / 100,
                previousTotal: Math.round(previousTotal * 100) / 100,
                changePercent,
            },
            bestSelling,
        });
    } catch (error) {
        next(error);
    }
};

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

const getPublicSellerProfile = async (req, res, next) => {
    try {
        const profile = await SellerProfile.findOne({ user: req.params.sellerId })
            .populate('user', '_id username displayName avatar');

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        res.json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyProfile,
    updateProfile,
    becomeSeller,
    getPublicSellerProfile,
    getSellerDashboardStats
};
