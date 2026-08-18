/**
 * POST /api/analyze-text — Food Text Analysis
 * 
 * Analyzes a food name/description using vitalist nutrition rules.
 * Returns structured JSON with nutritional classification.
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { foodAnalysisPrompt } = require('./_lib/prompts');

function extractHeuristicFoods(query) {
  const clean = (query || '').trim();
  const parts = clean
    .split(/[,+&/]|\bet\b|\bavec\b|\baux\b|\bau\b|\bde\b|\bd['’]/i)
    .map(p => p.trim())
    .filter(p => p.length >= 2);

  const tokens = parts.length > 0 ? parts : [clean];

  return tokens.map(token => {
    const lower = token.toLowerCase();
    const isElectric = /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre/i.test(lower);
    const isHybrid = !isElectric && /carotte|mais|maïs|pomme de terre|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|pamplemousse/i.test(lower);
    const isMucus = !isElectric && !isHybrid && /viande|poulet|boeuf|porc|fromage|lait|creme|crème|beurre|oeuf|œuf|pain|gateau|gâteau|biscuit|pizza|frit/i.test(lower);

    let emoji = '🍽️';
    if (/avocat/i.test(lower)) emoji = '🥑';
    else if (/concombre/i.test(lower)) emoji = '🥒';
    else if (/mangue/i.test(lower)) emoji = '🥭';
    else if (/papaye/i.test(lower)) emoji = '🍈';
    else if (/pomme/i.test(lower)) emoji = '🍎';
    else if (/banane/i.test(lower)) emoji = '🍌';
    else if (/melon|pasteque|pastèque/i.test(lower)) emoji = '🍉';
    else if (/raisin/i.test(lower)) emoji = '🍇';
    else if (/citron/i.test(lower)) emoji = '🍋';
    else if (/salade|laitue|kale|roquette/i.test(lower)) emoji = '🥗';
    else if (/riz|quinoa/i.test(lower)) emoji = '🍚';

    const pral = isElectric ? -3.5 : (isHybrid ? 2.0 : (isMucus ? 6.0 : -0.5));
    const nameCap = token.charAt(0).toUpperCase() + token.slice(1);

    return {
      name: nameCap,
      emoji,
      family: isElectric ? 'Vitaliste' : (isHybrid ? 'Hybride' : 'Alimentation'),
      approved: isElectric,
      scientific: { pral, density: isElectric ? 85 : 50, label: pral < 0 ? 'Alcalinisant' : 'Acidifiant', colorValue: pral < 0 ? '0xFF4ade80' : '0xFFfacc15' },
      vitality: { nova: isMucus ? 3 : 1, freshness: isMucus ? 40 : 90, label: isMucus ? 'Transformé' : 'Brut', colorValue: '0xFF4ade80' },
      specific: { mucus: isElectric ? 'Dissolvant' : (isMucus ? 'Mucogène' : 'Neutre'), hybrid: isHybrid, electric: isElectric, label: isElectric ? 'Électrique' : (isHybrid ? 'Hybride' : 'Standard') },
      tags: [isElectric ? 'Dr. Sebi Approved' : 'VitalTrack Analyzed'],
      note: isElectric ? 'Aliment électrique et alcalinisant.' : 'Aliment naturel.'
    };
  });
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!authGuard(req, res)) return;

  const { query } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

  const cleanQuery = query.trim();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackList = extractHeuristicFoods(cleanQuery);
      return res.status(200).json({ data: { items: fallbackList, foods: fallbackList } });
    }

    const result = await callGeminiApi({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: `Analyze this food or dish: ${cleanQuery}` }] }],
      systemInstruction: foodAnalysisPrompt,
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const list = parsed.foods || parsed.items || (parsed.name ? [parsed] : []);
    res.status(200).json({ data: { items: list, foods: list } });
  } catch (error) {
    console.warn('[/api/analyze-text] Falling back to heuristics:', error.message);
    const fallbackList = extractHeuristicFoods(cleanQuery);
    res.status(200).json({ data: { items: fallbackList, foods: fallbackList } });
  }
};
