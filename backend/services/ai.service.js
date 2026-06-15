const { Readable } = require('stream');

function normalizeOllamaHost(raw) {
    if (!raw) return 'http://localhost:11434';
    let host = raw.trim();
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
        if (!host.includes(':')) {
            host = `http://${host}:11434`;
        } else {
            host = `http://${host}`;
        }
    }
    return host.replace(/\/+$/, '');
}

const ollamaHost = normalizeOllamaHost(process.env.OLLAMA_HOST);
const defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b';

/**
 * Check if Ollama is running and available.
 */
async function checkOllamaStatus() {
    try {
        const response = await fetch(`${ollamaHost}/api/tags`);
        const data = await response.json();
        return { status: 'connected', models: data.models };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

/**
 * Non-streaming chat with Ollama.
 * @param {Array} messages - Array of { role, content } objects
 * @param {string} model - Model name
 * @returns {Promise<string>} - Response content
 */
async function chatWithAI(messages, model = defaultModel) {
    const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    return data.message.content;
}

/**
 * Streaming chat with Ollama.
 * Returns a Readable stream that emits SSE-like data chunks.
 * Each chunk is a JSON string: { "token": "...", "done": false }
 * @param {Array} messages - Array of { role, content } objects
 * @param {string} model - Model name
 * @returns {Promise<Readable>} - Readable stream of tokens
 */
async function chatStreamWithAI(messages, model = defaultModel) {
    const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama streaming error (${response.status}): ${errText}`);
    }

    // Create a readable stream that yields parsed tokens
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new Readable({
        objectMode: true,
        async read() {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Process remaining buffer
                        if (buffer.trim()) {
                            try {
                                const parsed = JSON.parse(buffer);
                                this.push(JSON.stringify({ token: parsed.message?.content || '', done: true }));
                            } catch (e) {
                                // ignore parse errors on leftover
                            }
                        }
                        this.push(null);
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;
                        try {
                            const parsed = JSON.parse(trimmed);
                            const token = parsed.message?.content || '';
                            this.push(JSON.stringify({ token, done: parsed.done || false }));
                            if (parsed.done) {
                                this.push(null);
                                return;
                            }
                        } catch (e) {
                            // skip malformed lines
                        }
                    }
                }
            } catch (err) {
                this.destroy(err);
            }
        }
    });

    return stream;
}

/**
 * Generate a response using a simple prompt (non-streaming).
 */
async function generateWithPrompt(prompt, systemPrompt, model = defaultModel) {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];
    return chatWithAI(messages, model);
}

/**
 * Build the system prompt for the AI art assistant agent.
 * @param {Object} context - Optional context { userName, artworkContext }
 * @returns {string} - System prompt
 */
function buildAgentSystemPrompt(context = {}) {
    return `Bạn là trợ lý AI của IlluWrl - nền tảng chia sẻ artwork, manga, novel và illustration.

Bạn có các công cụ sau để hỗ trợ người dùng:

1. **search**: Tìm kiếm artwork theo từ khóa. 
   Cú pháp: [SEARCH]từ khóa[/SEARCH]
   Kết quả trả về danh sách artwork phù hợp.

2. **recommend**: Gợi ý artwork dựa trên sở thích.
   Cú pháp: [RECOMMEND]mô tả sở thích[/RECOMMEND]
   Kết quả trả về danh sách gợi ý.

3. **summarize**: Tóm tắt nội dung artwork.
   Cú pháp: [SUMMARIZE]artwork_id[/SUMMARIZE]

4. **analyze**: Phân tích ảnh (phát hiện AI).
   Cú pháp: [ANALYZE]image_description[/ANALYZE]

Khi người dùng yêu cầu một trong các tác vụ trên, hãy trả lời bằng cách sử dụng cú pháp tương ứng.
Sau đó, khi nhận được kết quả từ công cụ, hãy giải thích kết quả cho người dùng bằng tiếng Việt.

Luôn trả lời bằng tiếng Việt, thân thiện, và tập trung vào nghệ thuật/hội họa.
${context.userName ? `Người dùng hiện tại: ${context.userName}` : ''}
${context.artworkContext ? `Ngữ cảnh artwork: ${context.artworkContext}` : ''}`;
}

module.exports = {
    checkOllamaStatus,
    chatWithAI,
    chatStreamWithAI,
    generateWithPrompt,
    buildAgentSystemPrompt,
    defaultModel,
    ollamaHost
};
