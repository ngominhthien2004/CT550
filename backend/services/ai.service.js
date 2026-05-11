const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
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