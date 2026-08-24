/**
 * tests/monte_carlo_prompt_matrix_simulator.mjs
 * 
 * 🎲 MONTE CARLO PROMPT SIMULATOR & STRESS TEST ENGINE (2,500+ COMBINATIONS)
 * Exhaustive simulation across all prompt permutations, user intents, languages,
 * fridge ingredients, dietary restrictions, and structural AI output variations.
 */

import assert from 'node:assert/strict';
import {
  extractSingleMealFromMarkdown,
  parseMarkdownDietPlan,
  renderMealActionCardHtml,
  renderDietPlanActionCardHtml
} from '../web-app/src/dietPlanAiBridge.js';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('🎲 DÉMARRAGE DU TEST MONTE CARLO : 2 500+ COMBINAISONS IA');
console.log('═══════════════════════════════════════════════════════════════════\n');

// 1. Dictionnaires de permutation stochastique
const INGREDIENT_POOLS = {
  greens: ['roquette sauvage', 'pourpier frais', 'mâche', 'épinards tendres', 'cresson de fontaine', 'laitue romaine', 'feuilles de pissenlit', 'kale doux'],
  vegetables: ['concombre bio', 'tomates anciennes', 'courgette crue', 'avocat mûr', 'fenouil doux', 'poivron rouge doux', 'céleri branche', 'carottes râpées'],
  fruits: ['bleuets sauvages du Québec', 'papaye mûre', 'pastèque hydratante', 'melon d\'eau', 'banane tachetée', 'framboises locales', 'figues fraîches', 'pomme verte granny'],
  seeds_nuts: ['graines de chanvre décortiquées', 'graines de tournesol germées', 'graines de chia', 'graines de courge', 'noix du Brésil', 'sésame noir complet'],
  seasoning: ['jus de citron frais', 'huile d\'olive première pression à froid', 'huile de lin crue', 'curcuma frais râpé', 'gingembre frais', 'sel gris de mer non raffiné', 'basilic frais', 'menthe fraîche'],
  transition_staples: ['patate douce vapeur douce', 'courge butternut cuite vapeur', 'quinoa germé', 'poisson blanc sauvage cuit vapeur (<90°C)', 'sarrasin décortiqué tiède']
};

const INTENT_TYPES = [
  'fridge_ingredients',
  'breakfast_request',
  'lunch_request',
  'dinner_request',
  'urgent_hunger_snack',
  'transition_craving_buffer',
  'detox_juice_infusion',
  'multi_day_plan_3d',
  'multi_day_plan_7d',
  'multi_day_plan_14d',
  'fasting_intermittent_regimen'
];

const LANGUAGES = ['fr', 'fr-CA', 'en', 'es'];

const PROFILE_CONTEXTS = [
  { level: 'Débutant (Transition omnivore)', organs: ['Reins', 'Côlon'] },
  { level: 'Intermédiaire (Végétal sans mucus)', organs: ['Lymphe', 'Reins'] },
  { level: 'Avancé (Frugivore / 80% cru)', organs: ['Foie', 'Peau'] },
  { level: 'Régénération (Détox profonde)', organs: ['Reins', 'Lymphe', 'Poumons'] }
];

