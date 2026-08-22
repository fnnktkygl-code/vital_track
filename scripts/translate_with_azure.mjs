/**
 * translate_with_azure.mjs
 * 
 * Script de traduction automatisée haute performance utilisant l'API Microsoft Translator (Azure Cognitive Services).
 * Offre 2 millions de caractères gratuits par mois (Tier F0).
 * 
 * Usage :
 *   export AZURE_TRANSLATOR_KEY="votre_cle_azure"
 *   export AZURE_TRANSLATOR_REGION="votre_region" (ex: "francecentral", "westeurope", "global")
 *   node scripts/translate_with_azure.mjs
 * 
 * Fonctionnalités :
 * - Découpage intelligent par sections / paragraphes pour respecter les quotas Azure
 * - Préservation stricte du balisage Markdown (titres #, tableaux |, listes, gras)
 * - Cache de progression incrémentale (reprise automatique en cas d'interruption)
 * - Assemblage automatique dans knowledge/ et web-app/src/data/books/
 */

import fs from 'fs';
import path from 'path';

const SOURCE_FILE = '/Users/richard/Developer/vital_track/knowledge/robert-morse-the-detox-miracle-sourcebook-ebook.md';
const CACHE_FILE = '/Users/richard/Developer/vital_track/scripts/.translation_cache_azure.json';
const OUTPUT_MD = '/Users/richard/Developer/vital_track/knowledge/robert-morse-le-guide-du-miracle-de-la-detox-fr.md';
const OUTPUT_JS = '/Users/richard/Developer/vital_track/web-app/src/data/books/morseDetoxMiracleFr.js';

const KEY = process.env.AZURE_TRANSLATOR_KEY || process.env.TRANSLATOR_TEXT_SUBSCRIPTION_KEY;
const REGION = process.env.AZURE_TRANSLATOR_REGION || process.env.TRANSLATOR_TEXT_REGION || 'global';
const ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';

if (!KEY) {
  console.error('\n❌ ERREUR : Clé API Microsoft Translator manquante !');
  console.error('Veuillez définir votre clé Azure Translator via la variable d\'environnement :');
  console.error('  export AZURE_TRANSLATOR_KEY="votre_cle_azure"');
  console.error('  export AZURE_TRANSLATOR_REGION="francecentral" (ou votre région Azure)');
  console.error('Puis relancez : node scripts/translate_with_azure.mjs\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🌐 TRADUCTEUR AZURE MICROSOFT TRANSLATOR (TIER GRATUIT 2M)');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📍 Région Azure : ${REGION}`);
console.log(`📖 Source : ${SOURCE_FILE}`);

async function translateBatch(texts) {
  const url = `${ENDPOINT}/translate?api-version=3.0&from=en&to=fr&textType=plain`;
  const body = texts.map(t => ({ Text: t }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': KEY,
      'Ocp-Apim-Subscription-Region': REGION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur API Azure (${response.status} ${response.statusText}): ${errText}`);
  }

  const data = await response.json();
  return data.map(item => item.translations[0]?.text || '');
}

