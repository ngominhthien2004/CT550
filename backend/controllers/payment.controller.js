const CreatorBalance = require('../models/CreatorBalance');
const EscrowTransaction = require('../models/EscrowTransaction');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PaymentConfig = require('../models/PaymentConfig');
const Payout = require('../models/Payout');
const PayoutMethod = require('../models/PayoutMethod');
const Request = require('../models/Request');
const {
    DEFAULT_PLATFORM_FEE_RATE,
    calculatePaymentBreakdown,
    normalizeCurrency,
    validatePaymentIntentPayload,
    validateQrIntentPayload,
    validatePayoutRequest,
} = require('../utils/paymentValidation');
const { createNotification } = require('../utils/notification');

function makeMockProviderId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function resolvePlatformFeeRate({ campaignKey, currency, country }) {
    const now = new Date();
    const filter = {
        isActive: true,
        $and: [
            { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
            { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
        ],
    };

    if (campaignKey) {
        const campaign = await PaymentConfig.findOne({ ...filter, key: campaignKey });
        if (campaign) {
            return campaign.platformFeeRate;
        }
    }

    const regional = await PaymentConfig.findOne({
        ...filter,
        currency: normalizeCurrency(currency),
        country: String(country || '').toUpperCase(),
    });

    return regional?.platformFeeRate || DEFAULT_PLATFORM_FEE_RATE;
}

async function writeEscrowTransaction({ payment, request, actorId, walletOwner, type, amount, metadata = {} }) {
    return EscrowTransaction.create({
        payment: payment._id,
        request: request?._id,
        actor: actorId,
        walletOwner,
        type,
        amount,
        currency: payment.currency,
        metadata,
    });
}

async function issueInvoice(payment, request) {
    const existing = await Invoice.findOne({ payment: payment._id });
    if (existing) {
        return existing;
    }

    return Invoice.create({
        payment: payment._id,
        request: request?._id,
        requester: payment.requester,
        creator: payment.creator,
        invoiceNumber: `INV-${Date.now()}-${payment._id.toString().slice(-6).toUpperCase()}`,
        currency: payment.currency,
        subtotalAmount: payment.amount,
        taxAmount: payment.feeBreakdown.taxAmount || 0,
        platformFeeAmount: payment.feeBreakdown.platformFeeAmount || 0,
        totalAmount: payment.amount,
        lines: [
            { label: 'Request payment', amount: payment.amount },
            { label: 'Platform fee', amount: payment.feeBreakdown.platformFeeAmount || 0 },
        ],
    });
}

async function addCreatorAvailableBalance(payment) {
    const balance = await CreatorBalance.findOneAndUpdate(
        { creator: payment.creator, currency: payment.currency },
        {
            $inc: {
                availableAmount: payment.feeBreakdown.creatorNetAmount,
                lifetimeEarnedAmount: payment.feeBreakdown.creatorNetAmount,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return balance;
}

function buildMockVietQrPayload({ bankCode, bankAccount, accountName, amount, transferContent }) {
    const encodedAccountName = encodeURIComponent(accountName);
    const encodedContent = encodeURIComponent(transferContent);

    return {
        bankCode,
        bankAccount,
        accountName,
        transferContent,
        qrImageUrl: `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedAccountName}`,
        deeplink: `vietqr://pay?bank=${bankCode}&account=${bankAccount}&amount=${amount}&content=${encodedContent}`,
    };
}

const createPaymentIntent = async (req, res, next) => {
    try {
        const request = await Request.findById(req.body.requestId).populate('term');
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (request.requester.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the requester can pay for this request'));
        }

        const currency = normalizeCurrency(req.body.currency || request.currency);
        const amount = Number(req.body.amount || request.proposedAmount);
        const gateway = String(req.body.gateway || 'stripe').toLowerCase();
        const targetPrice = request.term?.targetPrice || request.proposedAmount;
        const validation = validatePaymentIntentPayload({ amount, targetPrice, gateway, currency });
        if (!validation.valid) {
            res.status(400);
            return next(new Error(validation.errors.join(' ')));
        }

        const platformFeeRate = await resolvePlatformFeeRate({
            campaignKey: req.body.campaignKey,
            currency,
            country: req.body.country,
        });
        const breakdown = calculatePaymentBreakdown({ amount, platformFeeRate, currency });

        const payment = await Payment.create({
            request: request._id,
            requester: request.requester,
            creator: request.creator,
            amount: breakdown.amount,
            currency: breakdown.currency,
            gateway,
            status: 'requires_action',
            providerPaymentIntentId: makeMockProviderId(gateway === 'stripe' ? 'pi' : 'pay'),
            clientSecret: makeMockProviderId('secret'),
            idempotencyKey: req.headers['idempotency-key'] || req.body.idempotencyKey || '',
            paymentMethodLabel: req.body.paymentMethodLabel || gateway,
            feeBreakdown: breakdown,
            fx: {
                sourceCurrency: currency,
                settlementCurrency: normalizeCurrency(req.body.settlementCurrency || currency),
                rate: Number(req.body.fxRate || 1),
                provider: req.body.fxProvider || 'internal',
                quotedAt: new Date(),
            },
        });

        request.payment = payment._id;
        request.paymentStatus = 'requires_action';
        request.escrow.platformFeeRate = breakdown.platformFeeRate;
        request.escrow.platformFeeAmount = breakdown.platformFeeAmount;
        request.escrow.creatorPayoutAmount = breakdown.creatorNetAmount;
        await request.save();

        res.status(201).json({
            payment,
            checkout: {
                clientSecret: payment.clientSecret,
                providerPaymentIntentId: payment.providerPaymentIntentId,
                gateway: payment.gateway,
                requires3DSecure: payment.gateway === 'stripe',
            },
            breakdown,
        });
    } catch (error) {
        next(error);
    }
};

const createQrPaymentIntent = async (req, res, next) => {
    try {
        const request = await Request.findById(req.body.requestId).populate('term');
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (request.requester.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Only the requester can create QR payment for this request'));
        }

        const currency = normalizeCurrency(req.body.currency || request.currency || 'VND');
        const amount = Number(req.body.amount || request.proposedAmount);
        const targetPrice = request.term?.targetPrice || request.proposedAmount;
        const bankCode = req.body.bankCode || 'VCB';
        const bankAccount = req.body.bankAccount || process.env.QR_ESCROW_BANK_ACCOUNT || '0000000000';
        const accountName = req.body.accountName || process.env.QR_ESCROW_ACCOUNT_NAME || 'ILLUWRL ESCROW';
        const transferContent = req.body.transferContent || `REQ-${request._id.toString().slice(-8).toUpperCase()}`;
        const expiresInMinutes = Number(req.body.expiresInMinutes ?? 15);

        const paymentValidation = validatePaymentIntentPayload({
            amount,
            targetPrice,
            gateway: 'bank_qr',
            currency,
        });
        const qrValidation = validateQrIntentPayload({
            bankCode,
            bankAccount,
            accountName,
            transferContent,
            expiresInMinutes,
        });
        const errors = [...paymentValidation.errors, ...qrValidation.errors];
        if (errors.length) {
            res.status(400);
            return next(new Error(errors.join(' ')));
        }

        const platformFeeRate = await resolvePlatformFeeRate({
            campaignKey: req.body.campaignKey,
            currency,
            country: req.body.country || 'VN',
        });
        const breakdown = calculatePaymentBreakdown({ amount, platformFeeRate, currency });
        const qr = buildMockVietQrPayload({
            bankCode,
            bankAccount,
            accountName,
            amount: breakdown.amount,
            transferContent,
        });

        const payment = await Payment.create({
            request: request._id,
            requester: request.requester,
            creator: request.creator,
            amount: breakdown.amount,
            currency: breakdown.currency,
            gateway: 'bank_qr',
            status: 'requires_action',
            providerPaymentIntentId: makeMockProviderId('qr'),
            idempotencyKey: req.headers['idempotency-key'] || req.body.idempotencyKey || '',
            paymentMethodLabel: 'Bank QR',
            feeBreakdown: breakdown,
            fx: {
                sourceCurrency: currency,
                settlementCurrency: normalizeCurrency(req.body.settlementCurrency || currency),
                rate: Number(req.body.fxRate || 1),
                provider: req.body.fxProvider || 'internal',
                quotedAt: new Date(),
            },
        });

        request.payment = payment._id;
        request.paymentStatus = 'requires_action';
        request.escrow.platformFeeRate = breakdown.platformFeeRate;
        request.escrow.platformFeeAmount = breakdown.platformFeeAmount;
        request.escrow.creatorPayoutAmount = breakdown.creatorNetAmount;
        await request.save();

        res.status(201).json({
            payment,
            qr: {
                ...qr,
                expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
                instructions: 'Scan the QR, transfer the exact amount, then use simulate confirm in dev/test.',
            },
            breakdown,
        });
    } catch (error) {
        next(error);
    }
};

const simulateBankQrConfirmation = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            res.status(404);
            return next(new Error('Payment not found'));
        }

        const isRequester = payment.requester.toString() === req.user._id.toString();
        if (!isRequester && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Only requester or admin can simulate QR confirmation'));
        }

        if (payment.gateway !== 'bank_qr') {
            res.status(400);
            return next(new Error('Only bank QR payments can use this test confirmation'));
        }

        if (payment.status !== 'requires_action') {
            res.status(400);
            return next(new Error('Only pending QR payments can be confirmed'));
        }

        const request = payment.request ? await Request.findById(payment.request) : null;
        payment.status = 'held';
        payment.paidAt = new Date();
        payment.providerChargeId = req.body.bankTransactionId || makeMockProviderId('bank_txn');
        await payment.save();

        if (request) {
            request.paymentStatus = 'held';
            request.escrow.status = 'held';
            request.escrow.platformFeeRate = payment.feeBreakdown.platformFeeRate;
            request.escrow.platformFeeAmount = payment.feeBreakdown.platformFeeAmount;
            request.escrow.creatorPayoutAmount = payment.feeBreakdown.creatorNetAmount;
            await request.save();
        }

        await writeEscrowTransaction({
            payment,
            request,
            actorId: req.user._id,
            walletOwner: payment.creator,
            type: 'hold',
            amount: payment.amount,
            metadata: {
                source: 'mock_bank_qr_confirmation',
                bankTransactionId: payment.providerChargeId,
            },
        });
        await issueInvoice(payment, request);
        await createNotification({
            userId: payment.creator,
            actorId: payment.requester,
            type: 'request',
            message: `QR payment confirmed and held in escrow: ${payment.amount} ${payment.currency}.`,
        });

        res.json({ payment, request });
    } catch (error) {
        next(error);
    }
};

const handlePaymentWebhook = async (req, res, next) => {
    try {
        const eventType = req.body.type || req.body.eventType;
        const providerPaymentIntentId = req.body.providerPaymentIntentId || req.body.data?.object?.id;
        const paymentId = req.body.paymentId;

        const payment = paymentId
            ? await Payment.findById(paymentId)
            : await Payment.findOne({ providerPaymentIntentId });

        if (!payment) {
            res.status(404);
            return next(new Error('Payment not found'));
        }

        const request = payment.request ? await Request.findById(payment.request) : null;

        if (eventType === 'payment.succeeded') {
            payment.status = 'held';
            payment.paidAt = new Date();
            await payment.save();

            if (request) {
                request.payment = payment._id;
                request.paymentStatus = 'held';
                request.escrow.status = 'held';
                request.escrow.platformFeeRate = payment.feeBreakdown.platformFeeRate;
                request.escrow.platformFeeAmount = payment.feeBreakdown.platformFeeAmount;
                request.escrow.creatorPayoutAmount = payment.feeBreakdown.creatorNetAmount;
                await request.save();
            }

            await writeEscrowTransaction({
                payment,
                request,
                actorId: payment.requester,
                walletOwner: payment.creator,
                type: 'hold',
                amount: payment.amount,
                metadata: { eventType },
            });
            await issueInvoice(payment, request);
        } else if (eventType === 'payment.failed') {
            payment.status = 'failed';
            payment.failureReason = req.body.failureReason || 'Gateway reported payment failure';
            await payment.save();
            if (request) {
                request.paymentStatus = 'failed';
                await request.save();
            }
        } else if (eventType === 'charge.refunded') {
            payment.status = 'refunded';
            payment.refundedAt = new Date();
            await payment.save();
            if (request) {
                request.paymentStatus = 'refunded';
                request.escrow.status = 'refunded';
                request.escrow.refundedAt = new Date();
                await request.save();
            }
            await writeEscrowTransaction({
                payment,
                request,
                actorId: null,
                walletOwner: payment.requester,
                type: 'refund',
                amount: payment.amount,
                metadata: { eventType },
            });
        }

        res.json({ received: true, eventType, paymentStatus: payment.status });
    } catch (error) {
        next(error);
    }
};

const releaseEscrow = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            res.status(404);
            return next(new Error('Payment not found'));
        }

        const request = payment.request ? await Request.findById(payment.request) : null;
        const isCreator = payment.creator.toString() === req.user._id.toString();
        if (!isCreator && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Only creator or admin can release escrow'));
        }

        if (payment.status !== 'held') {
            res.status(400);
            return next(new Error('Only held payments can be released'));
        }

        payment.status = 'released';
        payment.releasedAt = new Date();
        await payment.save();

        if (request) {
            request.paymentStatus = 'released';
            request.escrow.status = 'released';
            request.escrow.releasedAt = new Date();
            await request.save();
        }

        const balance = await addCreatorAvailableBalance(payment);
        await writeEscrowTransaction({
            payment,
            request,
            actorId: req.user._id,
            walletOwner: payment.creator,
            type: 'release',
            amount: payment.feeBreakdown.creatorNetAmount,
            metadata: { balanceId: balance._id },
        });
        await writeEscrowTransaction({
            payment,
            request,
            actorId: req.user._id,
            walletOwner: null,
            type: 'platform_fee',
            amount: payment.feeBreakdown.platformFeeAmount,
        });

        await createNotification({
            userId: payment.creator,
            actorId: req.user._id,
            type: 'request',
            message: `Escrow released: ${payment.feeBreakdown.creatorNetAmount} ${payment.currency}.`,
        });

        res.json({ payment, balance });
    } catch (error) {
        next(error);
    }
};

const refundPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            res.status(404);
            return next(new Error('Payment not found'));
        }

        const request = payment.request ? await Request.findById(payment.request) : null;
        const isParticipant = [payment.requester.toString(), payment.creator.toString()].includes(req.user._id.toString());
        if (!isParticipant && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Only participants or admin can refund this payment'));
        }

        if (!['requires_action', 'authorized', 'held'].includes(payment.status)) {
            res.status(400);
            return next(new Error('Payment cannot be refunded from its current status'));
        }

        payment.status = 'refunded';
        payment.refundedAt = new Date();
        await payment.save();

        if (request) {
            request.paymentStatus = 'refunded';
            request.escrow.status = 'refunded';
            request.escrow.refundedAt = new Date();
            await request.save();
        }

        await writeEscrowTransaction({
            payment,
            request,
            actorId: req.user._id,
            walletOwner: payment.requester,
            type: 'refund',
            amount: payment.amount,
            metadata: { reason: req.body.reason || '' },
        });

        res.json(payment);
    } catch (error) {
        next(error);
    }
};

const getMyBalance = async (req, res, next) => {
    try {
        const balances = await CreatorBalance.find({ creator: req.user._id }).sort({ currency: 1 });
        res.json(balances);
    } catch (error) {
        next(error);
    }
};