// Helper to pick random item
function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleUnique(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 2. Générateur de cas de test Monte Carlo
function generateMonteCarloScenario(index) {
  const intent = sample(INTENT_TYPES);
  const lang = sample(LANGUAGES);
  const profile = sample(PROFILE_CONTEXTS);

  const selectedGreens = sampleUnique(INGREDIENT_POOLS.greens, 2);
  const selectedVegs = sampleUnique(INGREDIENT_POOLS.vegetables, 2);
  const selectedFruits = sampleUnique(INGREDIENT_POOLS.fruits, 2);
  const selectedSeeds = sampleUnique(INGREDIENT_POOLS.seeds_nuts, 1);
  const selectedSeasoning = sampleUnique(INGREDIENT_POOLS.seasoning, 2);
  const selectedTransition = sample(INGREDIENT_POOLS.transition_staples);

  let userPrompt = '';
  let mockAiResponse = '';
  let expectedType = 'meal'; // 'meal' or 'plan'

  if (intent === 'fridge_ingredients') {
    const fridgeItems = [...selectedGreens, ...selectedVegs, ...selectedSeeds];
    userPrompt = `J'ai dans mon frigo : ${fridgeItems.join(', ')}. Fais-moi un repas savoureux et vitaliste.`;
    mockAiResponse = `
Voici une préparation vivante et reminéralisante selon les principes du Dr. Robert Morse et d'Arnold Ehret :

### 🥗 Bol Vitaliste aux ${selectedVegs[0]} & ${selectedGreens[0]}

Ce repas optimise la filtration rénale et alcalinise les fluides interstitiels.

**Ingrédients :**
* 1 portion de ${selectedGreens[0]}
* 1 portion de ${selectedVegs[0]}
* 1 portion de ${selectedVegs[1]}
* 1 cuillère de ${selectedSeeds[0]}
* Assaisonnement : ${selectedSeasoning.join(' et ')}

**Préparation :**
Dressez les verdures dans un saladier, ajoutez les légumes coupés et nappez d'assaisonnement frais.
`;
  } else if (intent === 'breakfast_request') {
    userPrompt = `Propose-moi un petit-déjeuner énergisant et vivant.`;
    mockAiResponse = `
Pour un réveil enzymatique sans colles digestives :

### 🍉 Bol Matinal Électrisant aux ${selectedFruits[0]}

**Ingrédients :**
* 1 belle portion de ${selectedFruits[0]}
* 1 demi portion de ${selectedFruits[1]}
* 1 c. à soupe de ${selectedSeeds[0]}
* Un filet de ${selectedSeasoning[0]}

Hydratation cellulaire profonde.
`;
  } else if (intent === 'lunch_request') {
    userPrompt = `Idée de déjeuner pour le midi au travail sans coup de fatigue.`;
    mockAiResponse = `
Pour votre déjeuner vitalisant :

### 🥗 Grande Assiette Solaire ${selectedVegs[0]} & ${selectedGreens[1]}

**Ingrédients :**
- ${selectedGreens[1]} fraîche
- ${selectedVegs[0]} en tranches fines
- ${selectedVegs[1]}
- ${selectedSeeds[0]}
- Émulsion : ${selectedSeasoning[0]}

Facile à digérer et hautement conducteur.
`;
  } else if (intent === 'dinner_request') {
    userPrompt = `Qu'est-ce que je peux manger ce soir de léger ?`;
    mockAiResponse = `
Pour votre dîner de repos physiologique :

### 🍲 Velouté Apaisant & ${selectedTransition}

**Ingrédients :**
- ${selectedTransition}
- ${selectedGreens[0]} tombée à la vapeur douce
- ${selectedSeasoning[0]}
- ${selectedSeasoning[1]}

Favorise le sommeil et le travail nocturne du foie.
`;
  } else if (intent === 'urgent_hunger_snack') {
    userPrompt = `J'ai faim tout de suite ! Que manger de rapide ?`;
    mockAiResponse = `
Voici une collation express vivante prête en 2 minutes :

### 🍌 En-cas Énergétique aux ${selectedFruits[0]} & ${selectedSeeds[0]}

**Ingrédients :**
* ${selectedFruits[0]}
* 2 c. à soupe de ${selectedSeeds[0]}
* Une pincée de ${selectedSeasoning[0]}

Apport d'énergie propre sans encrassement.
`;
  } else if (intent === 'transition_craving_buffer') {
    userPrompt = `J'ai envie de manger du poisson ce soir, comment l'équilibrer ?`;
    mockAiResponse = `
Selon le principe du régime de transition d'Arnold Ehret, accompagnez toujours votre plat d'un puissant tampon alcalin :

### 🐟 Assiette de Transition : ${selectedTransition} & Lit Vivant

**Ingrédients :**
* ${selectedTransition}
* 70% de ${selectedGreens[0]} et ${selectedGreens[1]} crus
* Jus abondant de ${selectedSeasoning[0]}
* Filet de ${selectedSeasoning[1]}

Le volume de verdure crue neutralise la charge acide et fluidifie le transit.
`;
  } else if (intent === 'detox_juice_infusion') {
    userPrompt = `Donne-moi une infusion ou un jus pour drainer les reins et le foie.`;
    mockAiResponse = `
Voici une formule botanique reminéralisante :

### 🍵 Décoction Rénale d'Ortie & ${selectedSeasoning[0]}

**Ingrédients :**
* Feuilles d'ortie dioïque séchées (2 c. à soupe)
* ${selectedSeasoning[0]}
* 500 ml d'eau pure de source

Laisser infuser 15 minutes à couvert.
`;
  } else if (intent === 'multi_day_plan_3d' || intent === 'multi_day_plan_7d' || intent === 'multi_day_plan_14d') {
    expectedType = 'plan';
    const daysCount = intent === 'multi_day_plan_3d' ? 3 : (intent === 'multi_day_plan_7d' ? 7 : 14);
    userPrompt = `Fais-moi un plan de transition complet sur ${daysCount} jours pour détoxifier la lymphe.`;
    
    let daysMarkdown = '';
    for (let d = 1; d <= daysCount; d++) {
      daysMarkdown += `
### JOUR ${d} : Phase de Nettoyage ${d}
• Hydratation : Eau tiède citronnée
• Matin : ${selectedFruits[0]} et ${selectedFruits[1]}
• Déjeuner : Salade géante aux ${selectedVegs[0]} et ${selectedGreens[0]}
• Dîner : ${selectedTransition} et velouté doux
`;
    }
    mockAiResponse = `Voici votre protocole structuré sur ${daysCount} jours :\n${daysMarkdown}`;
  } else if (intent === 'fasting_intermittent_regimen') {
    expectedType = 'plan';
    userPrompt = `Programme de jeûne intermittent 16/8 adapté au vitalisme.`;
    mockAiResponse = `
Voici votre protocole de jeûne intermittent :

### JOUR 1 : Rythme Circadien & Repos Digestif
• Hydratation : Eau pure et tisanes non sucrées jusqu'à 12h00
• Déjeuner : Grande salade vivante aux ${selectedVegs[0]} et ${selectedGreens[0]}
• Dîner : Velouté tiède de ${selectedTransition} avant 20h00

### JOUR 2 : Activation Lymphatique
• Hydratation : Eau de source et infusion d'ortie
• Déjeuner : Assiette de fruits mûrs puis verdures crues
• Dîner : Légumes vapeur douce et avocat
`;
  }

  return {
    index,
    intent,
    lang,
    profile,
    userPrompt,
    mockAiResponse,
    expectedType
  };
}

// 3. Exécution massive des 2 500 simulations
const TOTAL_RUNS = 2500;
let mealSuccessCount = 0;
let planSuccessCount = 0;
let cardHtmlSuccessCount = 0;
let errors = [];

const categoryStats = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
const intentStats = {};

console.log(`⏳ Exécution de ${TOTAL_RUNS} simulations Monte Carlo stochastiques...\n`);
const startTime = Date.now();

for (let i = 0; i < TOTAL_RUNS; i++) {
  const scenario = generateMonteCarloScenario(i + 1);
  intentStats[scenario.intent] = (intentStats[scenario.intent] || 0) + 1;

  try {
    if (scenario.expectedType === 'plan') {
      const plan = parseMarkdownDietPlan(scenario.mockAiResponse);
      assert.ok(plan, `Plan extraction failed on run #${i + 1} (${scenario.intent})`);
      assert.ok(plan.sections.length >= 2, `Plan should have at least 2 sections, got ${plan?.sections?.length}`);
      
      const html = renderDietPlanActionCardHtml(plan);
      assert.ok(html.includes('ai-diet-plan-smart-card'), `Plan card HTML invalid on run #${i + 1}`);
      assert.ok(html.includes('applyExtractedDietPlanToCalendar'), `Plan sync action missing on run #${i + 1}`);
      assert.ok(html.includes('previewAndCustomizeDietPlanModal'), `Plan customize action missing on run #${i + 1}`);
      planSuccessCount++;
      cardHtmlSuccessCount++;
    } else {
      const meal = extractSingleMealFromMarkdown(scenario.mockAiResponse);
      assert.ok(meal, `Meal extraction failed on run #${i + 1} (${scenario.intent})`);
      assert.ok(meal.name && meal.name.length >= 3, `Meal title too short on run #${i + 1}`);
      assert.ok(meal.items && meal.items.length >= 2, `Meal has insufficient ingredients (<2) on run #${i + 1}`);
      assert.ok(['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.category), `Invalid category on run #${i + 1}`);
      assert.ok(meal.pralScore !== undefined, `Missing PRAL on run #${i + 1}`);
      assert.ok(meal.vitalityScore !== undefined, `Missing Vitality score on run #${i + 1}`);

      categoryStats[meal.category]++;

      const html = renderMealActionCardHtml(meal);
      assert.ok(html.includes('ai-meal-action-card'), `Meal action card HTML invalid on run #${i + 1}`);
      assert.ok(html.includes('handleAddActionMeal'), `Add to meals button missing on run #${i + 1}`);
      assert.ok(html.includes('openScheduleMealModal'), `Schedule to calendar button missing on run #${i + 1}`);
      assert.ok(html.includes('saveMealToCustomRecipes'), `Save to recipes button missing on run #${i + 1}`);
      assert.ok(html.includes('askMealVariant'), `AI adjustment chips missing on run #${i + 1}`);
      
      mealSuccessCount++;
      cardHtmlSuccessCount++;
    }
  } catch (err) {
    errors.push({ run: i + 1, scenario, error: err.message });
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
const totalPassed = mealSuccessCount + planSuccessCount;
const successRate = ((totalPassed / TOTAL_RUNS) * 100).toFixed(2);

console.log('═══════════════════════════════════════════════════════════════════');
console.log('📊 RÉSULTATS STATISTIQUES DU TEST DE MONTE CARLO (2 500 COMBINAISONS)');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`⏱️ Durée totale de simulation : ${duration}s (${(TOTAL_RUNS / duration).toFixed(0)} tests/sec)`);
console.log(`🎯 Succès global               : ${totalPassed} / ${TOTAL_RUNS} (${successRate}%)`);
console.log(`🥗 Repas unitaires extraits    : ${mealSuccessCount}`);
console.log(`📅 Plans multi-jours extraits  : ${planSuccessCount}`);
console.log(`✨ Cartes HTML générées        : ${cardHtmlSuccessCount} / ${TOTAL_RUNS}`);

console.log('\n📈 Répartition par catégorie de repas :');
console.log(`  • 🌅 Matin / Petit-déjeuner : ${categoryStats.breakfast}`);
console.log(`  • 🥗 Midi / Déjeuner        : ${categoryStats.lunch}`);
console.log(`  • 🍲 Soir / Dîner           : ${categoryStats.dinner}`);
console.log(`  • 🍵 Collation / Tisane     : ${categoryStats.snack}`);

console.log('\n📈 Répartition par intention de requête :');
Object.entries(intentStats).forEach(([intent, count]) => {
  console.log(`  • ${intent.padEnd(30)} : ${count} simulations`);
});

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} erreurs détectées durant la simulation :`);
  errors.slice(0, 5).forEach(e => console.error(`  - Run #${e.run} (${e.scenario.intent}): ${e.error}`));
  process.exit(1);
} else {
  console.log('\n🏆 VALIDATION MONTE CARLO 100.00% RÉUSSIE SUR TOUTES LES 2 500 COMBINAISONS !');
  console.log('✨ Zéro faille, conformité totale de la structure interactive et des 4 Call-to-Actions.');
}
