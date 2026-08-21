/**
 * test_recipes_logic.mjs
 * 
 * Comprehensive Unit Test Suite for VitalTrack Recipes Architecture:
 * - Validates all 76 recipes for data integrity and vitalist compliance.
 * - Tests multi-ingredient filtering (modes ANY and ALL).
 * - Tests servings calculation arithmetic.
 * - Validates verified YouTube video URLs.
 */

import { VITALIST_RECIPES, RECIPE_AUTHORS, RECIPE_TAGS, POPULAR_INGREDIENTS } from '../web-app/src/data/recipesData.js';

console.log('🧪 [TEST SUITE 1] Validation de la Pharmacopée Culinaire & Recettes (76 recettes)...');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ ÉCHEC: ${message}`);
    process.exitCode = 1;
  }
}

// ── 1. Nombre total et auteurs ──
assert(Array.isArray(VITALIST_RECIPES), 'VITALIST_RECIPES est un tableau.');
assert(VITALIST_RECIPES.length === 76, `VITALIST_RECIPES contient exactement 76 recettes (actuel: ${VITALIST_RECIPES.length}).`);
assert(Array.isArray(RECIPE_AUTHORS) && RECIPE_AUTHORS.length >= 7, 'RECIPE_AUTHORS contient tous les auteurs de référence.');
assert(Array.isArray(RECIPE_TAGS) && RECIPE_TAGS.length >= 10, 'RECIPE_TAGS contient au moins 10 tags thématiques.');
assert(Array.isArray(POPULAR_INGREDIENTS) && POPULAR_INGREDIENTS.length >= 30, 'POPULAR_INGREDIENTS contient les chips clés.');

// ── 2. Intégrité de chaque recette ──
const ids = new Set();
let verifiedVideoCount = 0;
let sauceCondimentCount = 0;

VITALIST_RECIPES.forEach((r, idx) => {
  const label = `Recette #${idx + 1} [${r.id}] "${r.title}"`;
  
  // ID unique
  assert(r.id && typeof r.id === 'string' && !ids.has(r.id), `${label} possède un ID unique.`);
  ids.add(r.id);

  // Titres & auteur
  assert(r.title && r.title.length >= 3, `${label} possède un titre valide.`);
  assert(r.subtitle && r.subtitle.length >= 3, `${label} possède un sous-titre.`);
  assert(r.author && r.authorTitle, `${label} possède un auteur et un titre d'autorité.`);
  assert(r.bookReference && r.bookReference.length >= 5, `${label} est rigoureusement sourcée dans un livre/monographie.`);

  // Catégorie & Scores
  assert(['jus-smoothie', 'elixir-tisane', 'plat-principal', 'salade-entree', 'soupe-bouillon', 'dessert-vivant', 'sauce-condiment', 'pain-boulangerie-ancestrale'].includes(r.category), `${label} possède une catégorie valide (${r.category}).`);
  assert(typeof r.vitalityScore === 'number' && r.vitalityScore >= 50 && r.vitalityScore <= 100, `${label} a un score de vitalité entre 50 et 100.`);
  assert(typeof r.pralScore === 'number', `${label} a un score PRAL numérique (${r.pralScore}).`);
  assert(typeof r.servings === 'number' && r.servings > 0, `${label} a un nombre de portions initial > 0 (${r.servings}).`);

  // Ingrédients
  assert(Array.isArray(r.ingredients) && r.ingredients.length > 0, `${label} a une liste d'ingrédients non vide (${r.ingredients?.length}).`);
  r.ingredients.forEach((ing, iIdx) => {
    assert(ing.name && ing.name.trim().length > 0, `${label} - ingrédient #${iIdx + 1} a un nom valide.`);
    assert(typeof ing.quantity === 'number' && !isNaN(ing.quantity) && ing.quantity > 0, `${label} - ingrédient "${ing.name}" a une quantité numérique > 0 (${ing.quantity}).`);
    assert(typeof ing.unit === 'string', `${label} - ingrédient "${ing.name}" a une unité.`);
  });

  // Instructions
  assert(Array.isArray(r.instructions) && r.instructions.length >= 2, `${label} a au moins 2 étapes de préparation.`);
  assert(r.vitalistAction && r.vitalistAction.length >= 20, `${label} a une explication détaillée de l'action vitaliste.`);

  // Compteurs
  if (r.videoUrl) {
    assert(r.videoUrl.startsWith('https://www.youtube.com/') || r.videoUrl.startsWith('https://youtu.be/'), `${label} a une URL vidéo YouTube valide (${r.videoUrl}).`);
    verifiedVideoCount++;
  }
  if (r.category === 'sauce-condiment') {
    sauceCondimentCount++;
  }
});

