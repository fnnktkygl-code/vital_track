/**
 * knowledgeRetriever.js
 * 
 * High-performance, low-latency Lexical RAG Retriever for VitalTrack Serverless API.
 * Chunks knowledge sources in memory and retrieves the Top-K most relevant passages
 * per user query, avoiding the 600,000 token blowup and ensuring instant response times
 * and full compatibility with Gemma and Gemini context windows.
 */

const fs = require('fs');
const path = require('path');

let _chunks = null;

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
    const paragraphs = rawText.split(/\n\s*\n+/);
    let currentChunk = '';
    let currentHeading = 'Principes Généraux';

    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (trimmed.length === 0) continue;

      if (trimmed.startsWith('#') || trimmed.startsWith('===')) {
        currentHeading = trimmed.replace(/[#=]/g, '').trim();
      }

      if (currentChunk.length + trimmed.length > 900) {
        if (currentChunk.length > 60) {
          _chunks.push({
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
      _chunks.push({
        heading: currentHeading,
        text: currentChunk.trim(),
        words: new Set(tokenize(currentChunk))
      });
    }

    console.log(`[RAG] Indexed ${_chunks.length} knowledge chunks successfully.`);
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
 * Retrieve the most relevant chunks for a user query.
 * @param {string} query User query
 * @param {number} topK Number of top chunks to return (default 4)
 * @returns {string} Formatted context snippet
 */
function retrieveRelevantKnowledge(query, topK = 4) {
  const chunks = initChunks();
  if (!chunks || chunks.length === 0 || !query) return '';

  const queryTerms = tokenize(query).filter(w => !STOP_WORDS.has(w));
  if (queryTerms.length === 0) return '';

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

    // Keyword density bonus
    if (score > 0) {
      scored.push({ chunk, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, topK);

  if (selected.length === 0) {
    return '';
  }

  return selected
    .map((item, idx) => `[Source Extraite ${idx + 1} — ${item.chunk.heading}]\n${item.chunk.text}`)
    .join('\n\n');
}

module.exports = {
  retrieveRelevantKnowledge
};
