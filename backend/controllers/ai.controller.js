const asyncHandler = require('express-async-handler');
const { chatWithAI, chatStreamWithAI, buildAgentSystemPrompt } = require('../services/ai.service.js');
const { detectAIWithHuggingFace, detectWithMetadataAnalysis } = require('../services/huggingface.service.js');
const { autoTagImage } = require('../services/autoTag.service.js');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');
const Request = require('../models/Request');
const Setting = require('../models/Setting');
const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');

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

// ── Agent Chat (streaming, SSE) ──
const agentChatStream = asyncHandler(async (req, res) => {
    const { message, history, sessionId } = req.body;

    // --- Guard clause ---
    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    // ----- Save user message immediately (before streaming) -----
    let savedSessionId = sessionId;
    if (sessionId) {
        await ChatMessage.create({
            session: sessionId,
            role: 'user',
            content: message
        });
        await ChatSession.findByIdAndUpdate(sessionId, { updatedAt: new Date() });
    }

    // Get user info for context
    const user = await User.findById(req.user._id).select('username displayName');
    const userName = user.displayName || user.username;

    // Detect intent
    const intent = detectIntent(message);
    console.log(`Agent intent detected: "${intent}" for message: "${message.substring(0, 50)}..."`);

    let toolResult = null;
    let toolUsed = false;

    if (intent === 'search') {
        const query = extractSearchQuery(message);
        console.log(`Agent executing SEARCH tool with query: "${query}"`);
        toolResult = await executeSearchTool(query || message, req.user._id);
        toolUsed = true;
    } else if (intent === 'recommend') {
        const description = extractRecommendQuery(message);
        console.log(`Agent executing RECOMMEND tool with: "${description}"`);
        toolResult = await executeRecommendTool(description || message, req.user._id);
        toolUsed = true;
    } else if (intent === 'summarize') {
        const idMatch = message.match(/[a-fA-F0-9]{24}/);
        const artworkId = idMatch ? idMatch[0] : null;
        console.log(`Agent executing SUMMARIZE tool for ID: "${artworkId || 'unknown'}"`);
        toolResult = await executeSummarizeTool(artworkId);
        toolUsed = true;
    }

    // Build messages for AI
    const context = { userName };
    const systemPrompt = buildAgentSystemPrompt(context);
    const aiMessages = history || [];

    let stream;
    if (toolUsed && toolResult) {
        aiMessages.push({ role: 'system', content: systemPrompt });
        aiMessages.push({ role: 'user', content: message });
        aiMessages.push({
            role: 'user',
            content: `Kết quả từ database:\n${JSON.stringify(toolResult, null, 2)}\n\nHãy giải thích kết quả này cho người dùng bằng tiếng Việt một cách thân thiện và dễ hiểu. Nếu không có kết quả, hãy nói với người dùng và gợi ý họ thử từ khóa khác.`
        });
        stream = await chatStreamWithAI(aiMessages);
    } else {
        aiMessages.push({ role: 'system', content: systemPrompt });
        aiMessages.push({ role: 'user', content: message });
        stream = await chatStreamWithAI(aiMessages);
    }

    // ----- Set SSE headers -----
    // All pre-checks passed; commit to streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream tokens as SSE events; collect full reply for persistence
    let fullReply = '';

    try {
        for await (const chunk of stream) {
            const parsed = JSON.parse(chunk);
            if (parsed.token) {
                fullReply += parsed.token;
                res.write(`data: ${JSON.stringify({ token: parsed.token })}\n\n`);
            }
            if (parsed.done) {
                // ----- Save assistant reply only after streaming completes -----
                if (savedSessionId) {
                    await ChatMessage.create({
                        session: savedSessionId,
                        role: 'assistant',
                        content: fullReply,
                        toolUsed
                    });

                    // Update session title if this was the first exchange
                    const msgCount = await ChatMessage.countDocuments({ session: savedSessionId });
                    if (msgCount <= 3) {
                        const title = message.length > 50
                            ? message.substring(0, 47) + '...'
                            : message;
                        await ChatSession.findByIdAndUpdate(savedSessionId, { title });
                    }
                }

                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }
        }
    } catch (err) {
        console.error('Agent streaming error:', err.message);
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        } else {
            throw err;
        }
    }
});

