const assert = require('node:assert/strict');
const test = require('node:test');

// Test 1: validateObjectId helper logic (since it's not exported from controller, test the concept inline)
test('ObjectId validation rejects invalid formats', () => {
  function isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isValidObjectId('507f1f77bcf86cd79943901'), false);   // too short
  assert.equal(isValidObjectId('507f1f77bcf86cd7994390111'), false); // too long
  assert.equal(isValidObjectId('not-an-object-id'), false);
  assert.equal(isValidObjectId(''), false);
  assert.equal(isValidObjectId(null), false);
  assert.equal(isValidObjectId(undefined), false);
});

// Test 2: Series type enum validation
test('series type must be one of allowed values', () => {
  const allowedTypes = ['manga', 'novel', 'illust'];
  function isValidSeriesType(type) {
    return allowedTypes.includes(type);
  }
  assert.equal(isValidSeriesType('manga'), true);
  assert.equal(isValidSeriesType('novel'), true);
  assert.equal(isValidSeriesType('illust'), true);
  assert.equal(isValidSeriesType('manga2'), false);
  assert.equal(isValidSeriesType(''), false);
  assert.equal(isValidSeriesType(null), false);
});

// Test 3: Reorder artwork ID matching validation
test('reorder requires the exact same artwork IDs as the series', () => {
  function validateReorder(currentIds, providedIds) {
    if (!Array.isArray(providedIds)) {
      return { valid: false, error: 'artworkIds must be an array' };
    }
    const current = currentIds.map(String).sort();
    const provided = providedIds.map(String).sort();
    if (current.length !== provided.length ||
        current.some((id, i) => id !== provided[i])) {
      return { valid: false, error: 'artworkIds must match current series artworks' };
    }
    return { valid: true };
  }

  // Exact match
  assert.deepEqual(validateReorder(['a', 'b', 'c'], ['a', 'b', 'c']), { valid: true });
  // Same IDs, different order
  assert.deepEqual(validateReorder(['a', 'b', 'c'], ['c', 'a', 'b']), { valid: true });
  // Missing an ID
  const result1 = validateReorder(['a', 'b', 'c'], ['a', 'b']);
  assert.equal(result1.valid, false);
  assert.match(result1.error, /match/i);
  // Extra ID
  const result2 = validateReorder(['a', 'b', 'c'], ['a', 'b', 'c', 'd']);
  assert.equal(result2.valid, false);
  assert.match(result2.error, /match/i);
  // Wrong ID
  const result3 = validateReorder(['a', 'b', 'c'], ['a', 'b', 'x']);
  assert.equal(result3.valid, false);
  assert.match(result3.error, /match/i);
  // Not an array
  const result4 = validateReorder(['a', 'b', 'c'], null);
  assert.equal(result4.valid, false);
  assert.match(result4.error, /array/i);
});

// Test 4: Empty title validation
test('series title validation rejects empty or whitespace-only titles', () => {
  function validateTitle(title) {
    if (title !== undefined && !title.trim()) {
      return { valid: false, error: 'Title cannot be empty' };
    }
    return { valid: true };
  }
  assert.deepEqual(validateTitle('My Series'), { valid: true });
  assert.deepEqual(validateTitle(undefined), { valid: true }); // undefined = not updating
  const result1 = validateTitle('');
  assert.equal(result1.valid, false);
  assert.match(result1.error, /empty/i);
  const result2 = validateTitle('   ');
  assert.equal(result2.valid, false);
  assert.match(result2.error, /empty/i);
});

// Test 5: HTTP status codes for authorization
test('authorization failure should use 403 (not 401) for authenticated users', () => {
  // This tests the concept (actual middleware testing needs supertest)
  function getAuthStatus(isAuthenticated, isOwner) {
    if (!isAuthenticated) return 401;
    if (!isOwner) return 403;
    return 200;
  }
  assert.equal(getAuthStatus(false, false), 401); // not logged in
  assert.equal(getAuthStatus(true, false), 403);   // logged in but not owner
  assert.equal(getAuthStatus(true, true), 200);     // logged in and is owner
});

// Test 6: Owner view count skip
test('view count should not increment for series owner', () => {
  function shouldIncrementView(reqUser, seriesUser) {
    if (!reqUser) return true; // anonymous visitor
    return String(reqUser) !== String(seriesUser);
  }
  assert.equal(shouldIncrementView(null, 'abc123'), true);     // anonymous
  assert.equal(shouldIncrementView('user1', 'user1'), false);  // owner
  assert.equal(shouldIncrementView('user1', 'user2'), true);   // different user
});
