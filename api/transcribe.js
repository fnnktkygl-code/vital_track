/**
 * POST /api/transcribe — Official Google Gemini Audio Transcription Endpoint
 * 
 * Accepts a base64-encoded audio snippet and transcribes it with high precision
 * in French, English, Spanish, or any spoken language using Google Gemini multimodal AI.
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!authGuard(req, res)) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY || req.headers?.['x-gemini-key'] || req.headers?.get?.('x-gemini-key') || req.body?.geminiApiKey;
    if (!apiKey) return res.status(500).json({ error: 'Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY sur Vercel ou renseigner votre clé dans Paramètres ⚙️.' });

    const { audioData, mimeType, language } = req.body || {};

    if (!audioData) {
      return res.status(400).json({ error: 'audioData (base64) is required' });
    }

    const mime = mimeType || 'audio/webm';
    const langMap = {
      'en': 'Transcribe accurately in English.',
      'es': 'Transcribe con absoluta fidelidad en Español.',
      'fr-CA': 'Transcris fidèlement et intégralement en Français (Canada / Québec).',
      'fr': 'Transcris fidèlement et intégralement en Français.'
    };
    const langInstruction = langMap[language] || langMap.fr;

    const systemPrompt = `You are a high-fidelity speech-to-text audio transcription engine for VitalTrack.
${langInstruction}
CRITICAL INSTRUCTIONS:
- Transcribe EVERYTHING the user said from the first syllable to the very last word with 100% completeness.
- Do NOT truncate or omit the ending words or trailing phrases.
- Accurately preserve all health, medical, vitalist, botanical, and dietary vocabulary (e.g. Dr. Sebi, Arnold Ehret, Robert Morse, détox, mucus, émonctoires, reins, lymphe, jeûne, papaye, algues, électrolytes, etc.).
- Output ONLY the raw transcribed text. Never add conversational commentary, timestamps, or quotes.`;

    const result = await callGeminiApi({
      apiKey,
      contents: [{
        role: 'user',
        parts: [
          { text: 'Transcribe this complete voice audio recording without omitting any words.' },
          { inlineData: { mimeType: mime, data: audioData } },
        ],
      }],
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.1 },
      intent: 'chitchat',
      requestedModel: 'gemini-3.5-flash-lite',
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleanTranscription = rawText.replace(/^["'\s]+|["'\s]+$/g, '').trim();

    res.status(200).json({ text: cleanTranscription });
  } catch (error) {
    console.error('[/api/transcribe] Error:', error.message);
    res.status(502).json({ error: 'Audio transcription failed', detail: error.message });
  }
};