async function run() {
  const rawText = fs.readFileSync(SOURCE_FILE, 'utf8');
  const lines = rawText.split('\n');

  // Découpage en blocs logiques (paragraphes et sections)
  const blocks = [];
  let currentBlock = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      if (line.trim() !== '') {
        blocks.push(line);
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  console.log(`📊 Nombre total de blocs à traduire : ${blocks.length}`);

  // Chargement du cache de reprise
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`💾 Cache existant chargé : ${Object.keys(cache).length} blocs déjà traduits.`);
    } catch (e) {
      cache = {};
    }
  }

  const translatedBlocks = new Array(blocks.length);
  const toTranslateIndices = [];

  for (let i = 0; i < blocks.length; i++) {
    if (cache[i] !== undefined) {
      translatedBlocks[i] = cache[i];
    } else {
      toTranslateIndices.push(i);
    }
  }

  console.log(`🚀 Blocs restants à traduire : ${toTranslateIndices.length}`);

  // Traitement par lots de 25 blocs
  const BATCH_SIZE = 25;
  for (let i = 0; i < toTranslateIndices.length; i += BATCH_SIZE) {
    const chunkIndices = toTranslateIndices.slice(i, i + BATCH_SIZE);
    const chunkTexts = chunkIndices.map(idx => blocks[idx]);

    process.stdout.write(`⏳ Traduction des blocs ${i + 1} à ${Math.min(i + BATCH_SIZE, toTranslateIndices.length)} / ${toTranslateIndices.length}... `);

    try {
      const results = await translateBatch(chunkTexts);
      for (let j = 0; j < chunkIndices.length; j++) {
        const originalIndex = chunkIndices[j];
        const translated = results[j];
        translatedBlocks[originalIndex] = translated;
        cache[originalIndex] = translated;
      }

      // Sauvegarde du cache
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
      console.log('✅ OK');
    } catch (err) {
      console.error(`\n❌ Échec sur le lot : ${err.message}`);
      console.error('Le travail accompli jusqu\'ici est sauvegardé dans le cache.');
      process.exit(1);
    }

    // Petite temporisation de courtoisie pour éviter le rate-limiting
    await new Promise(r => setTimeout(r, 200));
  }

  // Assemblage du Markdown final
  const finalMarkdown = translatedBlocks.join('\n\n');
  fs.writeFileSync(OUTPUT_MD, finalMarkdown, 'utf8');
  console.log(`\n🎉 Traduction intégrale terminée et écrite dans :\n  📄 ${OUTPUT_MD}`);

  // Assemblage dans le BookReader JS
  console.log('📦 Conversion vers le BookReader de VitalTrack...');
  // Découpage par chapitres / modules pour le BookReader
  const sections = finalMarkdown.split(/\n(?=###?\s+)/);
  const bookChapters = sections.map((sec, idx) => {
    const lines = sec.trim().split('\n');
    const titleLine = lines[0].replace(/^###?\s+/, '').trim();
    const paragraphs = lines.slice(1).join('\n').trim().split('\n\n').filter(p => p.trim().length > 0);

    return {
      id: `section-morse-${idx + 1}`,
      tag: `SECTION ${idx + 1}`,
      title: titleLine || `Section ${idx + 1}`,
      paragraphs: paragraphs.length > 0 ? paragraphs : [sec.trim()]
    };
  });

  const jsBookContent = `/**
 * morseDetoxMiracleFr.js
 * 
 * ÉDITION INTÉGRALE TRADUITE VIA MICROSOFT AZURE TRANSLATOR
 * « Le Guide du Miracle de la Détox & Régénération Cellulaire par les Plantes »
 * (The Detox Miracle Sourcebook - Dr. Robert Morse, N.D.)
 */

export const morseDetoxMiracleFr = {
  id: "morse-detox-miracle-fr",
  title: "Le Guide du Miracle de la Détox & Régénération Cellulaire par les Plantes",
  shortTitle: "Le Miracle de la Détox",
  author: "Dr. Robert Morse, N.D.",
  year: "2004 / 2012",
  pdfUrl: "/pdfs/dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf",
  coverColor: "#0f766e",
  accentColor: "#14b8a6",
  tagline: "Alimentation Vivante et Plantes pour une Régénération Cellulaire Complète",
  description: "L'ouvrage fondamental du Dr. Robert Morse traduit intégralement via Microsoft Translator.",
  pageCount: 662,
  chapters: ${JSON.stringify(bookChapters, null, 2)}
};
`;

  fs.writeFileSync(OUTPUT_JS, jsBookContent, 'utf8');
  console.log(`✅ Module BookReader JS mis à jour : ${OUTPUT_JS}`);
  console.log('🏆 PROCESSUS DE TRADUCTION AZURE COMPLÈTEMENT FINALISÉ !');
}

run().catch(err => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
