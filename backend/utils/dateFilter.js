/**
 * Build a MongoDB date range filter from `from` and `to` query params.
 * @param {Object} query - Express req.query
 * @param {string} fieldName - The date field to filter on (default: 'createdAt')
 * @returns {Object} MongoDB filter clause (e.g., { createdAt: { $gte: ..., $lte: ... } })
 */
function buildDateFilter(query, fieldName = 'createdAt') {
  const { from, to } = query;
  if (!from && !to) return {};

  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) {
    // If `to` is just a date string (no time), set to end of that day
    const toDate = new Date(to);
    if (!to.includes('T')) {
      toDate.setHours(23, 59, 59, 999);
    }
    filter.$lte = toDate;
  }

  return { [fieldName]: filter };
}

module.exports = { buildDateFilter };