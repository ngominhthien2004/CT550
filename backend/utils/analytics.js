/**
 * Analytics utility helpers
 */

/**
 * Calculate date range for a given period string.
 * Returns { startDate, previousStartDate, endDate } where:
 *   - current = startDate to endDate (endDate is now)
 *   - previous = previousStartDate to startDate (same length period before)
 */
function getDateRange(period) {
  const now = new Date();
  let currentStart, previousStart;

  switch (period) {
    case '7d':
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: // default 30d
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: currentStart,
    previousStartDate: previousStart,
    endDate: now,
  };
}

/**
 * Fill missing dates in an aggregation result with zero counts.
 * @param {Array} data - Array of { _id: 'YYYY-MM-DD', count: Number }
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {Array} Complete array with all dates filled
 */
function fillMissingDates(data, startDate, endDate) {
  const map = new Map();
  for (const item of data) {
    map.set(item._id, item.count);
  }

  const result = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0]; // YYYY-MM-DD
    result.push({
      date: key,
      count: map.get(key) || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Calculate percent change between two values.
 * Returns null if previousValue is 0 (avoid division by zero),
 * but handles the case where current > 0 and previous = 0 as +100%.
 */
function calculateChange(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

/**
 * Group aggregated data into current and previous periods,
 * fill missing dates, and calculate change.
 * @param {Array} rawData - Aggregation result with { _id: 'YYYY-MM-DD', count: Number }
 * @param {Object} range - { startDate, previousStartDate, endDate }
 * @returns {Object} { labels: [...], current: [...], previous: [...], changePercent: Number }
 */
function buildTrendResponse(rawData, range) {
  const allDates = fillMissingDates(rawData, range.previousStartDate, range.endDate);

  const previousData = [];
  const currentData = [];
  const labels = [];
  let previousSum = 0;
  let currentSum = 0;

  for (const item of allDates) {
    const d = new Date(item.date);
    labels.push(item.date);

    if (d < range.startDate) {
      previousData.push(item.count);
      previousSum += item.count;
    } else {
      currentData.push(item.count);
      currentSum += item.count;
    }
  }

  return {
    labels,
    current: currentData,
    previous: previousData,
    currentTotal: currentSum,
    previousTotal: previousSum,
    changePercent: calculateChange(currentSum, previousSum),
  };
}

module.exports = { getDateRange, fillMissingDates, calculateChange, buildTrendResponse };
