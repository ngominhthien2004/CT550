const Series = require('../models/Series');
require('../models/Artwork');
require('../models/Tag');

/**
 * Recomputes the tags for a given series ID by collecting unique tag ObjectIds
 * from all populated artworks attached to the series, then updates series.tags.
 *
 * @param {string|mongoose.Types.ObjectId} seriesId
 * @returns {Promise<Array>} The unique tag IDs array assigned to the series
 */
async function recomputeSeriesTags(seriesId) {
  const series = await Series.findById(seriesId).populate({
    path: 'artworks',
    select: 'tags',
  });

  if (!series) return [];

  const tagSet = new Set();
  if (Array.isArray(series.artworks)) {
    for (const artwork of series.artworks) {
      if (Array.isArray(artwork.tags)) {
        for (const tagId of artwork.tags) {
          if (tagId) {
            tagSet.add(tagId.toString());
          }
        }
      }
    }
  }

  const uniqueTags = Array.from(tagSet);
  series.tags = uniqueTags;
  await series.save({ validateBeforeSave: false });

  return uniqueTags;
}

module.exports = { recomputeSeriesTags };
