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

const suites = [
  { name: 'Suite 1: Intégrité des 76 Recettes & Filtrage Multi-Ingrédients', file: 'tests/test_recipes_logic.mjs' },
  { name: 'Suite 2: Moteur Deep Search, RAG 10M & Sécurité Phyto', file: 'tests/test_deep_search_logic.mjs' },
  { name: 'Suite 3: Responsivité Mobile, Ergonomie & Design System (Puppeteer)', file: 'tests/e2e/test_mobile_responsiveness_and_colors.mjs' },
  { name: 'Suite 4: Lecteur e-Book BookReader & Édition Intégrale d\'Ehret', file: 'tests/test_book_reader_logic.mjs' },
  { name: 'Suite 5: Lecteur e-Book BookReader & Édition Intégrale du Dr. Morse', file: 'tests/test_morse_reader_logic.mjs' },
  { name: 'Suite 6: Navigation Multilingue (EN/FR/ES/FR-CA) & Stabilité SPA (Puppeteer)', file: 'tests/e2e/test_navigation_and_language.mjs' },
  { name: 'Suite 7: Intégrité Linguistique & Parité i18n Exhaustive (FR/EN/ES/FR-CA)', file: 'tests/test_i18n_completeness.mjs' },
  { name: 'Suite 8: Grimoire des Préceptes & Capsule de Sagesse Multilingue (366 items)', file: 'tests/test_wisdom_grimoire_i18n.mjs' }
];

let allPassed = true;

for (let i = 0; i < suites.length; i++) {
  const suite = suites[i];
  console.log(`\n▶️ [${i + 1}/${suites.length}] Exécution de : ${suite.name}`);
  console.log('───────────────────────────────────────────────────────────');
  
  try {
    const output = execSync(`node ${suite.file}`, { stdio: 'inherit', cwd: process.cwd() });
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
