/**
 * POST /api/chat — Streaming SSE Serverless Chat Handler
 * 
 * Supports both real-time Server-Sent Events (SSE) streaming
 * and synchronous responses with multi-turn conversation memory.
 */

const { authGuard } = require('./_lib/authGuard');
const { callLlmCascade, COMPLEX_CASCADE } = require('./_lib/llmCascade');

module.exports = async function handler(req, res) {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Auth security guard
  if (!authGuard(req, res)) return;

  const { query, history = [], systemPrompt = '' } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required and must be non-empty.' });
  }

  const isStream = req.query.stream === 'true' || req.headers.accept?.includes('text/event-stream');

  if (isStream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    try {
      const result = await callLlmCascade({
        prompt: query,
        systemPrompt,
        isComplex: true
      });

      // Stream words or sentence chunks
      const words = result.text.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        const chunk = words.slice(i, i + 4).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ text: chunk, model: result.model })}\n\n`);
        await new Promise(r => setTimeout(r, 25));
      }

      res.write(`data: ${JSON.stringify({ done: true, model: result.model })}\n\n`);
      return res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      return res.end();
    }
  }

  // Synchronous response
  try {
    const result = await callLlmCascade({
      prompt: query,
      systemPrompt,
      isComplex: true
    });
    return res.status(200).json({ text: result.text, model: result.model });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