// ── Agent Chat (with tool calling) ──
const agentChat = asyncHandler(async (req, res) => {
    const { message, history, sessionId } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    // ----- Lưu tin nhắn user vào session (nếu có sessionId) -----
    let savedSessionId = sessionId;
    if (sessionId) {
        // Lưu message của user
        await ChatMessage.create({
            session: sessionId,
            role: 'user',
            content: message
        });
        // Cập nhật updatedAt
        await ChatSession.findByIdAndUpdate(sessionId, { updatedAt: new Date() });
    }

    // Get user info for context
    const user = await User.findById(req.user._id).select('username displayName');
    const userName = user.displayName || user.username;

    // Detect intent
    const intent = detectIntent(message);
    console.log(`Agent intent detected: "${intent}" for message: "${message.substring(0, 50)}..."`);

    let toolResult = null;
    let toolUsed = false;

    if (intent === 'search') {
        const query = extractSearchQuery(message);
        console.log(`Agent executing SEARCH tool with query: "${query}"`);
        toolResult = await executeSearchTool(query || message, req.user._id);
        toolUsed = true;
    } else if (intent === 'recommend') {
        const description = extractRecommendQuery(message);
        console.log(`Agent executing RECOMMEND tool with: "${description}"`);
        toolResult = await executeRecommendTool(description || message, req.user._id);
        toolUsed = true;
    } else if (intent === 'summarize') {
        // Try to extract artwork ID from message (24-char hex)
        const idMatch = message.match(/[a-fA-F0-9]{24}/);
        const artworkId = idMatch ? idMatch[0] : null;
        console.log(`Agent executing SUMMARIZE tool for ID: "${artworkId || 'unknown'}"`);
        toolResult = await executeSummarizeTool(artworkId);
        toolUsed = true;
    }

    // Build messages for AI
    const context = { userName };
    const systemPrompt = buildAgentSystemPrompt(context);
    const aiMessages = history || [];

    let reply;
    if (toolUsed && toolResult) {
        // Tool was executed — ask AI to explain the results
        aiMessages.push({ role: 'system', content: systemPrompt });

        // Add the user's original message for context
        aiMessages.push({ role: 'user', content: message });

        // Add tool result
        aiMessages.push({
            role: 'user',
            content: `Kết quả từ database:\n${JSON.stringify(toolResult, null, 2)}\n\nHãy giải thích kết quả này cho người dùng bằng tiếng Việt một cách thân thiện và dễ hiểu. Nếu không có kết quả, hãy nói với người dùng và gợi ý họ thử từ khóa khác.`
        });

        reply = await chatWithAI(aiMessages);
    } else {
        // No tool — direct chat
        aiMessages.push({ role: 'system', content: systemPrompt });
        aiMessages.push({ role: 'user', content: message });

        reply = await chatWithAI(aiMessages);
    }

    // ----- Lưu tin nhắn assistant vào session (nếu có sessionId) -----
    if (savedSessionId) {
        await ChatMessage.create({
            session: savedSessionId,
            role: 'assistant',
            content: reply,
            toolUsed
        });

        // Cập nhật title nếu đây là lần chat đầu tiên
        const msgCount = await ChatMessage.countDocuments({ session: savedSessionId });
        // welcome + user + vừa thêm assistant => nếu msgCount <= 3 là chưa có title
        if (msgCount <= 3) {
            const title = message.length > 50
                ? message.substring(0, 47) + '...'
                : message;
            await ChatSession.findByIdAndUpdate(savedSessionId, { title });
        }
    }

    res.json({ reply, toolUsed, toolResult });
});

// ── Tool Implementations ──

/**
 * Search artworks by keyword (title, tags, description).
 */
