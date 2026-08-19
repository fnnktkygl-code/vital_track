import os

file_path = "/Users/richard/Developer/vital_track/web-app/src/data/mediaSearchIndex.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

marker = "export const MEDIA_SEARCH_DATABASE = ["
db_index = content.find(marker)
if db_index == -1:
    raise Exception("Marker not found in file")

db_part = content[db_index:]

new_header = '''/**
 * 📚 VITALTRACK COMPREHENSIVE BILINGUAL MEDIA & PDF PASSAGE INDEX
 * Total Entries: 3440 passages & timestamps with 100% exact real PDF page numbers.
 * Recherche stricte : Traduction littérale exacte FR ↔ EN uniquement, sans synonymes parasites.
 */

export const EXACT_TRANSLATIONS = {
  // Auteurs et figures historiques (recherche stricte de l'auteur)
  'dr sebi': ['dr sebi', 'dr. sebi', 'dr alfredo sebi', 'alfredo bowman', 'sebi'],
  'sebi': ['sebi', 'dr sebi', 'dr. sebi', 'alfredo bowman'],
  'arnold ehret': ['arnold ehret', 'ehret', 'prof. arnold ehret'],
  'ehret': ['ehret', 'arnold ehret'],
  'robert morse': ['robert morse', 'dr. robert morse', 'dr morse', 'morse'],
  'morse': ['morse', 'robert morse', 'dr. morse', 'dr. robert morse'],
  'david wolfe': ['david wolfe', 'david avocado wolfe', 'wolfe'],
  'wolfe': ['wolfe', 'david wolfe'],
  'wim hof': ['wim hof', 'hof'],
  'leslie taylor': ['leslie taylor', 'dr. leslie taylor', 'raintree'],
  'raintree': ['raintree', 'leslie taylor'],

  // Organes & Anatomie (Traduction directe FR ↔ EN stricte uniquement)
  'yeux': ['yeux', 'oeil', 'eyes', 'eye', 'oculaire', 'ocular'],
  'oeil': ['oeil', 'yeux', 'eye', 'eyes', 'oculaire', 'ocular'],
  'eyes': ['eyes', 'eye', 'yeux', 'oeil', 'ocular', 'oculaire'],
  'eye': ['eye', 'eyes', 'oeil', 'yeux', 'ocular', 'oculaire'],
  'reins': ['reins', 'rein', 'kidneys', 'kidney', 'renal', 'rénal'],
  'rein': ['rein', 'reins', 'kidney', 'kidneys', 'renal', 'rénal'],
  'kidneys': ['kidneys', 'kidney', 'reins', 'rein', 'renal'],
  'kidney': ['kidney', 'kidneys', 'rein', 'reins', 'renal'],
  'foie': ['foie', 'liver', 'hépatique', 'hepatique', 'hepatic'],
  'liver': ['liver', 'foie', 'hepatic', 'hépatique', 'hepatique'],
  'poumons': ['poumons', 'poumon', 'lungs', 'lung'],
  'poumon': ['poumon', 'poumons', 'lung', 'lungs'],
  'lungs': ['lungs', 'lung', 'poumons', 'poumon'],
  'lung': ['lung', 'lungs', 'poumon', 'poumons'],
  'coeur': ['coeur', 'cœur', 'heart', 'cardiaque'],
  'heart': ['heart', 'coeur', 'cœur', 'cardiac'],
  'peau': ['peau', 'skin', 'cutané', 'cutane'],
  'skin': ['skin', 'peau', 'cutaneous'],
  'cerveau': ['cerveau', 'brain', 'cérébral', 'cerebral'],
  'brain': ['brain', 'cerveau', 'cerebral'],
  'estomac': ['estomac', 'stomach', 'gastrique', 'gastric'],
  'stomach': ['stomach', 'estomac', 'gastric'],
  'intestin': ['intestin', 'intestins', 'intestine', 'intestines', 'gut', 'bowel'],
  'intestins': ['intestins', 'intestin', 'intestines', 'intestine', 'gut', 'bowel'],
  'intestine': ['intestine', 'intestines', 'intestin', 'intestins', 'gut', 'bowel'],
  'intestines': ['intestines', 'intestine', 'intestins', 'intestin', 'gut', 'bowel'],
  'colon': ['colon', 'côlon'],
  'côlon': ['côlon', 'colon'],
  'surrenales': ['surrenales', 'surrénales', 'surrenale', 'surrénale', 'adrenals', 'adrenal'],
  'surrénales': ['surrénales', 'surrenales', 'surrénale', 'surrenale', 'adrenals', 'adrenal'],
  'adrenals': ['adrenals', 'adrenal', 'surrénales', 'surrenales'],
  'adrenal': ['adrenal', 'adrenals', 'surrénales', 'surrenales'],
  'lymphe': ['lymphe', 'lymphatique', 'lymph', 'lymphatic'],
  'lymph': ['lymph', 'lymphatic', 'lymphe', 'lymphatique'],
  'sang': ['sang', 'sanguin', 'blood'],
  'blood': ['blood', 'sang'],
  'pancreas': ['pancreas', 'pancréas'],
  'pancréas': ['pancréas', 'pancreas'],
  'thyroide': ['thyroide', 'thyroïde', 'thyroid'],
  'thyroïde': ['thyroïde', 'thyroide', 'thyroid'],
  'thyroid': ['thyroid', 'thyroïde', 'thyroid'],

  // Pathologies spécifiques (FR ↔ EN strict)
  'crohn': ['crohn', 'maladie de crohn', "crohn's", "crohn's disease"],
  'maladie de crohn': ['maladie de crohn', 'crohn', "crohn's disease", "crohn's"],
  "crohn's": ["crohn's", "crohn's disease", 'crohn', 'maladie de crohn'],
  'colite': ['colite', 'colitis', 'rectocolite', 'colite ulcéreuse', 'colite ulcereuse', 'ulcerative colitis'],
  'colitis': ['colitis', 'colite', 'ulcerative colitis', 'colite ulcéreuse'],
  'candida': ['candida', 'candidose', 'candidiasis'],
  'candidose': ['candidose', 'candida', 'candidiasis'],
  'diabete': ['diabete', 'diabète', 'diabetes'],
  'diabète': ['diabète', 'diabete', 'diabetes'],
  'diabetes': ['diabetes', 'diabète', 'diabete'],
  'cancer': ['cancer', 'tumeur', 'tumor', 'tumour'],
  'arthrite': ['arthrite', 'arthritis'],
  'arthritis': ['arthritis', 'arthrite'],
  'glaucome': ['glaucome', 'glaucoma'],
  'glaucoma': ['glaucoma', 'glaucome'],
  'cataracte': ['cataracte', 'cataractes', 'cataract', 'cataracts'],
  'cataract': ['cataract', 'cataracts', 'cataracte', 'cataractes'],
  'asthme': ['asthme', 'asthma'],
  'asthma': ['asthma', 'asthme'],
  'eczema': ['eczema', 'eczéma'],
  'eczéma': ['eczéma', 'eczema'],
  'psoriasis': ['psoriasis'],

  // Notions clés fondamentales
  'jeune': ['jeune', 'jeûne', 'fasting', 'fast'],
  'jeûne': ['jeûne', 'jeune', 'fasting', 'fast'],
  'fasting': ['fasting', 'fast', 'jeûne', 'jeune'],
  'fast': ['fast', 'fasting', 'jeûne', 'jeune'],
  'autophagie': ['autophagie', 'autophagy'],
  'autophagy': ['autophagy', 'autophagie'],
  'mucus': ['mucus', 'sans mucus', 'mucusless', 'mucogène', 'mucogene'],
  'sans mucus': ['sans mucus', 'mucusless', 'mucus'],
  'mucusless': ['mucusless', 'sans mucus', 'mucus'],
  'detox': ['detox', 'détox', 'detoxification', 'détoxification'],
  'détox': ['détox', 'detox', 'détoxification', 'detoxification'],
  'detoxification': ['detoxification', 'détoxification', 'detox', 'détox']
};

export const SYNONYMS = EXACT_TRANSLATIONS;

const STOPWORDS = new Set(['dr', 'dr.', 'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'for', 'with', 'avec']);

export function getExpandedSearchTokens(query) {
  if (!query) return [];
  const normalized = query.toLowerCase().trim();
  const tokens = new Set();
  
  tokens.add(normalized);

  if (EXACT_TRANSLATIONS[normalized]) {
    EXACT_TRANSLATIONS[normalized].forEach(t => tokens.add(t));
  } else {
    for (const [key, synList] of Object.entries(EXACT_TRANSLATIONS)) {
      if (key === normalized || synList.includes(normalized)) {
        synList.forEach(s => tokens.add(s.toLowerCase()));
      }
    }
  }

  // Mots individuels signifiants (sans les mots vides génériques comme 'dr' ou 'de')
  normalized.split(/\\s+/).forEach(w => {
    if (w.length >= 3 && !STOPWORDS.has(w)) {
      tokens.add(w);
      if (EXACT_TRANSLATIONS[w]) {
        EXACT_TRANSLATIONS[w].forEach(t => tokens.add(t));
      }
    }
  });

  return Array.from(tokens);
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

export function searchMediaKnowledge(query = '', filter = 'all') {
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
}

'''

new_content = new_header + db_part

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated mediaSearchIndex.js successfully.")
