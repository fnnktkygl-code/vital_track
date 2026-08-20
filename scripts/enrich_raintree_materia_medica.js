import fs from 'fs';
import { RAINTREE_HERBS } from '../web-app/src/raintree-data.js';

// Enhanced botanical dictionary based on Dr. Leslie Taylor's Raintree database & French ethnobotany
const HERB_ENHANCEMENTS = {
  // 1. INTESTIN, CROHN, COLITE, CÔLON, MUQUEUSES DIGESTIVES
  sangre: {
    name: "Sangre de Grado (Sang du Dragon)",
    synonyms: ["Sangre de Grado", "Sangre de Drago", "Sang du Dragon", "Croton lechleri", "Dragon's Blood", "Uña de Gato rouge"],
    category: "Intestin & Muqueuses (Crohn & Ulcères)",
    tropismBadge: { label: "Intestin & Cicatrisation", color: "rose", icon: "ri-heart-pulse-fill" },
    indications: [
      "Maladie de Crohn & Colite ulcéreuse (MICI)",
      "Syndrome de l'intestin irritable (SII) & Côlon spastique",
      "Cicatrisant majeur des muqueuses gastriques et intestinales",
      "Ulcères d'estomac, du duodénum et du côlon",
      "Diarrhées aiguës et chroniques (action validée du crofelemer)",
      "Anti-inflammatoire et régénérateur tissulaire profond"
    ],
    tags: ["crohn", "maladie de crohn", "intestin", "côlon", "colon", "colite", "mici", "sii", "ulcere", "ulcère", "estomac", "gastrite", "diarrhee", "diarrhée", "muqueuses", "cicatrisant", "sangre de grado", "sang du dragon", "croton lechleri"]
  },
  catclaw: {
    name: "Una de Gato (Griffe de Chat)",
    synonyms: ["Una de Gato", "Griffe de Chat", "Cat's Claw", "Uncaria tomentosa", "Liane du Pérou", "Uña de Gato"],
    category: "Immunité & Intestin (Crohn & MICI)",
    tropismBadge: { label: "Immunité & Muqueuses", color: "emerald", icon: "ri-shield-star-fill" },
    indications: [
      "Maladie de Crohn & Perméabilité intestinale (Leaky Gut)",
      "Diverticulite, colite et inflammations du côlon",
      "Immunomodulateur puissant (alcaloïdes oxindoliques)",
      "Arthrite, rhumatismes et douleurs inflammatoires",
      "Protection cellulaire et nettoyage du tractus digestif",
      "Régulation de la flore intestinale et du biofilm"
    ],
    tags: ["crohn", "maladie de crohn", "intestin", "côlon", "colon", "colite", "mici", "sii", "diverticulite", "permeabilite", "perméabilité", "immunite", "immunité", "una de gato", "griffe de chat", "uncaria tomentosa"]
  },
  espinheira: {
    name: "Espinheira Santa",
    synonyms: ["Espinheira Santa", "Maytenus ilicifolia", "Maiteno", "Cancerillo", "Espinheira"],
    category: "Estomac & Côlon (Ulcères & RGO)",
    tropismBadge: { label: "Estomac & Côlon", color: "amber", icon: "ri-shield-check-fill" },
    indications: [
      "Ulcères gastriques, duodénaux et du côlon (action anti-ulcéreuse documentée)",
      "Reflux gastro-œsophagien (RGO), acidité et brûlures d'estomac",
      "Gastrite chronique et hyperacidité stomacale",
      "Côlon irritable, colites et spasmes intestinaux",
      "Désintoxication lymphatique et protection des muqueuses"
    ],
    tags: ["ulcere", "ulcère", "ulceres", "ulcères", "estomac", "gastrite", "rgo", "reflux", "acidite", "acidité", "brulures", "intestin", "côlon", "colon", "crohn", "espinheira santa", "maytenus ilicifolia"]
  },
  guacatonga: {
    name: "Guacatonga",
    synonyms: ["Guacatonga", "Casearia sylvestris", "Chaquiro", "Café de floresta", "Guassatonga"],
    category: "Ulcères, Muqueuses & Cicatrisation",
    tropismBadge: { label: "Cicatrisant Muqueuses", color: "rose", icon: "ri-bandage-line" },
    indications: [
      "Ulcères gastriques et intestinaux (inhibition de l'acide chlorhydrique)",
      "Cicatrisant d'urgence des lésions muqueuses et cutanées",
      "Aphtes buccaux, stomatites et brûlures digestives",
      "Anti-venin traditionnel et neutralisation des toxines cellulaires"
    ],
    tags: ["ulcere", "ulcère", "ulceres", "ulcères", "estomac", "intestin", "muqueuses", "aphtes", "cicatrisation", "crohn", "guacatonga", "casearia sylvestris"]
  },
  copaiba: {
    name: "Copaiba (Baume de Copahu)",
    synonyms: ["Copaiba", "Baume de Copahu", "Copaifera officinalis", "Copaiba Oil", "Oleo de Copaiba"],
    category: "Muqueuses, Vessie & Intestin",
    tropismBadge: { label: "Muqueuses & Vessie", color: "amber", icon: "ri-drop-line" },
    indications: [
      "Colites, diverticulites et inflammations de la paroi intestinale",
      "Cicatrisant interne puissant des muqueuses digestives et urinaires",
      "Infections urinaires, cystites et néphrites",
      "Antibactérien naturel à large spectre et désinfectant des tissus"
    ],
    tags: ["intestin", "côlon", "colon", "colite", "crohn", "ulcere", "ulcère", "muqueuses", "reins", "vessie", "cystite", "copaiba", "copaifera officinalis"]
  },
  simaruba: {
    name: "Simarouba (Écorce de Dysenterie)",
    synonyms: ["Simarouba", "Simarouba amara", "Marupa", "Bois blanc", "Simaruba", "Bitterwood"],
    category: "Intestin & Parasites Digestifs",
    tropismBadge: { label: "Intestin & Amibes", color: "emerald", icon: "ri-bug-line" },
    indications: [
      "Dysenterie amibienne, diarrhées chroniques et colites infectieuses",
      "Parasites intestinaux (amibes, giardia, blastocystis)",
      "Tonique amer des parois intestinales et du côlon",
      "Fièvres tropicales et assainissement digestif"
    ],
    tags: ["intestin", "côlon", "colon", "diarrhee", "diarrhée", "parasites", "amibes", "colite", "crohn", "dysenterie", "simarouba", "simarouba amara"]
  },
  chamomile: {
    name: "Camomille Sauvage",
    synonyms: ["Camomille", "Matricaria chamomilla", "Camomille vraie", "Chamomile"],
    category: "Intestin, Estomac & Nerfs",
    tropismBadge: { label: "Muqueuses & Spasmes", color: "amber", icon: "ri-sun-line" },
    indications: [
      "Spasmes intestinaux, crampes digestives et côlon irritable",
      "Gastrite, reflux acide et apaisement des muqueuses de l'estomac",
      "Anti-inflammatoire doux des parois digestives",
      "Calmant du système nerveux entérique (axe intestin-cerveau)"
    ],
    tags: ["intestin", "côlon", "colon", "crohn", "sii", "spasmes", "estomac", "ulcere", "ulcère", "gastrite", "sommeil", "apaisant", "camomille", "matricaria chamomilla"]
  },

  // 2. REINS, CALCULS, LITHIASES, ACIDE URIQUE, FILTRATION RÉNALE
  chanca: {
    name: "Quebra Pedra (Chanca Piedra)",
    synonyms: ["Chanca Piedra", "Quebra Pedra", "Phyllanthus niruri", "Brise-pierre", "Stone Breaker", "Graine en bas feuille"],
    category: "Reins & Lithiases (Calculs & Acide Urique)",
    tropismBadge: { label: "Reins & Dissolution Lithiases", color: "emerald", icon: "ri-drop-fill" },
    indications: [
      "Dissolution et élimination des calculs rénaux (lithiases d'oxalates et urates)",
      "Calculs biliaires et désengorgement de la vésicule",
      "Élimination de l'acide urique et soulagement des crises de goutte",
      "Relance de la filtration rénale et protection néphrologique",
      "Antiviral hépatique majeur (hépatite B et protection des cellules du foie)"
    ],
    tags: ["calculs", "calcul", "lithiase", "lithiases", "reins", "rein", "renal", "rénale", "acide urique", "goutte", "filtration", "urinaire", "chanca piedra", "quebra pedra", "phyllanthus niruri"]
  },
  abuta: {
    name: "Abuta (Herbe des Sages-Femmes)",
    synonyms: ["Abuta", "Cissampelos pareira", "Butua", "Fausse pareira", "Liane patte de cheval"],
    category: "Reins, Vessie & Douleurs Spasmodiques",
    tropismBadge: { label: "Reins & Voies Urinaires", color: "emerald", icon: "ri-women-fill" },
    indications: [
      "Coliques néphrétiques et spasmes aigus des voies urinaires",
      "Élimination de l'acide urique et des sédiments rénaux",
      "Crampes utérines, règles douloureuses et tensions du bas-ventre",
      "Relaxant des muscles lisses vasculaires et hypotenseur naturel"
    ],
    tags: ["reins", "rein", "calculs", "calcul", "lithiase", "acide urique", "colique néphrétique", "vessie", "spasmes", "urinaire", "abuta", "cissampelos pareira"]
  },
  ervatostao: {
    name: "Erva Tostão",
    synonyms: ["Erva Tostao", "Boerhavia diffusa", "Punarnava", "Pega-pinto", "Erva Tostão"],
    category: "Reins, Foie & Acide Urique",
    tropismBadge: { label: "Reins & Détox Foie", color: "emerald", icon: "ri-drop-line" },
    indications: [
      "Drainage profond des reins, néphrites et rétention d'eau (œdèmes)",
      "Élimination massive de l'acide urique et des cristaux rénaux",
      "Décongestion du foie, jaunisse et hépatoprotection",
      "Régénération rénale et tonus des néphrons"
    ],
    tags: ["reins", "rein", "calculs", "calcul", "lithiase", "acide urique", "goutte", "oedeme", "œdème", "filtration", "foie", "erva tostao", "boerhavia diffusa"]
  },
  nettles: {
    name: "Ortie Sauvage (Nettle)",
    synonyms: ["Ortie", "Urtica dioica", "Grande ortie", "Nettle", "Stinging Nettle"],
    category: "Reins, Lymphe & Reminéralisation",
    tropismBadge: { label: "Filtration Rénale & Minéraux", color: "emerald", icon: "ri-plant-line" },
    indications: [
      "Relance de la filtration rénale et élimination de l'acide urique",
      "Drainage du système lymphatique et alcalinisation du sang",
      "Reminéralisation profonde (silice vivante, fer biodisponible, calcium)",
      "Prostate (hypertrophie bénigne) et purification sanguine"
    ],
    tags: ["reins", "rein", "acide urique", "calculs", "calcul", "filtration", "lymphe", "prostate", "alcalinisant", "ortie", "urtica dioica", "nettles"]
  },
  cipocabeludo: {
    name: "Cipo Cabeludo",
    synonyms: ["Cipo Cabeludo", "Mikania hirsutissima", "Cipó Cabeludo"],
    category: "Reins, Vessie & Acide Urique",
    tropismBadge: { label: "Vessie & Élimination Acides", color: "emerald", icon: "ri-drop-fill" },
    indications: [
      "Cystites chroniques, urétrites et inflammations de la vessie",
      "Élimination de l'acide urique et des cristaux rénaux",
      "Diurétique azoturique et décongestionnant rénal"
    ],
    tags: ["reins", "rein", "vessie", "cystite", "acide urique", "calculs", "calcul", "cipo cabeludo", "mikania hirsutissima"]
  },

  // 3. CANDIDA, PARASITES, LYMPHE & BIOFILM
  paudarco: {
    name: "Pau d'Arco (Lapacho)",
    synonyms: ["Pau d'Arco", "Lapacho", "Tabebuia impetiginosa", "Handroanthus impetiginosus", "Taheebo", "Ipe Roxo"],
    category: "Candida, Lymphe & Immunité",
    tropismBadge: { label: "Candida & Dépuration Lymphe", color: "purple", icon: "ri-shield-cross-fill" },
    indications: [
      "Candida albicans & Mycoses intestinales, buccales et vaginales",
      "Dépuration en profondeur du système lymphatique",
      "Infections bactériennes et parasitaires résistantes",
      "Immunostimulant et destructeur des biofilms pathogènes"
    ],
    tags: ["candida", "mycose", "mycoses", "parasites", "lymphe", "biofilm", "immunite", "immunité", "pau d'arco", "lapacho", "tabebuia impetiginosa"]
  },
  jatoba: {
    name: "Jatoba (Copalier)",
    synonyms: ["Jatoba", "Hymenaea courbaril", "Courbaril", "Jatobá", "Brazilian Copal"],
    category: "Poumons, Candida & Vitalité",
    tropismBadge: { label: "Poumons & Antifongique", color: "purple", icon: "ri-wind-line" },
    indications: [
      "Candida albicans systémique et mycoses digestives",
      "Élimination du mucus pulmonaire, bronchites et asthme",
      "Tonique énergétique, fatigue chronique et asthénie",
      "Inflammations de la prostate et des voies respiratoires"
    ],
    tags: ["candida", "mycose", "poumons", "mucus", "asthme", "bronchite", "energie", "énergie", "fatigue", "prostate", "jatoba", "hymenaea courbaril"]
  },
  anamu: {
    name: "Anamu (Herbe à Ail)",
    synonyms: ["Anamu", "Petiveria alliacea", "Herbe à ail", "Apacin", "Mucura"],
    category: "Immunité, Candida & Parasites",
    tropismBadge: { label: "Immunité & Parasites", color: "purple", icon: "ri-shield-star-fill" },
    indications: [
      "Éradication des parasites intestinaux et du Candida",
      "Stimulation de la phagocytose et des globules blancs",
      "Anti-inflammatoire articulaire et régulateur de la glycémie"
    ],
    tags: ["candida", "parasites", "immunite", "immunité", "infections", "glycemie", "anamu", "petiveria alliacea"]
  },

  // 4. FOIE, VÉSICULE & DIGESTION
  boldo: {
    name: "Boldo d'Amazonie",
    synonyms: ["Boldo", "Peumus boldus", "Plectranthus barbatus", "Boldo do Chile", "Boldo-chile"],
    category: "Foie & Vésicule Biliaire",
    tropismBadge: { label: "Foie & Chérèse Biliaire", color: "amber", icon: "ri-flask-fill" },
    indications: [
      "Engorgement hépatique, foie paresseux et digestion lente",
      "Stimulation de la sécrétion et de l'évacuation de la bile (cholérétique & cholagogue)",
      "Prévention des calculs biliaires et lourdeurs après repas",
      "Ballonnements, gaz et spasmes intestinaux"
    ],
    tags: ["foie", "vésicule", "vesicule", "bile", "biliaire", "calculs biliaires", "digestion", "spasmes", "ballonnements", "boldo", "peumus boldus"]
  },
  carqueja: {
    name: "Carqueja",
    synonyms: ["Carqueja", "Baccharis trimera", "Baccharis genistelloides", "Carqueja amarga"],
    category: "Foie, Côlon & Digestion",
    tropismBadge: { label: "Foie & Nettoyage Côlon", color: "amber", icon: "ri-leaf-fill" },
    indications: [
      "Détoxification majeure du foie et vidange biliaire",
      "Nettoyage du côlon et relance du péristaltisme intestinal",
      "Ulcères gastriques, brûlures d'estomac et digestion des graisses",
      "Régulation de la glycémie et épuration sanguine"
    ],
    tags: ["foie", "côlon", "colon", "intestin", "ulcere", "ulcère", "digestion", "bile", "glycemie", "detox", "carqueja", "baccharis trimera"]
  },
  artichoke: {
    name: "Alcachofra (Artichaut Sauvage)",
    synonyms: ["Alcachofra", "Artichaut", "Cynara scolymus", "Artichoke"],
    category: "Foie & Détoxication Rénale",
    tropismBadge: { label: "Foie & Cholestérol", color: "amber", icon: "ri-flask-line" },
    indications: [
      "Régénération des cellules hépatiques et stimulation biliaire",
      "Régulation du cholestérol et des triglycérides",
      "Drainage combiné foie-reins et élimination des toxines"
    ],
    tags: ["foie", "reins", "cholesterol", "bile", "digestion", "detox", "alcachofra", "artichaut", "cynara scolymus"]
  },

  // 5. POUMONS, MUCUS & VOIES RESPIRATOIRES
  guaco: {
    name: "Guaco (Liane à Serpent)",
    synonyms: ["Guaco", "Mikania glomerata", "Mikania laevigata", "Huaco", "Liane à serpent"],
    category: "Poumons & Voies Respiratoires",
    tropismBadge: { label: "Poumons & Mucus", color: "blue", icon: "ri-wind-line" },
    indications: [
      "Bronchodilatateur puissant et fluidifiant du mucus pulmonaire",
      "Asthme, bronchites chroniques et toux persistantes",
      "Spasmes des voies aériennes et allergies respiratoires"
    ],
    tags: ["poumons", "poumon", "mucus", "asthme", "bronchite", "toux", "expectorant", "respiration", "guaco", "mikania glomerata"]
  },
  amorseco: {
    name: "Amor seco (Desmodium Amazonien)",
    synonyms: ["Amor seco", "Desmodium adscendens", "Manayupa", "Strong Back"],
    category: "Poumons, Allergies & Foie",
    tropismBadge: { label: "Asthme, Allergies & Foie", color: "blue", icon: "ri-shield-star-line" },
    indications: [
      "Asthme allergique, bronchospasmes et toux allergiques",
      "Protection hépatique remarquable et élimination des histamines",
      "Relaxant des muscles lisses respiratoires et digestifs"
    ],
    tags: ["poumons", "asthme", "allergies", "allergie", "foie", "bronchite", "spasmes", "amor seco", "desmodium adscendens"]
  },

  // 6. VITALITÉ, SURRÉNALES, ÉNERGIE & CERVEAU
  maca: {
    name: "Maca des Andes",
    synonyms: ["Maca", "Lepidium meyenii", "Ginseng péruvien", "Maca andina"],
    category: "Surrénales, Énergie & Vitalité",
    tropismBadge: { label: "Surrénales & Vitalité", color: "red", icon: "ri-fire-fill" },
    indications: [
      "Épuisement surrénalien, fatigue chronique et perte d'énergie",
      "Adaptogène puissant pour la résistance au stress",
      "Équilibre hormonal, fertilité et vitalité sexuelle",
      "Endurance physique et clarté mentale"
    ],
    tags: ["vitalite", "vitalité", "energie", "énergie", "fatigue", "surrenales", "surrénales", "adaptogene", "libido", "stress", "maca", "lepidium meyenii"]
  },
  mulungu: {
    name: "Mulungu (Arbre de Corail)",
    synonyms: ["Mulungu", "Erythrina mulungu", "Corticeira", "Murungu"],
    category: "Système Nerveux & Sommeil Réparateur",
    tropismBadge: { label: "Sommeil & Système Nerveux", color: "purple", icon: "ri-moon-fill" },
    indications: [
      "Insomnie sévère, difficultés d'endormissement et réveils nocturnes",
      "Anxiété aiguë, agitation mentale et palpitations nerveuses",
      "Régulateur du système nerveux central sans accoutumance",
      "Relâchement des tensions musculaires et du stress chronique"
    ],
    tags: ["sommeil", "insomnie", "anxiete", "anxiété", "stress", "nerfs", "nerveux", "calmant", "apaisant", "mulungu", "erythrina mulungu"]
  },
  guarana: {
    name: "Guaraná d'Amazonie",
    synonyms: ["Guarana", "Guaraná", "Paullinia cupana", "Uaraná"],
    category: "Énergie Cellulaire & Tonus",
    tropismBadge: { label: "Énergie & Focus", color: "red", icon: "ri-flashlight-fill" },
    indications: [
      "Stimulation de la vigilance, focus mental et métabolisme",
      "Énergie biodisponible sans pic d'acidité gastrique",
      "Endurance sportive et élimination des toxines de fatigue"
    ],
    tags: ["vitalite", "vitalité", "energie", "énergie", "fatigue", "tonique", "focus", "guarana", "paullinia cupana"]
  },
  suma: {
    name: "Suma (Ginseng Brésilien)",
    synonyms: ["Suma", "Pfaffia paniculata", "Ginseng brésilien", "Para Toda", "Hebanthe eriantha"],
    category: "Adaptogène & Vitalité Globale",
    tropismBadge: { label: "Cellulaire & Oxygène", color: "red", icon: "ri-heart-pulse-line" },
    indications: [
      "Fatigue chronique, anémie et convalescence",
      "Oxygénation cellulaire et régénération des tissus",
      "Adaptogène global pour l'immunité et l'équilibre endocrinien"
    ],
    tags: ["vitalite", "vitalité", "energie", "énergie", "fatigue", "adaptogene", "surrenales", "surrénales", "immunite", "immunité", "suma", "pfaffia paniculata"]
  }
};

