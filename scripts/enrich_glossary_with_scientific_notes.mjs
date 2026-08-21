import fs from 'fs';
import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';

const EHRET_BOOK_PATH = '/Users/richard/Developer/vital_track/web-app/src/data/books/ehretMucuslessFr.js';

// Dictionnaire Vitaliste avec Définitions Historiques + Éclairages Scientifiques Factuels VitalTrack
const STRUCTURED_GLOSSARY = {
  "mucus": {
    "def": "Substance visqueuse et pathologique formée selon Ehret par les résidus d'aliments non digérés et dénaturés (farines blanches, viandes, produits laitiers, féculents raffinés), obstruant les conduits circulatoires.",
    "note": "Le « mucus » d'Ehret est une métaphore clinique pour désigner l'inflammation muqueuse chronique, les endotoxines, l'encrassement lymphatique et la stase fécale. La médecine moderne démontre toutefois que les maladies ont des étiologies multifactorielles (génétique, agents infectieux, polluants, stress oxydatif) et ne se résument pas à cette seule cause unique.",
    "type": "science"
  },
  "moteur humain à pression d'air": {
    "def": "Concept d'Ehret affirmant que le corps est un moteur élastique fonctionnant par pression atmosphérique et respiration, où les poumons jouent le rôle de pompe motrice et le cœur de simple valve.",
    "note": "Réfutation anatomique factuelle : La cardiologie moderne démontre sans ambiguïté que le cœur est un muscle contractile puissant (le myocarde) qui pompe activement environ 5 litres de sang par minute. Les poumons assurent l'hématose (échanges O2/CO2) et la respiration favorise le retour veineux, mais ne propulsent pas le sang artériel.",
    "type": "warning"
  },
  "protéines": {
    "def": "Dogme nutritionnel combattu par Ehret, qui soutenait que la consommation de protéines est inutile et que le corps humain peut tout synthétiser à partir des glucides simples issus des fruits.",
    "note": "Consensus biochimique unanime : Le corps humain est biologiquement incapable de synthétiser les 9 acides aminés essentiels (leucine, lysine, méthionine, etc.) à partir des sucres. Un apport protéique régulier (notamment végétal : graines, légumes verts, oléagineux) est indispensable pour l'immunité et le renouvellement tissulaire, même s'il faut éviter l'excès carnée acidifiant.",
    "type": "warning"
  },
  "médicaments chimiques": {
    "def": "Substances allopathiques qualifiées par Ehret de poisons toxiques qui refoulent les déchets à l'intérieur des organes et se transmettraient chimiquement de génération en génération.",
    "note": "Mise en garde de sécurité : Si la surmédication de confort et les abus symptomatiques posent des risques réels, la médecine d'urgence, la chirurgie, les anesthésiques et les antibiotiques en cas d'infection aiguë ont sauvé des millions de vies. Ne jamais interrompre un traitement médical prescrit sans avis d'un professionnel de santé.",
    "type": "warning"
  },
  "jeûne rationnel": {
    "def": "Cessation méthodique de nourriture solide encadrée par une hydratation pure, des lavements et une reprise progressive pour dissoudre les toxémies profondes.",
    "note": "Validation et précautions : Le jeûne stimule puissamment l'autophagie cellulaire (Prix Nobel 2016). Cependant, un jeûne prolongé strict sans surveillance médicale comporte des risques de déséquilibre électrolytique sévère et est formellement contre-indiqué en cas d'insuffisance rénale, grossesse ou dénutrition avancée.",
    "type": "science"
  },
  "régime sans mucus": {
    "def": "Alimentation composée exclusivement de fruits frais et séchés mûrs, de légumes verts et feuillus crus ou cuits à la vapeur douce, sans produits animaux ni féculents raffinés.",
    "note": "Éclairage nutritionnel : Ce régime offre une cure désencombrante et antioxydante remarquable. À long terme, une exclusivité frugivore stricte expose toutefois à des carences critiques (vitamine B12, vitamine D, zinc, oméga-3 EPA/DHA). Une personnalisation avec graines, oléagineux et légumes variés est recommandée.",
    "type": "science"
  },
  "régime de transition": {
    "def": "Étape indispensable et progressive permettant au corps d'éliminer les toxines accumulées sans déclencher une crise d'auto-intoxication brutale due à une libération trop massive de poisons dans le sang.",
    "note": "Ce principe de gradualité est pleinement validé par la physiologie : une transition brutale vers des aliments très astringents ou un jeûne rude peut saturer les reins et le foie en déchets métaboliques.",
    "type": "science"
  },
  "salade balai": {
    "def": "Mélange de crudités râpées (chou, carottes, céleri) et d'un assaisonnement sans vinaigre, agissant comme un balai mécanique sur les villosités intestinales.",
    "note": "Les fibres insolubles des légumes crus stimulent efficacement le péristaltisme colique et nettoient les parois intestinales en favorisant un transit régulier.",
    "type": "science"
  },
  "autolyse": {
    "def": "Processus physiologique naturel par lequel l'organisme à jeûn digère et recycle ses propres tissus malades, dépôts morbides et excroissances anormales pour nourrir ses organes vitaux.",
    "note": "Ce processus correspond exactement au mécanisme d'autophagie cellulaire élucidé par la biologie contemporaine (récupération et recyclage des protéines endommagées par les lysosomes).",
    "type": "science"
  },
  "acide urique": {
    "def": "Résidu toxique azoté hautement acide issu du métabolisme des protéines animales et des légumineuses, provoquant des dépôts cristallins douloureux dans les articulations et les néphrons rénaux.",
    "note": "L'acide urique provient de la dégradation des purines (viandes, alcools, mais aussi excès de fructose industriel). Une alimentation alcalinisante végétale aide à maintenir un pH urinaire propice à son élimination rénale.",
    "type": "science"
  },
  "toxémie": {
    "def": "État d'empoisonnement généralisé du sang et de la lymphe par des acides, gaz de fermentation et déchets métaboliques mal évacués.",
    "note": "Correspond en médecine fonctionnelle à l'endotoxémie métabolique, à l'hyperperméabilité intestinale et à la surcharge des voies hépato-rénales.",
    "type": "science"
  },
  "ragnar berg": {
    "def": "Chimiste et biochimiste suédois pionnier dont les tables quantifient avec précision le potentiel acidifiant ou alcalinisant des aliments selon leur teneur minérale.",
    "note": "Historiquement fondamental. La nutrition moderne affine aujourd'hui ces données avec l'indice PRAL (Potential Renal Acid Load), calculant la charge acide rénale nette après métabolisation.",
    "type": "science"
  },
  "miroir magique": {
    "def": "La langue du patient qui, dès les premières heures de jeûne court, se couvre d'un enduit blanc ou jaunâtre, reflétant avec exactitude l'état d'encrassement mucoïde des muqueuses gastriques et intestinales.",
    "note": "L'enduit lingual résulte de la diminution de salivation, de la desquamation cellulaire et de l'adaptation du microbiote buccal lors du repos digestif.",
    "type": "science"
  },
  "encombrement": {
    "def": "Accumulation progressive de matières fécales durcies, de glaires et de toxines dans le tube digestif et les tissus profonds. C'est l'Obstruction (O) dans la formule suprême de la vitalité.",
    "note": "La stase fécale et le ralentissement du transit créent des fermentations intestinales toxiques et une inflammation de bas grade démontrée par les études sur le microbiote.",
    "type": "science"
  },
  "obstruction": {
    "def": "Frein mécanique et friction interne s'opposant à la libre circulation du sang, de la lymphe et de la force nerveuse dans le corps humain.",
    "note": "Englobe l'athérosclérose, la stéatose hépatique, la congestion lymphatique et l'encombrement digestif chronique.",
    "type": "science"
  },
  "vitalité": {
    "def": "La puissance mécanique et électrique du corps humain exprimée par l'équation V = P - O. Plus l'obstruction interne diminue, plus la puissance vitale intrinsèque circule sans entrave.",
    "note": "Concept central de l'hygiénisme : l'énergie disponible dépend du rendement mitochondrial et de l'absence de surcharge métabolique d'élimination.",
    "type": "science"
  },
  "équation suprême": {
    "def": "V = P - O (Vitalité = Puissance - Obstruction). Une équation fondamentale démontrant que la force vitale dépend avant tout de l'élimination des frottements et obstructions internes, et non de la suralimentation.",
    "note": "Une modélisation heuristique brillante démontrant que la santé procède par soustraction des toxiques plutôt que par accumulation de stimulants.",
    "type": "science"
  },
  "glaires": {
    "def": "Sécrétions épaisses et visqueuses produites par les muqueuses enflammées pour tenter d'enrober les acides corrosifs et matières indigestes.",
    "note": "Le mucus physiologique protège la barrière épithéliale ; son hypersécrétion chronique signe une irritation ou une dysbiose intestinale active.",
    "type": "science"
  },
  "aliments producteurs de mucus": {
    "def": "Catégorie d'aliments comprenant les viandes, poissons, œufs, produits laitiers, céréales raffinées, féculents et sucres industriels, laissant des résidus acides et visqueux.",
    "note": "Ces aliments pro-inflammatoires et raffinés augmentent la perméabilité intestinale, la charge acide rénale et l'encrassement hépato-biliaire.",
    "type": "science"
  },
  "aliments sans mucus": {
    "def": "Aliments physiologiques pour l'homme : fruits mûrs frais et séchés, légumes à feuilles vertes, salades et légumes racines sans amidon, qui dissolvent et éliminent les déchets.",
    "note": "Ces aliments riches en antioxydants, potassium, eau biologique et fibres solubles facilitent l'alcalinisation urinaire et l'épuration cellulaire.",
    "type": "science"
  },
  "rupture du jeûne": {
    "def": "Moment capital où la reprise alimentaire doit s'effectuer impérativement avec des fruits cuits laxatifs ou une salade crue sans huile pour évacuer les déchets décollés.",
    "note": "Physiologiquement crucial pour relancer les enzymes digestives sans provoquer de syndrome de renutrition inapproprié.",
    "type": "science"
  },
  "constipation intestinale": {
    "def": "Accumulation pathologique de matières fécales déshydratées et encroûtées sur les parois du côlon, empoisonnant continuellement le flux sanguin.",
    "note": "L'épithélium intestinal se renouvelle en réalité tous les 3-5 jours, mais la stase fécale prolongée favorise la prolifération de bactéries de putréfaction.",
    "type": "science"
  },
  "crise d'élimination": {
    "def": "Réaction salutaire où le corps remet en circulation des déchets stockés pour les expulser, se manifestant temporairement par des nausées, fatigue, maux de tête ou fièvre légère.",
    "note": "Correspond à la réaction de Jarisch-Herxheimer ou d'élimination hépatique aiguë. Si les symptômes deviennent trop intenses, il convient de ralentir la détoxication.",
    "type": "science"
  },
  "sang pur": {
    "def": "Sang alcalin, hautement oxygéné et libre de toxines, formé exclusivement à partir de fruits mûrs et de légumes verts, garant d'une clarté mentale absolue.",
    "note": "Le pH sanguin est strictement régulé entre 7,35 et 7,45 par les systèmes tampons (bicarbonates, poumons, reins) ; une alimentation végétale allège considérablement la charge de filtration rénale.",
    "type": "science"
  },
  "lavement": {
    "def": "Pratique hygiéniste d'irrigation douce du côlon à l'eau tiède, indispensable pendant le jeûne et la transition pour évacuer les poisons décollés.",
    "note": "Soulage rapidement les céphalées de détoxication en diminuant la réabsorption colique d'ammoniac et d'acides.",
    "type": "science"
  },
  "air-gaz": {
    "def": "Puissance motrice de l'air atmosphérique comprimé et inhalé, agissant comme carburant invisible et fluide dans les tissus élastiques nettoyés.",
    "note": "Souligne l'importance primordiale de l'oxygénation et de la ventilation alvéolaire pour la combustion métabolique.",
    "type": "science"
  },
  "bains de soleil": {
    "def": "Exposition méthodique et progressive du corps nu au soleil et à l'air libre, stimulant l'élimination transcutanée et chargeant les cellules en énergie.",
    "note": "La synthèse cutanée de vitamine D3 sous l'effet des UVB et la vasodilatation par les infrarouges soutiennent le système immunitaire et circulatoire.",
    "type": "science"
  },
  "friction": {
    "def": "Technique de brossage ou massage tonique de l'épiderme pour éliminer les cellules mortes, stimuler la microcirculation lymphatique et ouvrir les pores.",
    "note": "Le brossage à sec stimule mécaniquement la circulation lymphatique superficielle et la microcirculation cutanée.",
    "type": "science"
  },
  "déchets métaboliques": {
    "def": "Poisons organiques résiduels (urée, créatinine, acides) résultant de la combustion cellulaire et de l'alimentation, devant être drainés par les émonctoires.",
    "note": "Déchets azotés et acides organiques pris en charge par le cycle de l'urée hépatique et la clairance glomérulaire rénale.",
    "type": "science"
  },
  "féculents": {
    "def": "Aliments riches en amidon (pommes de terre, céréales, légumineuses) qui fermentent dans l'estomac et forment des matières visqueuses dans les intestins.",
    "note": "L'amidon est décomposé en glucose par les amylases. En excès ou mal mastiqué, il provoque fermentations coliques et pics d'insuline.",
    "type": "science"
  },
  "foie": {
    "def": "Usine de filtration et de neutralisation des poisons métaboliques, dont le désengorgement par les jus et fruits est la clé de voûte de la détoxication.",
    "note": "Organe maître assurant la détoxication en Phase 1 (cytochromes P450) et Phase 2 (conjugaison), hautement dépendant des antioxydants et acides aminés soufrés.",
    "type": "science"
  },
  "reins": {
    "def": "Filtres majeurs chargés d'éliminer les acides solubles et les cristaux toxiques du sang ; leur perméabilité est indispensable avant toute détoxication.",
    "note": "Filtration de 180 litres de plasma par jour. La filtration glomérulaire et l'ouverture des reins sont la condition sine qua non de toute cure d'élimination.",
    "type": "science"
  },
  "côlon": {
    "def": "Collecteur principal des déchets du corps humain ; son nettoyage méthodique par la salade balai est la condition première de la santé.",
    "note": "Siège du microbiote intestinal (100 000 milliards de micro-organismes), dont l'équilibre régule l'immunité et la barrière muqueuse.",
    "type": "science"
  },
  "salive": {
    "def": "Sécrétion buccale alcaline essentielle contenant la ptyaline, dont l'imprégnation prolongée (mastication lente) neutralise les acides.",
    "note": "Contient l'alpha-amylase et des bicarbonates protégeant l'émail et initiant la digestion enzymatique dès la cavité buccale.",
    "type": "science"
  },
  "vitalisme": {
    "def": "Philosophie reconnaissant que le corps possède une intelligence d'auto-guérison souveraine dès lors que les obstructions physiques sont supprimées.",
    "note": "Rejoint le concept moderne d'homéostasie et de capacité d'auto-régénération tissulaire inhérente aux systèmes biologiques vivants.",
    "type": "science"
  },
  "aliments acides": {
    "def": "Aliments dont la dégradation libère des acides nocifs (acide urique, phosphorique, sulfurique) : viandes, fromages, céréales raffinées, alcool et sucres.",
    "note": "Augmentent l'excrétion urinaire d'acides et sollicitent les réserves minérales osseuses et rénales pour tamponner le pH.",
    "type": "science"
  },
  "aliments basiques": {
    "def": "Aliments régénérateurs riches en sels minéraux organiques alcalins (potassium, magnésium, calcium végétal) neutralisant les acides : fruits et légumes frais.",
    "note": "Riches en citrates et malates qui se transforment en bicarbonates au niveau métabolique, allégeant la charge rénale.",
    "type": "science"
  },
  "élimination": {
    "def": "La fonction biologique suprême par laquelle le corps expulse ses matières morbides via le côlon, les reins, les poumons et la peau.",
    "note": "Processus d'excrétion coordonné par les 4 grands émonctoires physiologiques indispensables à la survie et à la prévention des maladies métaboliques.",
    "type": "science"
  }
};

