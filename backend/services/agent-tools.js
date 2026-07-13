/**
 * Agent Tools — builds frontend action frames from AI intent + tool results.
 * Actions are emitted via SSE so the frontend can execute them (navigate, search, etc.)
 */

/**
 * Build agent actions based on detected intent and message content.
 * @param {'search'|'recommend'|'summarize'|'chat'} intent
 * @param {string} message - Original user message
 * @param {object|null} toolResult - Result from executed tool (if any)
 * @returns {Array<{type: string, params: object}>}
 */
function buildAgentActions(intent, message, toolResult) {
    const actions = [];

    switch (intent) {
        case 'search': {
            const query = extractSearchQuery(message);
            const type = detectSearchType(message);
            const age = detectAgeFilter(message);
            const order = detectSortOrder(message);

            const params = { q: query };
            if (type) params.type = type;
            if (age && age !== 'all') params.age = age;
            if (order && order !== 'newest') params.order = order;

            actions.push({ type: 'search', params });
            break;
        }

        case 'recommend': {
            // Navigate to discovery page or search sorted by popular
            actions.push({ type: 'search', params: { order: 'popular' } });
            break;
        }

        case 'summarize': {
            const idMatch = message.match(/[a-fA-F0-9]{24}/);
            if (idMatch) {
                actions.push({ type: 'view-artwork', params: { id: idMatch[0] } });
            }
            break;
        }

        // 'chat' intent = no action
    }

    return actions;
}

/**
 * Extract search query by removing trigger words and type/age hints.
 */
function extractSearchQuery(message) {
    return message
        .replace(/^tìm\s+(?:artwork|tác phẩm|tranh|ảnh|về|kiếm)?\s*/i, '')
        .replace(/tìm kiếm\s*/i, '')
        .replace(/search\s*/i, '')
        .replace(/có artwork nào về\s*/i, '')
        .replace(/cho (tôi )?xem\s*/i, '')
        .replace(/\b(illust|illustration|manga|novel|gif|thể loại|loại)\s*/gi, '')
        .replace(/\b(all ages|safe|r18|all)\s*/gi, '')
        .replace(/\b(mới nhất|phổ biến|nổi bật|popular|newest)\s*/gi, '')
        .trim() || message.trim();
}

/**
 * Detect artwork type from user message.
 */
function detectSearchType(message) {
    const lower = message.toLowerCase();
    if (/\bmanga\b/.test(lower)) return 'manga';
    if (/\bnovel\b/.test(lower) || /\btruyện\b/.test(lower)) return 'novel';
    if (/\bgif\b/.test(lower)) return 'gif';
    // 'illust' is default
    return 'illust';
}

/**
 * Detect age filter from user message.
 */
function detectAgeFilter(message) {
    const lower = message.toLowerCase();
    if (/\br18\b/.test(lower) || /\b18\+\b/.test(lower)) return 'r18';
    if (/\bsafe\b/.test(lower) || /all ages\b/.test(lower)) return 'safe';
    return 'all';
}

/**
 * Detect sort order from user message.
 */
function detectSortOrder(message) {
    const lower = message.toLowerCase();
    if (/phổ biến|nổi bật|popular/.test(lower)) return 'popular';
    return 'newest';
}

module.exports = { buildAgentActions };
