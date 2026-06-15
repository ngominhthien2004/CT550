const asyncHandler = require('express-async-handler');
const { chatWithAI, chatStreamWithAI, buildAgentSystemPrompt } = require('../services/ai.service.js');
const { detectAIWithHuggingFace, detectWithMetadataAnalysis } = require('../services/huggingface.service.js');
const { autoTagImage } = require('../services/autoTag.service.js');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');
const Setting = require('../models/Setting');

// ── Existing Chat (backward compatible) ──
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

// ── Agent Chat (with tool calling) ──
const agentChat = asyncHandler(async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    // Get user info for context
    const user = await User.findById(req.user._id).select('username displayName');
    const userName = user.displayName || user.username;

    // Build context
    const context = { userName };

    // Build messages
    const messages = history || [];
    const systemPrompt = buildAgentSystemPrompt(context);
    messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: message });

    // First call to Ollama
    let reply = await chatWithAI(messages);

    // Check for tool calls in the response
    let toolResult = null;

    // Check for SEARCH tool
    const searchMatch = reply.match(/\[SEARCH\]([\s\S]*?)\[\/SEARCH\]/);
    if (searchMatch) {
        const query = searchMatch[1].trim();
        console.log(`Agent executing SEARCH tool: "${query}"`);
        toolResult = await executeSearchTool(query);
        reply = reply.replace(searchMatch[0], '');
    }

    // Check for RECOMMEND tool
    const recommendMatch = reply.match(/\[RECOMMEND\]([\s\S]*?)\[\/RECOMMEND\]/);
    if (recommendMatch) {
        const description = recommendMatch[1].trim();
        console.log(`Agent executing RECOMMEND tool: "${description}"`);
        toolResult = await executeRecommendTool(description, req.user._id);
        reply = reply.replace(recommendMatch[0], '');
    }

    // Check for SUMMARIZE tool
    const summarizeMatch = reply.match(/\[SUMMARIZE\]([\s\S]*?)\[\/SUMMARIZE\]/);
    if (summarizeMatch) {
        const artworkId = summarizeMatch[1].trim();
        console.log(`Agent executing SUMMARIZE tool: "${artworkId}"`);
        toolResult = await executeSummarizeTool(artworkId);
        reply = reply.replace(summarizeMatch[0], '');
    }

    // If a tool was called, feed its result back to Ollama for final response
    if (toolResult) {
        const toolMessages = [...messages];
        // Add assistant's partial response (tool call removed)
        if (reply.trim()) {
            toolMessages.push({ role: 'assistant', content: reply.trim() });
        }
        // Add tool result as a user message with context
        toolMessages.push({
            role: 'user',
            content: `Kết quả từ công cụ:\n${JSON.stringify(toolResult, null, 2)}\n\nHãy giải thích kết quả này cho người dùng bằng tiếng Việt.`
        });

        const finalReply = await chatWithAI(toolMessages);
        res.json({ reply: finalReply, toolUsed: true, toolResult });
    } else {
        // No tool call — return the direct response
        res.json({ reply: reply.trim(), toolUsed: false });
    }
});

// ── Tool Implementations ──

/**
 * Search artworks by keyword (title, tags, description).
 */
async function executeSearchTool(query) {
    try {
        // Search by title (case-insensitive regex)
        const artworks = await Artwork.find({
            title: { $regex: query, $options: 'i' }
        })
        .populate('tags', 'name')
        .select('title type ageRating images')
        .limit(10)
        .lean();

        if (artworks.length === 0) {
            // Try searching by tag name
            const tags = await Tag.find({
                name: { $regex: query, $options: 'i' }
            }).select('_id').lean();

            if (tags.length > 0) {
                const tagIds = tags.map(t => t._id);
                const tagArtworks = await Artwork.find({ tags: { $in: tagIds } })
                    .populate('tags', 'name')
                    .select('title type ageRating images')
                    .limit(10)
                    .lean();
                
                return {
                    found: tagArtworks.length,
                    artworks: tagArtworks.map(a => ({
                        title: a.title,
                        type: a.type,
                        tags: a.tags?.map(t => t.name) || [],
                        ageRating: a.ageRating,
                        hasImage: a.images && a.images.length > 0
                    }))
                };
            }
        }

        return {
            found: artworks.length,
            artworks: artworks.map(a => ({
                title: a.title,
                type: a.type,
                tags: a.tags?.map(t => t.name) || [],
                ageRating: a.ageRating,
                hasImage: a.images && a.images.length > 0
            }))
        };
    } catch (error) {
        console.error('Search tool error:', error.message);
        return { error: error.message, found: 0, artworks: [] };
    }
}

