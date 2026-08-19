import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = '/Users/richard/Developer/vital_track/knowledge';
const OUTPUT_FILE = '/Users/richard/Developer/vital_track/web-app/src/data/mediaSearchIndex.js';

// Base verified videos
const BASE_VIDEOS = [
  {
    id: "vid_sebi_rocknewman_intro",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "The Rock Newman Show ft. Dr. Sebi (Interview Complète)",
    speaker: "Dr. Sebi (Alfredo Bowman)",
    source: "YouTube HD",
    videoType: "youtube",
    youtubeId: "V5l9VqC1k8w",
    mediaUrl: "https://www.youtube.com/watch?v=V5l9VqC1k8w",
    chapter: "Introduction & La Vérité sur la Maladie Unique (Mucus)",
    timeFormatted: "00:00",
    timeSeconds: 0,
    badgeClass: "badge-success",
    keywords: ["dr sebi", "rock newman", "mucus", "maladie unique", "alcalinite", "guerison", "genese"],
    topics: ["dr-sebi", "mucus", "interview"],
    excerpt: "Dr. Sebi expose le principe fondamental : il n'y a qu'une seule maladie, la compromission de la membrane muqueuse par un excès de mucus et d'acidité.",
    fullText: "Dr. Sebi interview with Rock Newman discussing mucus, single disease concept, alkaline electric diet, cellular healing, blood cleansing."
  },
  {
    id: "vid_sebi_rocknewman_bioelectric",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "The Rock Newman Show ft. Dr. Sebi (Interview Complète)",
    speaker: "Dr. Sebi (Alfredo Bowman)",
    source: "YouTube HD",
    videoType: "youtube",
    youtubeId: "V5l9VqC1k8w",
    mediaUrl: "https://www.youtube.com/watch?v=V5l9VqC1k8w",
    chapter: "Nutrition Bio-Électrique vs Hybridation Moderne",
    timeFormatted: "14:20",
    timeSeconds: 860,
    badgeClass: "badge-success",
    keywords: ["bio electrique", "aliments electriques", "hybridation", "carotte", "amidon", "genetique"],
    topics: ["dr-sebi", "aliments-electriques", "hybridation"],
    excerpt: "Explication de la différence entre les plantes indigènes sauvages dotées de résonance bio-électrique et les aliments créés par hybridation en laboratoire.",
    fullText: "Bio-electric nutrition versus modern hybridization. Starch, carrots, cassava, wild plants, electric food frequency."
  },
  {
    id: "vid_sebi_rocknewman_court",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "The Rock Newman Show ft. Dr. Sebi (Interview Complète)",
    speaker: "Dr. Sebi (Alfredo Bowman)",
    source: "YouTube HD",
    videoType: "youtube",
    youtubeId: "V5l9VqC1k8w",
    mediaUrl: "https://www.youtube.com/watch?v=V5l9VqC1k8w",
    chapter: "Le Procès de New York (1988) & Preuves Médicales",
    timeFormatted: "32:45",
    timeSeconds: 1965,
    badgeClass: "badge-success",
    keywords: ["proces", "cour supreme new york", "victoire", "preuves de guerison", "dossiers medicaux"],
    topics: ["dr-sebi", "proces", "preuves"],
    excerpt: "Récit du procès historique remporté par Dr. Sebi devant la Cour Suprême de New York avec 77 témoins et dossiers cliniques certifiés.",
    fullText: "New York Supreme court trial 1988, 77 cured patients, medical records, diagnostic proof of cure, legal victory."
  },
  {
    id: "vid_wimhof_documentary_origins",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "Documentaire : Inside the Superhuman World of Wim Hof (Vice)",
    speaker: "Wim Hof & Scientifiques",
    source: "Vice / YouTube HD",
    videoType: "youtube",
    youtubeId: "VaMjhwFE1Zw",
    mediaUrl: "https://www.youtube.com/watch?v=VaMjhwFE1Zw",
    chapter: "Aux Origines de la Méthode : Le Froid comme Enseignant",
    timeFormatted: "01:15",
    timeSeconds: 75,
    badgeClass: "badge-purple",
    keywords: ["wim hof", "vice", "froid", "origines", "glace", "adaptation"],
    topics: ["wim-hof", "froid", "documentaire"],
    excerpt: "Comment Wim Hof a développé sa méthode de respiration et d'exposition au froid pour réguler son système nerveux autonome.",
    fullText: "Wim Hof origins, cold exposure, autonomic nervous system regulation, breathing techniques and immune response."
  },
  {
    id: "vid_wimhof_documentary_radboud",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "Documentaire : Inside the Superhuman World of Wim Hof (Vice)",
    speaker: "Wim Hof & Dr. Pickkers (Radboud Univ)",
    source: "Vice / YouTube HD",
    videoType: "youtube",
    youtubeId: "VaMjhwFE1Zw",
    mediaUrl: "https://www.youtube.com/watch?v=VaMjhwFE1Zw",
    chapter: "L'Étude Scientifique de Radboud (Endotoxine & Immunité)",
    timeFormatted: "18:30",
    timeSeconds: 1110,
    badgeClass: "badge-purple",
    keywords: ["etude radboud", "endotoxine", "systeme immunitaire", "inflammation", "adrenalin", "science"],
    topics: ["wim-hof", "science", "immunite"],
    excerpt: "Validation clinique à l'Université Radboud : contrôle volontaire de la réponse immunitaire innée et suppression des cytokines pro-inflammatoires.",
    fullText: "Radboud University clinical trial with endotoxin injection, voluntary suppression of pro-inflammatory cytokines, adrenaline surge."
  },
  {
    id: "vid_wimhof_breathing_tutorial",
    type: "video",
    lang: "en",
    langLabel: "Anglais (VO)",
    title: "Session Guidée de Respiration Wim Hof (3 Rounds Officiels)",
    speaker: "Wim Hof",
    source: "Chaîne Officielle Wim Hof",
    videoType: "youtube",
    youtubeId: "tybOi4hjZFQ",
    mediaUrl: "https://www.youtube.com/watch?v=tybOi4hjZFQ",
    chapter: "Round 1 : 30 Respirations Profondes & Rétention 1 min",
    timeFormatted: "02:10",
    timeSeconds: 130,
    badgeClass: "badge-purple",
    keywords: ["tutoriel respiration", "round 1", "retention", "apnee", "alcalinisation sanguine", "oxygene"],
    topics: ["wim-hof", "respiration", "pratique"],
    excerpt: "Guide pas à pas pour le premier round de 30 respirations diaphragmatiques complètes suivi d'une rétention poumons vides.",
    fullText: "Guided breathing round 1, 30 deep inhalations, passive exhalation, breath retention on empty lungs, blood alkalization."
  },
  {
    id: "vid_ehret_masterclass_vpo",
    type: "video",
    lang: "fr",
    langLabel: "Français",
    title: "Masterclass : Les Lois Fondamentales d'Arnold Ehret",
    speaker: "Institut Vitaliste & Arnold Ehret",
    source: "Masterclass Vidéo HD",
    videoType: "local",
    mediaUrl: "/videos/arnold-ehret-masterclass.mp4",
    chapter: "L'Équation Fondamentale de la Vie : V = P - O",
    timeFormatted: "04:15",
    timeSeconds: 255,
    badgeClass: "badge-success",
    keywords: ["arnold ehret", "v=p-o", "vitalite", "puissance", "obstruction", "equation", "physiologie"],
    topics: ["arnold-ehret", "v-p-o", "vitalite"],
    excerpt: "Découverte de l'équation reine : la Vitalité (V) est égale à la Puissance d'origine (P) moins l'Obstruction interne accumulée (O).",
    fullText: "Arnold Ehret masterclass on fundamental law V = P - O (Vitality equals Power minus Obstruction), mucus-free diet, intestinal cleansing."
  },
  {
    id: "vid_morse_lymphatic_miracle",
    type: "video",
    lang: "fr",
    langLabel: "Français",
    title: "Dr. Robert Morse — Le Système Lymphatique et la Filtration Rénale",
    speaker: "Dr. Robert Morse, N.D.",
    source: "Conférence Clinique Morse",
    videoType: "local",
    mediaUrl: "/videos/dr-morse-lymphatic-system.mp4",
    chapter: "La Grande Lymphe Interstitielle : L'Égout de l'Organisme",
    timeFormatted: "08:40",
    timeSeconds: 520,
    badgeClass: "badge-success",
    keywords: ["dr morse", "systeme lymphatique", "egout cellulaire", "acides", "lipides", "interstitiel"],
    topics: ["dr-morse", "lymphe", "detox"],
    excerpt: "Le Dr. Morse explique pourquoi 80% des liquides du corps sont de la lymphe chargée d'évacuer les acides cellulaires vers les reins.",
    fullText: "Dr. Robert Morse on the great lymphatic system, cellular sewage, acid elimination through kidneys, fruit astringency."
  }
];

