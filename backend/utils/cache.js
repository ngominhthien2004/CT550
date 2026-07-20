/**
 * Two-tier caching: L1 (node-cache in-memory) + L2 (MongoDB TTL collection).
 * L1 is always the primary — fastest reads.
 * L2 is optional — for data that should survive server restart.
 */
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
});

// ── TTL constants (seconds) ──────────────────────────────────
const TTL = {
  /** Banners – rarely change */
  BANNERS: 300,
  /** Popular tag suggestions – expensive aggregation queries */
  TAGS_POPULAR: 300,
  /** Rankings */
  RANKINGS_DAILY: 120,
  RANKINGS_WEEKLY: 300,
  RANKINGS_MONTHLY: 600,
  /** Discovery page – paginated listing */
  DISCOVERY: 120,
  /** Artwork list queries */
  ARTWORK_LIST: 60,
  /** Similar artworks */
  SIMILAR_ARTWORKS: 300,
  /** Admin overview counts */
  ADMIN_OVERVIEW: 60,
  /** Public user profiles */
  PUBLIC_PROFILE: 120,
};

// ── Lazy Cache model loader (avoids circular require at startup) ──
let CacheModel = null;
function getCacheModel() {
  if (!CacheModel) {
    CacheModel = require('../models/Cache');
  }
  return CacheModel;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Build a deterministic cache key from a prefix + query params.
 * Sorts keys so `?a=1&b=2` and `?b=2&a=1` map to the same key.
 */
function buildKey(prefix, query = {}) {
  const sorted = Object.keys(query)
    .sort()
    .reduce((acc, k) => {
      acc[k] = query[k];
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sorted)}`;
}

/**
 * Get value from L1 (node-cache) only — fastest, no async overhead.
 * Used for short-TTL data that doesn't need to survive restart.
 */
function get(key) {
  return cache.get(key);
}

/**
 * Set value in L1 (node-cache) only.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl]
 */
function set(key, value, ttl) {
  cache.set(key, value, ttl);
}

/**
 * Get or fetch via L1 only (no MongoDB persistence).
 * Best for short-lived or frequently-invalidated data.
 * @param {string} key
 * @param {() => Promise<any>} fetchFn
 * @param {number} [ttl]
 */
async function getOrSet(key, fetchFn, ttl) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Get or fetch with TWO-tier: L1 → L2 → fetchFn.
 * Populates both L1 and L2 on miss.
 * Best for expensive, slow-changing data that should survive restart.
 * @param {string} key
 * @param {() => Promise<any>} fetchFn
 * @param {number} [ttl]
 */
async function getOrSetWithL2(key, fetchFn, ttl) {
  // 1. Try L1 (in-memory) — fastest path
  const l1 = cache.get(key);
  if (l1 !== undefined) return l1;

  // 2. Try L2 (MongoDB) — persistent cache
  try {
    const Model = getCacheModel();
    const doc = await Model.findOne({ key }).lean();
    if (doc && doc.expiresAt > new Date()) {
      // Found valid L2 entry — promote to L1 and return
      cache.set(key, doc.data, ttl);
      return doc.data;
    }
  } catch (err) {
    // L2 failure is non-blocking — fall through to fetchFn
    console.warn(`[cache] L2 miss for "${key}":`, err.message);
  }

  // 3. Miss in both — execute fetchFn
  const data = await fetchFn();

  // 4. Store in L1
  cache.set(key, data, ttl);

  // 5. Store in L2 (fire-and-forget — never block on DB)
  try {
    const Model = getCacheModel();
    const expiresAt = new Date(Date.now() + (ttl || 60) * 1000);
    await Model.updateOne(
      { key },
      { $set: { key, data, expiresAt } },
      { upsert: true }
    );
  } catch (err) {
    // L2 write failure is non-blocking
    console.warn(`[cache] L2 write failed for "${key}":`, err.message);
  }

  return data;
}

/**
 * Delete one or more cache keys.
 * Clears from both L1 and L2.
 * @param {string|string[]} keys
 */
function del(keys) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  // Clear L1
  cache.del(keyList);
  // Clear L2 (fire-and-forget)
  try {
    const Model = getCacheModel();
    Model.deleteMany({ key: { $in: keyList } }).catch(() => {});
  } catch (err) {
    // ignore
  }
}

/**
 * Delete all keys starting with a given prefix.
 * Clears from both L1 and L2.
 * @param {string} prefix
 */
function delByPrefix(prefix) {
  // Clear L1
  const matched = cache.keys().filter((k) => k.startsWith(prefix));
  if (matched.length) cache.del(matched);
  // Clear L2 (fire-and-forget with regex)
  try {
    const Model = getCacheModel();
    Model.deleteMany({ key: { $regex: `^${prefix}` } }).catch(() => {});
  } catch (err) {
    // ignore
  }
}

/** Empty the entire cache (L1 + L2). */
function flushAll() {
  cache.flushAll();
  try {
    const Model = getCacheModel();
    Model.deleteMany({}).catch(() => {});
  } catch (err) {
    // ignore
  }
}

/** Return L1 cache stats (keys, hits, misses, etc.). */
function stats() {
  return cache.getStats();
}

module.exports = {
  cache,
  TTL,
  buildKey,
  get,
  set,
  getOrSet,
  getOrSetWithL2,
  del,
  delByPrefix,
  flushAll,
  stats,
};
