const axios = require('axios');
const { detectLabels } = require('./googleVision.service');

const HF_API_URL = 'https://router.huggingface.co/hf-inference/models';
const AUTO_TAG_MODEL = process.env.AUTO_TAG_MODEL || 'google/vit-base-patch16-224';
const AUTO_TAG_CONFIDENCE = parseFloat(process.env.AUTO_TAG_CONFIDENCE || '0.2');
const AUTO_TAG_MAX_TAGS = parseInt(process.env.AUTO_TAG_MAX_TAGS || '5', 10);

/**
 * Clean a HuggingFace label into a valid tag name.
 * "tiger, Panthera tigris" → "tiger"
 * "tabby, tabby cat" → "tabby"
 */
function cleanHuggingFaceLabel(label) {
    if (!label) return '';
    // Take first part before comma
    const primary = label.split(',')[0].trim();
    // Lowercase, replace spaces with underscores, remove non-alphanumeric except underscore
    return primary
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
        .substring(0, 50); // safety cap
}

/**
 * Auto-tag an image using HuggingFace image classification.
 * @param {string} imageBase64 - Base64-encoded image data
 * @returns {Promise<string[]>} Array of suggested tag names (empty on failure)
 */
async function autoTagWithHuggingFace(imageBase64) {
    const hfToken = process.env.HF_TOKEN;

    if (!hfToken || hfToken === 'your_huggingface_token_here') {
        console.log('HF_TOKEN not configured — HuggingFace auto-tagging skipped');
        return [];
    }

    try {
        console.log(`Calling HuggingFace auto-tag model: ${AUTO_TAG_MODEL}`);

        const response = await axios.post(
            `${HF_API_URL}/${AUTO_TAG_MODEL}`,
            { inputs: imageBase64 },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        console.log('Auto-tag response status:', response.status);

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            console.log('Auto-tag: unexpected response format', typeof response.data);
            return [];
        }

        // Process classification results
        const results = response.data;
        const tags = [];

        for (const item of results) {
            if (item.score >= AUTO_TAG_CONFIDENCE) {
                const cleaned = cleanHuggingFaceLabel(item.label);
                if (cleaned && !tags.includes(cleaned)) {
                    tags.push(cleaned);
                }
            }
            if (tags.length >= AUTO_TAG_MAX_TAGS) break;
        }

        console.log(`HuggingFace auto-tag generated ${tags.length} tags:`, tags);
        return tags;
    } catch (error) {
        console.error('HuggingFace auto-tag error:', error.message);
        if (error.response) {
            console.error('Auto-tag response status:', error.response.status);
            console.error('Auto-tag response data:', JSON.stringify(error.response.data).substring(0, 300));
        }
        return [];
    }
}

/**
 * Auto-tag an image using the configured provider.
 * Provider is selected via AUTO_TAG_PROVIDER env var:
 *   - 'google-vision' → Google Cloud Vision API
 *   - anything else (or default) → HuggingFace Inference API
 * 
 * @param {string} imageBase64 - Base64-encoded image data
 * @returns {Promise<string[]>} Array of suggested tag names (empty on failure)
 */
async function autoTagImage(imageBase64) {
    const provider = (process.env.AUTO_TAG_PROVIDER || 'huggingface').toLowerCase();
    
    if (provider === 'google-vision') {
        console.log('Using Google Cloud Vision for auto-tagging');
        return await detectLabels(imageBase64);
    }
    
    // Default: HuggingFace
    console.log('Using HuggingFace for auto-tagging');
    return await autoTagWithHuggingFace(imageBase64);
}

module.exports = { autoTagImage };
