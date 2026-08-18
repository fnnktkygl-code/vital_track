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
    
    // 1. Junk Food / Ultra-Processed / Fast Food / Poutine / Fried / Dairy Heavy
    const isUltraProcessed = /poutine|burger|hamburger|cheeseburger|pizza|frite|frites|hot-?dog|tacos|kebab|nugget|nuggets|chips|raclette|fondue|bacon|saucisse|soda|coca|donut|croissant|gaufre|biscuit|snack|fast-?food|croque-?monsieur/i.test(lower);
    
    // 2. Electric Foods (Dr. Sebi: bio-mineral, non-hybridized, alkaline)
    const isElectric = !isUltraProcessed && /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|citron vert|lime|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre|aneth|basilic|coriandre|origan|romarin|thym|sauvage|spiruline|clémentine|mandarine|mûre|framboise|myrtille|fraise/i.test(lower);
    
    // 3. Hybridized / Acidifying Starchy Foods
    const isHybrid = !isUltraProcessed && !isElectric && /carotte|mais|maïs|pomme de terre|patate|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|pamplemousse|champignon/i.test(lower);
    
    // 4. Animal Products / Dairy / Standard Mucus-forming
    const isAnimalMucus = !isUltraProcessed && !isElectric && !isHybrid && /viande|poulet|boeuf|bœuf|porc|veau|agneau|canard|dinde|fromage|lait|creme|crème|beurre|oeuf|œuf|poisson|saumon|thon|crevette/i.test(lower);

    let emoji = '🍽️';
    if (/poutine/i.test(lower)) emoji = '🍟';
    else if (/burger/i.test(lower)) emoji = '🍔';
    else if (/pizza/i.test(lower)) emoji = '🍕';
    else if (/frite/i.test(lower)) emoji = '🍟';
    else if (/avocat/i.test(lower)) emoji = '🥑';
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

    let pral, density, nova, freshness, mucus, label, family, note;
    
    if (isUltraProcessed) {
      pral = 14.8;
      density = 15;
      nova = 4;
      freshness = 10;
      mucus = 'Fortement Mucogène';
      label = 'Ultra-transformé / Acidifiant';
      family = 'Plat Industriel';
      note = 'Produit ultra-transformé générant une forte acidose rénale (PRAL +14.8) et une congestion mucogène.';
    } else if (isElectric) {
      pral = -4.5;
      density = 88;
      nova = 1;
      freshness = 95;
      mucus = 'Dissolvant';
      label = 'Électrique (Dr. Sebi)';
      family = 'Aliment Vivant / Vitaliste';
      note = 'Aliment bio-minéral alcalinisant à haute charge électrolytique favorisant le nettoyage cellulaire.';
    } else if (isHybrid) {
      pral = 2.5;
      density = 55;
      nova = 2;
      freshness = 65;
      mucus = 'Faiblement Mucogène';
      label = 'Aliment Hybride';
      family = 'Féculents & Végétaux Hybrides';
      note = 'Aliment issu d\'hybridations végétales, contenant des amidons modérément mucogènes.';
    } else if (isAnimalMucus) {
      pral = 9.5;
      density = 45;
      nova = 3;
      freshness = 30;
      mucus = 'Mucogène Élevé';
      label = 'Produit Animal / Mucogène';
      family = 'Produits Animaux';
      note = 'Génère une production intense de mucus lymphatique et une charge acide importante.';
    } else {
      pral = 1.0;
      density = 50;
      nova = 2;
      freshness = 60;
      mucus = 'Neutre à Mucogène';
      label = 'Standard';
      family = 'Alimentation Courante';
      note = 'Aliment standard à consommer avec modération dans une démarche de détox.';
    }

    const nameCap = token.charAt(0).toUpperCase() + token.slice(1);

    return {
      name: nameCap,
      emoji,
      family,
      approved: isElectric,
      scientific: { 
        pral, 
        density, 
        label: pral < 0 ? 'Alcalinisant' : 'Acidifiant', 
        colorValue: pral < 0 ? '0xFF4ade80' : '0xFFfacc15' 
      },
      vitality: { 
        nova, 
        freshness, 
        label: nova === 1 ? 'Aliment Brut (Non transformé)' : nova === 2 ? 'Ingrédient culinaire' : nova === 3 ? 'Aliment transformé' : 'Produit Ultra-Transformé', 
        colorValue: nova === 1 ? '0xFF4ade80' : (nova <= 2 ? '0xFFfacc15' : '0xFFef4444')
      },
      specific: { 
        mucus, 
        hybrid: isHybrid || isUltraProcessed, 
        electric: isElectric, 
        label 
      },
      tags: [isElectric ? 'Dr. Sebi Approved' : isUltraProcessed ? 'Ultra-Transformé (NOVA 4)' : 'VitalTrack Analyzed'],
      note
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
      generationConfig: { temperature: 0.1, maxOutputTokens: 600, responseMimeType: 'application/json' },
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
