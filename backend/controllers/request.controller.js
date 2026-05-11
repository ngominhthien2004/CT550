const Request = require('../models/Request');
const RequestChatMessage = require('../models/RequestChatMessage');
const RequestEvent = require('../models/RequestEvent');
const RequestRevision = require('../models/RequestRevision');
const RequestTerm = require('../models/RequestTerm');
const User = require('../models/User');
const {
    ACTIVE_REQUEST_STATUSES,
    REQUEST_STATUSES,
    canCreateRevision,
    canTransitionRequest,
    validateRequestSubmission,
    validateRequestTermPayload,
} = require('../utils/requestValidation');
const { createNotification } = require('../utils/notification');
const path = require('path');

const REQUEST_POPULATE = [
    { path: 'creator', select: 'username displayName avatar' },
    { path: 'requester', select: 'username displayName avatar' },
    { path: 'term' },
];

function fileToPublicAsset(file) {
    const publicDir = path.join(__dirname, '..', 'public');
    const relativePath = path.relative(publicDir, file.path).replace(/\\/g, '/');
    return {
        url: `/${relativePath}`,
        originalName: file.originalname || '',
        mimeType: file.mimetype || '',
        size: file.size || 0,
    };
}

function filesFor(req, fieldName) {
    if (Array.isArray(req.files)) {
        return fieldName === 'referenceImages' ? req.files.map(fileToPublicAsset) : [];
    }

    return (req.files?.[fieldName] || []).map(fileToPublicAsset);
}

function parseStringList(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value !== 'string') {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
    } catch (_error) {
        // Fall back to comma-separated text.
    }

    return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseSpecifics(body = {}) {
    if (typeof body.specifics === 'string') {
        try {
            const parsed = JSON.parse(body.specifics);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        } catch (_error) {
            return {};
        }
    }

    return body.specifics && typeof body.specifics === 'object' ? body.specifics : {
        pose: body.pose,
        outfit: body.outfit,
        mood: body.mood,
        lighting: body.lighting,
        angle: body.angle,
        other: body.other,
    };
}

function normalizeBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }

    return defaultValue;
}

async function logRequestEvent({ requestId, actorId, type, fromStatus = '', toStatus = '', metadata = {} }) {
    return RequestEvent.create({
        request: requestId,
        actor: actorId,
        type,
        fromStatus,
        toStatus,
        metadata,
    });
}

async function addSystemChat(requestId, senderId, content) {
    return RequestChatMessage.create({
        request: requestId,
        sender: senderId,
        content,
        isSystem: true,
    });
}

function ensureParticipant(request, userId) {
    const id = userId.toString();
    return request.creator.toString() === id || request.requester.toString() === id;
}

function ensureCreator(request, userId) {
    return request.creator.toString() === userId.toString();
}

function ensureRequester(request, userId) {
    return request.requester.toString() === userId.toString();
}

async function populateRequest(query) {
    return query.populate(REQUEST_POPULATE);
}

const createRequestTerm = async (req, res, next) => {
    try {
        const payload = {
            ...req.body,
            acceptedWorkTypes: parseStringList(req.body.acceptedWorkTypes),
            acceptedAgeRatings: parseStringList(req.body.acceptedAgeRatings),
            forbiddenTopics: parseStringList(req.body.forbiddenTopics),
            preferredStyles: parseStringList(req.body.preferredStyles),
            targetPrice: Number(req.body.targetPrice),
            estimatedDays: Number(req.body.estimatedDays),
            maxOpenRequests: Number(req.body.maxOpenRequests),
            isOpen: req.body.isOpen === undefined ? true : normalizeBoolean(req.body.isOpen, true),
        };

        const validation = validateRequestTermPayload(payload);
        if (!validation.valid) {
            res.status(400);
            return next(new Error(validation.errors.join(' ')));
        }

        const term = await RequestTerm.create({
            ...payload,
            creator: req.user._id,
        });

        res.status(201).json(term);
    } catch (error) {
        next(error);
    }
};