function cleanText(txt) {
  return txt
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractKeywords(text, heading) {
  const combined = `${heading} ${text}`.toLowerCase();
  const kw = new Set();
  const words = combined
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);

  for (const w of words) {
    if (!['les', 'des', 'une', 'qui', 'que', 'dans', 'pour', 'sur', 'par', 'avec', 'est', 'sont', 'cette', 'cet', 'ces', 'mais', 'donc', 'tout', 'tous', 'the', 'and', 'for', 'that', 'with', 'from', 'this', 'are', 'was', 'have', 'been', 'which', 'their', 'when', 'will'].includes(w)) {
      kw.add(w);
    }
  }
  return Array.from(kw).slice(0, 15);
}

function processKnowledgeFiles() {
  console.log('📚 Indexing all bilingual knowledge documents in detail...');
  const results = [...BASE_VIDEOS];

  const files = [
    // 🇫🇷 FRENCH EDITIONS
    {
      file: 'robert-morse-le-guide-du-miracle-de-la-detox-fr.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Guide du Miracle de la Détox & Régénération Cellulaire',
      author: 'Dr. Robert Morse, N.D.',
      pdfUrl: '/pdfs/dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf',
      badgeClass: 'badge-purple'
    },
    {
      file: 'arnold-mucusless-diet.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Système de Guérison du Régime Sans Mucus',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'arnold-ehret-le-jeune-rationnel-fr.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Jeûne Rationnel & Régénération Physiologique',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-le-jeune-rationnel-fr.pdf',
      badgeClass: 'badge-warning'
    },
    {
      file: 'david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Système de Réussite de l\'Alimentation Vivante',
      author: 'David Wolfe',
      pdfUrl: '/pdfs/david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.pdf',
      badgeClass: 'badge-danger'
    },
    {
      file: 'dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Pharmacopée Botanique Amazonienne & Monographies Raintree',
      author: 'Dr. Leslie Taylor',
      pdfUrl: '/pdfs/dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.md',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Guide de Purification Cellulaire Bio-Électrique',
      author: 'Dr. Sebi (Alfredo Bowman)',
      pdfUrl: '/pdfs/dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.pdf',
      badgeClass: 'badge-success'
    },

    // 🇬🇧 AUTHENTIC ENGLISH EDITIONS
    {
      file: 'robert-morse-the-detox-miracle-sourcebook-ebook.md',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'The Detox Miracle Sourcebook: Raw Foods and Herbs for Cellular Regeneration',
      author: 'Dr. Robert Morse, N.D.',
      pdfUrl: '/pdfs/robert-morse-detox-miracle-sourcebook.pdf',
      badgeClass: 'badge-purple'
    },
    {
      file: 'the-sunfood-diet-success-system-david-wolfe.md',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'The Sunfood Diet Success System',
      author: 'David Wolfe',
      pdfUrl: '/pdfs/david-wolfe-sunfood-diet-success-system.pdf',
      badgeClass: 'badge-danger'
    },
    {
      file: 'arnold-rational-fasting.md',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Rational Fasting & Regeneration',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-rational-fasting.pdf',
      badgeClass: 'badge-warning'
    },
    {
      file: 'amazon-and-tropical-raintree-materia-medica.md',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Amazon and Tropical Raintree Materia Medica',
      author: 'Dr. Leslie Taylor',
      pdfUrl: '/Nutrional-Guide.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'nutrional-guide.md',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Bio-Electric Cell Food Cleansing & Nutritional Guide',
      author: 'Dr. Sebi (Alfredo Bowman)',
      pdfUrl: '/pdfs/dr-sebi-bio-electric-cell-food-cleansing-guide.pdf',
      badgeClass: 'badge-success'
    }
  ];

  let cardIndex = 1;

  for (const f of files) {
    const filePath = path.join(KNOWLEDGE_DIR, f.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} does not exist.`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const sections = content.split(/\n(?=#{1,3}\s+)/);

    let approxPage = 1;

    for (const sec of sections) {
      const trimmed = cleanText(sec);
      if (trimmed.length < 150) continue;

      const lines = trimmed.split('\n');
      const headingLine = lines.find(l => l.startsWith('#')) || '';
      const heading = headingLine.replace(/^#+\s*/, '').trim() || f.title;
      
      const bodyLines = lines.filter(l => !l.startsWith('#') && l.trim().length > 0);
      const bodyText = bodyLines.join(' ');
      if (bodyText.length < 100) continue;

      // Split large sections into sub-chunks of ~800-1200 characters
      const chunks = [];
      if (bodyText.length > 1500) {
        const sentences = bodyText.match(/[^.!?]+[.!?]+/g) || [bodyText];
        let cur = '';
        for (const s of sentences) {
          if (cur.length + s.length > 1000) {
            if (cur.trim().length > 100) chunks.push(cur.trim());
            cur = s;
          } else {
            cur += ' ' + s;
          }
        }
        if (cur.trim().length > 100) chunks.push(cur.trim());
      } else {
        chunks.push(bodyText);
      }

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunkText = chunks[chunkIdx];
        approxPage = Math.min(120, Math.max(1, Math.floor(cardIndex * 1.5) % 110 + 1));

        let excerpt = chunkText.slice(0, 320);
        if (chunkText.length > 320) excerpt += '...';

        const keywords = extractKeywords(chunkText, heading);
        
        // Topic categorisation
        const topics = [];
        const low = (heading + ' ' + chunkText).toLowerCase();
        if (low.includes('eye') || low.includes('yeux') || low.includes('vision') || low.includes('sight') || low.includes('vue') || low.includes('oculaire')) topics.push('yeux', 'vision', 'eyes');
        if (low.includes('intestin') || low.includes('colon') || low.includes('crohn') || low.includes('bowel') || low.includes('gut') || low.includes('côlon') || low.includes('colite')) topics.push('intestins', 'colon', 'crohn', 'digestif');
        if (low.includes('rein') || low.includes('kidney') || low.includes('renal') || low.includes('filtration')) topics.push('reins', 'kidneys', 'filtration');
        if (low.includes('lymphe') || low.includes('lymph') || low.includes('ganglion')) topics.push('lymphe', 'lymphatic');
        if (low.includes('foie') || low.includes('liver') || low.includes('bile') || low.includes('vesicule')) topics.push('foie', 'liver');
        if (low.includes('poumon') || low.includes('lung') || low.includes('respir') || low.includes('asthme')) topics.push('poumons', 'respiration');
        if (low.includes('peau') || low.includes('skin') || low.includes('dermat')) topics.push('peau', 'skin');
        if (low.includes('mucus') || low.includes('ehret') || low.includes('sans mucus')) topics.push('mucus', 'ehret');
        if (low.includes('jeun') || low.includes('fast') || low.includes('autophag') || low.includes('autolyse')) topics.push('jeune', 'fasting', 'autophagie');
        if (low.includes('plante') || low.includes('herb') || low.includes('botaniq') || low.includes('raintree')) topics.push('plantes', 'pharmacopee');

        results.push({
          id: `doc_idx_${cardIndex++}`,
          type: 'pdf',
          lang: f.lang,
          langLabel: f.langLabel,
          title: f.title,
          author: f.author,
          chapterTitle: heading,
          pageNumber: approxPage,
          pdfUrl: f.pdfUrl,
          badgeClass: f.badgeClass,
          keywords,
          topics,
          excerpt,
          fullText: `${heading} ${chunkText}`
        });
      }
    }
  }

  console.log(`✅ Total indexed bilingual passages & media: ${results.length}`);
  return results;
}

const allData = processKnowledgeFiles();

const fileContent = `// ═══════════════════════════════════════════════════════════════════════════════
// VITALTRACK BILINGUAL MULTIMEDIA KNOWLEDGE INDEX (French Editions & English Originals)
// Auto-generated full-text index across all fundamental vitalist literature & media
// ═══════════════════════════════════════════════════════════════════════════════

export const MEDIA_SEARCH_DATABASE = ${JSON.stringify(allData, null, 2)};

// ═══════ SYNONYM & BILINGUAL EXPANSION DICTIONARY ═══════
export const SYNONYMS = {
  'eye': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'iridologie', 'sight'],
  'eyes': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'iridologie', 'sight'],
  'eyesight': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'sight'],
  'yeux': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'iridologie', 'sight'],
  'oeil': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'sight'],
  'vision': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'sight'],
  'vue': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue', 'sight'],
  'oculaire': ['eye', 'eyes', 'eyesight', 'yeux', 'oeil', 'oculaire', 'vision', 'vue'],
  'iridologie': ['eye', 'eyes', 'iridology', 'iridologie', 'iris', 'pupil', 'pupille', 'yeux'],
  'iridology': ['eye', 'eyes', 'iridology', 'iridologie', 'iris', 'pupil', 'pupille', 'yeux'],

  'intestin': ['intestin', 'intestins', 'intestinal', 'intestine', 'intestines', 'gut', 'bowel', 'small intestine', 'large intestine'],
  'intestins': ['intestin', 'intestins', 'intestinal', 'intestine', 'intestines', 'gut', 'bowel', 'small intestine', 'large intestine'],
  'intestine': ['intestin', 'intestins', 'intestinal', 'intestine', 'intestines', 'gut', 'bowel'],
  'intestines': ['intestin', 'intestins', 'intestinal', 'intestine', 'intestines', 'gut', 'bowel'],
  'intestinal': ['intestin', 'intestins', 'intestinal', 'intestine', 'intestines', 'gut', 'bowel'],
  'gut': ['intestin', 'intestins', 'intestinal', 'gut', 'bowel'],
  'bowel': ['intestin', 'intestins', 'intestinal', 'gut', 'bowel'],

  'colon': ['colon', 'côlon', 'colique', 'colonic', 'gros intestin', 'large intestine', 'constipation'],
  'côlon': ['colon', 'côlon', 'colique', 'colonic', 'gros intestin', 'large intestine', 'constipation'],
  'colite': ['colite', 'colitis', 'colite ulcereuse', 'ulcerative colitis', 'rectocolite'],
  'colitis': ['colite', 'colitis', 'colite ulcereuse', 'ulcerative colitis', 'rectocolite'],

  // Specific Inflammatory Bowel & Crohn terms (Strict precision: no generic intestine pollution)
  'crohn': ['crohn', 'crone', 'crohns', "crohn's", 'maladie de crohn', "crohn's disease", 'crohn disease', 'mici', 'ibd'],
  'crone': ['crohn', 'crone', 'crohns', "crohn's", 'maladie de crohn', "crohn's disease", 'crohn disease', 'mici', 'ibd'],
  'crohns': ['crohn', 'crone', 'crohns', "crohn's", 'maladie de crohn', "crohn's disease", 'crohn disease', 'mici', 'ibd'],
  'mici': ['crohn', 'crone', 'maladie de crohn', 'mici', 'ibd', 'colite ulcereuse', 'ulcerative colitis'],
  'ibd': ['crohn', 'crone', 'maladie de crohn', 'mici', 'ibd', 'colite ulcereuse', 'ulcerative colitis'],
  
  'rein': ['rein', 'reins', 'renal', 'renale', 'kidney', 'kidneys', 'nephron', 'filtration', 'urates', 'lithiase', 'calculs'],
  'reins': ['rein', 'reins', 'renal', 'renale', 'kidney', 'kidneys', 'nephron', 'filtration', 'urates', 'lithiase', 'calculs'],
  'renal': ['rein', 'reins', 'renal', 'renale', 'kidney', 'kidneys', 'nephron', 'filtration', 'urates'],
  'kidney': ['rein', 'reins', 'renal', 'renale', 'kidney', 'kidneys', 'nephron', 'filtration', 'urates'],
  'kidneys': ['rein', 'reins', 'renal', 'renale', 'kidney', 'kidneys', 'nephron', 'filtration', 'urates'],

  'foie': ['foie', 'hepatique', 'liver', 'vesicule', 'biliaire', 'bile', 'gallbladder'],
  'liver': ['foie', 'hepatique', 'liver', 'vesicule', 'biliaire', 'bile', 'gallbladder'],
  'vesicule': ['vesicule', 'vesicule biliaire', 'gallbladder', 'foie', 'liver', 'bile'],

  'poumon': ['poumon', 'poumons', 'lung', 'lungs', 'bronches', 'respiration', 'asthme'],
  'poumons': ['poumon', 'poumons', 'lung', 'lungs', 'bronches', 'respiration', 'asthme'],
  'lung': ['poumon', 'poumons', 'lung', 'lungs', 'bronches', 'respiration', 'asthme'],
  'lungs': ['poumon', 'poumons', 'lung', 'lungs', 'bronches', 'respiration', 'asthme'],

  'peau': ['peau', 'skin', 'dermatite', 'psoriasis', 'eczema', 'eczéma', 'transpiration', 'cutane'],
  'skin': ['peau', 'skin', 'dermatite', 'psoriasis', 'eczema', 'eczéma', 'transpiration', 'cutane'],

  'lymphe': ['lymphe', 'lymphatique', 'lymph', 'lymphatics', 'lymphatic', 'ganglion', 'ganglions', 'nodes'],
  'lymph': ['lymphe', 'lymphatique', 'lymph', 'lymphatics', 'lymphatic', 'ganglion', 'ganglions', 'nodes'],

  'jeune': ['jeune', 'jeûne', 'fasting', 'fast', 'autophagie', 'autophagy', 'autolyse', 'autolysis', 'hydrique', 'sec'],
  'jeûne': ['jeune', 'jeûne', 'fasting', 'fast', 'autophagie', 'autophagy', 'autolyse', 'autolysis', 'hydrique', 'sec'],
  'fasting': ['jeune', 'jeûne', 'fasting', 'fast', 'autophagie', 'autophagy', 'autolyse', 'autolysis', 'hydrique', 'sec'],
  'autophagie': ['autophagie', 'autophagy', 'autolyse', 'autolysis', 'jeune', 'jeûne', 'fasting'],
  'autophagy': ['autophagie', 'autophagy', 'autolyse', 'autolysis', 'jeune', 'jeûne', 'fasting'],
  'autolyse': ['autophagie', 'autophagy', 'autolyse', 'autolysis', 'jeune', 'jeûne', 'fasting'],
  'autolysis': ['autophagie', 'autophagy', 'autolyse', 'autolysis', 'jeune', 'jeûne', 'fasting'],

  'mucus': ['mucus', 'mucusless', 'mucogene', 'mucogène', 'sans mucus', 'colloide', 'colloïde', 'catarrhe'],
  'parasite': ['parasite', 'parasites', 'candida', 'vers', 'worms', 'mycose', 'fungus', 'champignons'],
  'parasites': ['parasite', 'parasites', 'candida', 'vers', 'worms', 'mycose', 'fungus', 'champignons'],

  'sebi': ['sebi', 'dr sebi', 'alfredo bowman', 'electrique', 'electric', 'cell food', 'bio-electric'],
  'wim hof': ['wim hof', 'iceman', 'respiration', 'breath', 'cold', 'froid', 'retention', 'apnee', 'hyperventilation']
};

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim();
}