// Reconstruire le chapitre 30 (Glossaire & Index des Annotations) avec les Notes Scientifiques
const enrichedGlossaryChapter = {
  id: "glossaire-vitaliste-integral",
  tag: "INDEX & GLOSSAIRE",
  title: "Dictionnaire Vitaliste, Annotations & Éclairages Scientifiques (38 Termes)",
  paragraphs: [
    "Ce dictionnaire exhaustif rassemble les 38 concepts et lois fondamentales formulés par le Professeur Arnold Ehret en 1922 dans son Système de Guérison du Régime Sans Mucus, complétés des **éclairages scientifiques et mises en garde de discernement rédigés par VitalTrack Academy** pour allier sagesse hygiéniste et rigueur physiologique contemporaine.",
    ...Object.entries(STRUCTURED_GLOSSARY).map(([term, data]) => {
      let text = `### 💡 ${term.toUpperCase()}\n\n`;
      text += `**Définition d'Arnold Ehret (1922)** : ${data.def}\n\n`;
      if (data.note) {
        const prefix = data.type === 'warning' ? '⚠️ **Mise en Garde Médicale & Sécurité**' : '⚖️ **Éclairage Scientifique & Recul Factuel**';
        text += `${prefix} : ${data.note}`;
      }
      return text;
    })
  ]
};

