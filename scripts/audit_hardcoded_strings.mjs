/**
 * audit_hardcoded_strings.mjs
 * 
 * Scanne l'ensemble des fichiers du projet (HTML et JS) pour identifier
 * les textes codés en dur, les clés manquantes et les zones nécessitant
 * une refactorisation avec t(key) et data-i18n.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const webApp = path.join(root, 'web-app');

console.log('🔍 Audit des textes en dur et du système i18n...');

// 1. Charger les dictionnaires
import fr from '../web-app/src/locales/fr.js';
import en from '../web-app/src/locales/en.js';
import es from '../web-app/src/locales/es.js';
import frCA from '../web-app/src/locales/fr-CA.js';

function getFlatKeys(obj, prefix = '') {
  let keys = {};
  for (const k in obj) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(keys, getFlatKeys(obj[k], full));
    } else {
      keys[full] = obj[k];
    }
  }
  return keys;
}

const frKeys = getFlatKeys(fr);
const enKeys = getFlatKeys(en);
const esKeys = getFlatKeys(es);
const frCAKeys = getFlatKeys(frCA);

console.log(`\n📊 Statistiques Dictionnaires :`);
console.log(`  - FR    : ${Object.keys(frKeys).length} clés`);
console.log(`  - EN    : ${Object.keys(enKeys).length} clés`);
console.log(`  - ES    : ${Object.keys(esKeys).length} clés`);
console.log(`  - FR-CA : ${Object.keys(frCAKeys).length} clés`);

// 2. Vérifier les clés manquantes
const allKeyNames = new Set([
  ...Object.keys(frKeys),
  ...Object.keys(enKeys),
  ...Object.keys(esKeys),
  ...Object.keys(frCAKeys)
]);

let missingCount = 0;
for (const k of allKeyNames) {
  const missingIn = [];
  if (!(k in frKeys)) missingIn.push('FR');
  if (!(k in enKeys)) missingIn.push('EN');
  if (!(k in esKeys)) missingIn.push('ES');
  if (!(k in frCAKeys)) missingIn.push('FR-CA');
  if (missingIn.length > 0) {
    missingCount++;
    console.log(`⚠️ Clé manquante [${k}] dans : ${missingIn.join(', ')}`);
  }
}
console.log(`Total clés asymétriques : ${missingCount}`);

// 3. Scanner index.html pour repérer les éléments visibles sans attributs data-i18n
const indexHtmlPath = path.join(webApp, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

console.log('\n🔍 Analyse de index.html pour les textes bruts...');
// Regex pour repérer les boutons, titres, labels sans data-i18n
const elementRegex = /<(button|h[1-6]|span|p|label|a|div|th|td)[^>]*>([^<]+)<\/\1>/gi;
let match;
let unlocalizedElements = [];

while ((match = elementRegex.exec(indexHtml)) !== null) {
  const tag = match[1];
  const fullTag = match[0];
  const text = match[2].trim();
  
  // Ignorer si vide, ou si uniquement des chiffres/icônes/symboles, ou balise script/style
  if (!text || /^[\d\s\.\:\%\€\$\-\+\,\/\|\(\)\#\*\➔\⚡\🌱\🌿\⚠️\⛔\🔥\💧\🍎\🥬\📚\🔍\🧘\✨\🏆\❤️\💬\📅\📊\🔔\⚙️\👤\➕\➖\✏️\🗑️\⏱️\📖\🌙\☀️\🇫🇷\🇬🇧\🇪🇸\⚜️]+$/.test(text)) {
    continue;
  }
  
  // Si le tag ne contient pas data-i18n
  if (!fullTag.includes('data-i18n') && text.length > 2 && !text.includes('${')) {
    unlocalizedElements.push({ tag, text: text.slice(0, 50), snippet: fullTag.slice(0, 70) });
  }
}

console.log(`Éléments potentiellement non traduits dans index.html : ${unlocalizedElements.length}`);
unlocalizedElements.slice(0, 30).forEach((el, i) => {
  console.log(`  ${i + 1}. [${el.tag}] "${el.text}"`);
});

// 4. Scanner les fichiers JS pour les chaînes littérales récurrentes de l'interface
console.log('\n🔍 Analyse des fichiers JavaScript...');
const jsFiles = [
  'main.js',
  'recipesModule.js',
  'deepSearchModule.js',
  'calendar-legacy.js',
  'mascot.js',
  'mascot-nudges.js',
  'diet-plan-engine.js',
  'bookReaderModule.js',
  'auth.js'
];

jsFiles.forEach(f => {
  const filePath = path.join(webApp, 'src', f);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Rechercher les occurrences directes de textes en français courants non enveloppés dans t()
  const frenchPatterns = [
    /["'](Enregistrer|Supprimer|Modifier|Ajouter|Annuler|Fermer|Rechercher|Filtrer|Chargement|Erreur|Succès|Confirmer|Télécharger|Partager)["']/g,
    /["'](Petit-déjeuner|Déjeuner|Dîner|Collation|Jeûne|Hydratation|Vitalité|Alcalin|Mucus|Détox|Énergie|Niveau|Phase|Jour|Semaine|Mois)["']/g,
    /["'](Aucune recette|Aucun résultat|Veuillez patienter|Chargement en cours|Profil enregistré|Données synchronisées)["']/g,
    /alert\(["']([^"']+)["']\)/g,
    /showToast\(["']([^"']+)["']\)/g
  ];

  let matchesCount = 0;
  frenchPatterns.forEach(pat => {
    let m;
    while ((m = pat.exec(content)) !== null) {
      matchesCount++;
    }
  });

  console.log(`  📄 ${f} : ${matchesCount} motifs de textes d'interface repérés`);
});
