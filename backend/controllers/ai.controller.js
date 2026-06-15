const asyncHandler = require('express-async-handler');
const { chatWithAI, generateWithPrompt } = require('../services/ai.service.js');
const { detectAIWithHuggingFace, detectWithMetadataAnalysis } = require('../services/huggingface.service.js');
const { autoTagImage } = require('../services/autoTag.service.js');
const User = require('../models/User');
const Setting = require('../models/Setting');

const chat = asyncHandler(async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    const systemPrompt = `Bạn là một trợ lý chuyên về nghệ thuật và tranh (IlluWrl). 
Nhiệm vụ của bạn là:
1. Trả lời câu hỏi về nghệ thuật, illustration, manga, novel
2. Gợi ý tác phẩm hay dựa trên sở thích người dùng
3. Tóm tắt nội dung tác phẩm
4. Trả lời bằng tiếng Việt`;

    const messages = history || [];
    messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: message });

    const reply = await chatWithAI(messages);
    
    res.json({ reply });
});

const recommendArtworks = asyncHandler(async (req, res) => {
    const { favoriteGenres, description } = req.body;

    const systemPrompt = `Dựa vào mô tả sở thích của người dùng, hãy gợi ý các tác phẩm nghệ thuật phù hợp từ database. 
Trả lời bằng danh sách các tựa tác phẩm, giải thích ngắn gọn tại sao phù hợp.`;

    const prompt = `Sở thích: ${favoriteGenres || 'chưa biết'}
Mô tả thêm: ${description || 'không có'}
Hãy gợi ý 5 tác phẩm phù hợp nhất.`;

    const reply = await generateWithPrompt(prompt, systemPrompt);
    
    res.json({ recommendations: reply });
});

const searchByAI = asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query) {
        res.status(400);
        throw new Error('Query is required');
    }

    const systemPrompt = `Bạn là chuyên gia tìm kiếm tác phẩm nghệ thuật. 
Hãy phân tích yêu cầu của người dùng và đề xuất:
1. Từ khóa tìm kiếm phù hợp
2. Thể loại có thể theo yêu cầu
3. Bộ lọc nên áp dụng`;

    const result = await generateWithPrompt(query, systemPrompt);
    
    res.json({ analysis: result });
});

const summarizeArtwork = asyncHandler(async (req, res) => {
    const { artworkId } = req.params;

    const systemPrompt = `Bạn là chuyên gia tóm tắt tác phẩm nghệ thuật. Hãy tóm tắt ngắn gọn và hấp dẫn.`;

    const prompt = `Hãy tóm tắt tác phẩm ${artworkId} trong 2-3 câu.`;

    const summary = await generateWithPrompt(prompt, systemPrompt);
    
    res.json({ summary });
});

const detectAIImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Vui lòng tải lên một hình ảnh');
    }

    const imageBuffer = req.file.buffer;
    const imageSize = imageBuffer.length;
    const imageType = req.file.mimetype;
    const base64Image = imageBuffer.toString('base64');

    const settings = await Setting.getSettings();
    if (!settings.aiDetectionEnabled) {
      res.status(403);
      throw new Error('AI detection is currently disabled by admin');
    }

    const hfResult = await detectAIWithHuggingFace(base64Image);

    let result;
    
    if (hfResult.error) {
        result = {
            success: false,
            error: hfResult.error,
            method: hfResult.isFallback ? 'huggingface-fallback' : 'huggingface',
            imageSize,
            imageType
        };
    } else {
        result = {
            success: true,
            isAI: hfResult.isAI,
            confidence: hfResult.confidence,
            reason: hfResult.reason,
            model: hfResult.model || 'unknown',
            method: hfResult.isFallback ? 'huggingface-fallback' : 'huggingface',
            imageSize,
            imageType,
            hfError: hfResult.hfError || null,
            isFallback: hfResult.isFallback || false
        };
    }

    res.json(result);
});

const autoTagUpload = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image');
    }

    const settings = await Setting.getSettings();
    if (!settings.autoTaggingEnabled) {
        res.status(403);
        throw new Error('Auto-tagging is currently disabled by admin');
    }

    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    const tags = await autoTagImage(base64Image);

    res.json({
        success: true,
        tags,
        count: tags.length,
    });
});

module.exports = {
    chat,
    recommendArtworks,
    searchByAI,
    summarizeArtwork,
    detectAIImage,
    autoTagUpload
};