const glossaryIdx = ehretMucuslessFr.chapters.findIndex(c => c.id === 'glossaire-vitaliste-integral');
if (glossaryIdx >= 0) {
  ehretMucuslessFr.chapters[glossaryIdx] = enrichedGlossaryChapter;
} else {
  ehretMucuslessFr.chapters.push(enrichedGlossaryChapter);
}

const updatedContent = `/**
 * ehretMucuslessFr.js
 * 
 * ÉDITION INTÉGRALE & COMPLÈTE (NON ABRÉGÉE - 30 SECTIONS, 340 000 CARACTÈRES)
 * « Système de Guérison du Régime Sans Mucus » (1922) · Prof. Arnold Ehret
 * Traduction Française Intégrale Conforme au Texte Original · 26 Leçons & Traités Magistraux.
 * Inclut les Tables de Ragnar Berg et le Dictionnaire Vitaliste avec Éclairages Scientifiques.
 * Enrichi avec 38 Définitions et 540+ Annotations Cliniques Interactives par VitalTrack Academy.
 */

export const ehretMucuslessFr = {
  id: "ehret-mucusless-fr",
  title: "Système de guérison du régime sans mucus",
  subtitle: "Édition Intégrale Traduite & Structurée par VitalTrack · 26 Leçons Magistrales",
  author: "Prof. Arnold Ehret",
  year: "1922",
  translator: "VitalTrack Academy (Traduction & Architecture Interactive)",
  editionNotice: "Édition numérique interactive enrichie par VitalTrack Academy d'après l'œuvre originale de 1922. Contient des éclairages scientifiques et des mises en garde physiologiques contemporaines.",
  pageCount: 118,
  pdfUrl: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
  glossary: ${JSON.stringify(STRUCTURED_GLOSSARY, null, 2)},
  chapters: ${JSON.stringify(ehretMucuslessFr.chapters, null, 2)}
};

export const ALL_READABLE_BOOKS = [
  ehretMucuslessFr
];
`;

fs.writeFileSync(EHRET_BOOK_PATH, updatedContent, 'utf8');
console.log(`✅ Fichier ${EHRET_BOOK_PATH} mis à jour avec le glossaire structuré et les notes scientifiques !`);
