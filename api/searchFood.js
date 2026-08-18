const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');

function getHeuristicFood(query) {
  const q = (query || '').trim();
  const lower = q.toLowerCase();

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
  else if (/orange/i.test(lower)) emoji = '🍊';
  else if (/salade|laitue|kale|roquette/i.test(lower)) emoji = '🥗';
  else if (/riz|quinoa|cereale/i.test(lower)) emoji = '🍚';
  else if (/jus/i.test(lower)) emoji = '🥤';
  else if (/soupe|bouillon/i.test(lower)) emoji = '🥣';
  else if (/pain/i.test(lower)) emoji = '🍞';

  const pral = isElectric ? -3.5 : (isHybrid ? 2.0 : (isMucus ? 6.5 : -0.5));
  const density = isElectric ? 85 : (isHybrid ? 50 : 35);
  const nova = isMucus ? 3 : 1;

  const id = q.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || `food_${Date.now()}`;
  const nameCapitalized = q.charAt(0).toUpperCase() + q.slice(1);

  return {
    id,
    names: [nameCapitalized, q],
    emoji,
    family: isElectric ? 'Vitaliste' : (isHybrid ? 'Hybride' : 'Général'),
    category: isElectric ? 'Fruits & Légumes' : 'Alimentation',
    vitality: {
      nova,
      freshness: nova === 1 ? 90 : 45,
      label: nova === 1 ? 'Brut · Vivant' : 'Transformé'
    },
    specific: {
      mucus: isElectric ? 'Dissolvant' : (isMucus ? 'Mucogène' : (isHybrid ? 'Mucogène' : 'Neutre')),
      hybrid: isHybrid,
      electric: isElectric,
      label: isElectric ? 'Électrique' : (isHybrid ? 'Hybride' : 'Standard')
    },
    scientific_defaults: {
      pral,
      density
    },
    isNewFromAI: true,
    note: isElectric
      ? 'Aliment vivant alcalinisant conforme aux principes du Dr. Sebi.'
      : (isHybrid ? 'Aliment hybridé ou riche en amidon.' : 'Aliment analysé par classification naturelle.')
  };
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!authGuard(req, res)) return;

  const { query } = req.body || {};
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const cleanQuery = query.trim();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return deterministic heuristic fallback
      return res.status(200).json(getHeuristicFood(cleanQuery));
    }

    const systemInstruction = `Tu es un expert en nutrition vitaliste (Dr. Sebi, Arnold Ehret, Dr. Robert Morse).
L'utilisateur cherche un aliment ou un plat : "${cleanQuery}".
Retourne STRICTEMENT un objet JSON avec cette structure sans texte autour :
{
  "id": "nom_aliment",
  "names": ["Nom en français", "Nom en anglais"],
  "emoji": "🥑",
  "family": "Fruits",
  "category": "Fruits frais",
  "vitality": { "nova": 1, "freshness": 90, "label": "Non transformé" },
  "specific": { "mucus": "Dissolvant", "hybrid": false, "electric": true, "label": "Électrique" },
  "scientific_defaults": { "pral": -3.5, "density": 85 },
  "note": "Explication vitaliste"
}`;

    const result = await callGeminiApi({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: `Recherche et analyse vitaliste de : ${cleanQuery}` }] }],
      systemInstruction,
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let foodData = JSON.parse(cleaned);

    if (foodData.id === 'not_found' || !foodData.names) {
      foodData = getHeuristicFood(cleanQuery);
    }

    foodData.id = (foodData.id || cleanQuery).toLowerCase().replace(/[^a-z0-9]/g, '_');
    foodData.isNewFromAI = true;

    return res.status(200).json(foodData);
  } catch (error) {
    console.warn('AI Food Search falling back to heuristics:', error.message);
    return res.status(200).json(getHeuristicFood(cleanQuery));
  }
};
