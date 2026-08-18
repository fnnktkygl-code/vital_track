/**
 * POST /api/chat — VitalTrack Multi-turn Chat
 * 
 * Uses Gemini's native multi-turn conversation format for true context memory.
 * Each message in history becomes a proper {role, parts} entry.
 * Authenticated via X-VT-API-Key header.
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { chatSystemPrompt } = require('./_lib/prompts');
const { retrieveRelevantKnowledge } = require('./_lib/knowledgeRetriever');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authGuard(req, res)) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server GEMINI_API_KEY not configured' });

    const { query, profile, history, fileParts, model } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    // ── Build multi-turn contents array (Gemini native format) ──
    // Each entry: { role: "user"|"model", parts: [{ text }] }
    const contents = [];

    // Replay conversation history (last 40 turns)
    if (Array.isArray(history) && history.length > 0) {
      const trimmed = history.slice(-40);
      for (const msg of trimmed) {
        const role = msg.role === 'user' ? 'user' : 'model';
        if (msg.text && typeof msg.text === 'string') {
          contents.push({ role, parts: [{ text: msg.text }] });
        }
      }
    }

    // Current user message
    const currentParts = [{ text: query }];
    if (Array.isArray(fileParts)) {
      for (const f of fileParts) { if (f?.inlineData) currentParts.push(f); }
    }
    contents.push({ role: 'user', parts: currentParts });

    // ── Call Gemini with proper multi-turn ──
    let profileContext = '';
    if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) {
      profileContext = `\n\n[CONTEXTE DE L'UTILISATEUR ACTUEL]\nNom: ${profile.name || 'Inconnu'}\nObjectif: ${profile.goal || 'vitalité'}\nProtocole: ${profile.protocol || 'vitalist'}`;
    }

    const isContinuing = Array.isArray(history) && history.length > 0;
    const conversationRule = isContinuing 
      ? `\n\n[RÈGLE STRICTE] Ceci est la suite d'une conversation en cours. NE DIS PAS BONJOUR. Reprends directement le fil de la discussion.` 
      : `\n\n[RÈGLE STRICTE] C'est le début d'une nouvelle conversation. Tu peux saluer l'utilisateur si c'est pertinent.`;

    const targetedKnowledge = retrieveRelevantKnowledge(query, 4);
    const fullSystemInstruction = `${chatSystemPrompt}${profileContext}${conversationRule}${targetedKnowledge ? `\n\n[RAG_KNOWLEDGE_BASE]\nExtraits pertinents de nos livres de référence pour t'aider à répondre :\n${targetedKnowledge}` : ''}`;

    const isStream = req.query.stream === 'true';

    const result = await callGeminiApi({
      apiKey,
      contents,
      systemInstruction: fullSystemInstruction,
      generationConfig: { temperature: 0.3 },
      stream: isStream,
      requestedModel: model || null,
    });

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const reader = result.body.getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
      return;
    }

    res.status(200).json({ 
      text: result.text, 
      model: result.model 
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error.message);
    res.status(502).json({ error: 'Chat request failed', detail: error.message });
  }
};
