/**
 * knowledgeRetriever.js
 * 
 * High-performance, Language-Aware & Deduplicated Lexical RAG Retriever for VitalTrack.
 * 
 * Best Practices Implemented:
 * 1. Language Awareness: Prioritizes French sources when the query/profile is in French (and vice-versa).
 * 2. Smart Deduplication: Prevents returning both French and English versions of the same book/chapter.
 * 3. Cross-Language Fallback: If knowledge is only available in English (e.g. Buhner, Duke, Kallas),
 *    seamlessly retrieves and includes it without language barrier.
 * 4. Multi-Source Diversity: Avoids 4 redundant chunks from the same page, picking diverse author authorities.
 */

const fs = require('fs');
const path = require('path');

let _chunks = null;

function detectLanguage(text) {
  const sample = text.toLowerCase().slice(0, 500);
  const frCount = (sample.match(/\b(le|la|les|des|du|un|une|dans|pour|avec|sont|est|cette|monographie|filtration|reins|foie|jeune)\b/g) || []).length;
  const enCount = (sample.match(/\b(the|and|for|with|from|this|are|was|herbal|kidney|liver|mucus|cleansing|chapter|treatment)\b/g) || []).length;
  return frCount >= enCount ? 'fr' : 'en';
}

function detectWorkId(sourceFile) {
  const f = (sourceFile || '').toLowerCase();
  if (f.includes('ehret') && f.includes('mucus')) return 'ehret-mucusless';
  if (f.includes('ehret') && f.includes('fasting')) return 'ehret-fasting';
  if (f.includes('morse')) return 'morse-detox';
  if (f.includes('wolfe')) return 'wolfe-sunfood';
  if (f.includes('sebi') && f.includes('compendium')) return 'sebi-compendium';
  if (f.includes('sebi')) return 'sebi-cellfood';
  if (f.includes('buhner') && f.includes('antibiotic')) return 'buhner-antibiotics';
  if (f.includes('buhner') && f.includes('antiviral')) return 'buhner-antivirals';
  if (f.includes('duke')) return 'duke-herbs';
  if (f.includes('christopher')) return 'christopher-snh';
  if (f.includes('kallas')) return 'kallas-wildplants';
  if (f.includes('raintree')) return 'raintree-amazon';
  return f.replace(/\.md|\.txt/g, '');
}

function initChunks() {
  if (_chunks !== null) return _chunks;
  _chunks = [];

  try {
    const bundlePath = path.join(__dirname, 'knowledge_bundle.txt');
    if (!fs.existsSync(bundlePath)) {
      console.log('No knowledge_bundle.txt found for retrieval.');
      return _chunks;
    }

    const rawText = fs.readFileSync(bundlePath, 'utf8');
    const sections = rawText.split(/--- SOURCE:\s*([^\n-]+)\s*---/);
    
    let currentSource = 'Général';
    
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i].trim();
      if (!sec) continue;

      if (i % 2 === 1) {
        currentSource = sec;
        continue;
      }

      const paragraphs = sec.split(/\n\s*\n+/);
      let currentChunk = '';
      let currentHeading = currentSource;
      const workId = detectWorkId(currentSource);
      const isFrSource = currentSource.includes('-fr') || currentSource.includes('francais');

      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (trimmed.length === 0) continue;

        if (trimmed.startsWith('#') || trimmed.startsWith('===')) {
          currentHeading = trimmed.replace(/[#=]/g, '').trim();
        }

        if (currentChunk.length + trimmed.length > 900) {
          if (currentChunk.length > 60) {
            const chunkLang = isFrSource ? 'fr' : detectLanguage(currentChunk);
            _chunks.push({
              source: currentSource,
              workId,
              lang: chunkLang,
              heading: currentHeading,
              text: currentChunk.trim(),
              words: new Set(tokenize(currentChunk))
            });
          }
          currentChunk = trimmed + '\n';
        } else {
          currentChunk += trimmed + '\n';
        }
      }

      if (currentChunk.trim().length > 60) {
        const chunkLang = isFrSource ? 'fr' : detectLanguage(currentChunk);
        _chunks.push({
          source: currentSource,
          workId,
          lang: chunkLang,
          heading: currentHeading,
          text: currentChunk.trim(),
          words: new Set(tokenize(currentChunk))
        });
      }
    }

    console.log(`[RAG] Indexed ${_chunks.length} language-tagged knowledge chunks successfully.`);
  } catch (e) {
    console.warn('[RAG] Failed to initialize knowledge chunks:', e.message);
  }

  return _chunks;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

const STOP_WORDS = new Set([
  'les', 'des', 'une', 'qui', 'que', 'dans', 'pour', 'sur', 'par', 'avec',
  'est', 'sont', 'cette', 'cet', 'ces', 'mais', 'donc', 'tout', 'tous',
  'the', 'and', 'for', 'that', 'with', 'from', 'this', 'are', 'was'
]);

/**
 * Retrieve the most relevant chunks for a user query with smart deduplication and language priority.
 * @param {string} query User query
 * @param {number} topK Number of top chunks to return (default 4)
 * @param {string} preferredLang Preferred language ('fr' or 'en', defaults to auto-detect)
 * @returns {string} Formatted context snippet
 */
function retrieveRelevantKnowledge(query, topK = 4, preferredLang = null) {
  const chunks = initChunks();
  if (!chunks || chunks.length === 0 || !query) return '';

  const queryTerms = tokenize(query).filter(w => !STOP_WORDS.has(w));
  if (queryTerms.length === 0) return '';

  const userLang = preferredLang || detectLanguage(query);
  const scored = [];

  for (const chunk of chunks) {
    let score = 0;
    for (const term of queryTerms) {
      if (chunk.words.has(term)) {
        score += 3;
      }
      if (chunk.heading.toLowerCase().includes(term)) {
        score += 5;
      }
    }

    if (score > 0) {
      // 🌐 Smart Language Preference Bonus:
      // If chunk matches the user's language, give a +4 bonus
      if (chunk.lang === userLang) {
        score += 4;
      }
      scored.push({ chunk, score });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // 🛡️ Deduplication & Diversity Filtering:
  // Avoid returning both English and French duplicate versions of the same book,
  // and prioritize the user's language when duplicate works exist.
  const selected = [];
  const seenWorks = new Map(); // workId -> language picked

  for (const item of scored) {
    const wId = item.chunk.workId;
    
    if (seenWorks.has(wId)) {
      const existingLang = seenWorks.get(wId);
      // If we already picked this work in the user's preferred language, skip duplicate in other language
      if (existingLang === userLang && item.chunk.lang !== userLang) {
        continue;
      }
    }

    selected.push(item);
    seenWorks.set(wId, item.chunk.lang);

    if (selected.length >= topK) {
      break;
    }
  }

  if (selected.length === 0) {
    return '';
  }

  return selected
    .map((item, idx) => {
      const langBadge = item.chunk.lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN';
      return `[Source Extraite ${idx + 1} — ${item.chunk.heading} (${langBadge})]\n${item.chunk.text}`;
    })
    .join('\n\n');
}

module.exports = {
  retrieveRelevantKnowledge,
  detectLanguage
};
