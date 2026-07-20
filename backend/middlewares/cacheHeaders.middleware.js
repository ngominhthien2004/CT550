/**
 * Cache-Control and ETag middleware for fine-grained HTTP caching.
 */

/**
 * Set Cache-Control header on GET responses.
 * @param {number} maxAge – max-age in seconds
 * @param {boolean} [isPublic=true] – public vs private
 */
function cacheControl(maxAge, isPublic = true) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const visibility = isPublic ? 'public' : 'private';
    res.set('Cache-Control', `${visibility}, max-age=${maxAge}`);
    next();
  };
}

/** Force no-cache on sensitive/user-specific endpoints. */
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}

/** Enable strong ETag for artwork detail responses (Express 5 default is weak). */
function strongETag(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 200 && body && typeof body === 'object') {
      const hash = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex');
      res.set('ETag', `"${hash}"`);
    }
    return originalJson(body);
  };
  next();
}

module.exports = { cacheControl, noCache, strongETag };
