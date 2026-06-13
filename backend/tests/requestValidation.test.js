const assert = require('node:assert/strict');
const test = require('node:test');

const {
    REQUEST_STATUSES,
    canTransitionRequest,
    validateRequestSubmission,
    validateRequestTermPayload,
    canCreateRevision,
} = require('../utils/requestValidation');

test('validates request term payload for supported work type, target price, delivery days, and capacity', () => {
    const result = validateRequestTermPayload({
        title: 'Basic Illustration',
        targetPrice: 80,
        acceptedWorkTypes: ['illust'],
        estimatedDays: 21,
        maxOpenRequests: 3,
        rules: 'No explicit content. Soft lighting preferred.',
        strengths: 'Character portrait and expressive color.',
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
});

test('rejects request submission below creator target price or when creator has no capacity', () => {
    const belowTarget = validateRequestSubmission(
        { proposedAmount: 49, workType: 'illust', title: 'Portrait', description: 'Please draw my OC.' },
        { targetPrice: 50, acceptedWorkTypes: ['illust'], maxOpenRequests: 2 },
        { openRequestCount: 0 },
    );

    const overCapacity = validateRequestSubmission(
        { proposedAmount: 70, workType: 'illust', title: 'Portrait', description: 'Please draw my OC.' },
        { targetPrice: 50, acceptedWorkTypes: ['illust'], maxOpenRequests: 2 },
        { openRequestCount: 2 },
    );

    assert.equal(belowTarget.valid, false);
    assert.match(belowTarget.errors.join('\n'), /target price/i);
    assert.equal(overCapacity.valid, false);
    assert.match(overCapacity.errors.join('\n'), /capacity/i);
});

test('allows only explicit request status transitions', () => {
    assert.equal(canTransitionRequest(REQUEST_STATUSES.PENDING, REQUEST_STATUSES.ACCEPTED), true);
    assert.equal(canTransitionRequest(REQUEST_STATUSES.ACCEPTED, REQUEST_STATUSES.IN_PROGRESS), true);
    assert.equal(canTransitionRequest(REQUEST_STATUSES.DRAFT_SUBMITTED, REQUEST_STATUSES.REVISION), true);
    assert.equal(canTransitionRequest(REQUEST_STATUSES.COMPLETED, REQUEST_STATUSES.REVISION), false);
    assert.equal(canTransitionRequest(REQUEST_STATUSES.REJECTED, REQUEST_STATUSES.ACCEPTED), false);
});

test('limits requester revision rounds to two minor revisions', () => {
    assert.equal(canCreateRevision({ status: REQUEST_STATUSES.DRAFT_SUBMITTED, revisionCount: 0 }).allowed, true);
    assert.equal(canCreateRevision({ status: REQUEST_STATUSES.REVISION, revisionCount: 1 }).allowed, true);

    const result = canCreateRevision({ status: REQUEST_STATUSES.REVISION, revisionCount: 2 });

    assert.equal(result.allowed, false);
    assert.match(result.reason, /maximum/i);
});
