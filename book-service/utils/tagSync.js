const Tag = require('../models/Tag');

const normalizeTagName = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    return raw
        .trim()
        .replace(/^#/, '')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
};

const upsertTags = async (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) return;

    const operations = tags
        .map(normalizeTagName)
        .filter(Boolean)
        .map((name) => ({
            updateOne: {
                filter: { name },
                update: { $inc: { usageCount: 1 } },
                upsert: true
            }
        }));

    if (operations.length === 0) return;

    await Tag.bulkWrite(operations, { ordered: false });
};

module.exports = { upsertTags };
