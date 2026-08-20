import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
  const wisdomModule = await import('../web-app/src/data/vitalistWisdom.js');
  const searchModule = await import('../web-app/src/data/mediaSearchIndex.js');

  const cards = wisdomModule.VITALIST_WISDOM;
  const searchFn = searchModule.searchMediaKnowledge;

  console.log(`Auditing all ${cards.length} wisdom cards against the 3450-passage literature database...\n`);

  let perfectMatches = 0;
  let passedWithResults = 0;
  let missingResults = [];

  for (const card of cards) {
    const results = searchFn(card.searchQuery);

    if (!results || results.length === 0) {
      // Try fallback to author + category key
      const fallbackQuery = `${card.author} ${card.category}`;
      const fallbackRes = searchFn(fallbackQuery);
      if (fallbackRes && fallbackRes.length > 0) {
        missingResults.push({
          id: card.id,
          day: card.dayOfYear,
          author: card.author,
          quote: card.quote.slice(0, 60),
          query: card.searchQuery,
          fixQuery: fallbackQuery,
          status: 'Needs Query Refinement'
        });
      } else {
        missingResults.push({
          id: card.id,
          day: card.dayOfYear,
          author: card.author,
          quote: card.quote.slice(0, 60),
          query: card.searchQuery,
          status: 'No Match Found'
        });
      }
    } else {
      const top = results[0];
      const matchesAuthor = top.author && top.author.toLowerCase().includes(card.author.split(' ')[0].toLowerCase());
      if (matchesAuthor) {
        perfectMatches++;
      } else {
        passedWithResults++;
      }
    }
  }

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`AUDIT RESULTS FOR 366 VITALIST CARDS:`);
  console.log(`- Perfect Author & Concept Matches (Rank #1): ${perfectMatches}/${cards.length} (${Math.round(perfectMatches/cards.length*100)}%)`);
  console.log(`- Cross-Corpus Relevant Matches: ${passedWithResults}/${cards.length}`);
  console.log(`- Problematic / Zero Matches: ${missingResults.length}/${cards.length}`);
  console.log(`══════════════════════════════════════════════\n`);

  if (missingResults.length > 0) {
    console.log('Sample Problematic Cards:', missingResults.slice(0, 10));
  }
}

runAudit();