/**
 * Recommend artworks based on user preferences (favorites, bookmarks).
 */
async function executeRecommendTool(description, userId) {
    try {
        // Get user's favorited/bookmarked artworks to find similar tags
        const userFavorites = await Artwork.find({
            bookmarks: userId
        })
        .populate('tags', 'name')
        .select('tags')
        .limit(20)
        .lean();

        // Collect tag frequencies from user's favorites
        const tagCounts = {};
        for (const art of userFavorites) {
            for (const tag of (art.tags || [])) {
                const tagName = tag.name;
                if (tagName) {
                    tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                }
            }
        }

        // Get top tags from favorites
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        // Find similar artworks (excluding user's own)
        let recommendations = [];
        if (topTags.length > 0) {
            const tagDocs = await Tag.find({ name: { $in: topTags } }).select('_id').lean();
            const tagIds = tagDocs.map(t => t._id);

            recommendations = await Artwork.find({
                tags: { $in: tagIds },
                user: { $ne: userId }
            })
            .populate('tags', 'name')
            .populate('user', 'username displayName')
            .select('title type tags user ageRating')
            .limit(10)
            .sort({ likeCount: -1 })
            .lean();
        }

        return {
            basedOnFavorites: topTags.length > 0,
            favoriteTags: topTags,
            userDescription: description,
            recommendations: recommendations.map(a => ({
                title: a.title,
                type: a.type,
                tags: a.tags?.map(t => t.name) || [],
                author: a.user?.displayName || a.user?.username || 'Unknown',
                ageRating: a.ageRating
            }))
        };
    } catch (error) {
        console.error('Recommend tool error:', error.message);
        return { error: error.message, recommendations: [] };
    }
}

/**
 * Summarize an artwork by its ID.
 */
async function executeSummarizeTool(artworkId) {
    try {
        const artwork = await Artwork.findById(artworkId)
            .populate('tags', 'name')
            .populate('user', 'username displayName')
            .select('title description type tags user ageRating images likeCount viewCount')
            .lean();

        if (!artwork) {
            return { error: 'Artwork not found' };
        }

        return {
            title: artwork.title,
            description: artwork.description?.substring(0, 500) || '(no description)',
            type: artwork.type,
            tags: artwork.tags?.map(t => t.name) || [],
            author: artwork.user?.displayName || artwork.user?.username || 'Unknown',
            ageRating: artwork.ageRating,
            stats: {
                likes: artwork.likeCount || 0,
                views: artwork.viewCount || 0
            },
            hasImage: artwork.images && artwork.images.length > 0
        };
    } catch (error) {
        console.error('Summarize tool error:', error.message);
        return { error: error.message };
    }
}

// ── Existing endpoints (unchanged) ──

const recommendArtworks = asyncHandler(async (req, res) => {
    const { favoriteGenres, description } = req.body;

    const systemPrompt = `Dựa vào mô tả sở thích của người dùng, hãy gợi ý các tác phẩm nghệ thuật phù hợp từ database. 
Trả lời bằng danh sách các tựa tác phẩm, giải thích ngắn gọn tại sao phù hợp.`;

    const prompt = `Sở thích: ${favoriteGenres || 'chưa biết'}
Mô tả thêm: ${description || 'không có'}
Hãy gợi ý 5 tác phẩm phù hợp nhất.`;

    const { generateWithPrompt } = require('../services/ai.service.js');
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

    const { generateWithPrompt } = require('../services/ai.service.js');
    const result = await generateWithPrompt(query, systemPrompt);

    res.json({ analysis: result });
});

const summarizeArtwork = asyncHandler(async (req, res) => {
    const { artworkId } = req.params;

    const { generateWithPrompt } = require('../services/ai.service.js');
    
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
    agentChat,
    recommendArtworks,
    searchByAI,
    summarizeArtwork,
    detectAIImage,
    autoTagUpload
};