async function executeSearchTool(query, userId) {
    try {
        const result = { artworks: [], users: [], plans: [], tags: [] };
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        // 1. Search artworks by title
        const artworksByTitle = await Artwork.find({ title: regex })
            .populate('tags', 'name')
            .select('title type ageRating images')
            .limit(5)
            .lean();
        
        // 2. Search artworks by tags
        const tags = await Tag.find({ name: regex }).select('_id name').lean();
        let artworksByTag = [];
        if (tags.length > 0) {
            const tagIds = tags.map(t => t._id);
            artworksByTag = await Artwork.find({ tags: { $in: tagIds } })
                .populate('tags', 'name')
                .select('title type ageRating images')
                .limit(5)
                .lean();
        }

        // Merge artworks, dedup by _id
        const seenIds = new Set();
        const allArtworks = [...artworksByTitle, ...artworksByTag];
        for (const a of allArtworks) {
            if (!seenIds.has(a._id.toString())) {
                seenIds.add(a._id.toString());
                result.artworks.push({
                    title: a.title,
                    type: a.type,
                    tags: a.tags?.map(t => t.name) || [],
                    ageRating: a.ageRating,
                    hasImage: a.images && a.images.length > 0
                });
            }
        }

        // 3. Search users by username or displayName
        const users = await User.find({
            $or: [
                { username: regex },
                { displayName: regex }
            ]
        })
        .select('username displayName avatar bio')
        .limit(5)
        .lean();

        result.users = users.map(u => ({
            username: u.username,
            displayName: u.displayName || u.username,
            hasAvatar: !!u.avatar,
            bio: u.bio ? u.bio.substring(0, 100) : ''
        }));

        // 4. Search plans (commission requests) by title
        const plans = await Request.find({ title: regex })
            .populate('creator', 'username displayName')
            .select('title workType targetPrice currency status')
            .limit(5)
            .lean();

        result.plans = plans.map(p => ({
            title: p.title,
            workType: p.workType,
            price: p.targetPrice ? `${p.currency || 'USD'} ${p.targetPrice}` : 'Negotiable',
            status: p.status,
            creator: p.creator?.displayName || p.creator?.username || 'Unknown'
        }));

        // 5. Return matched tags too
        result.tags = tags.map(t => t.name);

        result.found = {
            artworks: result.artworks.length,
            users: result.users.length,
            plans: result.plans.length,
            tags: result.tags.length
        };

        return result;
    } catch (error) {
        console.error('Search tool error:', error.message);
        return { error: error.message, found: { artworks: 0, users: 0, plans: 0, tags: 0 }, artworks: [], users: [], plans: [], tags: [] };
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

// ── Intent Detection Helpers ──

/**
 * Detect user intent from message using keyword patterns.
 * @returns {'search'|'recommend'|'summarize'|'chat'}
 */
function detectIntent(message) {
    const lower = message.toLowerCase().trim();

    // Search patterns - ưu tiên kiểm tra trước
    if (/tìm/i.test(lower) ||
        /search/i.test(lower) ||
        /tìm kiếm/i.test(lower) ||
        /có (artwork|tác phẩm|tranh|ảnh) (nào|về)/i.test(lower) ||
        /cho xem/i.test(lower)) {
        return 'search';
    }

    // Recommend patterns
    if (/gợi.ý/i.test(lower) ||
        /đề xuất/i.test(lower) ||
        /recommend/i.test(lower) ||
        /suggest/i.test(lower) ||
        /giới thiệu/i.test(lower) ||
        /gợi ý cho tôi/i.test(lower)) {
        return 'recommend';
    }

    // Summarize patterns
    if (/tóm tắt/i.test(lower) ||
        /summarize/i.test(lower) ||
        /tổng quan/i.test(lower)) {
        return 'summarize';
    }

    return 'chat';
}

/**
 * Extract search query from user message by removing trigger words.
 */
function extractSearchQuery(message) {
    return message
        .replace(/^tìm\s+(?:artwork|tác phẩm|tranh|ảnh|về|kiếm)?\s*/i, '')
        .replace(/tìm kiếm\s*/i, '')
        .replace(/search\s*/i, '')
        .replace(/có artwork nào về\s*/i, '')
        .replace(/cho (tôi )?xem\s*/i, '')
        .trim() || message.trim();
}

/**
 * Extract recommendation description from user message.
 */
function extractRecommendQuery(message) {
    return message
        .replace(/^(gợi.ý|đề xuất|recommend|suggest|giới thiệu)\s*/i, '')
        .replace(/gợi ý cho tôi\s*/i, '')
        .trim() || message.trim();
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
    agentChatStream,
    recommendArtworks,
    searchByAI,
    summarizeArtwork,
    detectAIImage,
    autoTagUpload
};
