function normalizeOllamaHost(raw) {
  if (!raw) return 'http://localhost:11434';
  let host = raw.trim();
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    // Nếu là IP hoặc hostname không có protocol, thêm http:// và port mặc định
    if (!host.includes(':')) {
      host = `http://${host}:11434`;
    } else {
      host = `http://${host}`;
    }
  }
  return host.replace(/\/+$/, ''); // xóa trailing slash
}

const ollamaHost = normalizeOllamaHost(process.env.OLLAMA_HOST);
const defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b';

async function checkOllamaStatus() {
    try {
        const response = await fetch(`${ollamaHost}/api/tags`);
        const data = await response.json();
        return { status: 'connected', models: data.models };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

async function chatWithAI(messages, model = defaultModel) {
    const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages
        })
    });
    
    const data = await response.json();
    return data.message.content;
}

async function generateWithPrompt(prompt, systemPrompt, model = defaultModel) {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];
    return chatWithAI(messages, model);
}

module.exports = {
    checkOllamaStatus,
    chatWithAI,
    generateWithPrompt,
    defaultModel
};