const getMyTransactions = async (req, res, next) => {
    try {
        const transactions = await EscrowTransaction.find({ walletOwner: req.user._id })
            .populate('payment', 'gateway status amount currency')
            .populate('request', 'title status')
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(req.query.limit) || 80, 200));

        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

const createPayoutMethod = async (req, res, next) => {
    try {
        const method = await PayoutMethod.create({
            creator: req.user._id,
            method: String(req.body.method || '').toLowerCase(),
            settlementCurrency: normalizeCurrency(req.body.settlementCurrency || req.body.currency),
            country: req.body.country || 'JP',
            accountLabel: req.body.accountLabel,
            providerAccountId: req.body.providerAccountId || '',
            maskedAccount: req.body.maskedAccount || '',
            isDefault: Boolean(req.body.isDefault),
            status: 'pending_verification',
        });

        res.status(201).json(method);
    } catch (error) {
        next(error);
    }
};

const getPayoutMethods = async (req, res, next) => {
    try {
        const methods = await PayoutMethod.find({ creator: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.json(methods);
    } catch (error) {
        next(error);
    }
};

const requestPayout = async (req, res, next) => {
    try {
        const currency = normalizeCurrency(req.body.currency);
        const amount = Number(req.body.amount);
        const method = String(req.body.method || '').toLowerCase();
        const validation = validatePayoutRequest({ amount, currency, method });
        if (!validation.valid) {
            res.status(400);
            return next(new Error(validation.errors.join(' ')));
        }

        const balance = await CreatorBalance.findOne({ creator: req.user._id, currency });
        if (!balance || balance.availableAmount < amount) {
            res.status(400);
            return next(new Error('Insufficient available balance'));
        }

        const payout = await Payout.create({
            creator: req.user._id,
            payoutMethod: req.body.payoutMethodId || undefined,
            method,
            amount,
            currency,
            scheduleType: req.body.scheduleType === 'monthly' ? 'monthly' : 'on_demand',
        });

        balance.availableAmount -= amount;
        balance.lifetimePayoutAmount += amount;
        await balance.save();

        res.status(201).json({ payout, balance });
    } catch (error) {
        next(error);
    }
};

const getMyPayouts = async (req, res, next) => {
    try {
        const payouts = await Payout.find({ creator: req.user._id })
            .populate('payoutMethod', 'method accountLabel maskedAccount status')
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(req.query.limit) || 80, 200));
        res.json(payouts);
    } catch (error) {
        next(error);
    }
};

