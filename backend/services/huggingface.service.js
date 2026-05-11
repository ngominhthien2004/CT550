const axios = require('axios');

const HF_API_URL = 'https://api-inference.huggingface.co/models';

async function detectAIWithHuggingFace(imageBase64) {
    const hfToken = process.env.HF_TOKEN;
    
    if (!hfToken || hfToken === 'your_huggingface_token_here') {
        return {
            error: 'HF_TOKEN not configured',
            fallback: true
        };
    }

    const model = 'umm-maybe/AI-image-detector';
    
    try {
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { inputs: imageBase64 },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('HF Response:', JSON.stringify(response.data));

        if (response.data && response.data[0]) {
            const results = response.data[0];
            return processHFResults(results);
        }

        return { error: 'Invalid response', fallback: true };
    } catch (error) {
        console.error('HF Error:', error.message);
        return {
            error: error.message,
            fallback: true
        };
    }
}

function processHFResults(results) {
    const labels = results.map(r => r.label.toLowerCase());
    const scores = results.map(r => r.score);
    
    const aiIdx = labels.findIndex(l => l.includes('ai') || l.includes('generated') || l.includes('computer'));
    const realIdx = labels.findIndex(l => l.includes('real') || l.includes('natural') || l.includes('photo'));
    
    const aiScore = aiIdx >= 0 ? scores[aiIdx] : 0;
    const realScore = realIdx >= 0 ? scores[realIdx] : 0;
    
    const isAI = aiScore > realScore;
    const confidence = Math.round(Math.max(aiScore, realScore) * 100);
    
    return {
        isAI,
        confidence,
        reason: isAI 
            ? `AI generated (${confidence}%)`
            : `Real image (${confidence}%)`,
        model: 'umm-maybe/AI-image-detector',
        allResults: results
    };
}

async function detectWithMetadataAnalysis(imageBuffer) {
    const size = imageBuffer.length;
    const type = detectImageType(imageBuffer);
    const patterns = analyzeCompressionPatterns(imageBuffer);
    const sizeCategory = getSizeCategory(size);
    
    let aiScore = 0;
    let reasons = [];
    
    if (size > 200000) {
        aiScore += 20;
        reasons.push('kích thước lớn (>200KB)');
    }
    
    if (type === 'png' && size > 500000) {
        aiScore += 25;
        reasons.push('PNG kích thước rất lớn');
    }
    
    if (patterns.hasJPEGArtifacts) {
        aiScore += 15;
        reasons.push('JPEG artifacts bất thường');
    }
    
    if (patterns.hasUniformPatterns) {
        aiScore += 20;
        reasons.push('patterns đồng nhất bất thường');
    }
    
    if (size < 10000) {
        aiScore -= 10;
    }
    
    const isAI = aiScore > 30;
    const confidence = Math.min(85, Math.max(30, 50 + aiScore));
    
    const reason = reasons.length > 0 
        ? `AI indicators: ${reasons.join(', ')}`
        : 'Không phát hiện đặc điểm đặc biệt - ảnh có vẻ tự nhiên';
    
    return {
        isAI,
        confidence,
        reason,
        method: 'metadata-analysis',
        details: {
            size,
            type,
            sizeCategory,
            aiScore,
            indicators: reasons
        }
    };
}

function detectImageType(buffer) {
    if (buffer.length < 4) return 'unknown';
    const header = buffer.slice(0, 4).toString('hex');
    if (header.startsWith('89504e47')) return 'png';
    if (header.startsWith('ffd8ff')) return 'jpeg';
    if (header.startsWith('47494638')) return 'gif';
    if (header.startsWith('424d')) return 'bmp';
    if (header.startsWith('49492a00') || header.startsWith('4d4d002a')) return 'tiff';
    return 'unknown';
}

function analyzeCompressionPatterns(buffer) {
    if (buffer.length < 1000) {
        return { hasJPEGArtifacts: false, hasUniformPatterns: false };
    }
    
    const hex = buffer.toString('hex').toLowerCase();
    const hasJPEGArtifacts = hex.includes('ffd9') && hex.includes('ffda');
    
    const sampleSize = Math.min(1000, buffer.length);
    const sample = buffer.slice(0, sampleSize);
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < sample.length; i++) {
        sum += sample[i];
        sumSq += sample[i] * sample[i];
    }
    const mean = sum / sample.length;
    const variance = (sumSq / sample.length) - (mean * mean);
    const hasUniformPatterns = variance < 500;
    
    return { hasJPEGArtifacts, hasUniformPatterns };
}

function getSizeCategory(bytes) {
    if (bytes < 50000) return 'small';
    if (bytes < 500000) return 'medium';
    return 'large';
}

module.exports = {
    detectAIWithHuggingFace,
    detectWithMetadataAnalysis
};