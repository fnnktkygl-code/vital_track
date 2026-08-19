/**
 * POST /api/searchFood — AI Food Search & Vitalist Analysis
 * 
 * Analyzes any queried food or complex dish with Gemini / Vitalist rules.
 * Returns a standardized food object classified into the correct category.
 */
const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { foodAnalysisPrompt, getFoodAnalysisPrompt } = require('./_lib/prompts');

function getHeuristicFood(query) {
  const q = (query || '').trim();
  const lower = q.toLowerCase();

  // 1. Fast Food / Junk Food / Ultra-Processed / Complex Dishes
  const isUltraProcessed = /burrito|wrap|tacos|fajita|quesadilla|nachos|poutine|burger|hamburger|cheeseburger|pizza|frite|frites|hot-?dog|kebab|shawarma|nugget|nuggets|chips|raclette|fondue|tartiflette|bacon|saucisse|soda|coca|donut|croissant|gaufre|biscuit|snack|fast-?food|croque-?monsieur|lasagne|quiche|p[aâ]t[eé]|p[aâ]t[eé]\s*chinois|hachis|hachis\s*parmentier|tourti[eè]re|gratin|moussaka|shepherd|cottage\s*pie|boeuf\s*bourguignon|chili\s*con\s*carne|cordon\s*bleu/i.test(lower);

  // 2. Electric Foods (Dr. Sebi, Arnold Ehret, Morse: wild, non-hybridized, alkaline bio-minerals)
  const isElectric = !isUltraProcessed && /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|citron vert|lime|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre|aneth|basilic|coriandre|origan|romarin|thym|sauvage|spiruline|clémentine|mandarine|mûre|framboise|myrtille|fraise|moringa|baobab|bouye|bissap|hibiscus|bleuet|canneberge|argousier|ortie|pissenlit|ditakh|madd|gombo|sureau|aronia|camu|acai|acerola|pousse|germe/i.test(lower);

  // 3. Hybridized / Acidifying Starchy Foods
  const isHybrid = !isUltraProcessed && !isElectric && /carotte|mais|maïs|pomme de terre|patate|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|pamplemousse|champignon/i.test(lower);

  // 4. Animal Products / Dairy / Standard Mucus-forming
  const isAnimalMucus = !isUltraProcessed && !isElectric && !isHybrid && /viande|poulet|boeuf|bœuf|porc|veau|agneau|canard|dinde|fromage|lait|creme|crème|beurre|oeuf|œuf|poisson|saumon|thon|crevette/i.test(lower);

  let emoji = '🍽️';
  let family = 'Alimentation';
  let category = 'Alimentation';
  if (/burrito|wrap|tacos|fajita|quesadilla/i.test(lower)) { emoji = '🌯'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/burger/i.test(lower)) { emoji = '🍔'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/pizza/i.test(lower)) { emoji = '🍕'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/poutine|frite/i.test(lower)) { emoji = '🍟'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/kebab|shawarma/i.test(lower)) { emoji = '🥙'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/p[aâ]t[eé]|hachis|lasagne|gratin|quiche|tourti[eè]re/i.test(lower)) { emoji = '🥘'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/avocat/i.test(lower)) { emoji = '🥑'; family = 'Fruits'; category = 'Fruits'; }
  else if (/concombre/i.test(lower)) { emoji = '🥒'; family = 'Légumes'; category = 'Légumes'; }
  else if (/mangue/i.test(lower)) { emoji = '🥭'; family = 'Fruits'; category = 'Fruits'; }
  else if (/papaye/i.test(lower)) { emoji = '🍈'; family = 'Fruits'; category = 'Fruits'; }
  else if (/pomme/i.test(lower)) { emoji = '🍎'; family = 'Fruits'; category = 'Fruits'; }
  else if (/banane/i.test(lower)) { emoji = '🍌'; family = 'Fruits'; category = 'Fruits'; }
  else if (/melon|pasteque|pastèque/i.test(lower)) { emoji = '🍉'; family = 'Fruits'; category = 'Fruits'; }
  else if (/raisin/i.test(lower)) { emoji = '🍇'; family = 'Fruits'; category = 'Fruits'; }
  else if (/citron/i.test(lower)) { emoji = '🍋'; family = 'Fruits'; category = 'Fruits'; }
  else if (/orange|clementine|clémentine|mandarine/i.test(lower)) { emoji = '🍊'; family = 'Fruits'; category = 'Fruits'; }
  else if (/salade|laitue|kale|roquette/i.test(lower)) { emoji = '🥗'; family = 'Légumes'; category = 'Légumes'; }
  else if (/riz|quinoa|cereale|amarante|fonio|kamut/i.test(lower)) { emoji = '🌾'; family = 'Céréales'; category = 'Céréales'; }
  else if (/haricot|lentille|pois/i.test(lower)) { emoji = '🫘'; family = 'Légumineuses'; category = 'Légumineuses'; }
  else if (/amande|noix|noisette|chia|lin|sesame|sésame/i.test(lower)) { emoji = '🥜'; family = 'Noix & Graines'; category = 'Noix & Graines'; }
  else if (/jus/i.test(lower)) { emoji = '🥤'; family = 'Boissons'; category = 'Boissons'; }
  else if (/the|thé|tisane|infusion/i.test(lower)) { emoji = '🍵'; family = 'Herbes & Thés'; category = 'Herbes & Thés'; }
  else if (/pain|baguette|boulange/i.test(lower)) { emoji = '🥖'; family = 'Pain & Boulangerie'; category = 'Pain & Boulangerie'; }
  else if (/fromage/i.test(lower)) { emoji = '🧀'; family = 'Produits Laitiers'; category = 'Produits Laitiers'; }
  else if (/viande|boeuf|bœuf|steak|poulet|porc/i.test(lower)) { emoji = '🥩'; family = 'Viandes & Charcuterie'; category = 'Viandes & Charcuterie'; }
  else if (/poisson|saumon|thon|crevette/i.test(lower)) { emoji = '🐟'; family = 'Poissons & Fruits de mer'; category = 'Poissons & Fruits de mer'; }

  let pral, density, nova, freshness, mucus, label, note;
  if (isUltraProcessed) {
    pral = 15.8;
    density = 20;
    nova = 4;
    freshness = 20;
    mucus = 'Fortement Mucogène';
    label = 'Ultra-Transformé / Fast Food';
    if (!category || category === 'Alimentation') {
      family = 'Plats Cuisinés & Fast Food';
      category = 'Plats Cuisinés & Fast Food';
    }
    note = 'Plat complexe ultra-transformé générant une forte acidose rénale (PRAL +' + pral.toFixed(1) + ') et une charge mucogène élevée.';
  } else if (isElectric) {
    pral = -4.5;
    density = 88;
    nova = 1;
    freshness = 95;
    mucus = 'Dissolvant';
    label = 'Électrique (Dr. Sebi)';
    if (!category || category === 'Alimentation') {
      family = 'Fruits';
      category = 'Fruits';
    }
    note = 'Aliment vivant bio-minéral alcalinisant à haute charge électrolytique favorisant le nettoyage cellulaire.';
  } else if (isHybrid) {
    pral = 2.5;
    density = 55;
    nova = 2;
    freshness = 65;
    mucus = 'Faiblement Mucogène';
    label = 'Aliment Hybride';
    if (!category || category === 'Alimentation') {
      family = 'Céréales';
      category = 'Céréales';
    }
    note = 'Aliment issu d\'hybridations végétales, contenant des amidons modérément mucogènes.';
  } else if (isAnimalMucus) {
    pral = 10.5;
    density = 40;
    nova = 3;
    freshness = 30;
    mucus = 'Mucogène Élevé';
    label = 'Produit Animal / Mucogène';
    if (!category || category === 'Alimentation') {
      family = 'Viandes & Charcuterie';
      category = 'Viandes & Charcuterie';
    }
    note = 'Génère une production importante de mucus lymphatique et une acidité métabolique marquée.';
  } else {
    pral = 1.0;
    density = 50;
    nova = 2;
    freshness = 60;
    mucus = 'Neutre à Mucogène';
    label = 'Standard';
    note = 'Aliment standard analysé par règles vitalistes.';
  }

  const id = q.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || `food_${Date.now()}`;
  const nameCapitalized = q.charAt(0).toUpperCase() + q.slice(1);

  return {
    id,
    name: nameCapitalized,
    names: [nameCapitalized, q],
    emoji,
    family,
    category,
    vitality: {
      nova,
      freshness,
      label: nova === 1 ? 'Brut · Vivant' : nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment transformé',
      colorValue: nova === 1 ? '0xFF4ade80' : nova === 4 ? '0xFFef4444' : '0xFFfacc15'
    },
    specific: {
      mucus,
      hybrid: isHybrid || isUltraProcessed,
      electric: isElectric,
      label: isElectric ? 'Électrique' : (isHybrid ? 'Hybride' : isUltraProcessed ? 'Fast-Food / Hybride' : 'Mucogène')
    },
    scientific_defaults: {
      pral,
      density,
      label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant'
    },
    scientific: {
      pral,
      density,
      label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant'
    },
    approved: isElectric,
    isNewFromAI: true,
    note
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
      return res.status(200).json(getHeuristicFood(cleanQuery));
    }

    const userLang = req.body?.language || 'fr';
    const dynamicPrompt = getFoodAnalysisPrompt(userLang);

    const result = await callGeminiApi({
      apiKey,
      contents: [{ role: 'user', parts: [{ text: `Recherche et analyse vitaliste rigoureuse de l'aliment ou plat : "${cleanQuery}"` }] }],
      systemInstruction: dynamicPrompt,
      generationConfig: { temperature: 0.1, maxOutputTokens: 2500, responseMimeType: "application/json" }
    });

    const rawText = typeof result === 'object' && result.text ? result.text : String(result || '');
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed = JSON.parse(cleaned);

    const rawFood = parsed.foods?.[0] || parsed.items?.[0] || (parsed.name ? parsed : null);
    if (!rawFood || !rawFood.name) {
      return res.status(200).json(getHeuristicFood(cleanQuery));
    }

    const name = (rawFood.name || cleanQuery).replace(/^./, c => c.toUpperCase());
    const id = (rawFood.id || cleanQuery).toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || `food_${Date.now()}`;

    const sc = rawFood.scientific || rawFood.scientific_defaults || {};
    const vt = rawFood.vitality || {};
    const sp = rawFood.specific || {};

    const pral = typeof sc.pral === 'number' ? sc.pral : 0;
    const nova = typeof vt.nova === 'number' ? vt.nova : (sp.electric ? 1 : 3);
    const density = typeof sc.density === 'number' ? sc.density : (pral < 0 ? 80 : 35);
    const freshness = typeof vt.freshness === 'number' ? vt.freshness : (nova === 1 ? 95 : nova === 4 ? 20 : 60);

    let category = rawFood.category || rawFood.family || 'Alimentation';
    // Standardize category name
    if (/fruit/i.test(category)) category = 'Fruits';
    else if (/légume|legume|salade/i.test(category)) category = 'Légumes';
    else if (/céréale|cereale|grain/i.test(category)) category = 'Céréales';
    else if (/légumineuse|legumineuse|haricot|pois|lentille/i.test(category)) category = 'Légumineuses';
    else if (/noix|graine/i.test(category)) category = 'Noix & Graines';
    else if (/herbe|thé|the|tisane|plante/i.test(category)) category = 'Herbes & Thés';
    else if (/épice|epice|assaisonnement/i.test(category)) category = 'Épices & Assaisonnements';
    else if (/huile/i.test(category)) category = 'Huiles';
    else if (/boisson|jus/i.test(category)) category = 'Boissons';
    else if (/fast|plat|burger|pizza|poutine|tacos|burrito|industriel|cuisine/i.test(category)) category = 'Plats Cuisinés & Fast Food';
    else if (/snack|frite|chips/i.test(category)) category = 'Snacks & Ultra-transformés';
    else if (/viande|charcuterie|boeuf|poulet/i.test(category)) category = 'Viandes & Charcuterie';
    else if (/poisson|mer|fruits de mer/i.test(category)) category = 'Poissons & Fruits de mer';
    else if (/lait|fromage|yaourt/i.test(category)) category = 'Produits Laitiers';
    else if (/pain|boulange/i.test(category)) category = 'Pain & Boulangerie';

    const foodData = {
      id,
      name,
      names: [name, cleanQuery],
      emoji: rawFood.emoji || (nova === 4 ? '🍕' : sp.electric ? '🥑' : '🍽️'),
      family: rawFood.family || category,
      category,
      vitality: {
        nova,
        freshness,
        label: vt.label || (nova === 1 ? 'Aliment Brut (Non transformé)' : nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment transformé'),
        colorValue: nova === 1 ? '0xFF4ade80' : nova === 4 ? '0xFFef4444' : '0xFFfacc15'
      },
      specific: {
        mucus: sp.mucus || (sp.electric ? 'Dissolvant' : nova === 4 ? 'Fortement Mucogène' : 'Mucogène'),
        hybrid: sp.hybrid === true || nova >= 3,
        electric: sp.electric === true,
        label: sp.label || (sp.electric ? 'Électrique (Dr. Sebi)' : nova === 4 ? 'Ultra-Transformé' : 'Standard')
      },
      scientific_defaults: {
        pral,
        density,
        label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant'
      },
      scientific: {
        pral,
        density,
        label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant'
      },
      approved: sp.electric === true,
      isNewFromAI: true,
      note: rawFood.note || `Aliment analysé via l'IA VitalTrack.`
    };

    return res.status(200).json(foodData);
  } catch (error) {
    console.warn('AI Food Search falling back to heuristics:', error.message);
    return res.status(200).json(getHeuristicFood(cleanQuery));
  }
};
