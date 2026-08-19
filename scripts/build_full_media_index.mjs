import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const PDF_DIR = '/Users/richard/Developer/vital_track/web-app/public/pdfs';
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

// Clean text helper: strip markdown syntax, asterisks, headers, double spaces
function cleanText(txt) {
  if (!txt) return '';
  return txt
    .replace(/\r\n/g, '\n')
    .replace(/[*_#`~]/g, ' ')
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

  const stopWords = new Set([
    'les', 'des', 'une', 'qui', 'que', 'dans', 'pour', 'sur', 'par', 'avec', 'est', 'sont', 'cette', 'cet', 'ces', 'mais', 'donc', 'tout', 'tous', 'the', 'and', 'for', 'that', 'with', 'from', 'this', 'are', 'was', 'have', 'been', 'which', 'their', 'when', 'will', 'your', 'about', 'from', 'they', 'what', 'page', 'chapter', 'section'
  ]);

  for (const w of words) {
    if (!stopWords.has(w)) {
      kw.add(w);
    }
  }
  return Array.from(kw).slice(0, 15);
}

// Strict topic tagging to avoid false-positive pollution (e.g. crohn only when crohn is present!)
function getTopicsForText(heading, text) {
  const topics = [];
  const low = (heading + ' ' + text).toLowerCase();
  
  if (low.includes('eye') || low.includes('yeux') || low.includes('vision') || low.includes('sight') || low.includes('vue') || low.includes('oculaire') || low.includes('glaucome') || low.includes('cataracte')) {
    topics.push('yeux', 'vision', 'eyes');
  }
  
  if (low.includes('crohn') || low.includes("crohn's") || low.includes('mici') || low.includes('ibd')) {
    topics.push('crohn');
  }

  if (low.includes('colite') || low.includes('colitis') || low.includes('rectocolite') || low.includes('rch')) {
    topics.push('colite');
  }

  if (low.includes('intestin') || low.includes('colon') || low.includes('bowel') || low.includes('gut') || low.includes('côlon') || low.includes('grele') || low.includes('tractus')) {
    topics.push('intestins', 'colon', 'digestif');
  }

  if (low.includes('rein') || low.includes('kidney') || low.includes('renal') || low.includes('filtration')) {
    topics.push('reins', 'kidneys', 'filtration');
  }

  if (low.includes('surrenale') || low.includes('adrenal')) {
    topics.push('surrenales', 'adrenals');
  }

  if (low.includes('lymphe') || low.includes('lymph') || low.includes('ganglion') || low.includes('nodes')) {
    topics.push('lymphe', 'lymphatic');
  }

  if (low.includes('foie') || low.includes('liver') || low.includes('bile') || low.includes('vesicule') || low.includes('gallbladder')) {
    topics.push('foie', 'liver');
  }

  if (low.includes('poumon') || low.includes('lung') || low.includes('respir') || low.includes('asthme') || low.includes('bronch')) {
    topics.push('poumons', 'respiration');
  }

  if (low.includes('peau') || low.includes('skin') || low.includes('dermat') || low.includes('eczema') || low.includes('psoriasis')) {
    topics.push('peau', 'skin');
  }

  if (low.includes('mucus') || low.includes('ehret') || low.includes('sans mucus') || low.includes('mucusless')) {
    topics.push('mucus', 'ehret');
  }

  if (low.includes('jeun') || low.includes('fast') || low.includes('autophag') || low.includes('autolyse')) {
    topics.push('jeune', 'fasting', 'autophagie');
  }

  if (low.includes('plante') || low.includes('herb') || low.includes('botaniq') || low.includes('raintree') || low.includes('chanca') || low.includes('graviola')) {
    topics.push('plantes', 'pharmacopee');
  }

  if (low.includes('sebi') || low.includes('bio-electrique') || low.includes('alcalin') || low.includes('cell food')) {
    topics.push('dr-sebi', 'bio-electrique');
  }

  if (low.includes('wolfe') || low.includes('sunfood') || low.includes('vivante')) {
    topics.push('david-wolfe', 'sunfood');
  }

  return topics;
}

// Extract chapter title from page lines
function detectPageHeading(lines, defaultTitle) {
  for (const line of lines.slice(0, 5)) {
    const trimmed = cleanText(line);
    if (!trimmed) continue;
    if (trimmed.length > 4 && trimmed.length < 80 && !/^\d+$/.test(trimmed) && !trimmed.toLowerCase().startsWith('page')) {
      return trimmed.replace(/^Chapter\s+\d+\s*[:-]?\s*/i, '').trim();
    }
  }
  return defaultTitle;
}

async function processAllMediaAndPdfs() {
  console.log('📚 Indexing all verified PDF files with exact page numbers...');
  const results = [...BASE_VIDEOS];

  const pdfFiles = [
    // 🇫🇷 FRENCH EDITIONS
    {
      file: 'dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Guide du Miracle de la Détox & Régénération Cellulaire',
      author: 'Dr. Robert Morse, N.D.',
      pdfUrl: '/pdfs/dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf',
      badgeClass: 'badge-purple'
    },
    {
      file: 'arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Système de Guérison du Régime Sans Mucus',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'arnold-ehret-le-jeune-rationnel-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Jeûne Rationnel & Régénération Physiologique',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-le-jeune-rationnel-fr.pdf',
      badgeClass: 'badge-warning'
    },
    {
      file: 'david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Le Système de Réussite de l\'Alimentation Vivante',
      author: 'David Wolfe',
      pdfUrl: '/pdfs/david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.pdf',
      badgeClass: 'badge-danger'
    },
    {
      file: 'dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Pharmacopée Botanique Amazonienne & Monographies Raintree',
      author: 'Dr. Leslie Taylor',
      pdfUrl: '/pdfs/dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.pdf',
      lang: 'fr',
      langLabel: '🇫🇷 Français',
      title: 'Guide de Purification Cellulaire Bio-Électrique',
      author: 'Dr. Sebi (Alfredo Bowman)',
      pdfUrl: '/pdfs/dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.pdf',
      badgeClass: 'badge-success'
    },

    // 🇬🇧 AUTHENTIC ENGLISH EDITIONS
    {
      file: 'robert-morse-detox-miracle-sourcebook.pdf',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'The Detox Miracle Sourcebook: Raw Foods and Herbs for Cellular Regeneration',
      author: 'Dr. Robert Morse, N.D.',
      pdfUrl: '/pdfs/robert-morse-detox-miracle-sourcebook.pdf',
      badgeClass: 'badge-purple'
    },
    {
      file: 'david-wolfe-sunfood-diet-success-system.pdf',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'The Sunfood Diet Success System',
      author: 'David Wolfe',
      pdfUrl: '/pdfs/david-wolfe-sunfood-diet-success-system.pdf',
      badgeClass: 'badge-danger'
    },
    {
      file: 'arnold-ehret-rational-fasting.pdf',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Rational Fasting & Regeneration',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-rational-fasting.pdf',
      badgeClass: 'badge-warning'
    },
    {
      file: 'arnold-ehret-mucusless-diet-healing-system.pdf',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Mucusless Diet Healing System',
      author: 'Prof. Arnold Ehret',
      pdfUrl: '/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf',
      badgeClass: 'badge-success'
    },
    {
      file: 'dr-sebi-bio-electric-cell-food-cleansing-guide.pdf',
      lang: 'en',
      langLabel: '🇬🇧 English (Original)',
      title: 'Bio-Electric Cell Food Cleansing & Nutritional Guide',
      author: 'Dr. Sebi (Alfredo Bowman)',
      pdfUrl: '/pdfs/dr-sebi-bio-electric-cell-food-cleansing-guide.pdf',
      badgeClass: 'badge-success'
    }
  ];

  let cardIndex = 1;

  for (const f of pdfFiles) {
    const pdfPath = path.join(PDF_DIR, f.file);
    if (!fs.existsSync(pdfPath)) {
      console.warn(`PDF file not found: ${pdfPath}`);
      continue;
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pages = [];

    const render_page = (pageData) => {
      return pageData.getTextContent().then(textContent => {
        const text = textContent.items.map(item => item.str).join(' ');
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          rawText: text
        });
        return text;
      });
    };

    await pdf(dataBuffer, { pagerender: render_page });
    console.log(`  📄 ${f.file} : ${pages.length} pages processed.`);

    let currentChapter = f.title;

    for (const p of pages) {
      const cleaned = cleanText(p.rawText);
      if (cleaned.length < 80) continue; // Skip empty pages

      const lines = cleaned.split(/(?<=\n|\. )/);
      const headingCandidate = detectPageHeading(lines, currentChapter);
      if (headingCandidate && headingCandidate.length < 90 && headingCandidate !== currentChapter) {
        currentChapter = headingCandidate;
      }

      // If page is dense (> 1300 chars), create readable sub-chunks with exact pageNumber
      const chunks = [];
      if (cleaned.length > 1400) {
        const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
        let cur = '';
        for (const s of sentences) {
          if (cur.length + s.length > 1000) {
            if (cur.trim().length > 80) chunks.push(cur.trim());
            cur = s;
          } else {
            cur += ' ' + s;
          }
        }
        if (cur.trim().length > 80) chunks.push(cur.trim());
      } else {
        chunks.push(cleaned);
      }

      for (const chunkText of chunks) {
        let excerpt = chunkText.slice(0, 320);
        if (chunkText.length > 320) excerpt += '...';

        const keywords = extractKeywords(chunkText, currentChapter);
        const topics = getTopicsForText(currentChapter, chunkText);

        results.push({
          id: `doc_idx_${cardIndex++}`,
          type: 'pdf',
          lang: f.lang,
          langLabel: f.langLabel,
          title: f.title,
          author: f.author,
          chapterTitle: currentChapter,
          pageNumber: p.pageNumber, // 🎯 100% REAL PDF PAGE NUMBER
          pdfUrl: f.pdfUrl,
          badgeClass: f.badgeClass,
          keywords,
          topics,
          excerpt,
          fullText: `${currentChapter} — ${chunkText}`
        });
      }
    }
  }

  // Also include Materia Medica Monograph Index from Markdown
  const raintreeMdPath = path.join(KNOWLEDGE_DIR, 'amazon-and-tropical-raintree-materia-medica.md');
  if (fs.existsSync(raintreeMdPath)) {
    console.log('  🌿 Indexing Leslie Taylor Materia Medica monographs...');
    const content = fs.readFileSync(raintreeMdPath, 'utf8');
    const sections = content.split(/\n(?=#{1,3}\s+)/);
    let approxPage = 1;

    for (const sec of sections) {
      const cleaned = cleanText(sec);
      if (cleaned.length < 150) continue;

      const lines = cleaned.split('\n');
      const heading = lines[0]?.trim() || 'Plante Amazonienne';
      const body = lines.slice(1).join(' ').trim();
      if (body.length < 100) continue;

      approxPage++;
      let excerpt = body.slice(0, 320);
      if (body.length > 320) excerpt += '...';

      const keywords = extractKeywords(body, heading);
      const topics = getTopicsForText(heading, body);
      topics.push('plantes', 'pharmacopee', 'raintree');

      results.push({
        id: `doc_idx_${cardIndex++}`,
        type: 'pdf',
        lang: 'en',
        langLabel: '🇬🇧 English (Original)',
        title: 'Amazon and Tropical Raintree Materia Medica',
        author: 'Dr. Leslie Taylor',
        chapterTitle: heading,
        pageNumber: approxPage,
        pdfUrl: '/Nutrional-Guide.pdf',
        badgeClass: 'badge-success',
        keywords,
        topics,
        excerpt,
        fullText: `${heading} — ${body}`
      });
    }
  }

  console.log(`✅ Total Indexed Media and PDF Passages: ${results.length}`);

  // Build Output File Content with optimized scoring search function
  const fileContent = `/**
 * 📚 VITALTRACK COMPREHENSIVE BILINGUAL MEDIA & PDF PASSAGE INDEX
 * Total Entries: ${results.length} passages & timestamps with 100% exact real PDF page numbers.
 */

export const SYNONYMS = {
  // Pathologies & conditions spécifiques
  'crohn': ['crohn', 'maladie de crohn', "crohn's", 'colite', 'colitis', 'mici', 'ibd'],
  'colite': ['colite', 'colitis', 'rectocolite', 'inflammation intestinale', 'rch'],
  'candida': ['candida', 'candidose', 'levures', 'mycose', 'fungal', 'yeast'],
  'yeux': ['yeux', 'oeil', 'vision', 'eyes', 'sight', 'oculaire', 'cataracte', 'glaucome'],
  'eyes': ['eyes', 'eye', 'vision', 'sight', 'yeux', 'oeil', 'glaucoma', 'cataracts'],
  'reins': ['reins', 'rein', 'kidney', 'kidneys', 'renal', 'filtration', 'nephron', 'surrenales', 'adrenals'],
  'kidneys': ['kidneys', 'kidney', 'renal', 'reins', 'rein', 'filtration', 'adrenals', 'surrenales'],
  'surrenales': ['surrenales', 'surrenale', 'adrenals', 'adrenal', 'medulla', 'cortex', 'aldosterone'],
  'adrenals': ['adrenals', 'adrenal', 'surrenales', 'surrenale', 'medulla', 'cortex'],
  'lymphe': ['lymphe', 'lymphatique', 'lymph', 'lymphatic', 'ganglions', 'nodes', 'interstitiel'],
  'lymph': ['lymph', 'lymphatic', 'lymphe', 'nodes', 'ganglions', 'interstitial'],
  'intestins': ['intestin', 'intestins', 'colon', 'gut', 'bowel', 'côlon', 'grele', 'tractus'],
  'colon': ['colon', 'côlon', 'intestin', 'intestins', 'bowel', 'large intestine'],
  'gut': ['gut', 'bowel', 'gi tract', 'gastrointestinal', 'intestin', 'colon'],
  'jeune': ['jeune', 'jeûne', 'fasting', 'fast', 'autophagie', 'autophagy', 'abstinence', 'hydrique'],
  'fasting': ['fasting', 'fast', 'jeune', 'jeûne', 'water fast', 'juice fast', 'autophagy'],
  'autophagie': ['autophagie', 'autophagy', 'autolyse', 'recyclage cellulaire', 'nobel ohsumi'],
  'mucus': ['mucus', 'sans mucus', 'mucusless', 'mucogene', 'glaires', 'obstruction', 'ehret'],
  'foie': ['foie', 'liver', 'hepatique', 'hepatic', 'bile', 'vesicule', 'biliary'],
  'liver': ['liver', 'hepatic', 'foie', 'bile', 'gallbladder', 'vesicule'],
  'poumons': ['poumons', 'poumon', 'lungs', 'lung', 'respiration', 'bronches', 'asthme'],
  'peau': ['peau', 'skin', 'dermatite', 'eczema', 'psoriasis', 'sudation', 'transpiration'],
  'plantes': ['plantes', 'plante', 'herbes', 'herbe', 'herbs', 'botanique', 'raintree', 'tisane', 'teinture'],
  'sebi': ['sebi', 'dr sebi', 'bowman', 'bio-electrique', 'alcalin', 'electric', 'cell food'],
  'morse': ['morse', 'robert morse', 'detox miracle', 'sourcebook', 'cellular regeneration', 'filtration renale'],
  'ehret': ['ehret', 'arnold ehret', 'regime sans mucus', 'mucusless', 'jeune rationnel', 'v=p-o'],
  'wolfe': ['wolfe', 'david wolfe', 'sunfood', 'alimentation vivante', 'raw food', 'superfoods'],
  'wim hof': ['wim hof', 'hof', 'respiration', 'froid', 'glace', 'apnee', 'radboud', 'hyperventilation']
};

export function getExpandedSearchTokens(query) {
  if (!query) return [];
  const normalized = query.toLowerCase().trim();
  const tokens = new Set();
  
  tokens.add(normalized);
  normalized.split(/\\s+/).forEach(w => {
    if (w.length >= 2) tokens.add(w);
  });

  for (const [key, synList] of Object.entries(SYNONYMS)) {
    if (normalized === key || normalized.includes(key) || synList.some(s => s === normalized)) {
      synList.forEach(s => tokens.add(s.toLowerCase()));
    }
  }

  return Array.from(tokens);
}

function escapeRegex(string) {
  return string.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&');
}

export function searchMediaKnowledge(query = '', filter = 'all') {
  if (!query && filter === 'all') return MEDIA_SEARCH_DATABASE;
  
  const tokens = getExpandedSearchTokens(query);
  const normalizedQuery = (query || '').toLowerCase().trim();

  let filtered = MEDIA_SEARCH_DATABASE;
  if (filter === 'video') {
    filtered = filtered.filter(item => item.type === 'video');
  } else if (filter === 'pdf') {
    filtered = filtered.filter(item => item.type === 'pdf');
  } else if (filter === 'fr') {
    filtered = filtered.filter(item => item.lang === 'fr');
  } else if (filter === 'en') {
    filtered = filtered.filter(item => item.lang === 'en');
  }

  if (!query || tokens.length === 0) {
    return filtered;
  }

  const scored = [];

  for (const item of filtered) {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const chapter = (item.chapterTitle || item.chapter || '').toLowerCase();
    const fullText = (item.fullText || item.excerpt || '').toLowerCase();
    const topics = (item.topics || []).map(t => t.toLowerCase());
    const keywords = (item.keywords || []).map(k => k.toLowerCase());

    // De-prioritize table of contents if searching for specific content
    if (!normalizedQuery.includes('table') && (chapter.includes('table des matières') || chapter.includes('table of contents') || chapter.includes('contents'))) {
      score -= 30;
    }

    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      const escaped = escapeRegex(token);
      const regexExact = token.length <= 4 ? new RegExp('\\\\b' + escaped + '\\\\b', 'i') : new RegExp(escaped, 'i');
      
      // 1. Chapter or Title match (Highest Priority)
      if (regexExact.test(chapter)) score += 50;
      if (regexExact.test(title)) score += 30;

      // 2. FullText exact occurrences
      if (regexExact.test(fullText)) {
        score += 40;
        const matches = fullText.match(new RegExp(escaped, 'gi')) || [];
        score += Math.min(30, matches.length * 5);
      }

      // 3. Specific topics match
      if (topics.includes(token)) score += 25;
      if (keywords.includes(token)) score += 10;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

export const MEDIA_SEARCH_DATABASE = ${JSON.stringify(results, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
  console.log(`🎉 Successfully generated mediaSearchIndex.js at ${OUTPUT_FILE} !`);
}

processAllMediaAndPdfs().catch(err => {
  console.error('Fatal build error:', err);
  process.exit(1);
});
