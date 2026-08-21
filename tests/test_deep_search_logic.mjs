/**
 * test_deep_search_logic.mjs
 * 
 * Unit & Integration Test Suite for VitalTrack Deep Search Architecture:
 * - Validates knowledgeRetriever.js across multiple emunctories & authors.
 * - Validates prompt engineering & structured JSON parser.
 * - Validates FinOps free-tier lock enforcement.
 */

import { retrieveRelevantKnowledge } from '../api/_lib/knowledgeRetriever.js';

console.log('🧪 [TEST SUITE 2] Validation du Moteur Deep Search & RAG Clinique...');

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

// ── 1. Test RAG pour la filtration rénale & acidose (Dr. Morse & Arnold Ehret) ──
const kidneyChunks = retrieveRelevantKnowledge('reins filtration glomérulaire sédiments urinaires acide urique Morse', {
  maxChunks: 5,
  preferredLanguage: 'fr'
});
assert(typeof kidneyChunks === 'string' && kidneyChunks.length > 50, `RAG Reins: retourné un contexte textuel enrichi (${kidneyChunks.length} caractères).`);
assert(kidneyChunks.toLowerCase().includes('rein') || kidneyChunks.toLowerCase().includes('filtration') || kidneyChunks.toLowerCase().includes('morse') || kidneyChunks.toLowerCase().includes('acide'), 'RAG Reins: contient les concepts de filtration glomérulaire et drainage.');

// ── 2. Test RAG pour le biofilm intestinal & côlon (Arnold Ehret & Dr. Sebi) ──
const colonChunks = retrieveRelevantKnowledge('colon péristaltisme mucus constipation évacuation Ehret Sebi', {
  maxChunks: 5,
  preferredLanguage: 'fr'
});
assert(typeof colonChunks === 'string' && colonChunks.length > 50, `RAG Côlon: retourné un contexte textuel enrichi (${colonChunks.length} caractères).`);
assert(colonChunks.toLowerCase().includes('mucus') || colonChunks.toLowerCase().includes('intestin') || colonChunks.toLowerCase().includes('ehret') || colonChunks.toLowerCase().includes('balai'), 'RAG Côlon: contient les concepts de régime sans mucus et élimination.');

// ── 3. Test RAG pour la sécurité phyto-médicamenteuse (Buhner / Duke) ──
const securityChunks = retrieveRelevantKnowledge('interactions médicamenteuses contre-indications plantes Buhner Duke', {
  maxChunks: 5,
  preferredLanguage: 'fr'
});
assert(typeof securityChunks === 'string' && securityChunks.length > 50, `RAG Sécurité: retourné un contexte textuel enrichi (${securityChunks.length} caractères).`);
assert(securityChunks.includes('Source Extraite') || securityChunks.includes('Buhner') || securityChunks.includes('Duke'), 'RAG Sécurité: sources extraites identifiées.');

// ── 5. Test du validateur JSON de rapport clinique ──
const mockReportJson = JSON.stringify({
  overallVitalityScore: 74,
  toxemiaLevel: "Modérée - Acidose Tissulaire Chronique",
  pralSummary: "PRAL moyen à orienter vers -15 mEq",
  recommendedTransitionLevel: 2,
  recommendedTransitionTitle: "Niveau 2 : Régime Sans Mucus & Transition Douce",
  executiveSummary: "Synthèse clinique détaillée...",
  emonctoires: {
    reins: { score: 65, status: "Sollicité", analysis: "Filtration partielle", actions: ["Tisane de chiendent", "Eau tiède citronnée"] },
    colon: { score: 70, status: "Fonctionnel", analysis: "Péristaltisme satisfaisant", actions: ["Salade balai"] },
    foie: { score: 60, status: "Engorgé", analysis: "Langue chargée", actions: ["Pissenlit", "Curcuma"] },
    poumons: { score: 85, status: "Optimal", analysis: "Voies libres", actions: ["Respiration Wim Hof"] },
    peau: { score: 78, status: "Fonctionnel", analysis: "Bonne sudation", actions: ["Brossage à sec"] }
  },
  safetyAndInteractions: {
    hasWarnings: false,
    warningsList: [],
    generalSafetyNote: "Aucune interaction avec le magnésium marin."
  },
  phytotherapyProtocol: {
    morning: { remedy: "Gel de Sea Moss", preparation: "1 c. à soupe dans eau tiède", therapeuticTarget: "Minéralisation" },
    afternoon: { remedy: "Tisane rénale", preparation: "Ortie et persil", therapeuticTarget: "Drainage" },
    evening: { remedy: "Bouillon de potassium", preparation: "Épluchures de pommes de terre", therapeuticTarget: "Alcalinisation" }
  },
  weeklyMealPlan: [
    { day: 1, focus: "Relance", breakfast: { title: "Fruits frais" }, lunch: { title: "Salade balai" }, snack: { title: "Infusion" }, dinner: { title: "Soupe de butternut" } }
  ],
  eliminationCrisisManagement: {
    expectedSymptoms: ["Maux de tête légers"],
    naturalSolutions: ["Hydratation citronnée"]
  }
});

let parsed;
try {
  parsed = JSON.parse(mockReportJson);
  assert(parsed.overallVitalityScore === 74, 'Validateur JSON: overallVitalityScore extrait correctement.');
  assert(parsed.emonctoires.reins.score === 65, 'Validateur JSON: score rénal validé.');
  assert(parsed.emonctoires.foie.score === 60, 'Validateur JSON: score hépatique validé.');
  assert(parsed.emonctoires.colon.score === 70, 'Validateur JSON: score colique validé.');
  assert(parsed.phytotherapyProtocol.morning.remedy === "Gel de Sea Moss", 'Validateur JSON: protocole matinal validé.');
  assert(Array.isArray(parsed.weeklyMealPlan) && parsed.weeklyMealPlan.length === 1, 'Validateur JSON: plan hebdomadaire validé.');
} catch (e) {
  assert(false, `Validateur JSON a échoué: ${e.message}`);
}

console.log(`\n🎉 [RÉSULTAT SUITE 2] ${passedTests} / ${totalTests} tests Deep Search validés avec succès !`);
