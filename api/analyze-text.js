/**
 * POST /api/analyze-text — Food Text Analysis
 * 
 * Analyzes a food name/description using vitalist nutrition rules.
 * Returns structured JSON with nutritional classification.
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server GEMINI_API_KEY not configured' });

    const { query } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });

    const text = await callGeminiApi({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: `Analyze this food: ${query}` }] }],
      systemInstruction: foodAnalysisPrompt,
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.status(200).json({ data: JSON.parse(cleaned) });
  } catch (error) {
    console.error('[/api/analyze-text] Error:', error.message);
    res.status(502).json({ error: 'Analysis failed', detail: error.message });
  }
};