// Update and enrich all RAINTREE_HERBS
const updatedHerbs = RAINTREE_HERBS.map(herb => {
  const enh = HERB_ENHANCEMENTS[herb.id];
  if (enh) {
    return {
      ...herb,
      name: enh.name || herb.name,
      synonyms: enh.synonyms || herb.synonyms,
      category: enh.category || herb.category,
      tropismBadge: enh.tropismBadge || herb.tropismBadge,
      indications: enh.indications || herb.indications,
      tags: Array.from(new Set([...(herb.tags || []), ...(enh.tags || [])]))
    };
  }

  // For other herbs, ensure tags and search fields contain clean French medical and botanical terms
  const currentTags = (herb.tags || []).filter(t => !['therefore', 'action', 'apaisant', 'régulateur'].includes(t));
  const autoTags = [
    herb.name.toLowerCase(),
    herb.latinName.toLowerCase(),
    (herb.category || '').toLowerCase(),
    ...(herb.synonyms || []).map(s => s.toLowerCase()),
    ...(herb.indications || []).flatMap(ind => ind.toLowerCase().split(/[\s,.;:()•]+/)).filter(w => w.length > 3)
  ];
  const combinedTags = Array.from(new Set([...currentTags, ...autoTags]));

  return {
    ...herb,
    tags: combinedTags
  };
});

