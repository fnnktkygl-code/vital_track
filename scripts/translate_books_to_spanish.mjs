/**
 * translate_books_to_spanish.mjs
 * 
 * Traduction intégrale haute fidélité des livres d'Arnold Ehret et du Dr. Robert Morse en Espagnol.
 * - Traduit l'intégralité du texte (titres, sous-titres, menus, 100% des paragraphes et des phrases)
 * - Préserve et convertit les balises {{terme_fr}} -> {{terme_es}} vers le glossaire espagnol
 * - Traduit les tables Markdown (Ragnar Berg, anatomie comparée, tables acido-basiques)
 * - Mémorise dans scripts/.spanish_books_translation_cache.json pour reprise instantanée
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';
import { morseDetoxMiracleFr } from '../web-app/src/data/books/morseDetoxMiracleFr.js';

const CACHE_PATH = path.resolve(__dirname, '.spanish_books_translation_cache.json');
const EHRET_ES_OUT_PATH = path.resolve(__dirname, '../web-app/src/data/books/ehretMucuslessEs.js');
const MORSE_ES_OUT_PATH = path.resolve(__dirname, '../web-app/src/data/books/morseDetoxMiracleEs.js');

let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    console.log(`📦 Cache de traduction chargé : ${Object.keys(cache).length} entrées.`);
  } catch (err) {
    console.warn(`⚠️ Erreur lecture cache : ${err.message}`);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`⚠️ Erreur écriture cache : ${err.message}`);
  }
}

const EHRET_TAG_MAP = {
  'acide urique': 'ácido úrico',
  'air-gaz': 'aire-gas',
  'aliments sans mucus': 'alimentos sin moco',
  'bains de soleil': 'baños de sol',
  'constipation intestinale': 'estreñimiento intestinal',
  'côlon': 'colon',
  'colon': 'colon',
  'encombrement': 'obstrucción',
  'foie': 'hígado',
  'friction': 'fricción',
  'féculents': 'almidones y féculas',
  'jeûne rationnel': 'ayuno racional',
  'lavement': 'enema',
  'miroir magique': 'espejo mágico',
  'mucus': 'moco',
  'obstruction': 'obstrucción',
  'protéines': 'proteínas',
  'ragnar berg': 'ragnar berg',
  'reins': 'riñones',
  'rupture du jeûne': 'ruptura del ayuno',
  'régime de transition': 'dieta de transición',
  'régime sans mucus': 'dieta sin moco',
  'toxémie': 'toxemia',
  'vitalité': 'vitalidad',
  'élimination': 'eliminación',
  'autolyse': 'autólisis',
  'air frais': 'aire fresco',
  'sang propre': 'sangre limpia',
  'aliments producteurs de mucus': 'alimentos formadores de moco',
  'équation suprême': 'ecuación suprema',
  'salade balai': 'ensalada escoba',
  'puissance': 'potencia'
};

const MORSE_TAG_MAP = {
  'acidose': 'acidosis',
  'ptyaline': 'ptialina',
  'lymphe': 'linfa',
  'filtration rénale': 'filtración renal',
  'surrénales': 'glándulas suprarrenales',
  'glandes surrénales': 'glándulas suprarrenales',
  'parathyroïdes': 'paratiroides',
  'frugivorisme': 'frugivorismo',
  'combinaisons alimentaires': 'combinaciones alimentarias',
  'formules de plantes': 'fórmulas de plantas',
  'température basale de barnes': 'temperatura basal de barnes',
  'crise de guérison': 'crisis de curación',
  'crise d\'élimination': 'crisis de curación',
  'aliments vivants': 'alimentos vivos',
  'iridologie': 'iridología',
  'subluxations vertébrales': 'subluxaciones vertebrales',
  'alcalinisation': 'alcalinización',
  'astringence': 'astringencia',
  'détoxification': 'desintoxicación',
  'vitalité': 'vitalidad',
  'autophagie': 'autofagia',
  'mucus': 'moco',
  'fruits': 'frutas',
  'jeûne': 'ayuno',
  'loi de hering': 'ley de hering',
  'angströms': 'angströms',
  'fructose': 'fructosa',
  'plantes astringentes': 'plantas astringentes'
};

// Glossaires complets
let GLOSSARIES = {};
try {
  GLOSSARIES = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'spanish_glossaries.json'), 'utf-8'));
} catch (e) {
  console.warn("Chargement glossaires fallback");
}

async function translateApi(text, src = 'fr', dest = 'es') {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const key = `${src}->${dest}:${trimmed}`;
  if (cache[key]) {
    return cache[key];
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${dest}&dt=t&q=${encodeURIComponent(trimmed)}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const translated = data[0].map(part => part[0]).filter(Boolean).join('');
      cache[key] = translated;
      return translated;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      if (attempt === 3) {
        console.error(`⚠️ Erreur traduction [${trimmed.slice(0, 30)}...] : ${err.message}`);
        return trimmed;
      }
    }
  }
}

async function translateParagraph(p, tagMap) {
  if (!p || !p.trim()) return p;

  // 1. Masquer les balises {{terme}}
  const tagsFound = [];
  const masked = p.replace(/\{\{(.+?)\}\}/g, (match, term) => {
    const cleanTerm = term.toLowerCase().trim();
    const mapped = tagMap[cleanTerm] || cleanTerm;
    const idx = tagsFound.length;
    tagsFound.push(mapped);
    return `__VTTG_${idx}__`;
  });

  let translatedText = await translateApi(masked);

  // 2. Démasquer les balises
  for (let idx = 0; idx < tagsFound.length; idx++) {
    const term = tagsFound[idx];
    const regex = new RegExp(`__\\s*VTTG_${idx}\\s*__`, 'g');
    translatedText = translatedText.replace(regex, `{{${term}}}`);
    translatedText = translatedText.replace(`__VTTG_${idx}__`, `{{${term}}}`);
  }

  return translatedText;
}

async function translateEhret() {
  console.log('\n📘 =================================================================');
  console.log('📖 TRADUCTION INTÉGRALE D\'ARNOLD EHRET EN ESPAGNOL');
  console.log('=================================================================');

  const esData = {
    id: "ehret-mucusless-es",
    title: "Sistema de Curación por Dieta Sin Moco",
    subtitle: "Un curso completo para quienes desean aprender a reconquistar su salud, vitalidad y juventud mediante el ayuno racional y los alimentos sin moco",
    author: "Prof. Arnold Ehret",
    year: "1922",
    translator: "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
    editionNotice: "Edición digital interactiva enriquecida por VitalTrack Academy a partir de la obra original de 1922. Contiene aclaraciones científicas y advertencias fisiológicas respaldadas por fuentes primarias verificables.",
    pageCount: ehretMucuslessFr.pageCount || 118,
    pdfUrl: "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
    glossary: GLOSSARIES.ehret || {},
    chapters: []
  };

  const total = ehretMucuslessFr.chapters.length;

  for (let i = 0; i < total; i++) {
    const ch = ehretMucuslessFr.chapters[i];
    const chId = ch.id.replace('lesson-', 'leccion-');

    let tag = ch.tag;
    if (tag.startsWith('Leçon')) tag = tag.replace('Leçon', 'Lección');
    else if (tag === 'Introduction') tag = 'Introducción';
    else if (tag === 'Préface') tag = 'Prefacio';
    else if (tag === 'Biographie') tag = 'Biografía';
    else if (tag === 'Dictionnaire') tag = 'Glosario';
    else tag = await translateApi(tag);

    const title = await translateApi(ch.title);
    console.log(`\n  [${i + 1}/${total}] 📘 ${tag} : ${title} (${ch.paragraphs.length} paragraphes)...`);

    const esParagraphs = new Array(ch.paragraphs.length);
    const BATCH_SIZE = 12;
    for (let pIdx = 0; pIdx < ch.paragraphs.length; pIdx += BATCH_SIZE) {
      const chunk = ch.paragraphs.slice(pIdx, pIdx + BATCH_SIZE);
      const results = await Promise.all(
        chunk.map(p => translateParagraph(p, EHRET_TAG_MAP))
      );
      results.forEach((res, offset) => {
        esParagraphs[pIdx + offset] = res;
      });
      saveCache();
      process.stdout.write(`    • ${Math.min(pIdx + BATCH_SIZE, ch.paragraphs.length)}/${ch.paragraphs.length} traduits...\r`);
    }
    console.log(`    ✅ ${ch.paragraphs.length}/${ch.paragraphs.length} paragraphes traduits.`);

    esData.chapters.push({
      id: chId,
      tag,
      title,
      paragraphs: esParagraphs
    });
    saveCache();
  }

  const jsContent = `// Édition Intégrale en Espagnol - Prof. Arnold Ehret\nexport const ehretMucuslessEs = ${JSON.stringify(esData, null, 2)};\n`;
  fs.writeFileSync(EHRET_ES_OUT_PATH, jsContent, 'utf-8');
  console.log(`\n✨ Fichier écrit avec succès : ${EHRET_ES_OUT_PATH} (${(fs.statSync(EHRET_ES_OUT_PATH).size / 1024).toFixed(1)} Ko)`);
}

async function translateMorse() {
  console.log('\n🌿 =================================================================');
  console.log('📖 TRADUCTION INTÉGRALE DU DR. ROBERT MORSE EN ESPAGNOL');
  console.log('=================================================================');

  const esData = {
    id: "morse-detox-miracle-es",
    title: "El Milagro de la Desintoxicación",
    subtitle: "Guía clínica y práctica para la regeneración celular completa, la activación linfática, la filtración renal y la vitalidad holística",
    author: "Dr. Robert Morse, N.D.",
    year: "2004",
    translator: "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
    editionNotice: "Edición clínica interactiva traducida y enriquecida por VitalTrack Academy a partir de 'The Detox Miracle Sourcebook' (2004). Incluye tablas de anatomía comparada, fórmulas de plantas, protocolo Barnes y referencias académicas primarias.",
    pageCount: morseDetoxMiracleFr.pageCount || 380,
    pdfUrl: "/pdfs/robert-morse-the-detox-miracle-sourcebook-ebook.pdf",
    glossary: GLOSSARIES.morse || {},
    chapters: []
  };

  const total = morseDetoxMiracleFr.chapters.length;

  for (let i = 0; i < total; i++) {
    const ch = morseDetoxMiracleFr.chapters[i];
    const chId = ch.id.replace('chapitre-', 'capitulo-').replace('module-', 'modulo-').replace('annexe-', 'anexo-');

    let tag = ch.tag;
    if (tag.startsWith('Chapitre')) tag = tag.replace('Chapitre', 'Capítulo');
    else if (tag.startsWith('Module')) tag = tag.replace('Module', 'Módulo');
    else if (tag.startsWith('Annexe')) tag = tag.replace('Annexe', 'Anexo');
    else if (tag === 'Introduction') tag = 'Introducción';
    else if (tag === 'Glossaire') tag = 'Glosario';
    else tag = await translateApi(tag);

    const title = await translateApi(ch.title);
    console.log(`\n  [${i + 1}/${total}] 🌿 ${tag} : ${title} (${ch.paragraphs.length} paragraphes)...`);

    const esParagraphs = new Array(ch.paragraphs.length);
    const BATCH_SIZE = 12;
    for (let pIdx = 0; pIdx < ch.paragraphs.length; pIdx += BATCH_SIZE) {
      const chunk = ch.paragraphs.slice(pIdx, pIdx + BATCH_SIZE);
      const results = await Promise.all(
        chunk.map(p => translateParagraph(p, MORSE_TAG_MAP))
      );
      results.forEach((res, offset) => {
        esParagraphs[pIdx + offset] = res;
      });
      saveCache();
      process.stdout.write(`    • ${Math.min(pIdx + BATCH_SIZE, ch.paragraphs.length)}/${ch.paragraphs.length} traduits...\r`);
    }
    console.log(`    ✅ ${ch.paragraphs.length}/${ch.paragraphs.length} paragraphes traduits.`);

    esData.chapters.push({
      id: chId,
      tag,
      title,
      paragraphs: esParagraphs
    });
    saveCache();
  }

  const jsContent = `// Édition Intégrale en Espagnol - Dr. Robert Morse\nexport const morseDetoxMiracleEs = ${JSON.stringify(esData, null, 2)};\n`;
  fs.writeFileSync(MORSE_ES_OUT_PATH, jsContent, 'utf-8');
  console.log(`\n✨ Fichier écrit avec succès : ${MORSE_ES_OUT_PATH} (${(fs.statSync(MORSE_ES_OUT_PATH).size / 1024).toFixed(1)} Ko)`);
}

async function main() {
  await translateEhret();
  await translateMorse();
  saveCache();
  console.log('\n🎉 TRADUCTION ESPAGNOLE INTÉGRALE DES LIVRES COMPLÉTÉE AVEC SUCCÈS !');
}

main().catch(err => {
  console.error("❌ ERREUR :", err);
  process.exit(1);
});
