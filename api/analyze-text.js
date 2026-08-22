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
    const isUltraProcessed = /burrito|wrap|tacos|fajita|quesadilla|nachos|poutine|burger|hamburger|cheeseburger|pizza|frite|frites|hot-?dog|kebab|shawarma|nugget|nuggets|chips|raclette|fondue|tartiflette|bacon|saucisse|soda|coca|donut|croissant|gaufre|biscuit|snack|fast-?food|croque-?monsieur|lasagne|quiche|p[aâ]t[eé]|p[aâ]t[eé]\s*chinois|hachis|hachis\s*parmentier|tourti[eè]re|gratin|moussaka|shepherd|cottage\s*pie|boeuf\s*bourguignon|chili\s*con\s*carne|cordon\s*bleu/i.test(lower);
    
    // 2. Electric & Wild Original Foods (Universal Vitalist: bio-mineral, wild, African, Amazonian, Dr. Sebi, Ehret, Morse)
    const isElectric = !isUltraProcessed && /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|citron vert|lime|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre|aneth|basilic|coriandre|origan|romarin|thym|sauvage|spiruline|clémentine|mandarine|mûre|framboise|myrtille|fraise|strawberry|raspberry|blueberry|blackberry|moringa|baobab|bouye|bissap|hibiscus|bleuet|canneberge|argousier|ortie|pissenlit|ditakh|dettarium|madd|saba|gombo|soursop|corossol|sureau|aronia|camu|acai|acerola|pousse|germe/i.test(lower);
    
    // 3. Natural Living Plant Foods / Fresh Fruits & Raw Greens (Non-Sebi living foods: PRAL negative, NOVA 1, Mucus Dissolving)
    const isNaturalPlantAlkaline = !isUltraProcessed && !isElectric && /fruit|baie|berry|goyave|guava|lychee|litchi|passion|maracuja|grenade|pomegranate|kiwi|abricot|apricot|peche|pêche|nectarine|ananas|pineapple|mangoustan|mangosteen|kaki|persimmon|pitaya|dragon|tamarin|tamarind|agrumes|orange|mandarine|clementine|pamplemousse|salade|laitue|verdure|epinard|épinard|tisane|infusion/i.test(lower);

    // 4. Hybridized / Acidifying Starchy Foods
    const isHybrid = !isUltraProcessed && !isElectric && !isNaturalPlantAlkaline && /carotte|mais|maïs|pomme de terre|patate|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|champignon/i.test(lower);
    
    // 5. Animal Products / Dairy / Standard Mucus-forming
    const isAnimalMucus = !isUltraProcessed && !isElectric && !isNaturalPlantAlkaline && !isHybrid && /viande|poulet|boeuf|bœuf|porc|veau|agneau|canard|dinde|fromage|lait|creme|crème|beurre|oeuf|œuf|poisson|saumon|thon|crevette/i.test(lower);

    let emoji = '🍽️';
    if (/burrito|wrap|tacos|fajita|quesadilla/i.test(lower)) emoji = '🌯';
    else if (/poutine|frite/i.test(lower)) emoji = '🍟';
    else if (/burger/i.test(lower)) emoji = '🍔';
    else if (/pizza/i.test(lower)) emoji = '🍕';
    else if (/kebab|shawarma/i.test(lower)) emoji = '🥙';
    else if (/avocat/i.test(lower)) emoji = '🥑';
    else if (/concombre/i.test(lower)) emoji = '🥒';
    else if (/mangue/i.test(lower)) emoji = '🥭';
    else if (/papaye/i.test(lower)) emoji = '🍈';
    else if (/pomme/i.test(lower)) emoji = '🍎';
    else if (/banane/i.test(lower)) emoji = '🍌';
    else if (/melon|pasteque|pastèque/i.test(lower)) emoji = '🍉';
    else if (/raisin/i.test(lower)) emoji = '🍇';
    else if (/citron/i.test(lower)) emoji = '🍋';
    else if (/fraise|strawberry/i.test(lower)) emoji = '🍓';
    else if (/framboise|myrtille|blueberry|raspberry/i.test(lower)) emoji = '🫐';
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
      density = 90;
      nova = 1;
      freshness = 95;
      mucus = 'Dissolvant';
      label = 'Électrique (Dr. Sebi & Sauvage)';
      family = 'Aliment Vivant / Vitaliste';
      note = 'Aliment bio-minéral alcalinisant à haute charge électrolytique favorisant le nettoyage cellulaire.';
    } else if (isNaturalPlantAlkaline) {
      pral = -3.2;
      density = 85;
      nova = 1;
      freshness = 90;
      mucus = 'Dissolvant';
      label = 'Végétal Vivant Alcalinisant';
      family = 'Fruits & Végétaux Vivants';
      note = 'Fruit ou végétal vivant naturel, alcalinisant et dissolvant naturel des toxines.';
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
      pral = 0.5;
      density = 60;
      nova = 1;
      freshness = 75;
      mucus = 'Neutre';
      label = 'Végétal Brut / Neutre';
      family = 'Alimentation Naturelle';
      note = 'Aliment brut naturel à consommer dans le cadre d\'une alimentation équilibrée.';
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

  const rawQuery = req.body?.query || req.body?.text || req.body?.dish || '';
  if (!rawQuery || !rawQuery.trim()) return res.status(400).json({ error: 'query or text is required' });

  const cleanQuery = rawQuery.trim();

  try {
    const apiKey = process.env.GEMINI_API_KEY || req.headers?.['x-gemini-key'] || req.headers?.get?.('x-gemini-key') || req.body?.geminiApiKey;
    if (!apiKey) {
      const fallbackList = extractHeuristicFoods(cleanQuery);
      return res.status(200).json({ data: { items: fallbackList, foods: fallbackList } });
    }

    const result = await callGeminiApi({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: `Analyze this food or dish: ${cleanQuery}` }] }],
      systemInstruction: foodAnalysisPrompt,
      generationConfig: { temperature: 0.1, maxOutputTokens: 3000, responseMimeType: 'application/json' },
      intent: 'standard',
      requestedModel: 'gemini-3.6-flash',
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // Try extracting json array/object if surrounded by preamble
      const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

    const list = parsed.foods || parsed.items || (Array.isArray(parsed) ? parsed : (parsed.name ? [parsed] : []));
    res.status(200).json({ data: { items: list, foods: list } });
  } catch (error) {
    console.warn('[/api/analyze-text] Falling back to heuristics:', error.message);
    const fallbackList = extractHeuristicFoods(cleanQuery);
    res.status(200).json({ data: { items: fallbackList, foods: fallbackList } });
  }
};
