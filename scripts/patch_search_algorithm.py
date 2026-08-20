import re

file_path = '/Users/richard/Developer/vital_track/web-app/src/data/mediaSearchIndex.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_search_func = """export function searchMediaKnowledge(query = '', filter = 'all') {
  if (!query || !query.trim()) return [];
  
  const tokens = getExpandedSearchTokens(query);
  const normalizedQuery = (query || '').toLowerCase().trim();

  let filtered = MEDIA_SEARCH_DATABASE;
  if (filter === 'video' || filter === 'videos') {
    filtered = filtered.filter(item => item.type === 'video');
  } else if (filter === 'pdf' || filter === 'pdfs') {
    filtered = filtered.filter(item => item.type === 'pdf');
  } else if (filter === 'fr') {
    filtered = filtered.filter(item => item.lang === 'fr');
  } else if (filter === 'en') {
    filtered = filtered.filter(item => item.lang === 'en');
  }

  if (tokens.length === 0) {
    return filtered;
  }

  const scored = [];

  for (const item of filtered) {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const chapter = (item.chapterTitle || item.chapter || '').toLowerCase();
    const fullText = (item.fullText || item.excerpt || '').toLowerCase();
    const author = (item.author || item.bookTitle || '').toLowerCase();

    // Dé-priorisation des sommaires
    if (!normalizedQuery.includes('table') && (chapter.includes('table des matières') || chapter.includes('table of contents') || chapter.includes('contents'))) {
      score -= 40;
    }

    let matchedAny = false;

    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      const escaped = escapeRegex(token);
      // Correspondance stricte avec frontière de mot
      const regexWord = new RegExp('(?:^|[^a-zA-Z0-9À-ÿ])' + escaped + '(?:$|[^a-zA-Z0-9À-ÿ])', 'i');
      
      // 1. Auteur ou ouvrage (Priorité maximale)
      if (regexWord.test(author)) {
        score += 150;
        matchedAny = true;
      }

      // 2. Titre de chapitre ou section
      if (regexWord.test(chapter)) {
        score += 80;
        matchedAny = true;
      }

      // 3. Titre de ressource
      if (regexWord.test(title)) {
        score += 50;
        matchedAny = true;
      }

      // 4. Texte intégral (occurrence mot à mot)
      if (regexWord.test(fullText)) {
        const matches = fullText.match(new RegExp(escaped, 'gi')) || [];
        score += Math.min(60, 20 + matches.length * 5);
        matchedAny = true;
      }
    }

    // Filtrage strict : seuls les éléments contenant véritablement les termes sont retenus
    if (matchedAny && score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}"""

new_search_func = """export function searchMediaKnowledge(query = '', filter = 'all') {
  if (!query || !query.trim()) return [];
  
  const normalizedQuery = (query || '').toLowerCase().trim();
  const rawTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  let filtered = MEDIA_SEARCH_DATABASE;
  if (filter === 'video' || filter === 'videos') {
    filtered = filtered.filter(item => item.type === 'video');
  } else if (filter === 'pdf' || filter === 'pdfs') {
    filtered = filtered.filter(item => item.type === 'pdf');
  } else if (filter === 'fr') {
    filtered = filtered.filter(item => item.lang === 'fr');
  } else if (filter === 'en') {
    filtered = filtered.filter(item => item.lang === 'en');
  }

  const authorNames = ['sebi', 'ehret', 'morse', 'wolfe', 'walker', 'taylor', 'wim', 'hof', 'shelton', 'jensen', 'raintree'];
  const stopWords = new Set(['dr', 'dr.', 'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'for', 'with', 'avec', 'par', 'pour', 'dans', 'sur', 'ce', 'cet', 'cette', 'ces', 'sont', 'est', 'qui', 'que', 'son', 'sa', 'ses']);

  const queryAuthors = [];
  const queryContent = [];

  for (const w of rawTokens) {
    if (stopWords.has(w)) continue;
    if (authorNames.includes(w)) {
      queryAuthors.push(w);
    } else if (w.length >= 3) {
      queryContent.push(w);
    }
  }

  // Get expanded tokens for content concepts
  const contentExpanded = [];
  for (const c of queryContent) {
    const exp = getExpandedSearchTokens(c);
    contentExpanded.push(exp);
  }

  const scored = [];

  for (const item of filtered) {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const chapter = (item.chapterTitle || item.chapter || '').toLowerCase();
    const fullText = (item.fullText || item.excerpt || '').toLowerCase();
    const author = (item.author || item.bookTitle || '').toLowerCase();

    // Dé-priorisation des sommaires
    if (!normalizedQuery.includes('table') && (chapter.includes('table des matières') || chapter.includes('table of contents') || chapter.includes('contents'))) {
      score -= 50;
    }

    // Check author match
    let authorMatch = false;
    if (queryAuthors.length > 0) {
      for (const a of queryAuthors) {
        if (author.includes(a)) authorMatch = true;
      }
    }

    let contentMatchCount = 0;

    if (queryContent.length > 0) {
      for (const expList of contentExpanded) {
        let matchedThisConcept = false;
        for (const token of expList) {
          if (!token || token.length < 2) continue;
          const escaped = escapeRegex(token);
          const regexWord = new RegExp('(?:^|[^a-zA-Z0-9À-ÿ])' + escaped + '(?:$|[^a-zA-Z0-9À-ÿ])', 'i');

          if (regexWord.test(fullText)) {
            matchedThisConcept = true;
            score += 100;
            const matches = fullText.match(new RegExp(escaped, 'gi')) || [];
            score += Math.min(80, matches.length * 12);
          }
          if (regexWord.test(chapter)) {
            matchedThisConcept = true;
            score += 180;
          }
          if (regexWord.test(title)) {
            matchedThisConcept = true;
            score += 90;
          }
        }
        if (matchedThisConcept) {
          contentMatchCount++;
        }
      }

      // Si des mots de contenu sont recherchés, le passage DOIT matcher au moins un concept
      if (contentMatchCount === 0) continue;

      // Multiplicateur pour la co-occurrence de plusieurs concepts
      score += (contentMatchCount * contentMatchCount) * 140;

      // Correspondance exacte de la phrase entière
      if (fullText.includes(normalizedQuery)) {
        score += 1000;
      }

      // Bonus si l'auteur correspond également
      if (authorMatch) {
        score += 250;
      }
    } else {
      // Recherche purement par auteur
      if (!authorMatch) continue;
      score = 100;
    }

    if (score > 0) {
      scored.push({ item, score, contentMatchCount });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}"""

if old_search_func in content:
    content = content.replace(old_search_func, new_search_func, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Successfully patched searchMediaKnowledge in mediaSearchIndex.js")
else:
    print("❌ Could not find exact old_search_func in mediaSearchIndex.js")