const updateRequestTerm = async (req, res, next) => {
    try {
        const term = await RequestTerm.findById(req.params.id);
        if (!term) {
            res.status(404);
            return next(new Error('Request term not found'));
        }

        if (term.creator.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to update this request term'));
        }

        const payload = {
            ...term.toObject(),
            ...req.body,
            acceptedWorkTypes: req.body.acceptedWorkTypes === undefined ? term.acceptedWorkTypes : parseStringList(req.body.acceptedWorkTypes),
            acceptedAgeRatings: req.body.acceptedAgeRatings === undefined ? term.acceptedAgeRatings : parseStringList(req.body.acceptedAgeRatings),
            forbiddenTopics: req.body.forbiddenTopics === undefined ? term.forbiddenTopics : parseStringList(req.body.forbiddenTopics),
            preferredStyles: req.body.preferredStyles === undefined ? term.preferredStyles : parseStringList(req.body.preferredStyles),
            targetPrice: req.body.targetPrice === undefined ? term.targetPrice : Number(req.body.targetPrice),
            estimatedDays: req.body.estimatedDays === undefined ? term.estimatedDays : Number(req.body.estimatedDays),
            maxOpenRequests: req.body.maxOpenRequests === undefined ? term.maxOpenRequests : Number(req.body.maxOpenRequests),
            isOpen: req.body.isOpen === undefined ? term.isOpen : normalizeBoolean(req.body.isOpen, term.isOpen),
        };

        const validation = validateRequestTermPayload(payload);
        if (!validation.valid) {
            res.status(400);
            return next(new Error(validation.errors.join(' ')));
        }

        Object.assign(term, payload);
        const updated = await term.save();

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

const getRequestTerms = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.creator) {
            filter.creator = req.query.creator;
        }
        if (req.query.openOnly !== 'false') {
            filter.isOpen = true;
        }

        const terms = await RequestTerm.find(filter)
            .populate('creator', 'username displayName avatar')
            .sort({ createdAt: -1 });

        res.json(terms);
    } catch (error) {
        next(error);
    }
};

const createRequest = async (req, res, next) => {
    try {
        const term = await RequestTerm.findById(req.body.termId);
        if (!term || !term.isOpen) {
            res.status(404);
            return next(new Error('Creator is not accepting this request plan'));
        }

        if (term.creator.toString() === req.user._id.toString()) {
            res.status(400);
            return next(new Error('Creators cannot request their own plan'));
        }

        const openRequestCount = await Request.countDocuments({
            creator: term.creator,
            status: { $in: ACTIVE_REQUEST_STATUSES },
        });

        const payload = {
            title: req.body.title,
            description: req.body.description,
            workType: req.body.workType,
            proposedAmount: Number(req.body.proposedAmount),
            visibility: req.body.visibility || 'private',
            ageRating: req.body.ageRating || 'all',
            referenceImages: filesFor(req, 'referenceImages'),
        };

        const validation = validateRequestSubmission(payload, term, { openRequestCount });
        if (!validation.valid) {
            res.status(400);
            return next(new Error(validation.errors.join(' ')));
        }

        const request = await Request.create({
            term: term._id,
            creator: term.creator,
            requester: req.user._id,
            title: payload.title.trim(),
            description: payload.description.trim(),
            workType: payload.workType,
            tags: parseStringList(req.body.tags),
            specifics: parseSpecifics(req.body),
            proposedAmount: payload.proposedAmount,
            currency: term.currency || 'USD',
            visibility: payload.visibility,
            isAnonymous: normalizeBoolean(req.body.isAnonymous),
            ageRating: payload.ageRating,
            referenceImages: payload.referenceImages,
            escrow: {
                status: 'held',
                platformFeeRate: 0.12,
            },
        });

        await logRequestEvent({
            requestId: request._id,
            actorId: req.user._id,
            type: 'request_submitted',
            toStatus: REQUEST_STATUSES.PENDING,
            metadata: { escrowStatus: 'held' },
        });

        await createNotification({
            userId: term.creator,
            actorId: req.user._id,
            type: 'request',
            message: `New Request: ${request.title}`,
        });

        const populated = await populateRequest(Request.findById(request._id));
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

const listMyRequests = async (req, res, next) => {
    try {
        const role = req.query.role === 'creator' ? 'creator' : 'requester';
        const filter = { [role]: req.user._id };
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const requests = await Request.find(filter)
            .populate(REQUEST_POPULATE)
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(req.query.limit) || 80, 200));

        res.json(requests);
    } catch (error) {
        next(error);
    }
};

const listPublicRequests = async (req, res, next) => {
    try {
        const filter = {
            visibility: 'public',
            status: { $in: [REQUEST_STATUSES.ACCEPTED, REQUEST_STATUSES.IN_PROGRESS, REQUEST_STATUSES.DRAFT_SUBMITTED, REQUEST_STATUSES.COMPLETED] },
        };

        if (req.query.creator) {
            filter.creator = req.query.creator;
        }

        const requests = await Request.find(filter)
            .populate('creator', 'username displayName avatar')
            .select('-description -specifics -referenceImages -giftFiles')
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(req.query.limit) || 60, 120));

        res.json(requests);
    } catch (error) {
        next(error);
    }
};

