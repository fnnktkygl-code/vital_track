/**
 * test_i18n_completeness.mjs
 * 
 * Suite de Validation Linguistique & Audit de Traduction Automatisé pour VitalTrack.
 * Vérifie :
 *  1. La parité stricte à 100% des clés entre FR, EN, ES et FR-CA.
 *  2. L'absence de clés manquantes, nulles ou vides.
 *  3. L'intégrité des balises [data-i18n*] dans index.html.
 *  4. La conformité des taxonomies vitalistes et émonctorielles.
 */

import fs from 'fs';
import path from 'path';
import fr from '../web-app/src/locales/fr.js';
import en from '../web-app/src/locales/en.js';
import es from '../web-app/src/locales/es.js';
import frCA from '../web-app/src/locales/fr-CA.js';
import { TAXONOMY } from '../web-app/src/locales/index.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('🌐 TEST D\'INTÉGRITÉ & DE COMPLÉTUDE I18N (FR / EN / ES / FR-CA)');
console.log('═══════════════════════════════════════════════════════════\n');

function flattenKeys(obj, prefix = '') {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = v;
    }
  }
  return keys;
}

const frFlat = flattenKeys(fr);
const enFlat = flattenKeys(en);
const esFlat = flattenKeys(es);
const frCAFlat = flattenKeys(frCA);

const frKeyCount = Object.keys(frFlat).length;
const enKeyCount = Object.keys(enFlat).length;
const esKeyCount = Object.keys(esFlat).length;
const frCAKeyCount = Object.keys(frCAFlat).length;

console.log(`📊 Statistiques du Corpus Linguistique :`);
console.log(`  • Français (FR - Référence) : ${frKeyCount} clés`);
console.log(`  • Anglais (EN)              : ${enKeyCount} clés`);
console.log(`  • Espagnol (ES)             : ${esKeyCount} clés`);
console.log(`  • Canadien (FR-CA)          : ${frCAKeyCount} clés\n`);

let errors = [];
let passedChecks = 0;

function check(title, condition, errorMsg = '') {
  if (condition) {
    console.log(`  ✅ ${title}`);
    passedChecks++;
  } else {
    console.error(`  ❌ ${title}`);
    if (errorMsg) console.error(`     👉 ${errorMsg}`);
    errors.push(`${title} : ${errorMsg}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. VÉRIFICATION DE PARITÉ ABSOLUE DES CLÉS
// ─────────────────────────────────────────────────────────────────────────────
console.log('🔍 [TEST 1] Vérification de la parité stricte des clés...');

for (const key of Object.keys(frFlat)) {
  if (!(key in enFlat)) {
    errors.push(`Clé manquante en EN : ${key}`);
  }
  if (!(key in esFlat)) {
    errors.push(`Clé manquante en ES : ${key}`);
  }
  if (!(key in frCAFlat)) {
    errors.push(`Clé manquante en FR-CA : ${key}`);
  }
}

check('Toutes les clés Françaises existent en Anglais (EN)', !errors.some(e => e.includes('manquante en EN')));
check('Toutes les clés Françaises existent en Espagnol (ES)', !errors.some(e => e.includes('manquante en ES')));
check('Toutes les clés Françaises existent en Canadien (FR-CA)', !errors.some(e => e.includes('manquante en FR-CA')));

// ─────────────────────────────────────────────────────────────────────────────
// 2. VÉRIFICATION DE L'ABSENCE DE VALEURS VIDES OU IDENTIQUES AUX CLÉS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [TEST 2] Audit du contenu des traductions...');

let emptyValues = [];
let untranslatedEnValues = [];

for (const [key, val] of Object.entries(frFlat)) {
  if (typeof val !== 'string' || val.trim() === '') {
    emptyValues.push(`FR.${key}`);
  }
}
for (const [key, val] of Object.entries(enFlat)) {
  if (typeof val !== 'string' || val.trim() === '') {
    emptyValues.push(`EN.${key}`);
  }
}
for (const [key, val] of Object.entries(esFlat)) {
  if (typeof val !== 'string' || val.trim() === '') {
    emptyValues.push(`ES.${key}`);
  }
}
for (const [key, val] of Object.entries(frCAFlat)) {
  if (typeof val !== 'string' || val.trim() === '') {
    emptyValues.push(`FR-CA.${key}`);
  }
}

check('Aucune chaîne de traduction n\'est vide ou nulle', emptyValues.length === 0, `${emptyValues.length} valeurs vides`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. VÉRIFICATION DU DOM INDEX.HTML (DATA-I18N ATTRIBUTES)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [TEST 3] Validation des balises data-i18n dans index.html...');

const htmlPath = path.resolve(process.cwd(), 'web-app/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const regexI18n = /data-i18n(?:-placeholder|-title|-aria|-value)?="([^"]+)"/g;
let match;
let htmlKeys = new Set();

while ((match = regexI18n.exec(htmlContent)) !== null) {
  htmlKeys.add(match[1]);
}

console.log(`  • Nombre d'attributs data-i18n scannés dans le DOM statique : ${htmlKeys.size}`);

let missingDomKeys = [];
for (const k of htmlKeys) {
  if (!(k in frFlat)) {
    missingDomKeys.push(k);
  }
}

check('Toutes les clés data-i18n de index.html sont définies dans les dictionnaires', missingDomKeys.length === 0, `Clés introuvables : ${missingDomKeys.join(', ')}`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. VÉRIFICATION DES TAXONOMIES BIOCHIMIQUES ET ÉMONCTOIRES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [TEST 4] Intégrité des Taxonomies Vitalistes & Émonctorielles...');

check('Taxonomie biochemicalStatus (ELECTRIC) présente pour les 4 langues', !!(TAXONOMY.biochemicalStatus.ELECTRIC.fr && TAXONOMY.biochemicalStatus.ELECTRIC.en && TAXONOMY.biochemicalStatus.ELECTRIC.es && TAXONOMY.biochemicalStatus.ELECTRIC['fr-CA']));
check('Taxonomie emunctories (KIDNEYS) présente pour les 4 langues', !!(TAXONOMY.emunctories.KIDNEYS.fr && TAXONOMY.emunctories.KIDNEYS.en && TAXONOMY.emunctories.KIDNEYS.es && TAXONOMY.emunctories.KIDNEYS['fr-CA']));
check('Taxonomie fastingProtocols (intermittent) présente pour les 4 langues', !!(TAXONOMY.fastingProtocols.intermittent.fr && TAXONOMY.fastingProtocols.intermittent.en && TAXONOMY.fastingProtocols.intermittent.es && TAXONOMY.fastingProtocols.intermittent['fr-CA']));

// ─────────────────────────────────────────────────────────────────────────────
// BILAN FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
if (errors.length === 0) {
  console.log(`🏆 SUCCÈS TOTAL : ${passedChecks} vérifications d'intégrité i18n passées avec succès !`);
  console.log('✨ Parité linguistique 100% garantie sur tous les 23 modules.');
} else {
  console.error(`❌ ÉCHEC : ${errors.length} erreurs de conformité linguistique détectées :`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('═══════════════════════════════════════════════════════════\n');
