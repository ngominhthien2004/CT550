const { Readable } = require('stream');

// ── Provider detection ──
const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();

// ── Ollama config ──
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
const ollamaDefaultModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b';

// ── OpenAI-compatible config ──
const openaiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openaiDefaultModel = process.env.OPENAI_MODEL || 'deepseek-chat';

// ── Status check ──
async function checkAIStatus() {
    if (AI_PROVIDER === 'openai') {
        try {
            const response = await fetch(`${openaiBaseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${openaiApiKey}` }
            });
            if (!response.ok) {
                const errText = await response.text();
                return { status: 'error', message: `API error (${response.status}): ${errText}`, provider: 'openai' };
            }
            const data = await response.json();
            return { status: 'connected', provider: 'openai', models: data.data };
        } catch (error) {
            return { status: 'error', message: error.message, provider: 'openai' };
        }
    }
    // Ollama
    try {
        const response = await fetch(`${ollamaHost}/api/tags`);
        const data = await response.json();
        return { status: 'connected', provider: 'ollama', models: data.models };
    } catch (error) {
        return { status: 'error', message: error.message, provider: 'ollama' };
    }
}

// ── Non-streaming chat ──
async function chatWithAI(messages, model) {
    if (AI_PROVIDER === 'openai') {
        return chatWithOpenAI(messages, model || openaiDefaultModel);
    }
    return chatWithOllama(messages, model || ollamaDefaultModel);
}

async function chatWithOllama(messages, model) {
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

async function chatWithOpenAI(messages, model) {
    const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({ model, messages, stream: false })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

// ── Streaming chat ──
async function chatStreamWithAI(messages, model) {
    if (AI_PROVIDER === 'openai') {
        return chatStreamWithOpenAI(messages, model || openaiDefaultModel);
    }
    return chatStreamWithOllama(messages, model || ollamaDefaultModel);
}

async function chatStreamWithOllama(messages, model) {
    const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama streaming error (${response.status}): ${errText}`);
    }

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
                    buffer = lines.pop() || '';

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

async function chatStreamWithOpenAI(messages, model) {
    const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({ model, messages, stream: true })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI streaming error (${response.status}): ${errText}`);
    }

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
                        this.push(null);
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;
                        // SSE format: "data: {...}"
                        if (trimmed.startsWith('data: ')) {
                            const jsonStr = trimmed.slice(6).trim();
                            if (jsonStr === '[DONE]') {
                                this.push(JSON.stringify({ token: '', done: true }));
                                this.push(null);
                                return;
                            }
                            try {
                                const parsed = JSON.parse(jsonStr);
                                const token = parsed.choices?.[0]?.delta?.content || '';
                                this.push(JSON.stringify({ token, done: false }));
                            } catch (e) {
                                // skip malformed JSON
                            }
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

// ── Generate with prompt ──
async function generateWithPrompt(prompt, systemPrompt, model) {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];
    return chatWithAI(messages, model);
}

// ── Build system prompt ──
function buildAgentSystemPrompt(context = {}) {
    return `Bạn là trợ lý AI thân thiện của IlluWrl - nền tảng chia sẻ artwork, manga, novel và illustration.

Nhiệm vụ của bạn:
- Trả lời câu hỏi về nghệ thuật, illustration, manga, novel
- Giải thích kết quả tìm kiếm artwork cho người dùng
- Gợi ý tác phẩm dựa trên sở thích
- Tóm tắt nội dung tác phẩm nghệ thuật
- Trò chuyện tự nhiên, thân thiện

Khi tôi cung cấp cho bạn dữ liệu từ database (kết quả tìm kiếm, gợi ý, tóm tắt), hãy giải thích chúng cho người dùng một cách dễ hiểu và hấp dẫn.

TÍNH NĂNG AGENT:
- Khi người dùng yêu cầu tìm kiếm, tôi sẽ tự động điều hướng họ đến trang kết quả tìm kiếm.
- Khi người dùng yêu cầu tóm tắt artwork, tôi sẽ tự động mở trang chi tiết artwork đó.
- Khi người dùng yêu cầu gợi ý, tôi sẽ hiển thị các tác phẩm phổ biến.
- Luôn giải thích rõ ràng những gì tôi đang làm cho người dùng.

Luôn trả lời bằng tiếng Việt (trừ khi người dùng hỏi bằng ngôn ngữ khác), thân thiện, và tập trung vào nghệ thuật/hội họa.
${context.userName ? `\nNgười dùng hiện tại: ${context.userName}` : ''}
${context.artworkContext ? `\nNgữ cảnh artwork: ${context.artworkContext}` : ''}`;
}

// ── Keep old name as alias for backward compatibility ──
const checkOllamaStatus = checkAIStatus;

module.exports = {
    checkAIStatus,
    checkOllamaStatus,  // backward compat
    chatWithAI,
    chatStreamWithAI,
    generateWithPrompt,
    buildAgentSystemPrompt,
    defaultModel: AI_PROVIDER === 'openai' ? openaiDefaultModel : ollamaDefaultModel,
    provider: AI_PROVIDER
};