const getRequestById = async (req, res, next) => {
    try {
        const request = await populateRequest(Request.findById(req.params.id));
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (request.visibility !== 'public' && !ensureParticipant(request, req.user?._id || '')) {
            res.status(403);
            return next(new Error('Not authorized to view this request'));
        }

        res.json(request);
    } catch (error) {
        next(error);
    }
};

async function transitionRequest({ request, actorId, toStatus, type, metadata = {} }) {
    const fromStatus = request.status;
    if (!canTransitionRequest(fromStatus, toStatus)) {
        const error = new Error(`Cannot transition request from ${fromStatus} to ${toStatus}`);
        error.statusCode = 400;
        throw error;
    }

    request.status = toStatus;
    await request.save();
    await logRequestEvent({ requestId: request._id, actorId, type, fromStatus, toStatus, metadata });
    return request;
}

const acceptRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can accept this request'));
        }

        request.dueAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.ACCEPTED,
            type: 'request_accepted',
        });
        await addSystemChat(request._id, req.user._id, 'Private request room opened after creator acceptance.');
        await createNotification({
            userId: request.requester,
            actorId: req.user._id,
            type: 'request',
            message: `Your Request "${request.title}" was accepted.`,
        });

        const populated = await populateRequest(Request.findById(request._id));
        res.json(populated);
    } catch (error) {
        next(error);
    }
};

const rejectRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can reject this request'));
        }

        request.escrow.status = 'refunded';
        request.escrow.refundedAt = new Date();
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.REJECTED,
            type: 'request_rejected',
            metadata: { reason: req.body.reason || '' },
        });
        await createNotification({
            userId: request.requester,
            actorId: req.user._id,
            type: 'request',
            message: `Your Request "${request.title}" was declined and refunded.`,
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const startRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can start this request'));
        }

        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.IN_PROGRESS,
            type: 'request_started',
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const cancelRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureParticipant(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only request participants can cancel this request'));
        }

        request.escrow.status = 'refunded';
        request.escrow.refundedAt = new Date();
        request.chatClosedAt = new Date();
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.CANCELLED,
            type: 'request_cancelled',
            metadata: { reason: req.body.reason || '' },
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const submitDraft = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can submit a draft'));
        }

        const draftFiles = filesFor(req, 'draftFiles');
        if (!draftFiles.length) {
            res.status(400);
            return next(new Error('At least one draft file is required'));
        }

        request.draftFiles = draftFiles;
        request.autoCompleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.DRAFT_SUBMITTED,
            type: 'draft_submitted',
        });

        await createNotification({
            userId: request.requester,
            actorId: req.user._id,
            type: 'request',
            message: `Draft submitted for "${request.title}".`,
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const createRevision = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureRequester(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the requester can request revisions'));
        }

        const revisionCheck = canCreateRevision(request);
        if (!revisionCheck.allowed) {
            res.status(400);
            return next(new Error(revisionCheck.reason));
        }

        if (!req.body.notes || !req.body.notes.trim()) {
            res.status(400);
            return next(new Error('Revision notes are required'));
        }

        request.revisionCount += 1;
        const revision = await RequestRevision.create({
            request: request._id,
            requester: req.user._id,
            round: request.revisionCount,
            notes: req.body.notes.trim(),
        });

        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.REVISION,
            type: 'revision_requested',
            metadata: { revisionId: revision._id, round: revision.round },
        });

        await createNotification({
            userId: request.creator,
            actorId: req.user._id,
            type: 'request',
            message: `Revision requested for "${request.title}".`,
        });

        res.status(201).json(revision);
    } catch (error) {
        next(error);
    }
};

const completeRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can complete this request'));
        }

        const finalFiles = filesFor(req, 'finalFiles');
        if (!finalFiles.length) {
            res.status(400);
            return next(new Error('At least one final file is required'));
        }

        const fee = Math.round(request.proposedAmount * request.escrow.platformFeeRate * 100) / 100;
        request.finalFiles = finalFiles;
        request.giftFiles = filesFor(req, 'giftFiles');
        request.escrow.platformFeeAmount = fee;
        request.escrow.creatorPayoutAmount = Math.max(request.proposedAmount - fee, 0);
        request.escrow.status = 'released';
        request.escrow.releasedAt = new Date();
        request.chatClosedAt = new Date();
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.COMPLETED,
            type: 'request_completed',
            metadata: { platformFeeAmount: fee },
        });

        await createNotification({
            userId: request.requester,
            actorId: req.user._id,
            type: 'request',
            message: `Final files delivered for "${request.title}".`,
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const approveRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureRequester(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the requester can approve completion'));
        }

        if (request.status !== REQUEST_STATUSES.DRAFT_SUBMITTED && request.status !== REQUEST_STATUSES.REVISION) {
            res.status(400);
            return next(new Error('Request can only be approved after draft submission'));
        }

        const fee = Math.round(request.proposedAmount * request.escrow.platformFeeRate * 100) / 100;
        request.escrow.platformFeeAmount = fee;
        request.escrow.creatorPayoutAmount = Math.max(request.proposedAmount - fee, 0);
        request.escrow.status = 'released';
        request.escrow.releasedAt = new Date();
        request.chatClosedAt = new Date();
        await transitionRequest({
            request,
            actorId: req.user._id,
            toStatus: REQUEST_STATUSES.COMPLETED,
            type: 'request_approved',
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const requestExtension = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureCreator(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the creator can request an extension'));
        }

        if (request.extensionDays > 0) {
            res.status(400);
            return next(new Error('Extension has already been used'));
        }

        const days = Math.min(Math.max(Number(req.body.days) || 0, 1), 30);
        request.extensionDays = days;
        request.extensionRequestedAt = new Date();
        request.dueAt = new Date((request.dueAt || new Date()).getTime() + days * 24 * 60 * 60 * 1000);
        await request.save();
        await logRequestEvent({
            requestId: request._id,
            actorId: req.user._id,
            type: 'extension_requested',
            metadata: { days },
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const createFanLetter = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureRequester(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only the requester can send a fan letter'));
        }

        if (request.status !== REQUEST_STATUSES.COMPLETED) {
            res.status(400);
            return next(new Error('Fan letters are available after completion'));
        }

        request.fanLetter = {
            rating: Number(req.body.rating) || undefined,
            message: req.body.message || '',
            createdAt: new Date(),
        };
        await request.save();
        await logRequestEvent({
            requestId: request._id,
            actorId: req.user._id,
            type: 'fan_letter_sent',
        });

        res.json(await populateRequest(Request.findById(request._id)));
    } catch (error) {
        next(error);
    }
};

const getRequestChat = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureParticipant(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only request participants can view this chat'));
        }

        const messages = await RequestChatMessage.find({ request: request._id })
            .populate('sender', 'username displayName avatar')
            .sort({ createdAt: 1 })
            .limit(300);

        res.json(messages);
    } catch (error) {
        next(error);
    }
};

const createRequestChatMessage = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureParticipant(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only request participants can send chat messages'));
        }

        if (request.chatClosedAt) {
            res.status(400);
            return next(new Error('Request chat room is closed'));
        }

        const attachments = filesFor(req, 'attachments');
        if (!attachments.length && (!req.body.content || !req.body.content.trim())) {
            res.status(400);
            return next(new Error('Message text or attachment is required'));
        }

        const message = await RequestChatMessage.create({
            request: request._id,
            sender: req.user._id,
            content: req.body.content || '',
            attachments,
        });

        const recipientId = ensureCreator(request, req.user._id) ? request.requester : request.creator;
        await createNotification({
            userId: recipientId,
            actorId: req.user._id,
            type: 'request',
            message: `New Request chat message for "${request.title}".`,
        });

        const populated = await RequestChatMessage.findById(message._id)
            .populate('sender', 'username displayName avatar');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

const getRequestEvents = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureParticipant(request, req.user._id) && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to view request events'));
        }

        const events = await RequestEvent.find({ request: request._id })
            .populate('actor', 'username displayName avatar')
            .sort({ createdAt: -1 });

        res.json(events);
    } catch (error) {
        next(error);
    }
};

const reportRequest = async (req, res, next) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            res.status(404);
            return next(new Error('Request not found'));
        }

        if (!ensureParticipant(request, req.user._id)) {
            res.status(403);
            return next(new Error('Only request participants can report this request'));
        }

        await logRequestEvent({
            requestId: request._id,
            actorId: req.user._id,
            type: 'request_reported',
            metadata: {
                reason: req.body.reason || '',
                detail: req.body.detail || '',
            },
        });

        const admins = await User.find({ role: 'admin' }).select('_id').limit(20);
        await Promise.all(admins.map((admin) => createNotification({
            userId: admin._id,
            actorId: req.user._id,
            type: 'request',
            message: `Request dispute/report opened: ${request.title}`,
        })));

        res.status(201).json({ message: 'Report submitted for moderation review' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    acceptRequest,
    approveRequest,
    cancelRequest,
    completeRequest,
    createFanLetter,
    createRequest,
    createRequestChatMessage,
    createRequestTerm,
    createRevision,
    getRequestById,
    getRequestChat,
    getRequestEvents,
    getRequestTerms,
    listMyRequests,
    listPublicRequests,
    rejectRequest,
    reportRequest,
    requestExtension,
    startRequest,
    submitDraft,
    updateRequestTerm,
};
