const WORK_TYPES = ['illust', 'manga', 'gif', 'novel'];
const VISIBILITY_VALUES = ['public', 'private'];
const AGE_RATINGS = ['all', 'r-18', 'r-18g'];

const REQUEST_STATUSES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    DRAFT_SUBMITTED: 'draft_submitted',
    REVISION: 'revision',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
};

const ACTIVE_REQUEST_STATUSES = [
    REQUEST_STATUSES.ACCEPTED,
    REQUEST_STATUSES.IN_PROGRESS,
    REQUEST_STATUSES.DRAFT_SUBMITTED,
    REQUEST_STATUSES.REVISION,
];

const TRANSITIONS = {
    [REQUEST_STATUSES.PENDING]: [
        REQUEST_STATUSES.ACCEPTED,
        REQUEST_STATUSES.REJECTED,
        REQUEST_STATUSES.CANCELLED,
    ],
    [REQUEST_STATUSES.ACCEPTED]: [
        REQUEST_STATUSES.IN_PROGRESS,
        REQUEST_STATUSES.CANCELLED,
    ],
    [REQUEST_STATUSES.IN_PROGRESS]: [
        REQUEST_STATUSES.DRAFT_SUBMITTED,
        REQUEST_STATUSES.CANCELLED,
    ],
    [REQUEST_STATUSES.DRAFT_SUBMITTED]: [
        REQUEST_STATUSES.REVISION,
        REQUEST_STATUSES.COMPLETED,
        REQUEST_STATUSES.CANCELLED,
    ],
    [REQUEST_STATUSES.REVISION]: [
        REQUEST_STATUSES.DRAFT_SUBMITTED,
        REQUEST_STATUSES.COMPLETED,
        REQUEST_STATUSES.CANCELLED,
    ],
    [REQUEST_STATUSES.COMPLETED]: [],
    [REQUEST_STATUSES.REJECTED]: [],
    [REQUEST_STATUSES.CANCELLED]: [],
};

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateRequestTermPayload(payload = {}) {
    const errors = [];
    const acceptedWorkTypes = Array.isArray(payload.acceptedWorkTypes) ? payload.acceptedWorkTypes : [];

    if (!isNonEmptyString(payload.title)) {
        errors.push('Plan title is required.');
    }

    if (!Number.isFinite(Number(payload.targetPrice)) || Number(payload.targetPrice) <= 0) {
        errors.push('Target price must be greater than 0.');
    }

    if (!acceptedWorkTypes.length || acceptedWorkTypes.some((type) => !WORK_TYPES.includes(type))) {
        errors.push('At least one supported work type is required.');
    }

    const estimatedDays = Number(payload.estimatedDays);
    if (!Number.isInteger(estimatedDays) || estimatedDays < 14 || estimatedDays > 60) {
        errors.push('Estimated days must be an integer from 14 to 60.');
    }

    const maxOpenRequests = Number(payload.maxOpenRequests);
    if (!Number.isInteger(maxOpenRequests) || maxOpenRequests < 1 || maxOpenRequests > 20) {
        errors.push('Maximum open requests must be an integer from 1 to 20.');
    }

    if (!isNonEmptyString(payload.rules)) {
        errors.push('Acceptance rules are required.');
    }

    if (!isNonEmptyString(payload.strengths)) {
        errors.push('Creator strengths description is required.');
    }

    return { valid: errors.length === 0, errors };
}

function validateRequestSubmission(payload = {}, term = {}, context = {}) {
    const errors = [];
    const proposedAmount = Number(payload.proposedAmount);
    const targetPrice = Number(term.targetPrice);
    const acceptedWorkTypes = Array.isArray(term.acceptedWorkTypes) ? term.acceptedWorkTypes : [];
    const maxOpenRequests = Number(term.maxOpenRequests || 0);
    const openRequestCount = Number(context.openRequestCount || 0);

    if (!isNonEmptyString(payload.title)) {
        errors.push('Request title is required.');
    }

    if (!isNonEmptyString(payload.description)) {
        errors.push('Request description is required.');
    }

    if (!WORK_TYPES.includes(payload.workType)) {
        errors.push('A supported work type is required.');
    } else if (acceptedWorkTypes.length && !acceptedWorkTypes.includes(payload.workType)) {
        errors.push('This request plan does not accept the selected work type.');
    }

    if (!Number.isFinite(proposedAmount) || proposedAmount < targetPrice) {
        errors.push('Proposed amount must meet or exceed the creator target price.');
    }

    if (maxOpenRequests > 0 && openRequestCount >= maxOpenRequests) {
        errors.push('Creator request capacity is currently full.');
    }

    if (payload.visibility && !VISIBILITY_VALUES.includes(payload.visibility)) {
        errors.push('Visibility must be public or private.');
    }

    if (payload.ageRating && !AGE_RATINGS.includes(payload.ageRating)) {
        errors.push('Invalid age rating.');
    }

    if (Array.isArray(payload.referenceImages) && payload.referenceImages.length > 15) {
        errors.push('Reference images are limited to 15 files.');
    }

    return { valid: errors.length === 0, errors };
}

function canTransitionRequest(fromStatus, toStatus) {
    return Boolean(TRANSITIONS[fromStatus]?.includes(toStatus));
}

function canCreateRevision(requestLike = {}) {
    const status = requestLike.status;
    const revisionCount = Number(requestLike.revisionCount || 0);

    if (![REQUEST_STATUSES.DRAFT_SUBMITTED, REQUEST_STATUSES.REVISION].includes(status)) {
        return { allowed: false, reason: 'Revisions are only available after a draft is submitted.' };
    }

    if (revisionCount >= 2) {
        return { allowed: false, reason: 'Maximum revision rounds reached.' };
    }

    return { allowed: true, reason: '' };
}

module.exports = {
    ACTIVE_REQUEST_STATUSES,
    AGE_RATINGS,
    REQUEST_STATUSES,
    VISIBILITY_VALUES,
    WORK_TYPES,
    canCreateRevision,
    canTransitionRequest,
    validateRequestSubmission,
    validateRequestTermPayload,
};
