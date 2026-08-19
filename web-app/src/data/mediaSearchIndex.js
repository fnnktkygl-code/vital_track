/**
 * 📚🎬 VitalTrack Multimedia & PDF Deep-Search Knowledge Index
 * 
 * Comprehensive structured index of timecoded video chapters and PDF book passages.
 * Each entry provides precise timestamps (seconds) or page numbers for direct jump.
 */

export const MEDIA_SEARCH_DATABASE = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 VIDÉOS TIME-CODÉES (LOCALES & YOUTUBE)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Dr. Sebi Documentary (Local HD - 56 min) ---
  {
    id: "vid-sebi-01",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Introduction & Parcours d'Alfredo Bowman (Dr. Sebi)",
    speaker: "Dr. Sebi (Alfredo Bowman)",
    timeSeconds: 0,
    timeFormatted: "00:00",
    badgeClass: "badge-success",
    keywords: ["dr sebi", "alfredo bowman", "biographie", "origine", "guérison", "honduras", "ucla", "médecine naturelle"],
    topics: ["dr-sebi", "histoire", "bio-electricite"],
    excerpt: "L'entretien télévisé historique avec le Dr. Sebi à Howard University Television retraçant son parcours, sa découverte de la biochimie naturelle et sa mission de régénération cellulaire."
  },
  {
    id: "vid-sebi-02",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "L'Équilibre Bio-Minéral & L'Alcalinité Cellulaire",
    speaker: "Dr. Sebi",
    timeSeconds: 270,
    timeFormatted: "04:30",
    badgeClass: "badge-success",
    keywords: ["alcalin", "alcalinite", "bio-mineral", "ph", "cellule", "resonance", "electricite", "frequence", "biochimie"],
    topics: ["alcalinite", "dr-sebi", "biochimie"],
    excerpt: "Explication de la résonance bio-minérale : le corps humain est électrique. Chaque cellule a besoin de minéraux alcalins natifs pour maintenir son potentiel transmembranaire et sa vitalité."
  },
  {
    id: "vid-sebi-03",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Le Mucus : Cause Unique Fondamentale des Maladies",
    speaker: "Dr. Sebi",
    timeSeconds: 675,
    timeFormatted: "11:15",
    badgeClass: "badge-success",
    keywords: ["mucus", "cause des maladies", "inflammation", "membrane muqueuse", "poumons", "bronches", "sinusite", "acidose"],
    topics: ["mucus", "pathologie", "dr-sebi"],
    excerpt: "« Il n'y a qu'une seule maladie : la rupture de la membrane muqueuse causée par l'accumulation de mucus et de toxines acides. Si le mucus atteint les poumons, c'est la pneumonie ; dans les articulations, c'est l'arthrite ; dans le cerveau, c'est la maladie mentale. »"
  },
  {
    id: "vid-sebi-04",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "La Vérité sur les Aliments Hybrides et Artificiels",
    speaker: "Dr. Sebi",
    timeSeconds: 1120,
    timeFormatted: "18:40",
    badgeClass: "badge-success",
    keywords: ["hybride", "aliments hybrides", "carotte", "brocoli", "ail", "amidon", "gmo", "naturel", "sauvage"],
    topics: ["aliments-electriques", "hybridation", "dr-sebi"],
    excerpt: "Démonstration des aliments non naturels créés par croisement humain : la carotte, le brocoli, l'ail et les féculents riches en amidon qui encrassent l'organisme et bloquent l'élimination lymphatique."
  },
  {
    id: "vid-sebi-05",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Le Procès Historique de 1987 à la Cour Suprême de New York",
    speaker: "Dr. Sebi",
    timeSeconds: 1570,
    timeFormatted: "26:10",
    badgeClass: "badge-success",
    keywords: ["proces", "cour supreme", "new york", "1987", "justice", "temoignages", "guerison", "preuves medicales"],
    topics: ["dr-sebi", "histoire", "victoire-juridique"],
    excerpt: "Récit du procès intenté par l'État de New York contre le Dr. Sebi : obligation de présenter des preuves médicales devant le juge, ayant abouti à son acquittement total grâce au témoignage de 77 patients guéris de maladies déclarées incurables."
  },
  {
    id: "vid-sebi-06",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Les Plantes Médicinales d'Épuration Cellulaire (Sea Moss & Chelation)",
    speaker: "Dr. Sebi",
    timeSeconds: 2065,
    timeFormatted: "34:25",
    badgeClass: "badge-success",
    keywords: ["sea moss", "mousse d'irlande", "fucus", "chelation", "maya", "plantes", "herboristerie", "iode", "mineraux"],
    topics: ["plantes-medicinales", "dr-sebi", "detox"],
    excerpt: "Présentation des complexes botaniques à haute densité minérale : Sea Moss (Mousse d'Irlande), Vessie Varech (Bladderwrack), racine de Bardane et Salsepareille pour dissoudre le mucus et chélater les dépôts intracellulaires."
  },
  {
    id: "vid-sebi-07",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Nutrition Électrique vs Nutrition Chimique Morte",
    speaker: "Dr. Sebi",
    timeSeconds: 2570,
    timeFormatted: "42:50",
    badgeClass: "badge-success",
    keywords: ["electrique", "aliments electriques", "fruits sauvages", "vitalite", "energie", "vibratoire", "vie"],
    topics: ["aliments-electriques", "energie", "dr-sebi"],
    excerpt: "Comment la nourriture vivante transmet son champ électromagnétique aux organes, contrastant avec les produits animaux et industriels dépourvus de potentiel électrique vivant."
  },
  {
    id: "vid-sebi-08",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/dr-sebi-documentary.mp4",
    poster: "/videos/posters/dr-sebi-documentary.jpg",
    title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
    source: "WHUT TV / Dr. Sebi (Howard University Television • 56 min)",
    chapter: "Le Jeûne Thérapeutique & L'Irrigation Lymphatique",
    speaker: "Dr. Sebi",
    timeSeconds: 2955,
    timeFormatted: "49:15",
    badgeClass: "badge-success",
    keywords: ["jeune", "jeune therapeutique", "irrigation", "lymphe", "eau de source", "nettoyage", "autophagie"],
    topics: ["jeune", "lymphe", "dr-sebi"],
    excerpt: "Le protocole ultime de purge : suspension des apports solides, consommation exclusive d'eau de source chaude et de décoctions botaniques pour permettre au système lymphatique d'évacuer les scories acides."
  },

  // --- Wim Hof Guided Breathing 3 Rounds (Local HD) ---
  {
    id: "vid-wim-01",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    title: "Respiration Guidée Wim Hof (3 Rounds Officiels)",
    source: "Wim Hof Method (Session Guidée Audio/Vidéo HD)",
    chapter: "Round 1 : 30 Respirations Profondes (Oxygénation Rythmée)",
    speaker: "Wim Hof",
    timeSeconds: 0,
    timeFormatted: "00:00",
    badgeClass: "badge-success",
    keywords: ["respiration", "wim hof", "round 1", "inspiration", "ventrale", "hyperventilation", "poumons", "oxygene"],
    topics: ["respiration", "wim-hof", "oxygene"],
    excerpt: "Début de la séance : 30 cycles respiratoires rythmés. Inspirez pleinement par le ventre et la poitrine (« Fully In »), relâchez passivement sans forcer (« Let Go »)."
  },
  {
    id: "vid-wim-02",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    title: "Respiration Guidée Wim Hof (3 Rounds Officiels)",
    source: "Wim Hof Method (Session Guidée Audio/Vidéo HD)",
    chapter: "Round 1 : Rétention Poumons Vides (1 minute)",
    speaker: "Wim Hof",
    timeSeconds: 110,
    timeFormatted: "01:50",
    badgeClass: "badge-success",
    keywords: ["retention", "apnee", "poumons vides", "calme", "hypoxie intermittente", "wim hof", "round 1"],
    topics: ["respiration", "retention", "wim-hof"],
    excerpt: "Après la 30e expiration : expirez doucement et bloquez votre respiration poumons vides pendant 1 minute. Détendez le corps, ressentez le calme profond et l'alcalinisation cellulaire."
  },
  {
    id: "vid-wim-03",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    title: "Respiration Guidée Wim Hof (3 Rounds Officiels)",
    source: "Wim Hof Method (Session Guidée Audio/Vidéo HD)",
    chapter: "Round 2 : Rétention Poumons Vides (1 minute 30)",
    speaker: "Wim Hof",
    timeSeconds: 260,
    timeFormatted: "04:20",
    badgeClass: "badge-success",
    keywords: ["retention 1m30", "apnee", "round 2", "wim hof", "systeme nerveux", "alcalinite"],
    topics: ["respiration", "retention", "wim-hof"],
    excerpt: "Deuxième phase de rétention poumons vides prolongée à 1m30. La baisse du CO2 et l'adaptation à l'hypoxie intermittente activent le système nerveux parasympathique et la production d'érythropoïétine."
  },
  {
    id: "vid-wim-04",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    title: "Respiration Guidée Wim Hof (3 Rounds Officiels)",
    source: "Wim Hof Method (Session Guidée Audio/Vidéo HD)",
    chapter: "Round 3 : Rétention Poumons Vides Finale (1 minute 45)",
    speaker: "Wim Hof",
    timeSeconds: 440,
    timeFormatted: "07:20",
    badgeClass: "badge-success",
    keywords: ["retention 1m45", "round 3", "apnee finale", "etat meditater", "wim hof", "picotements"],
    topics: ["respiration", "retention", "wim-hof"],
    excerpt: "Troisième et dernière rétention majeure à 1m45. Libération d'endorphines, réinitialisation de la réponse immunitaire et profonde clarté mentale."
  },

  // --- Wim Hof Science & Biology (Local HD - 15 min) ---
  {
    id: "vid-wim-sci-01",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-science.mp4",
    poster: "/videos/posters/wim-hof-science.jpg",
    title: "La Science & la Biologie de la Méthode Wim Hof",
    source: "Wim Hof Science & Medical Research (15 min)",
    chapter: "L'Étude Clinique de l'Université Radboud (Injection d'Endotoxine)",
    speaker: "Chercheurs & Wim Hof",
    timeSeconds: 200,
    timeFormatted: "03:20",
    badgeClass: "badge-success",
    keywords: ["science", "radboud", "endotoxine", "etude clinique", "immunite", "e coli", "inflammation", "preuve scientifique"],
    topics: ["science", "immunite", "wim-hof"],
    excerpt: "Démonstration scientifique historique : 12 volontaires entraînés par Wim Hof reçoivent une injection d'endotoxine bactérienne (E. coli) et suppriment volontairement la fièvre et les marqueurs inflammatoires (TNF-alpha, IL-6)."
  },
  {
    id: "vid-wim-sci-02",
    type: "video",
    videoType: "local",
    mediaUrl: "/videos/wim-hof-science.mp4",
    poster: "/videos/posters/wim-hof-science.jpg",
    title: "La Science & la Biologie de la Méthode Wim Hof",
    source: "Wim Hof Science & Medical Research (15 min)",
    chapter: "Alcalinisation Sanguine Immédiate & Hausse du pH",
    speaker: "Chercheurs Radboud",
    timeSeconds: 405,
    timeFormatted: "06:45",
    badgeClass: "badge-success",
    keywords: ["ph sanguin", "alcalinite", "hyperventilation", "co2", "gaz du sang", "science", "bicarbonate"],
    topics: ["science", "alcalinite", "respiration"],
    excerpt: "Mesure directe en laboratoire : l'hyperventilation contrôlée fait monter le pH sanguin jusqu'à 7.75 (alcalose respiratoire temporaire), modifiant l'environnement ionique et réduisant l'inflammation tissulaire."
  },

  // --- ARTE Documentaire : Le Jeûne, une nouvelle thérapie ? (YouTube) ---
  {
    id: "vid-arte-01",
    type: "video",
    videoType: "youtube",
    youtubeId: "_ufnGrKmL1c",
    mediaUrl: "https://www.youtube.com/watch?v=_ufnGrKmL1c",
    embedUrl: "https://www.youtube-nocookie.com/embed/_ufnGrKmL1c",
    title: "Le jeûne, une nouvelle thérapie ?",
    source: "ARTE Documentaire Scientifique (56 min)",
    chapter: "La Clinique Buchinger & Les Protocoles Médicaux Allemands",
    speaker: "Dr. Françoise Wilhelmi de Toledo",
    timeSeconds: 0,
    timeFormatted: "00:00",
    badgeClass: "badge-warning",
    keywords: ["arte", "buchinger", "jeune medical", "allemagne", "clinique", "surveillance", "bouillon", "jus de fruits"],
    topics: ["jeune", "arte", "clinique"],
    excerpt: "Immersion à la clinique de jeûne thérapeutique Buchinger Wilhelmi en Allemagne : comment le jeûne supervisé traite les maladies métaboliques, le diabète et l'hypertension depuis plus d'un siècle."
  },
  {
    id: "vid-arte-02",
    type: "video",
    videoType: "youtube",
    youtubeId: "_ufnGrKmL1c",
    mediaUrl: "https://www.youtube.com/watch?v=_ufnGrKmL1c",
    embedUrl: "https://www.youtube-nocookie.com/embed/_ufnGrKmL1c",
    title: "Le jeûne, une nouvelle thérapie ?",
    source: "ARTE Documentaire Scientifique (56 min)",
    chapter: "L'Autophagie & Le Basculement Métabolique Cétonique",
    speaker: "Pr. Valter Longo & Chercheurs",
    timeSeconds: 510,
    timeFormatted: "08:30",
    badgeClass: "badge-warning",
    keywords: ["autophagie", "corps cetoniques", "basculement", "glucagon", "glycogene", "nettoyage cellulaire"],
    topics: ["autophagie", "jeune", "science"],
    excerpt: "Explication des mécanismes de l'autophagie : lorsque les réserves de glycogène hépatique s'épuisent après 24 à 48 heures, les cellules déclenchent le recyclage de leurs organites endommagés et protéines anormales."
  },
  {
    id: "vid-arte-03",
    type: "video",
    videoType: "youtube",
    youtubeId: "_ufnGrKmL1c",
    mediaUrl: "https://www.youtube.com/watch?v=_ufnGrKmL1c",
    embedUrl: "https://www.youtube-nocookie.com/embed/_ufnGrKmL1c",
    title: "Le jeûne, une nouvelle thérapie ?",
    source: "ARTE Documentaire Scientifique (56 min)",
    chapter: "Jeûne & Protection Contre la Toxicité de la Chimiothérapie",
    speaker: "Pr. Valter Longo (University of Southern California)",
    timeSeconds: 1785,
    timeFormatted: "29:45",
    badgeClass: "badge-warning",
    keywords: ["chimiorésistance", "chimiothérapie", "valter longo", "cancer", "cellules saines", "protection"],
    topics: ["cancer", "valter-longo", "jeune"],
    excerpt: "Les découvertes du Pr. Valter Longo sur la résistance différentielle au stress : le jeûne de 48h avant la chimiothérapie met les cellules saines en mode bouclier protecteur tout en rendant les cellules cancéreuses vulnérables."
  },

  // --- What The Health (YouTube) ---
  {
    id: "vid-wth-01",
    type: "video",
    videoType: "youtube",
    youtubeId: "_ymX8x0IqM8",
    mediaUrl: "https://www.youtube.com/watch?v=_ymX8x0IqM8",
    embedUrl: "https://www.youtube-nocookie.com/embed/_ymX8x0IqM8",
    title: "What The Health (Enquête Nutritionnelle)",
    source: "AUM Films / Kip Andersen (VOSTFR 1h32)",
    chapter: "Le Vrai Déclencheur du Diabète : Les Graisses Saturées Intramyocellulaires",
    speaker: "Dr. Neal Barnard & Dr. Michael Greger",
    timeSeconds: 860,
    timeFormatted: "14:20",
    badgeClass: "badge-warning",
    keywords: ["diabete", "insuline", "graisses saturees", "sucre", "viande", "lipides intramyocellulaires"],
    topics: ["diabete", "graisses", "nutrition"],
    excerpt: "Démystification médicale : le diabète de type 2 n'est pas causé par les glucides des fruits, mais par l'accumulation de lipides microscopiques dans les cellules musculaires qui bloquent les récepteurs de l'insuline."
  },

  // --- Forks Over Knives / La Santé Dans L'Assiette (YouTube) ---
  {
    id: "vid-fok-01",
    type: "video",
    videoType: "youtube",
    youtubeId: "EjTWFoqLy34",
    mediaUrl: "https://www.youtube.com/watch?v=EjTWFoqLy34",
    embedUrl: "https://www.youtube-nocookie.com/embed/EjTWFoqLy34",
    title: "La Santé Dans L'Assiette (Forks Over Knives)",
    source: "Forks Over Knives (1h36)",
    chapter: "Inversion de l'Athérosclérose et Dissolution des Plaques Artérielles",
    speaker: "Dr. Caldwell Esselstyn (Cleveland Clinic)",
    timeSeconds: 2100,
    timeFormatted: "35:00",
    badgeClass: "badge-warning",
    keywords: ["atherosclerose", "coeur", "arteres", "cholesterol", "dr esselstyn", "endothelium", "cleveland clinic"],
    topics: ["cardiovasculaire", "arteres", "nutrition"],
    excerpt: "Angiographies coronaires à l'appui : les patients atteints de maladie coronarienne sévère voient leurs artères se rouvrir et les plaques d'athérome se dissoudre grâce à l'adoption d'un régime végétal complet sans huile."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 OUVRAGES & GUIDES PDF (EXTRAITS & PAGES PRÉCISES)
  // ═══════════════════════════════════════════════════════════════════════════

  // --- Arnold Ehret : Système de Guérison du Régime Sans Mucus (Édition FR Intégrale) ---
  {
    id: "pdf-ehret-fr-ch01",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon I : Principes Généraux de Guérison",
    pageNumber: 6,
    badgeClass: "badge-success",
    keywords: ["arnold ehret", "principes", "lecon 1", "guerison", "nature", "vitalisme", "regime sans mucus", "bases"],
    topics: ["arnold-ehret", "regime-sans-mucus", "philosophie"],
    excerpt: "« La nature guérit par l'élimination des matières étrangères et des toxines. Chaque maladie n'est qu'un effort de l'organisme pour se débarrasser des déchets encombrants. »"
  },
  {
    id: "pdf-ehret-fr-ch02",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon II : Les Causes Latentes des Maladies & la Vraie Nature du Mucus",
    pageNumber: 9,
    badgeClass: "badge-success",
    keywords: ["mucus", "cause des maladies", "encrassement", "dechets", "lecon 2", "fermentation", "putrefaction"],
    topics: ["mucus", "arnold-ehret", "pathologie"],
    excerpt: "« Toute maladie, peu importe le nom que la science médicale lui attribue, est une obstruction par le mucus, un colmatage du système tubulaire humain par des matières alimentaires décomposées et non digérées. »"
  },
  {
    id: "pdf-ehret-fr-ch04",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon IV : La Formule Fondamentale de la Vie : V = P - O",
    pageNumber: 17,
    badgeClass: "badge-success",
    keywords: ["v=p-o", "formule de la vie", "vitalite", "puissance", "obstruction", "equation", "physiologie", "lecon 4"],
    topics: ["v-p-o", "arnold-ehret", "vitalisme"],
    excerpt: "« V = P - O (Vitalité = Puissance - Obstruction). Dès que l'obstruction O diminue vers zéro par le régime sans mucus et le jeûne rationnel, la vitalité V atteint son apogée sans avoir besoin de carburant supplémentaire. »"
  },
  {
    id: "pdf-ehret-fr-ch06",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon VI : L'Erreur Fondamentale de la Théorie des Protéines",
    pageNumber: 25,
    badgeClass: "badge-success",
    keywords: ["proteines", "albumine", "erreur medicale", "acide urique", "viande", "azote", "lecon 6", "reins"],
    topics: ["proteines", "arnold-ehret", "nutrition"],
    excerpt: "« L'obsession pour les protéines et l'albumine est l'erreur médicale la plus destructrice de tous les temps. Le corps humain n'a pas besoin de protéines complexes en grande quantité ; leur décomposition génère de l'acide urique et un mucus visqueux mortel. »"
  },
  {
    id: "pdf-ehret-fr-ch08",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon VIII : Aliments Producteurs de Mucus vs Aliments Sans Mucus",
    pageNumber: 33,
    badgeClass: "badge-success",
    keywords: ["tableau des aliments", "sans mucus", "producteurs de mucus", "fruits", "legumes verts", "farines", "produits laitiers", "lecon 8"],
    topics: ["classification", "aliments", "arnold-ehret"],
    excerpt: "Classification comparative : Tous les fruits mûrs, baies, raisins, figues et légumes à feuilles vertes sont 100% SANS MUCUS. Tous les produits animaux, œufs, laitages, farines blanches, riz et viandes sont de puissants générateurs de mucus et d'acide."
  },
  {
    id: "pdf-ehret-fr-ch10",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon X : La Conduite du Régime de Transition",
    pageNumber: 44,
    badgeClass: "badge-success",
    keywords: ["transition", "regime de transition", "menus", "elimination progressive", "prudence", "lecon 10"],
    topics: ["transition", "menus", "arnold-ehret"],
    excerpt: "« Ne passez jamais brutalement d'une alimentation standard à un régime 100% fruits. La dissolution du mucus serait trop rapide et submergerait la circulation sanguine. La transition progressive est le secret absolu du succès. »"
  },
  {
    id: "pdf-ehret-fr-ch14",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon XIV : Le Jeûne Court & ses Règles d'Or",
    pageNumber: 68,
    badgeClass: "badge-success",
    keywords: ["jeune court", "regles du jeune", "jeune intermittent", "lavement", "crise de foie", "lecon 14"],
    topics: ["jeune", "elimination", "arnold-ehret"],
    excerpt: "Règles d'or du jeûne selon Ehret : préférer des jeûnes courts répétés (24h à 3 jours) entrecoupés de repas de transition aux longs jeûnes épuisants non préparés. Toujours nettoyer le côlon par des lavements à l'eau tiède."
  },
  {
    id: "pdf-ehret-fr-ch17",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
    title: "Système de Guérison du Régime Sans Mucus (Édition Française)",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Leçon XVII : Le Pouvoir Dissolvant des Fruits Noirs & Raisins",
    pageNumber: 86,
    badgeClass: "badge-success",
    keywords: ["raisin", "cure uvale", "fruits noirs", "mures", "figues", "dissolution", "mucus", "lecon 17"],
    topics: ["fruits", "dissolution", "arnold-ehret"],
    excerpt: "La cure de raisins et le pouvoir des fruits noirs : les acides tartriques et maliques des raisins et cerises agissent comme de puissants solvants organiques capables de liquéfier les encroûtements de mucus les plus anciens."
  },

  // --- Arnold Ehret : Le Jeûne Rationnel ---
  {
    id: "pdf-ehret-fasting-01",
    type: "pdf",
    pdfUrl: "/pdfs/arnold-ehret-rational-fasting.pdf",
    title: "Le Jeûne Rationnel & Régénération Physiologique",
    author: "Prof. Arnold Ehret",
    chapterTitle: "Chapitre 2 : L'Autolyse & la Détoxification Interne",
    pageNumber: 18,
    badgeClass: "badge-success",
    keywords: ["jeune rationnel", "autolyse", "elimination", "foie", "reins", "repose digestif", "langue blanche"],
    topics: ["jeune", "arnold-ehret", "autolyse"],
    excerpt: "Durant le jeûne, l'organisme ne meurt pas de faim : il se nourrit de ses propres tissus malades, de ses kystes, de ses dépôts de graisse et de ses poches de mucus stagnantes par autolyse sélective."
  },

  // --- Dr. Robert Morse : The Detox Miracle Sourcebook ---
  {
    id: "pdf-morse-01",
    type: "pdf",
    pdfUrl: "/pdfs/robert-morse-detox-miracle-sourcebook.pdf",
    title: "Guide de Régénération & Détoxification Cellulaire",
    author: "Dr. Robert Morse, N.D.",
    chapterTitle: "Chapitre 3 : Le Grand Système Lymphatique (L'Égout du Corps)",
    pageNumber: 24,
    badgeClass: "badge-success",
    keywords: ["robert morse", "systeme lymphatique", "lymphe", "ganglions", "liquide interstitiel", "acidose", "egout"],
    topics: ["lymphe", "robert-morse", "acidose"],
    excerpt: "« La lymphe représente 80% des liquides du corps humain et constitue notre système d'assainissement interne. Quand les ganglions lymphatiques s'acidifient et se congestionnent, la stagnation cellulaire engendre les maladies chroniques. »"
  },
  {
    id: "pdf-morse-02",
    type: "pdf",
    pdfUrl: "/pdfs/robert-morse-detox-miracle-sourcebook.pdf",
    title: "Guide de Régénération & Détoxification Cellulaire",
    author: "Dr. Robert Morse, N.D.",
    chapterTitle: "Chapitre 5 : La Filtration Rénale & les Sédiments Urinaires",
    pageNumber: 52,
    badgeClass: "badge-success",
    keywords: ["reins", "filtration renale", "sediments", "urines", "nephrons", "robert morse", "elimination lymphatique"],
    topics: ["reins", "filtration", "robert-morse"],
    excerpt: "Comment vérifier la filtration rénale : l'urine matinale recueillie dans un bocal en verre doit impérativement présenter des flocons de sédiments blanchâtres (rejets lymphatiques). Sans filtration rénale, la détoxification ne peut pas aboutir."
  },
  {
    id: "pdf-morse-03",
    type: "pdf",
    pdfUrl: "/pdfs/robert-morse-detox-miracle-sourcebook.pdf",
    title: "Guide de Régénération & Détoxification Cellulaire",
    author: "Dr. Robert Morse, N.D.",
    chapterTitle: "Chapitre 8 : Le Pouvoir Électrique et Astringent des Fruits",
    pageNumber: 120,
    badgeClass: "badge-success",
    keywords: ["fruits", "astringence", "citron", "pasteque", "melons", "vitalite", "electrolytes", "robert morse"],
    topics: ["fruits", "astringence", "robert-morse"],
    excerpt: "Pourquoi les fruits sont supérieurs aux légumes pour la régénération : les fruits possèdent une vibration électromagnétique élevée et un pouvoir astringent qui contracte les tissus pour forcer la lymphe stagnante à circuler."
  },

  // --- David Wolfe : The Sunfood Diet Success System ---
  {
    id: "pdf-wolfe-01",
    type: "pdf",
    pdfUrl: "/pdfs/david-wolfe-sunfood-diet-success-system.pdf",
    title: "Le Système de Réussite de l'Alimentation Vivante",
    author: "David Wolfe",
    chapterTitle: "Chapitre 2 : La Biophotonique & la Lumière Solaire Végétale",
    pageNumber: 35,
    badgeClass: "badge-success",
    keywords: ["david wolfe", "biophotons", "lumiere solaire", "soleil", "chlorophylle", "energie vivante", "alimentation crue"],
    topics: ["biophotons", "david-wolfe", "soleil"],
    excerpt: "Les biophotons sont des quanta de lumière émis par les cellules des plantes vivantes non cuites. Consommer des aliments gorgés de soleil permet de recharger le champ bioénergétique humain."
  },

  // --- Dr. Sebi : Bio-Electric Cell Food Cleansing Guide ---
  {
    id: "pdf-sebi-guide-01",
    type: "pdf",
    pdfUrl: "/pdfs/dr-sebi-bio-electric-cell-food-cleansing-guide.pdf",
    title: "Guide de Nettoyage Cellulaire Bio-Électrique",
    author: "Dr. Sebi (Alfredo Bowman)",
    chapterTitle: "Section 1 : La Classification des Aliments Électriques Authentiques",
    pageNumber: 2,
    badgeClass: "badge-success",
    keywords: ["dr sebi", "liste des aliments", "aliments electriques", "pommes sauvages", "figues", "fonio", "teff", "graines de chanvre"],
    topics: ["dr-sebi", "aliments-electriques", "guide"],
    excerpt: "La liste officielle des aliments thérapeutiques du Dr. Sebi : Fonio, Teff, Quinoa sauvage, Mousse d'Irlande, Noix de coco fraîche, Pommes sauvages à pépins, Figues, et Concombres non hybridés."
  }
];