const getMyPayments = async (req, res, next) => {
    try {
        const filter = {
            $or: [
                { requester: req.user._id },
                { creator: req.user._id },
            ],
        };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const payments = await Payment.find(filter)
            .populate('request', 'title status')
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(req.query.limit) || 80, 200));
        res.json(payments);
    } catch (error) {
        next(error);
    }
};

const upsertPaymentConfig = async (req, res, next) => {
    try {
        const key = req.body.key || 'default';
        const config = await PaymentConfig.findOneAndUpdate(
            { key },
            {
                key,
                platformFeeRate: req.body.platformFeeRate,
                currency: normalizeCurrency(req.body.currency),
                country: req.body.country || '',
                campaignName: req.body.campaignName || '',
                startsAt: req.body.startsAt || null,
                endsAt: req.body.endsAt || null,
                isActive: req.body.isActive !== false,
            },
            { new: true, upsert: true, runValidators: true },
        );

        res.json(config);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPaymentIntent,
    createQrPaymentIntent,
    createPayoutMethod,
    getMyBalance,
    getMyPayments,
    getMyPayouts,
    getMyTransactions,
    getPayoutMethods,
    handlePaymentWebhook,
    refundPayment,
    releaseEscrow,
    requestPayout,
    simulateBankQrConfirmation,
    upsertPaymentConfig,
};
