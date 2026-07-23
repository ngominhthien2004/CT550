const axios = require('axios');

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Detect labels in an image using Google Cloud Vision API.
 * Returns an array of label strings (lowercase, cleaned).
 * @param {string} imageBase64 - Base64-encoded image data (without data URI prefix)
 * @returns {Promise<string[]>} Array of label names
 */
async function detectLabels(imageBase64) {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey || apiKey === 'your_google_vision_api_key_here') {
        return [];
    }

    const maxResults = parseInt(process.env.AUTO_TAG_MAX_TAGS || '10', 10);
    const minConfidence = parseFloat(process.env.GOOGLE_VISION_CONFIDENCE || '0.6');

    try {
        const response = await axios.post(
            `${VISION_API_URL}?key=${apiKey}`,
            {
                requests: [{
                    image: {
                        content: imageBase64
                    },
                    features: [{
                        type: 'LABEL_DETECTION',
                        maxResults: maxResults
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        // Check for errors in the response
        if (response.data?.responses?.[0]?.error) {
            console.error('Google Vision API error:', response.data.responses[0].error.message);
            return [];
        }

        // Extract labels
        const labels = response.data?.responses?.[0]?.labelAnnotations || [];
        
        if (labels.length === 0) {
            return [];
        }

        // Process labels: filter by confidence and clean
        const tags = [];
        for (const label of labels) {
            if (label.score >= minConfidence) {
                const cleaned = cleanLabel(label.description);
                if (cleaned && !tags.includes(cleaned)) {
                    tags.push(cleaned);
                }
            }
            if (tags.length >= maxResults) break;
        }

        return tags;
    } catch (error) {
        console.error('Google Vision API error:', error.message);
        if (error.response) {
            console.error('Google Vision response status:', error.response.status);
            console.error('Google Vision response data:', JSON.stringify(error.response.data).substring(0, 500));
        }
        return [];
    }
}

/**
 * Clean a label description into a valid tag name.
 * "Mountain range" → "mountain_range"
 */
function cleanLabel(label) {
    if (!label) return '';
    return label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/^_+|_+$/g, '')
        .substring(0, 50);
}

module.exports = { detectLabels };
