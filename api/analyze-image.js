/**
 * POST /api/analyze-image — Food Image Analysis
 * 
 * Accepts a base64-encoded image and analyzes it using vitalist nutrition rules.
 * Uses JSON body with { imageData, mimeType } instead of multipart (Vercel limitation).
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { foodAnalysisPrompt } = require('./_lib/prompts');

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
    if (!apiKey) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY sur Vercel ou renseigner votre clé dans Paramètres ⚙️.'
      });
    }

    const { imageData, mimeType } = req.body || {};

    if (!imageData) {
      return res.status(400).json({ error: 'imageData (base64) is required' });
    }

    const mime = mimeType || 'image/jpeg';

    const result = await callGeminiApi({
      apiKey,
      contents: [{
        role: 'user',
        parts: [
          { text: 'Identify all foods/ingredients in this image.' },
          { inlineData: { mimeType: mime, data: imageData } },
        ],
      }],
      systemInstruction: foodAnalysisPrompt,
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      intent: 'complex',
      requestedModel: 'gemini-3.7-flash',
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    res.status(200).json({ data: JSON.parse(cleaned) });
  } catch (error) {
    console.error('[/api/analyze-image] Error:', error.message);
    res.status(502).json({ error: 'Image analysis failed', detail: error.message });
  }
};
