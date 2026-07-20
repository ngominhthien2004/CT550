/**
 * In-memory cache utility using node-cache.
 * Provides a singleton cache instance + helpers for TTL management.
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
 * Get a value from cache, or call fetchFn to populate it.
 * @param {string} key
 * @param {() => Promise<any>} fetchFn
 * @param {number} [ttl] – overrides default TTL
 */
async function getOrSet(key, fetchFn, ttl) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Delete one or more cache keys.
 * @param {string|string[]} keys
 */
function del(keys) {
  if (Array.isArray(keys)) cache.del(keys);
  else cache.del(keys);
}

/**
 * Delete all keys starting with a given prefix.
 * @param {string} prefix
 */
function delByPrefix(prefix) {
  const matched = cache.keys().filter((k) => k.startsWith(prefix));
  if (matched.length) cache.del(matched);
}

/** Empty the entire cache. */
function flushAll() {
  cache.flushAll();
}

/** Return cache stats (keys, hits, misses, etc.). */
function stats() {
  return cache.getStats();
}

module.exports = {
  cache,
  TTL,
  buildKey,
  getOrSet,
  del,
  delByPrefix,
  flushAll,
  stats,
};