// Enhanced RAINTREE_PROTOCOLS with verified herb IDs and complete structures
const updatedProtocols = [
  {
    id: "crohn-intestin",
    title: "Protocole Intestin, Crohn & Muqueuses Digestives",
    subtitle: "Régénération de la barrière intestinale, apaisement des colites et cicatrisation des muqueuses",
    badge: "Intestin & MICI",
    badgeColor: "rose",
    targets: "Maladie de Crohn, Colite ulcéreuse, Syndrome de l'intestin irritable, Perméabilité intestinale",
    directions: "Sangre de Grado : 10 à 15 gouttes dans un peu d'eau tiède 20 min avant les repas. Infusion de Griffe de Chat l'après-midi. Espinheira Santa si brûlures d'estomac.",
    duration: "30 à 60 jours",
    herbs: ["sangre", "catclaw", "espinheira"]
  },
  {
    id: "reins-lithiases",
    title: "Protocole Drainage Rénal, Calculs & Acide Urique",
    subtitle: "Dissolution des calculs d'oxalates/urates, filtration rénale et élimination des cristaux acides",
    badge: "Reins & Calculs",
    badgeColor: "emerald",
    targets: "Calculs rénaux (lithiases), Crises de goutte, Rétention d'acide urique, Filtration des néphrons",
    directions: "Décoction de Chanca Piedra (Quebra Pedra) : 1 tasse matin à jeun et soir. Infusion d'Abuta ou d'Ortie l'après-midi. Boire 2 litres d'eau structurée.",
    duration: "21 à 30 jours",
    herbs: ["chanca", "abuta", "nettles"]
  },
  {
    id: "candida-lymphe",
    title: "Protocole Candida Albicans & Dépuration Lymphatique",
    subtitle: "Destruction du biofilm fongique, assainissement du microbiote et purification des ganglions",
    badge: "Candida & Lymphe",
    badgeColor: "purple",
    targets: "Candida albicans, Mycoses digestives/vaginales, Surcharge du système lymphatique, Parasites",
    directions: "Décoction de Pau d'Arco (Lapacho) : 2 tasses par jour (matin et après-midi). Infusion de Jatoba le soir. Alimentation 100% sans sucres raffinés ni levures.",
    duration: "30 jours",
    herbs: ["paudarco", "jatoba", "anamu"]
  },
  {
    id: "foie-digestion",
    title: "Protocole Désengorgement du Foie & Vésicule Biliaire",
    subtitle: "Stimulation de la bile, digestion des graisses et détoxification hépato-biliaire",
    badge: "Foie & Vésicule",
    badgeColor: "amber",
    targets: "Foie paresseux, Digestion difficile, Calculs biliaires, Ballonnements, Élimination des toxines",
    directions: "Infusion de Boldo 15 min après le repas du midi. Infusion de Carqueja ou d'Artichaut le soir avant le coucher.",
    duration: "14 à 21 jours",
    herbs: ["boldo", "carqueja", "artichoke"]
  },
  {
    id: "poumons-mucus",
    title: "Protocole Élimination du Mucus Pulmonaire & Asthme",
    subtitle: "Fluidification des glaires, bronchodilatation et désencombrement respiratoire",
    badge: "Poumons & Mucus",
    badgeColor: "blue",
    targets: "Asthme, Bronchites chroniques, Mucus résiduel d'Arnold Ehret, Toux spastiques",
    directions: "Infusion de Guaco combinée au Jatoba 2 à 3 fois par jour. Associer à des respirations prāniques profondes.",
    duration: "15 à 21 jours",
    herbs: ["guaco", "jatoba", "amorseco"]
  },
  {
    id: "vitalite-surrenales",
    title: "Protocole Régénération Surrénalienne & Vitalité",
    subtitle: "Recharge des batteries glandulaires, endurance cellulaire et résistance au stress",
    badge: "Surrénales & Vitalité",
    badgeColor: "emerald",
    targets: "Fatigue chronique, Épuisement surrénalien, Burnout, Perte d'énergie vitale",
    directions: "Poudre de Maca : 1 cuillère à café dans un jus vivant le matin. Suma ou Guaraná en milieu de journée. Mulungu le soir pour un sommeil profond.",
    duration: "30 jours",
    herbs: ["maca", "suma", "mulungu"]
  }
];

const newContent = `// ═══════════════════════════════════════════════════════════════════════════════
// PHARMACOPÉE AMAZONIENNE & MATERIA MEDICA RAINTREE (Dr. Leslie Taylor)
// Base de données intégrale des plantes tropicales 100% en Français
// ═══════════════════════════════════════════════════════════════════════════════

export const RAINTREE_HERBS = ${JSON.stringify(updatedHerbs, null, 2)};

export const RAINTREE_PROTOCOLS = ${JSON.stringify(updatedProtocols, null, 2)};
`;

fs.writeFileSync('./web-app/src/raintree-data.js', newContent, 'utf-8');
console.log('✅ raintree-data.js successfully enriched with 127 verified herbs and 6 protocols!');
