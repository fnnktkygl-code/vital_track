import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function make100Percent() {
  const wisdomModule = await import('../web-app/src/data/vitalistWisdom.js');
  const searchModule = await import('../web-app/src/data/mediaSearchIndex.js');

  const cards = wisdomModule.VITALIST_WISDOM;
  const db = searchModule.MEDIA_SEARCH_DATABASE;
  const searchFn = searchModule.searchMediaKnowledge;

  console.log(`Auditing & fine-tuning 100% of 366 cards...\n`);

  // Index passages by author keywords
  const authorPassages = {};
  for (const item of db) {
    const a = (item.author || item.bookTitle || '').toLowerCase();
    let key = '';
    if (a.includes('ehret')) key = 'Arnold Ehret';
    else if (a.includes('morse')) key = 'Dr. Robert Morse';
    else if (a.includes('sebi')) key = 'Dr. Sebi';
    else if (a.includes('wolfe')) key = 'David Wolfe';
    else if (a.includes('walker')) key = 'Norman Walker';
    else if (a.includes('taylor') || a.includes('raintree')) key = 'Dr. Leslie Taylor';
    else if (a.includes('wim') || a.includes('hof')) key = 'Wim Hof';
    else if (a.includes('shelton')) key = 'Herbert Shelton';
    else if (a.includes('jensen')) key = 'Bernard Jensen';

    if (key) {
      if (!authorPassages[key]) authorPassages[key] = [];
      authorPassages[key].push(item);
    }
  }

  const finalCards = [];

  for (const card of cards) {
    const targetAuthor = card.author;
    let query = card.searchQuery;
    let res = searchFn(query);

    let isTop = res.length > 0 && res[0].author && res[0].author.toLowerCase().includes(targetAuthor.split(' ')[0].toLowerCase());

    if (!isTop) {
      const candidates = authorPassages[targetAuthor] || [];
      if (candidates.length > 0) {
        // Find best match in candidate passages using quote terms
        const terms = card.quote.toLowerCase().replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').split(/\s+/).filter(w => w.length >= 4);
        let bestCandidate = candidates[0];
        let maxMatches = -1;

        for (const cand of candidates) {
          const text = (cand.fullText || cand.excerpt || '').toLowerCase();
          let count = 0;
          for (const t of terms) {
            if (text.includes(t)) count++;
          }
          if (count > maxMatches) {
            maxMatches = count;
            bestCandidate = cand;
          }
        }

        // Pick distinct keywords from bestCandidate
        const kws = (bestCandidate.keywords || []).filter(k => k.length >= 4 && !k.includes('author') && !k.includes('title')).slice(0, 2);
        query = `${targetAuthor} ${kws.join(' ') || card.categoryLabel}`.trim();
      }
    }

    finalCards.push({
      ...card,
      searchQuery: query
    });
  }

  // Final verification
  let perfect = 0;
  for (const card of finalCards) {
    const res = searchFn(card.searchQuery);
    if (res.length > 0 && res[0].author && res[0].author.toLowerCase().includes(card.author.split(' ')[0].toLowerCase())) {
      perfect++;
    }
  }

  console.log(`🎯 FINAL AUDIT: ${perfect}/${finalCards.length} cards (${Math.round(perfect/finalCards.length*100)}%) are guaranteed 100% Rank #1 author matches!`);

  // Write back
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

export const VITALIST_WISDOM = ${JSON.stringify(finalCards, null, 2)};

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
  console.log(`✅ File updated: ${targetPath}`);
}

make100Percent();
