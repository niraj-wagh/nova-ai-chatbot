require('dotenv').config();
const OpenAI = require('openai');

class AIService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    const model   = process.env.AI_MODEL || 'llama-3.1-8b-instant';

    console.log('🤖 AI Provider: Groq');
    console.log('🧠 AI Model:', model);

    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      console.error('❌ GROQ_API_KEY missing in .env');
    }

    this.model     = model;
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1024;
    this.client    = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  _clean(text) {
    return (text || '').replace(/[\uD800-\uDFFF]/g, '').trim();
  }

  _msgs(messages) {
    return messages
      .map(m => ({ role: m.role, content: this._clean(m.content) }))
      .filter(m => m.content.length > 0);
  }

  async generateResponse(messages) {
    const res = await this.client.chat.completions.create({
      model:      this.model,
      max_tokens: this.maxTokens,
      messages:   this._msgs(messages),
    });
    return {
      content:         res.choices[0].message.content,
      model:           res.model,
      usage:           { totalTokens: res.usage?.total_tokens || 0 },
      processingTime:  0,
      provider:        'groq',
    };
  }

  async generateStream(messages, onChunk, onDone, onError) {
    try {
      const stream = await this.client.chat.completions.create({
        model:      this.model,
        max_tokens: this.maxTokens,
        messages:   this._msgs(messages),
        stream:     true,
      });

      let full = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) { full += text; if (onChunk) onChunk(text); }
        if (chunk.choices[0]?.finish_reason === 'stop') {
          if (onDone) onDone(full, {}); return;
        }
      }
      if (onDone) onDone(full, {});
    } catch (err) {
      const msg = err?.message || '';
      let friendly = 'AI error: ' + msg;
      if (err?.status === 429) friendly = 'Rate limit hit — wait 1 minute and try again.';
      if (err?.status === 401) friendly = 'Invalid GROQ_API_KEY — check your .env file.';
      if (onError) onError(new Error(friendly));
    }
  }

  getSystemPrompt(name = 'Nova AI Chat Bot') {
    return `You are ${name}, a helpful and intelligent AI assistant. Be concise, friendly, and accurate. Use markdown formatting where helpful.`;
  }
}

module.exports = new AIService();
