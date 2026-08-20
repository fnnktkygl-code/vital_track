import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeSources() {
  const wisdomModule = await import('../web-app/src/data/vitalistWisdom.js');
  const searchModule = await import('../web-app/src/data/mediaSearchIndex.js');

  const cards = wisdomModule.VITALIST_WISDOM;
  const db = searchModule.MEDIA_SEARCH_DATABASE;
  const searchFn = searchModule.searchMediaKnowledge;

  console.log(`Optimizing all ${cards.length} cards for 100% authentic Rank #1 matching...\n`);

  let optimizedCards = [];
  let authorPassages = {};

  // Group passages by author
  for (const item of db) {
    const a = (item.author || item.bookTitle || '').toLowerCase();
    let authKey = 'other';
    if (a.includes('ehret')) authKey = 'ehret';
    else if (a.includes('morse')) authKey = 'morse';
    else if (a.includes('sebi')) authKey = 'sebi';
    else if (a.includes('wolfe')) authKey = 'wolfe';
    else if (a.includes('walker')) authKey = 'walker';
    else if (a.includes('taylor') || a.includes('raintree')) authKey = 'taylor';
    else if (a.includes('wim') || a.includes('hof')) authKey = 'hof';
    else if (a.includes('shelton')) authKey = 'shelton';
    else if (a.includes('jensen')) authKey = 'jensen';

    if (!authorPassages[authKey]) authorPassages[authKey] = [];
    authorPassages[authKey].push(item);
  }

  for (const card of cards) {
    const authKey = card.id.split('-')[0];
    let query = card.searchQuery;
    let results = searchFn(query);

    let topIsAuthor = results.length > 0 && results[0].author && results[0].author.toLowerCase().includes(card.author.split(' ')[0].toLowerCase());

    if (!topIsAuthor && authorPassages[authKey] && authorPassages[authKey].length > 0) {
      // Find the best passage for this card among the author's own passages
      let bestItem = null;
      let maxScore = -1;
      const quoteWords = card.quote.toLowerCase().split(/\s+/).filter(w => w.length >= 4);

      for (const p of authorPassages[authKey]) {
        const text = (p.fullText || p.excerpt || '').toLowerCase();
        let score = 0;
        for (const w of quoteWords) {
          if (text.includes(w)) score += 10;
        }
        if (score > maxScore) {
          maxScore = score;
          bestItem = p;
        }
      }

      if (bestItem) {
        // Extract 2 key topic words from bestItem keywords or chapter
        const keyWords = (bestItem.keywords || []).slice(0, 3).join(' ');
        const refinedQuery = `${card.author} ${keyWords || card.category}`.trim();
        const testRes = searchFn(refinedQuery);
        if (testRes.length > 0 && testRes[0].author && testRes[0].author.toLowerCase().includes(card.author.split(' ')[0].toLowerCase())) {
          query = refinedQuery;
        }
      }
    }

    optimizedCards.push({
      ...card,
      searchQuery: query
    });
  }

  // Verify final count
  let perfectCount = 0;
  for (const card of optimizedCards) {
    const res = searchFn(card.searchQuery);
    if (res.length > 0 && res[0].author && res[0].author.toLowerCase().includes(card.author.split(' ')[0].toLowerCase())) {
      perfectCount++;
    }
  }

  console.log(`✅ After Optimization: ${perfectCount}/${optimizedCards.length} cards (${Math.round(perfectCount/optimizedCards.length*100)}%) rank their own author #1!`);

  // Write back to vitalistWisdom.js
  const fileHeader = `/**
 * Base de données exhaustive de Sagesse & Lois Bio-Vitalistes (366 fiches pour chaque jour de l'année)
 * Auteurs et Ouvrages Authentiques du Corpus :
 * - Arnold Ehret (Système de Guérison du Régime Sans Mucus, Le Jeûne Rationnel)
 * - Dr. Robert Morse (Le Guide du Miracle de la Détox, Régénération Tissulaire & Lymphe)
 * - Dr. Sebi (Guide de Purification Bio-Électrique Cellulaire, Minéraux Marins)
 * - David Wolfe (Le Système de Réussite de l'Alimentation Vivante, Biophotons)
 * - Norman Walker (Votre Santé par les Jus Frais de Légumes, Santé du Côlon)
 * - Dr. Leslie Taylor (Pharmacopée Amazonienne Raintree & Tropical Materia Medica)
 * - Wim Hof (La Méthode Wim Hof, Respiration & Froid)
 * - Herbert Shelton (Les Combinaisons Alimentaires, Le Jeûne Thérapeutique)
 * - Bernard Jensen (Nettoyage des Tissus par la Gestion Intestinale, Chlorophylle)
 */

export const VITALIST_WISDOM = ${JSON.stringify(optimizedCards, null, 2)};

/**
 * Récupère le conseil vitaliste officiel du jour (1 à 366)
 */
export function getDailyWisdom(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.min(366, Math.max(1, Math.floor(diff / oneDay)));
  return VITALIST_WISDOM[dayOfYear - 1] || VITALIST_WISDOM[0];
}

/**
 * Récupère un conseil aléatoire ou filtré
 */
export function getRandomWisdom(category = null, author = null, timePhase = null) {
  let pool = VITALIST_WISDOM;

  if (category && category !== 'all') {
    pool = pool.filter(w => w.category === category);
  }
  if (author && author !== 'all') {
    pool = pool.filter(w => w.author.toLowerCase().includes(author.toLowerCase()));
  }
  if (timePhase && timePhase !== 'all') {
    pool = pool.filter(w => w.timePhase === timePhase || w.timePhase === 'all');
  }

  if (pool.length === 0) pool = VITALIST_WISDOM;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Récupère un conseil en fonction de l'heure circadienne actuelle
 */
export function getCircadianContextWisdom() {
  const hour = new Date().getHours();
  let phase = 'all';

  if (hour >= 4 && hour < 12) phase = 'elimination';
  else if (hour >= 12 && hour < 20) phase = 'appropriation';
  else if (hour >= 20 || hour < 4) phase = 'regeneration';

  const pool = VITALIST_WISDOM.filter(w => w.timePhase === phase || w.timePhase === 'all');
  return pool[Math.floor(Math.random() * pool.length)] || VITALIST_WISDOM[0];
}
`;

  const targetPath = path.resolve(__dirname, '../web-app/src/data/vitalistWisdom.js');
  fs.writeFileSync(targetPath, fileHeader, 'utf8');
  console.log(`✅ Saved optimized wisdom cards to ${targetPath}`);
}

optimizeSources();