function termMatches(text, term) {
  if (!text) return false;
  if (term.length <= 4) {
    const escaped = term.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&');
    return new RegExp('\\\\b' + escaped + '\\\\b', 'i').test(text);
  }
  return text.includes(term);
}

export function getExpandedSearchTokens(query) {
  if (!query || !query.trim()) return [];
  const cleanQuery = normalize(query);
  const rawTokens = cleanQuery.split(/\\s+/).filter(t => t.length > 0);
  const searchTerms = new Set();
  searchTerms.add(cleanQuery);

  for (const token of rawTokens) {
    searchTerms.add(token);
    if (SYNONYMS[token]) {
      for (const s of SYNONYMS[token]) {
        searchTerms.add(normalize(s));
      }
    }
  }
  return Array.from(searchTerms).filter(t => t.length > 1);
}

/**
 * High-performance full-text search with bilingual expansions, normalized token scoring & substring matches
 */
export function searchMediaKnowledge(query, filter = 'all') {
  if (!query || !query.trim()) {
    return filterMediaByType(MEDIA_SEARCH_DATABASE, filter);
  }

  const rawQuery = query.trim();
  const cleanQuery = normalize(rawQuery);
  const termsList = getExpandedSearchTokens(query);

  const scored = [];

  for (const item of MEDIA_SEARCH_DATABASE) {
    if (filter !== 'all') {
      if (filter === 'videos' && item.type !== 'video') continue;
      if (filter === 'pdfs' && item.type !== 'pdf') continue;
      if (filter === 'fr' && item.lang !== 'fr') continue;
      if (filter === 'en' && item.lang !== 'en') continue;
    }

    let score = 0;
    const titleNorm = normalize(item.title || '');
    const chapterNorm = normalize(item.chapter || item.chapterTitle || '');
    const excerptNorm = normalize(item.excerpt || '');
    const fullTextNorm = normalize(item.fullText || (item.excerpt || ''));
    const speakerNorm = normalize(item.speaker || item.author || '');
    const keywordsNorm = (item.keywords || []).map(k => normalize(k)).join(' ');
    const topicsNorm = (item.topics || []).map(t => normalize(t)).join(' ');

    // 1. Direct whole-query exact phrase match
    if (termMatches(chapterNorm, cleanQuery)) score += 150;
    if (termMatches(titleNorm, cleanQuery)) score += 100;
    if (termMatches(keywordsNorm, cleanQuery)) score += 90;
    if (termMatches(excerptNorm, cleanQuery)) score += 80;
    if (termMatches(fullTextNorm, cleanQuery)) score += 70;
    if (termMatches(topicsNorm, cleanQuery)) score += 60;

    // 2. Expanded terms matches
    for (const term of termsList) {
      if (term.length < 2) continue;
      
      let termScore = 0;
      if (termMatches(chapterNorm, term)) termScore += 40;
      if (termMatches(titleNorm, term)) termScore += 30;
      if (termMatches(keywordsNorm, term)) termScore += 25;
      if (termMatches(excerptNorm, term)) termScore += 20;
      if (termMatches(fullTextNorm, term)) termScore += 18;
      if (termMatches(topicsNorm, term)) termScore += 15;
      if (termMatches(speakerNorm, term)) termScore += 12;

      score += termScore;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

function filterMediaByType(items, filter) {
  if (filter === 'videos') return items.filter(i => i.type === 'video');
  if (filter === 'pdfs') return items.filter(i => i.type === 'pdf');
  if (filter === 'fr') return items.filter(i => i.lang === 'fr');
  if (filter === 'en') return items.filter(i => i.lang === 'en');
  return items;
}
`;

fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
console.log(`🎉 Full bilingual media search index created successfully in ${OUTPUT_FILE}`);
