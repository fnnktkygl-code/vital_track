/**
 * POST /api/chat — VitalTrack Multi-turn Chat
 * 
 * Uses Gemini's native multi-turn conversation format for true context memory.
 * Each message in history becomes a proper {role, parts} entry.
 * Authenticated via X-VT-API-Key header.
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { getChatSystemPrompt, getChitChatSystemPrompt } = require('./_lib/prompts');
const { retrieveRelevantKnowledge } = require('./_lib/knowledgeRetriever');
const { classifyQueryIntent } = require('./_lib/queryClassifier');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authGuard(req, res)) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY || req.headers?.['x-gemini-key'] || req.headers?.get?.('x-gemini-key') || req.body?.geminiApiKey;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY sur Vercel ou renseigner votre clé gratuite Google AI Studio dans Paramètres ⚙️.'
      });
    }

    const { query, profile, history, fileParts, model } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    // ── Classify Query Intent (Smart Tier Routing) ──
    const intent = classifyQueryIntent({ query, history, fileParts });
    const userLang = profile?.language || req.body?.language || 'fr';

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

    // ── Build System Instruction based on Intent Tier ──
    let fullSystemInstruction = '';
    let genConfig = { temperature: 0.3, maxOutputTokens: 8192 };

    if (intent === 'chitchat') {
      // Tier 0: Chit-chat / Greetings -> Lightweight Prompt, 0 RAG tokens, fast response
      fullSystemInstruction = getChitChatSystemPrompt(userLang);
      genConfig = { temperature: 0.7, maxOutputTokens: 256 };
    } else {
      // Tier 1 & 2: Health / Clinical Query -> Full Coaching Prompt + Profile + Targeted RAG
      let profileContext = '';
      if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) {
        const country = profile.country || 'Canada 🍁';
        const city = profile.city || 'Montréal';
        const bioregion = profile.bioregion || 'Boréale / Tempérée froide';
        const season = profile.season || 'Hiver';
        const restrictions = profile.restrictions || 'Aucune restriction déclarée';
        const transitionLevel = profile.transitionLevel || 'Intermédiaire (Alimentation végétale / transition sans mucus)';
        const targetOrgans = Array.isArray(profile.targetOrgans) && profile.targetOrgans.length > 0
          ? profile.targetOrgans.join(', ')
          : (profile.targetOrgans || 'Système global (Reins & Lymphe)');
        
        let morphologyText = '';
        if (profile.height || profile.currentWeight || profile.targetWeight || profile.age || profile.activityLevel) {
          const parts = [];
          if (profile.height) parts.push(`Taille: ${profile.height} cm`);
          if (profile.currentWeight) parts.push(`Poids actuel: ${profile.currentWeight} kg`);
          if (profile.targetWeight) parts.push(`Poids cible: ${profile.targetWeight} kg`);
          if (profile.age) parts.push(`Âge: ${profile.age} ans`);
          if (profile.activityLevel) parts.push(`Activité: ${profile.activityLevel}`);
          morphologyText = `\nMorphologie & Métabolisme: ${parts.join(' | ')}`;
        }

        let memoriesText = '';
        if (Array.isArray(profile.memories) && profile.memories.length > 0) {
          memoriesText = `\nHabitudes & Préférences mémorisées :\n${profile.memories.map(m => `- ${m}`).join('\n')}`;
        } else if (typeof profile.memories === 'string' && profile.memories.trim()) {
          memoriesText = `\nHabitudes & Préférences mémorisées : ${profile.memories.trim()}`;
        }

        profileContext = `\n\n[CONTEXTE & BIO-PROFIL DE L'UTILISATEUR]
Nom: ${profile.name || 'Inconnu'}
Localisation: ${city}, ${country} (Biorégion: ${bioregion}, Saison: ${season})
Objectif Majeur: ${profile.goal || 'Détox & Vitalité'}
Protocole / École: ${profile.protocol || 'vitalist'}
Niveau de Transition: ${transitionLevel}
Émonctoires & Terrains prioritaires à soutenir: ${targetOrgans}${morphologyText}
Restrictions & Allergies strictes: ${restrictions}${memoriesText}
[DIRECTIVE COACHING PROFILE] : Adapte TOUJOURS tes conseils botaniques (plantes Raintree, tisanes, aliments), l'intensité des détox et les protocoles de jeûne en fonction directe du niveau de transition et des émonctoires prioritaires déclarés par l'utilisateur.`;
      }

      const isContinuing = Array.isArray(history) && history.length > 0;
      const conversationRule = isContinuing 
        ? `\n\n[RÈGLE STRICTE] Ceci est la suite d'une conversation en cours. NE DIS PAS BONJOUR. Reprends directement le fil de la discussion.` 
        : `\n\n[RÈGLE STRICTE] C'est le début d'une nouvelle conversation. Tu peux saluer l'utilisateur si c'est pertinent.`;
      
      const chunkCount = intent === 'complex' ? 5 : 3;
      const targetedKnowledge = retrieveRelevantKnowledge(query, chunkCount, userLang);
      const dynamicSystemPrompt = getChatSystemPrompt(userLang);
      fullSystemInstruction = `${dynamicSystemPrompt}${profileContext}${conversationRule}${targetedKnowledge ? `\n\n[RAG_KNOWLEDGE_BASE]\nExtraits pertinents de nos livres de référence pour t'aider à répondre :\n${targetedKnowledge}` : ''}`;
    }

    const isStream = req.query.stream === 'true';

    const result = await callGeminiApi({
      apiKey,
      contents,
      systemInstruction: fullSystemInstruction,
      generationConfig: genConfig,
      stream: isStream,
      requestedModel: model || null,
      intent,
    });

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Expose-Headers', 'X-Model-Used, X-Intent-Tier');
      res.setHeader('X-Model-Used', result.model || 'gemini-2.5-flash');
      res.setHeader('X-Intent-Tier', intent);
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
      model: result.model,
      intent 
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error.message);
    res.status(502).json({ error: 'Chat request failed', detail: error.message });
  }
};