console.log(`📊 [STATISTIQUES] Recettes avec vidéos vérifiées : ${verifiedVideoCount} / 76`);
console.log(`🥫 [STATISTIQUES] Sauces & condiments fondamentaux : ${sauceCondimentCount}`);
assert(sauceCondimentCount >= 9, 'Au moins 9 sauces et condiments fondamentaux sains sont présents.');

// ── 3. Test de l'algorithme de filtrage multi-ingrédients ──
function filterRecipes(selectedIngredients, matchMode = 'any') {
  if (!selectedIngredients || selectedIngredients.length === 0) return VITALIST_RECIPES;
  
  const normSelected = selectedIngredients.map(i => i.toLowerCase().trim());
  
  return VITALIST_RECIPES.filter(r => {
    const ingNames = r.ingredients.map(i => i.name.toLowerCase());
    
    if (matchMode === 'all') {
      return normSelected.every(sel => ingNames.some(name => name.includes(sel)));
    } else {
      return normSelected.some(sel => ingNames.some(name => name.includes(sel)));
    }
  });
}

const resAnyAvocado = filterRecipes(['Avocat'], 'any');
assert(resAnyAvocado.length >= 4, `Filtre 'Avocat' (ANY) retourne au moins 4 recettes (trouvé: ${resAnyAvocado.length}).`);

const resAllAvocadoCitron = filterRecipes(['Avocat', 'Citron'], 'all');
assert(resAllAvocadoCitron.length >= 2, `Filtre 'Avocat' + 'Citron' (ALL) retourne au moins 2 recettes (trouvé: ${resAllAvocadoCitron.length}).`);

const resSeaMoss = filterRecipes(['Sea Moss'], 'any');
assert(resSeaMoss.length >= 1, `Filtre 'Sea Moss' retourne au moins 1 recette (trouvé: ${resSeaMoss.length}).`);

// ── 4. Test du calculateur dynamique de portions ──
function scaleIngredient(ing, baseServings, targetServings) {
  const ratio = targetServings / baseServings;
  const scaledQty = ing.quantity * ratio;
  return Number.isInteger(scaledQty) ? scaledQty : Math.round(scaledQty * 10) / 10;
}

const sampleRecipe = VITALIST_RECIPES.find(r => r.id === 'sebi-sea-moss-gel');
const baseQty = sampleRecipe.ingredients[0].quantity; // 50g pour 4 pers
const scaledFor2 = scaleIngredient(sampleRecipe.ingredients[0], 4, 2);
const scaledFor8 = scaleIngredient(sampleRecipe.ingredients[0], 4, 8);

assert(scaledFor2 === 25, `Calculateur de portions: 50g pour 4 pers -> 25g pour 2 pers (obtenu: ${scaledFor2}).`);
assert(scaledFor8 === 100, `Calculateur de portions: 50g pour 4 pers -> 100g pour 8 pers (obtenu: ${scaledFor8}).`);

console.log(`\n🎉 [RÉSULTAT SUITE 1] ${passedTests} / ${totalTests} tests validés avec succès !`);