/**
 * Fast client-side full-text search with relevance ranking & fuzzy fallback
 */
export function searchMediaKnowledge(query, filter = 'all') {
  if (!query || !query.trim()) {
    return filterMediaByType(MEDIA_SEARCH_DATABASE, filter);
  }

  const cleanQuery = query.toLowerCase().trim();
  const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 0);

  const scored = [];

  for (const item of MEDIA_SEARCH_DATABASE) {
    if (filter !== 'all') {
      if (filter === 'videos' && item.type !== 'video') continue;
      if (filter === 'pdfs' && item.type !== 'pdf') continue;
    }

    let score = 0;
    const titleLower = (item.title || '').toLowerCase();
    const chapterLower = (item.chapter || item.chapterTitle || '').toLowerCase();
    const excerptLower = (item.excerpt || '').toLowerCase();
    const speakerLower = (item.speaker || item.author || '').toLowerCase();
    const keywordsLower = (item.keywords || []).map(k => k.toLowerCase()).join(' ');
    const topicsLower = (item.topics || []).map(t => t.toLowerCase()).join(' ');

    const fullText = `${titleLower} ${chapterLower} ${excerptLower} ${speakerLower} ${keywordsLower} ${topicsLower}`;

    // Exact query match boost
    if (chapterLower.includes(cleanQuery)) score += 50;
    if (titleLower.includes(cleanQuery)) score += 40;
    if (keywordsLower.includes(cleanQuery)) score += 35;
    if (excerptLower.includes(cleanQuery)) score += 30;

    // Token matches
    for (const token of tokens) {
      if (chapterLower.includes(token)) score += 15;
      if (keywordsLower.includes(token)) score += 12;
      if (excerptLower.includes(token)) score += 8;
      if (titleLower.includes(token)) score += 6;
      if (speakerLower.includes(token)) score += 5;
      if (topicsLower.includes(token)) score += 4;
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
  return items;
}
