/**
 * Compute aggregated stats for a series from its populated artworks.
 * Returns a new object so the original series document is not mutated.
 *
 * @param {Object} series - Series document or plain object (may include populated artworks).
 * @returns {Object} Series object with totalViews, totalLikes, totalBookmarks, totalComments.
 */
function computeSeriesStats(series) {
  const doc = series && typeof series.toObject === 'function' ? series.toObject() : { ...series };
  const artworks = doc.artworks || [];

  const stats = {
    totalViews: 0,
    totalLikes: 0,
    totalBookmarks: 0,
    totalComments: 0,
  };

  for (const artwork of artworks) {
    const a = artwork && typeof artwork.toObject === 'function' ? artwork.toObject() : artwork;
    stats.totalViews += a.viewCount || 0;
    stats.totalLikes += a.likeCount || 0;
    stats.totalBookmarks += a.bookmarkCount || 0;
    stats.totalComments += a.commentCount || 0;
  }

  return { ...doc, ...stats };
}

module.exports = { computeSeriesStats };
