const { detectLabels } = require('./googleVision.service');

/**
 * Auto-tag an image using Google Cloud Vision API.
 * @param {string} imageBase64 - Base64-encoded image data
 * @returns {Promise<string[]>} Array of suggested tag names (empty on failure)
 */
async function autoTagImage(imageBase64) {
    return await detectLabels(imageBase64);
}

module.exports = { autoTagImage };
