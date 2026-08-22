/**
 * run_all_tests.mjs
 * 
 * Master Test Runner for VitalTrack.
 * Runs all unit, integration, and E2E mobile audit suites in sequence.
 */

import { execSync } from 'child_process';

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 VITALTRACK MASTER QUALITY & TEST SUITE RUNNER');
console.log('═══════════════════════════════════════════════════════════\n');

const isE2EOnly = process.argv.includes('--e2e');
const isAll = process.argv.includes('--all');

const unitSuites = [
  { name: 'Suite 1: Intégrité des 76 Recettes & Filtrage Multi-Ingrédients', file: 'tests/test_recipes_logic.mjs' },
  { name: 'Suite 2: Moteur Deep Search, RAG 10M & Sécurité Phyto', file: 'tests/test_deep_search_logic.mjs' },
  { name: 'Suite 3: Lecteur e-Book BookReader & Édition Intégrale d\'Ehret (FR)', file: 'tests/test_book_reader_logic.mjs' },
  { name: 'Suite 4: Lecteur e-Book BookReader & Édition Intégrale du Dr. Morse (FR)', file: 'tests/test_morse_reader_logic.mjs' },
  { name: 'Suite 5: Éditions Intégrales en Espagnol des Livres d\'Ehret & Dr. Morse (ES)', file: 'tests/test_spanish_books_logic.mjs' },
  { name: 'Suite 6: Intégrité Linguistique & Parité i18n Exhaustive (FR/EN/ES/FR-CA)', file: 'tests/test_i18n_completeness.mjs' },
  { name: 'Suite 7: Mascotte Speech Bubble, Badges & Synchronisation Protocole i18n', file: 'tests/test_mascot_i18n_and_badges.mjs' },
  { name: 'Suite 8: Suivi du Poids, Comparateur Avant/Après & Purge RGPD Photos', file: 'tests/test_weight_photos_logic.mjs' },
  { name: 'Suite 9: Détection d\'Intention Chat & Cascades Multi-Modèles FinOps', file: 'tests/test_chat_intent_and_cascade.mjs' },
  { name: 'Suite 10: Barre Latérale de Chat & Système Vocal Gemini-Style', file: 'tests/test_chat_sidebar_and_voice.mjs' }
];

const e2eSuites = [
  { name: 'Suite E2E 1: Responsivité Mobile, Ergonomie & Design System (Puppeteer)', file: 'tests/e2e/test_mobile_responsiveness_and_colors.mjs' },
  { name: 'Suite E2E 2: Navigation Multilingue (EN/FR/ES/FR-CA) & Stabilité SPA (Puppeteer)', file: 'tests/e2e/test_navigation_and_language.mjs' },
  { name: 'Suite E2E 3: Grimoire des Préceptes & Rendu E2E (Puppeteer)', file: 'tests/test_wisdom_grimoire_i18n.mjs' },
  { name: 'Suite E2E 4: Audit Global E2E Console & Éléments Interactifs', file: 'tests/e2e/run_e2e_audit.mjs' }
];

let suitesToRun = [];
if (isE2EOnly) {
  suitesToRun = e2eSuites;
} else if (isAll) {
  suitesToRun = [...unitSuites, ...e2eSuites];
} else {
  suitesToRun = unitSuites;
}

let allPassed = true;

for (let i = 0; i < suitesToRun.length; i++) {
  const suite = suitesToRun[i];
  console.log(`\n▶️ [${i + 1}/${suitesToRun.length}] Exécution de : ${suite.name}`);
  console.log('───────────────────────────────────────────────────────────');
  
  try {
    execSync(`node ${suite.file}`, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`\n✨ SUCCÈS : ${suite.name}`);
  } catch (err) {
    console.error(`\n❌ ÉCHEC : ${suite.name}`);
    allPassed = false;
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
if (allPassed) {
  console.log('🏆 TOUTES LES SUITES DE TESTS SONT 100% VALIDÉES SANS ERREUR !');
} else {
  console.log('⚠️ DES TESTS ONT ÉCHOUÉ. VEUILLEZ VÉRIFIER LES LOGS.');
  process.exit(1);
}
console.log('═══════════════════════════════════════════════════════════\n');
