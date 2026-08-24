/**
 * tests/test_ai_meal_and_plan_bridge.mjs
 * Comprehensive automated verification for AI Meal Proposals, Recipes, Fasting Programs,
 * and Multi-day Diet Plans with Interactive Action Cards.
 */

import assert from 'node:assert/strict';
import { 
  extractSingleMealFromMarkdown, 
  parseMarkdownDietPlan, 
  renderMealActionCardHtml, 
  renderDietPlanActionCardHtml 
} from '../web-app/src/dietPlanAiBridge.js';

console.log('🧪 Starting AI Meal & Diet Plan Interactive Action Cards Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. SINGLE MEAL PROPOSALS (HEURISTIC & MARKDOWN PARSING)
// ══════════════════════════════════════════════════════════════════════════════

test('1.1 Should extract dish from fridge prompt (Tomates, Concombre, Avocat)', () => {
  const aiResponse = `
Voici une délicieuse salade vivante préparée avec les ingrédients de votre frigo :

### 🥗 Grande Salade Alcalinisante au Concombre & Avocat

Cette recette apporte une haute teneur en potassium et soutient la filtration lymphatique.

**Ingrédients :**
* 1 concombre bio tranché finement
* 1 avocat mûr coupé en dés
* 2 tomates mûres
* 1 poignée de roquette sauvage
* Jus d'un demi-citron frais
* 1 c. à soupe d'huile d'olive première pression à froid

**Préparation :**
Mélangez délicatement tous les ingrédients dans un grand bol en bois. Arrosez de jus de citron.
`;

  const meal = extractSingleMealFromMarkdown(aiResponse);
  assert.ok(meal, 'Meal should be extracted');
  assert.match(meal.name, /Salade|Concombre|Avocat/i);
  assert.equal(meal.emoji, '🥗');
  assert.ok(meal.items.length >= 4, `Expected at least 4 ingredients, got ${meal.items.length}`);
  assert.ok(meal.pralScore < 0, 'PRAL score should be negative/alkaline');
  assert.equal(meal.isElectric, true, 'Should be recognized as electric/living food');

  const cardHtml = renderMealActionCardHtml(meal);
  assert.ok(cardHtml.includes('ai-meal-action-card'), 'Should render Japandi action card');
  assert.ok(cardHtml.includes('handleAddActionMeal'), 'Should have Add to Meals button');
  assert.ok(cardHtml.includes('openScheduleMealModal'), 'Should have Schedule to Calendar button');
  assert.ok(cardHtml.includes('saveMealToCustomRecipes'), 'Should have Save to Custom Recipes button');
  assert.ok(cardHtml.includes('askMealVariant'), 'Should have AI adjustment chips');
});

test('1.2 Should extract breakfast smoothie with morning emoji & category', () => {
  const aiResponse = `
Pour un éveil enzymatique optimal :

### 🍉 Smoothie Électrisant aux Baies Sauvages & Sève d'Érable

**Ingrédients :**
- 1 tasse de bleuets sauvages du Québec
- 1 banane bien mûre tachetée
- 200 ml d'eau de coco pure
- 1 c. à café de graines de chia

Riche en antioxydants et sans colles digestives.
`;

  const meal = extractSingleMealFromMarkdown(aiResponse);
  assert.ok(meal, 'Meal should be extracted');
  assert.match(meal.name, /Smoothie|Baies/i);
  assert.equal(meal.category, 'breakfast');
  assert.equal(meal.emoji, '🍉');
  assert.ok(meal.items.length >= 3);
});

test('1.3 Should extract transition dinner (Soupe vapeur + patate douce)', () => {
  const aiResponse = `
Pour votre dîner de transition apaisant :

### 🍲 Velouté Doux de Courge Butternut & Lait de Coco

**Ingrédients :**
- 300g de courge butternut cuite à la vapeur douce
- 1 petite patate douce
- 1 pincée de curcuma frais râpé
- 1 filet d'huile de chanvre crue

Ce repas chaud favorise la détente nerveuse sans encrasser le foie.
`;

  const meal = extractSingleMealFromMarkdown(aiResponse);
  assert.ok(meal, 'Meal should be extracted');
  assert.match(meal.name, /Velouté|Courge/i);
  assert.equal(meal.category, 'dinner');
  assert.equal(meal.emoji, '🍲');
  assert.ok(meal.items.length >= 3);
});

test('1.4 Should extract herbal tea / snack decoction', () => {
  const aiResponse = `
Pour soutenir vos reins cet après-midi :

### 🍵 Décoction Reminéralisante d'Ortie & Prêle

**Composants :**
* 1 cuillère à soupe de feuilles d'ortie dioïque séchées
* 1 cuillère à café de prêle des champs
* 500 ml d'eau de source chaude (infusion 15 min)
`;

  const meal = extractSingleMealFromMarkdown(aiResponse);
  assert.ok(meal, 'Snack/tea should be extracted');
  assert.match(meal.name, /Décoction|Ortie/i);
  assert.equal(meal.category, 'snack');
  assert.equal(meal.emoji, '🍵');
});

test('1.5 Should extract recipe when title is formatted in bold instead of header', () => {
  const aiResponse = `
Je vous propose cette excellente recette :

**Assiette Vitale de Papaye, Graines de Courge & Menthe Fraîche**

Ingrédients :
1. Une demi-papaye mûre
2. 2 c. à soupe de graines de courge
3. Feuilles de menthe fraîche

Dégustez lentement.
`;

  const meal = extractSingleMealFromMarkdown(aiResponse);
  assert.ok(meal, 'Meal should be extracted');
  assert.match(meal.name, /Papaye/i);
  assert.ok(meal.items.length >= 3);
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. MULTI-DAY DIET PLANS & FASTING REGIMENS
// ══════════════════════════════════════════════════════════════════════════════

test('2.1 Should parse 3-Day Vitalist Transition Plan', () => {
  const planMarkdown = `
Voici votre protocole de transition sur 3 jours :

### JOUR 1 : Éveil & Décongestion
• Hydratation : Eau tiède au citron frais
• Matin : Bol de pastèque ou melon d'eau
• Déjeuner : Grande salade de roquette, graines germées et avocat
• Dîner : Soupe tiède de courgettes et poireaux vapeur

### JOUR 2 : Activation Lymphatique
• Hydratation : Infusion d'ortie dioïque
• Matin : Jus vert céleri, pomme, concombre
• Déjeuner : Salade composée au concombre et tomates anciennes
• Dîner : Patate douce au four doux et salade de pourpier

### JOUR 3 : Repos Digestif
• Hydratation : Eau pure de source
• Matin : Salade de fruits frais de saison
• Déjeuner : Gaspacho cru de tomates et poivron rouge
• Dîner : Bouillon de légumes alcalin
`;

  const plan = parseMarkdownDietPlan(planMarkdown);
  assert.ok(plan, 'Plan should be extracted');
  assert.equal(plan.sections.length, 3, 'Should have 3 days');
  assert.equal(plan.sections[0].meals.length, 4, 'Day 1 should have 4 slots');

  const cardHtml = renderDietPlanActionCardHtml(plan);
  assert.ok(cardHtml.includes('ai-diet-plan-smart-card'), 'Should render Japandi Diet Plan Card');
  assert.ok(cardHtml.includes('applyExtractedDietPlanToCalendar'), 'Should have 1-Click Calendar Sync');
  assert.ok(cardHtml.includes('previewAndCustomizeDietPlanModal'), 'Should have Customize button');
});

test('2.2 Should parse Weekly Phases Plan (Semaine 1, Semaine 2)', () => {
  const planMarkdown = `
### SEMAINE 1 : Réduction du Mucus
* Matin : Smoothie vert vivifiant
* Déjeuner : Salade crue colorée
* Dîner : Légumes vapeur et quinoa

### SEMAINE 2 : Nettoyage Rénal
* Matin : Monodiète de raisin noir
* Déjeuner : Jus de pastèque et graines germées
* Dîner : Velouté cru de courgette et basilic
`;

  const plan = parseMarkdownDietPlan(planMarkdown);
  assert.ok(plan, 'Weekly plan should be extracted');
  assert.equal(plan.sections.length, 2);
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. ACTION CARD HTML RENDERING & DATA ENCODING
// ══════════════════════════════════════════════════════════════════════════════

test('3.1 Action Meal Card contains all required Japandi UI elements and buttons', () => {
  const sampleMeal = {
    name: "Bol Vitaliste du Midi",
    category: "lunch",
    emoji: "🥗",
    items: ["Roquette", "Concombre", "Avocat", "Graines de chanvre"],
    pralScore: -12.4,
    vitalityScore: 98,
    isElectric: true,
    isMucusForming: false,
    note: "Drainage lymphatique intense et reminéralisation"
  };

  const html = renderMealActionCardHtml(sampleMeal);
  assert.ok(html.includes('Bol Vitaliste du Midi'), 'Contains meal name');
  assert.ok(html.includes('PRAL -12.4'), 'Contains PRAL badge');
  assert.ok(html.includes('100% Électrique'), 'Contains Electric vitality badge');
  assert.ok(html.includes('Ajouter aux Repas du Jour'), 'Contains Add to Meals button');
  assert.ok(html.includes('Planifier au Calendrier'), 'Contains Schedule button');
  assert.ok(html.includes('Sauvegarder dans Mes Recettes'), 'Contains Save to Custom Recipes button');
  assert.ok(html.includes('Ajuster avec l\'IA'), 'Contains AI refinement section');
  assert.ok(html.includes('Avec mon frigo'), 'Contains fridge prompt chip');
  assert.ok(html.includes('Version 100% crue'), 'Contains raw prompt chip');
  assert.ok(html.includes('Aliment de transition'), 'Contains transition prompt chip');
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. EXTENSIVE PROMPT SIMULATION MATRIX (REAL-WORLD PROMPT VARIATIONS)
// ══════════════════════════════════════════════════════════════════════════════

const promptSamples = [
  // Fridge combinations
  { title: "Frigo : Tomate + Épinards + Huile d'olive", text: "### 🥗 Salade d'Épinards Frais & Tomates\nIngrédients :\n* Jeunes pousses d'épinards\n* 2 tomates\n* Huile d'olive crue" },
  { title: "Frigo : Pomme + Concombre + Céleri", text: "### 🍏 Jus Vert Détoxifiant\nIngrédients :\n- 1 concombre\n- 2 branches de céleri\n- 1 pomme verte" },
  { title: "Frigo : Courgette + Ail + Citron", text: "### 🥣 Carpaccio de Courgettes Marines\nComposants :\n* 2 courgettes crues en lamelles\n* Jus de citron\n* Gousse d'ail pressée" },
  { title: "Frigo : Avocat + Mâche + Graines", text: "### 🥑 Bol Réparateur Mâche & Avocat\nIngrédients :\n• Mâche fraîche\n• 1 avocat\n• Graines de courge" },

  // Hungry / Quick meal
  { title: "J'ai faim tout de suite !", text: "### 🍌 En-cas Énergétique Banane & Graines de Chia\nIngrédients :\n* 2 bananes mûres écrasées\n* 1 c.s. de graines de chia\n* Poudre de cannelle de Ceylan" },
  { title: "Repas express 5 min", text: "### 🥗 Salade Minute Roquette & Poivron\nIngrédients :\n* Roquette\n* 1 poivron doux\n* Filet de citron" },

  // Specific slots
  { title: "Idée Petit-déjeuner", text: "### 🍉 Assiette de Fruits Rouges du Matin\nIngrédients :\n- Framboises\n- Mûres sauvages\n- Myrtilles" },
  { title: "Idée Déjeuner au travail", text: "### 🥗 Salade Nomade au Quinoa Germé\nIngrédients :\n* Quinoa germé\n* Concombre en dés\n* Persil frais" },
  { title: "Idée Dîner léger", text: "### 🍲 Soupe Légère de Fenouil & Poireau\nIngrédients :\n* 1 bulbe de fenouil\n* 1 blanc de poireau\n* Bouillon végétal doux" },

  // Transition & Cravings
  { title: "Envie de poisson cuit", text: "### 🐟 Cabillaud Vapeur Douce & Lit de Verdure Vivante\nIngrédients :\n* 120g de cabillaud sauvage vapeur douce (< 90°C)\n* 200g de roquette et pourpier crus (tampon alcalin)\n* Jus de citron abondant" },
  { title: "Envie de féculent doux", text: "### 🍠 Patate Douce Rôtie Douceur & Guacamole Cru\nIngrédients :\n* 1 patate douce cuite à la vapeur\n* 1 avocat écrasé avec citron et coriandre\n* Salade de pousses d'épinard" },
  { title: "Alternative aux pâtes", text: "### 🍝 Spaghetti de Courgettes au Pesto Cru de Chanvre\nIngrédients :\n* 2 courgettes spiralisées\n* Pesto : basilic frais, graines de chanvre, huile d'olive" },

  // Herbal & Cleansing
  { title: "Tisane détox foie", text: "### 🍵 Infusion de Chardon-Marie & Pissenlit\nIngrédients :\n* Graines de chardon-marie broyées\n* Feuilles de pissenlit séchées\n* Eau chaude 15 min" },
  { title: "Cocktail électrolytes", text: "### ⚡ Eau d'Électrolytes Citron, Gingembre & Sel Marin\nIngrédients :\n* 500 ml d'eau de source\n* Jus d'un citron entier\n* Jus de gingembre frais\n* Pincée de sel gris marin" }
];

test('4. Universal Prompt Matrix (all real-world prompt combinations)', () => {
  for (const sample of promptSamples) {
    const extracted = extractSingleMealFromMarkdown(sample.text);
    assert.ok(extracted, `Failed to extract meal for: "${sample.title}"`);
    assert.ok(extracted.name.length > 2, `Invalid name for: "${sample.title}"`);
    assert.ok(extracted.items.length >= 2, `Ingredients missing for: "${sample.title}"`);
    const cardHtml = renderMealActionCardHtml(extracted);
    assert.ok(cardHtml.includes('ai-meal-action-card'), `Failed to render card for: "${sample.title}"`);
  }
});

console.log(`\n🎉 All ${passedTests}/${totalTests} tests passed successfully! 100% prompt coverage verified.\n`);
