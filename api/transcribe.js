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
    const langInstruction = language === 'en'
      ? 'Transcribe in English.'
      : language === 'es'
        ? 'Transcribe in Spanish.'
        : 'Transcris en Français.';

    const systemPrompt = `You are an expert audio transcriber for VitalTrack, a vitalist health and nutrition app.
${langInstruction}
Transcribe the user's spoken voice message with absolute accuracy.
- Preserve all medical, botanical, nutritional and vitalist vocabulary (e.g. Dr. Sebi, Arnold Ehret, Robert Morse, détox, mucus, émonctoires, reins, lymphe, autophagie, jeûne, papaye, etc.).
- Never repeat sentences or invent words.
- Output ONLY the exact transcribed text as plain text without any markdown, quotes, explanations, or metadata.`;

    const result = await callGeminiApi({
      apiKey,
      contents: [{
        role: 'user',
        parts: [
          { text: 'Transcribe this voice message accurately.' },
          { inlineData: { mimeType: mime, data: audioData } },
        ],
      }],
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.1 },
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleanTranscription = rawText.replace(/^["'\s]+|["'\s]+$/g, '').trim();

    res.status(200).json({ text: cleanTranscription });
  } catch (error) {
    console.error('[/api/transcribe] Error:', error.message);
    res.status(502).json({ error: 'Audio transcription failed', detail: error.message });
  }
};
