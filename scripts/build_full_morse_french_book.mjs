import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les 387 pages extraites
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_morse_pages.json'), 'utf8'));

console.log(`📖 Traitement de ${pages.length} pages pour reconstruire l'édition intégrale du Dr. Robert Morse...`);

// Concaténer tout le texte du livre à partir de la page 14 (début du contenu réel)
const fullBookPages = pages.filter(p => p.page >= 14);
const fullBookText = fullBookPages.map(p => p.text).join('\n\n');
console.log(`Total caractère extrait (pages 14-387) : ${fullBookText.length.toLocaleString()} caractères.`);

// Définitions précises des 87 sections pour le découpage
const SECTION_DEFS = [
  {
    id: "hommages-et-remerciements",
    tag: "PRÉFACE & HOMMAGES",
    title: "Hommages Historiques & Remerciements",
    match: /(?:Éloges pour|Toute ma reconnaissance va à mon cher ami le Dr Bernard Jensen)/i
  },
  {
    id: "introduction",
    tag: "INTRODUCTION",
    title: "Introduction : Bienvenue dans le Voyage vers la Vitalité",
    match: /^Introduction\b/im
  },
  {
    id: "pour-commencer-10-regles",
    tag: "GUIDE PRATIQUE",
    title: "Pour Commencer : Les 10 Clés de la Réussite",
    match: /(?:Pour commencer\s*[\n\r]*\s*10\s*trucs|10\s*trucs\s*pour\s*réussir|Pour\s*commencer\b)/i
  },
  {
    id: "chapitre-1-comprendre-notre-espece",
    tag: "CHAPITRE 1",
    title: "Comprendre Notre Espèce : L'Humain Frugivore & Anatomie Comparée",
    match: /^CHAPITRE UN\b/im
  },
  {
    id: "chapitre-2-fonctionnement-organisme",
    tag: "CHAPITRE 2",
    title: "Le Fonctionnement de Notre Organisme : Vue d'Ensemble",
    match: /^CHAPITRE DEUX\b/im
  },
  {
    id: "module-2-1-quatre-processus-base",
    tag: "MODULE 2.1",
    title: "Les Quatre Processus de Base : Digestion, Absorption, Utilisation, Élimination",
    match: /^MODULE 2\.1\b/im
  },
  {
    id: "module-2-2-systemes-de-notre-corps",
    tag: "MODULE 2.2",
    title: "Les Systèmes de Notre Corps : Structures et Fonctions",
    match: /^MODULE 2\.2\b/im
  },
  {
    id: "module-2-3-la-cellule",
    tag: "MODULE 2.3",
    title: "La Cellule : Usine Vivante, Respiration & Nutrition Cellulaire",
    match: /^MODULE 2\.3\b/im
  },
  {
    id: "module-2-4-les-tissus",
    tag: "MODULE 2.4",
    title: "Les Tissus : Épithélial, Conjonctif, Musculaire et Nerveux",
    match: /^MODULE 2\.4\b/im
  },
  {
    id: "module-2-5-systeme-cardiovasculaire-et-sang",
    tag: "MODULE 2.5",
    title: "Le Système Cardiovasculaire et le Sang",
    match: /^MODULE 2\.5\b/im
  },
  {
    id: "module-2-6-systeme-digestif",
    tag: "MODULE 2.6",
    title: "Le Système Digestif : De la Bouche à l'Intestin Grêle",
    match: /^MODULE 2\.6\b/im
  },
  {
    id: "module-2-7-systeme-elimination-lymphe",
    tag: "MODULE 2.7",
    title: "Le Système d'Élimination : La Lymphe (80% des fluides) et les 4 Émonctoires",
    match: /^MODULE 2\.7\b/im
  },
  {
    id: "module-2-8-systeme-glandulaire-endocrinien",
    tag: "MODULE 2.8",
    title: "Le Système Glandulaire Endocrinien : Surrénales, Thyroïde, Parathyroïdes, Hypophyse",
    match: /^MODULE 2\.8\b/im
  },
  {
    id: "module-2-9-systeme-musculaire",
    tag: "MODULE 2.9",
    title: "Le Système Musculaire et le Tissu Conjonctif",
    match: /^MODULE 2\.9\b/im
  },
  {
    id: "module-2-10-systeme-nerveux",
    tag: "MODULE 2.10",
    title: "Le Système Nerveux : Central (SNC) et Autonome (Sympathique/Parasympathique)",
    match: /^MODULE 2\.10\b/im
  },
  {
    id: "module-2-11-systeme-de-reproduction",
    tag: "MODULE 2.11",
    title: "Le Système de Reproduction : Prostate, Testicules, Ovaires et Utérus",
    match: /^MODULE 2\.11\b/im
  },
  {
    id: "module-2-12-systeme-respiratoire",
    tag: "MODULE 2.12",
    title: "Le Système Respiratoire : Poumons, Alvéoles et Échanges Gazeux",
    match: /^MODULE 2\.12\b/im
  },
  {
    id: "module-2-13-systeme-squelettique",
    tag: "MODULE 2.13",
    title: "Le Système Squelettique : Os, Moelle Osseuse et Régénération Minérale",
    match: /^MODULE 2\.13\b/im
  },
  {
    id: "chapitre-3-les-aliments-que-nous-mangeons",
    tag: "CHAPITRE 3",
    title: "Les Aliments que Nous Mangeons : L'Énergie Vivante",
    match: /^CHAPITRE TROIS\b/im
  },
  {
    id: "module-3-1-glucides-et-sucres",
    tag: "MODULE 3.1",
    title: "Les Glucides, les Sucres et Leur Métabolisme : Fructose vs Glucose",
    match: /^MODULE 3\.1\b/im
  },
  {
    id: "module-3-2-proteines-et-metabolisme",
    tag: "MODULE 3.2",
    title: "Les Protéines et Leur Métabolisme : Acides Aminés vs Structures Complexes",
    match: /^MODULE 3\.2\b/im
  },
  {
    id: "module-3-3-lipides-et-metabolisme",
    tag: "MODULE 3.3",
    title: "Les Lipides et Leur Métabolisme : Acides Gras Essentiels et Cholestérol",
    match: /^MODULE 3\.3\b/im
  },
  {
    id: "module-3-4-enzymes-biocatalyseurs",
    tag: "MODULE 3.4",
    title: "Les Enzymes : Les Biocatalyseurs de la Vie",
    match: /^MODULE 3\.4\b/im
  },
  {
    id: "module-3-5-vitamines-coenzymes",
    tag: "MODULE 3.5",
    title: "Les Vitamines (Coenzymes) : Pourquoi les Synthétiques Échouent",
    match: /^MODULE 3\.5\b/im
  },
  {
    id: "module-3-6-elements-essentiels-mineraux",
    tag: "MODULE 3.6",
    title: "Les Éléments Essentiels : Minéraux Majeurs, Oligo-Éléments et Sels de Schüssler",
    match: /^MODULE 3\.6\b/im
  },
  {
    id: "module-3-7-composes-phytochimiques",
    tag: "MODULE 3.7",
    title: "Les Composés Phytochimiques : Antioxydants et Astringents",
    match: /^MODULE 3\.7\b/im
  },
  {
    id: "module-3-8-ph-des-aliments",
    tag: "MODULE 3.8",
    title: "Le pH des Aliments : Acidité vs Alcalinité & Électrolytes",
    match: /^MODULE 3\.8\b/im
  },
  {
    id: "module-3-9-energie-des-aliments",
    tag: "MODULE 3.9",
    title: "L'Énergie des Aliments : Fréquences Électromagnétiques en Angströms",
    match: /^MODULE 3\.9\b/im
  },
  {
    id: "module-3-10-aliments-complets-et-vivants",
    tag: "MODULE 3.10",
    title: "Aliments Complets et Vivants : Pourquoi le Cuit Tue",
    match: /^MODULE 3\.10\b/im
  },
  {
    id: "chapitre-4-les-habitudes-toxiques",
    tag: "CHAPITRE 4",
    title: "Les Habitudes Toxiques : Démystification des Croyances Modernes",
    match: /^CHAPITRE Q\s*UATRE\b/im
  },
  {
    id: "module-4-1-probleme-du-lait-produits-laitiers",
    tag: "MODULE 4.1",
    title: "Le Problème du Lait et des Produits Laitiers : Mucus et Blocage Calcique",
    match: /^MODULE 4\.1\b/im
  },
  {
    id: "module-4-2-proteines-toute-la-verite",
    tag: "MODULE 4.2",
    title: "Les Protéines : Toute la Vérité sur le Mythe des Protéines",
    match: /^MODULE 4\.2\b/im
  },
  {
    id: "module-4-3-irritants-et-stimulants",
    tag: "MODULE 4.3",
    title: "Irritants et Stimulants : Café, Épices Brûlantes, Sucres et Alcool",
    match: /^MODULE 4\.3\b/im
  },
  {
    id: "module-4-4-vaccination-aiguilles-empoisonnees",
    tag: "MODULE 4.4",
    title: "Vaccination : Analyse Critique et Impact sur la Génétique Cellulaire",
    match: /^MODULE 4\.4\b/im
  },
  {
    id: "module-4-5-poisons-chimiques-et-medicaments",
    tag: "MODULE 4.5",
    title: "Poisons Chimiques : Environnement, Hygiène, Cosmétiques et Médicaments",
    match: /MODULE\s*4\s*[\.\,]\s*5\s*—\s*Poisons\s*chimiques/i
  },
  {
    id: "module-4-6-se-proteger-des-cancerigenes",
    tag: "MODULE 4.6",
    title: "Se Protéger des Cancérigènes : 14 Règles d'Hygiène Fondamentale",
    match: /^MODULE 4\.6\b/im
  },
  {
    id: "chapitre-5-nature-de-la-maladie",
    tag: "CHAPITRE 5",
    title: "La Nature de la Maladie : Acidose, Toxémie et Faiblesses Génétiques",
    match: /^CHAPITRE CINQ\b/im
  },
  {
    id: "module-5-1-trois-causes-premieres",
    tag: "MODULE 5.1",
    title: "Les Trois Causes Premières de la Maladie",
    match: /^MODULE 5\.1\b/im
  },
  {
    id: "module-5-2-parasites-amis-ou-ennemis",
    tag: "MODULE 5.2",
    title: "Les Parasites : Amis ou Ennemis ? Le Rôle des Éboueurs Naturels",
    match: /^MODULE 5\.2\b/im
  },
  {
    id: "module-5-3-pourquoi-le-cholesterol-fait-des-plaques",
    tag: "MODULE 5.3",
    title: "Pourquoi le Cholestérol et les Lipides Forment-ils des Plaques ?",
    match: /^MODULE 5\.3\b/im
  },
  {
    id: "module-5-4-surrenales-et-troubles-hormonaux",
    tag: "MODULE 5.4",
    title: "Faiblesse des Surrénales : Troubles Féminins et Masculins",
    match: /^MODULE 5\.4\b/im
  },
  {
    id: "module-5-5-le-cancer",
    tag: "MODULE 5.5",
    title: "Le Cancer : Comprendre l'Acidose Tissulaire et la Régénération",
    match: /^MODULE 5\.5\b/im
  },
  {
    id: "module-5-6-troubles-neurologiques",
    tag: "MODULE 5.6",
    title: "Troubles et Traumatismes Neurologiques : Sclérose, Parkinson et Lésions",
    match: /^MODULE 5\.6\b/im
  },
  {
    id: "module-5-7-le-diabete",
    tag: "MODULE 5.7",
    title: "Le Diabète (Types I et II) : Rôle du Pancréas et des Surrénales",
    match: /^MODULE 5\.7\b/im
  },
  {
    id: "module-5-8-perte-et-controle-de-poids",
    tag: "MODULE 5.8",
    title: "Perte et Contrôle de Poids : Traiter la Cause, Pas les Calories",
    match: /^MODULE 5\.8\b/im
  },
  {
    id: "module-5-9-la-peau-et-ses-troubles",
    tag: "MODULE 5.9",
    title: "La Peau et Ses Troubles : Le Troisième Rein",
    match: /^MODULE 5\.9\b/im
  },
  {
    id: "module-5-10-esprit-emotions-et-cellules",
    tag: "MODULE 5.10",
    title: "L'Esprit, les Émotions et les Cellules : L'Impact du Mental",
    match: /^MODULE 5\.10\b/im
  },
  {
    id: "module-5-11-le-langage-corporel",
    tag: "MODULE 5.11",
    title: "Le Langage Corporel : Que Tente de Vous Dire Votre Corps ?",
    match: /^MODULE 5\.11\b/im
  },
  {
    id: "module-5-12-questionnaire-de-sante",
    tag: "MODULE 5.12",
    title: "Questionnaire d'Auto-Évaluation de Santé et Bilan Émonctoriel",
    match: /^MODULE 5\.12\b/im
  },
  {
    id: "chapitre-6-eradiquer-la-maladie",
    tag: "CHAPITRE 6",
    title: "Éradiquer la Maladie par le Nettoyage et la Régénération Tissulaire",
    match: /^CHAPITRE SIX\b/im
  },
  {
    id: "module-6-1-naturopathie-et-science-detox",
    tag: "MODULE 6.1",
    title: "La Naturopathie et la Science de la Détoxification",
    match: /^MODULE 6\.1\b/im
  },
  {
    id: "module-6-2-obstructions-et-detoxification",
    tag: "MODULE 6.2",
    title: "Obstructions et Détoxification : Déboucher les Voies Énergétiques",
    match: /^MODULE 6\.2\b/im
  },
  {
    id: "module-6-3-comment-amener-le-corps-a-se-detoxifier",
    tag: "MODULE 6.3",
    title: "Comment Amener le Corps à se Détoxifier ?",
    match: /^MODULE 6\.3\b/im
  },
  {
    id: "module-6-4-aliments-alcalinisants-et-acidifiants",
    tag: "MODULE 6.4",
    title: "Aliments Alcalinisants et Acidifiants dans la Détoxification",
    match: /^MODULE 6\.4\b/im
  },
  {
    id: "module-6-5-a-quoi-s-attendre-pendant-la-detox",
    tag: "MODULE 6.5",
    title: "À Quoi s'Attendre Pendant la Détox : Les Symptômes d'Élimination",
    match: /^MODULE 6\.5\b/im
  },
  {
    id: "module-6-6-la-crise-de-guerison",
    tag: "MODULE 6.6",
    title: "La Crise de Guérison (Healing Crisis) : Légère, Modérée et Forte",
    match: /^MODULE 6\.6\b/im
  },
  {
    id: "module-6-7-le-jeune-et-la-detoxification",
    tag: "MODULE 6.7",
    title: "Le Jeûne et la Détoxification : Jeûne aux Fruits, aux Jus et à l'Eau",
    match: /^MODULE 6\.7\b/im
  },
  {
    id: "module-6-8-deux-grands-jeunes-aux-jus",
    tag: "MODULE 6.8",
    title: "Deux Grands Jeûnes aux Jus : La Cure de Raisin et la Cure de Citronnade",
    match: /^MODULE 6\.8\b/im
  },
  {
    id: "module-6-9-gestion-saine-des-intestins",
    tag: "MODULE 6.9",
    title: "Gestion Saine des Intestins : Formules Intestinales, Lavements et Colema Board",
    match: /^MODULE 6\.9\b/im
  },
  {
    id: "chapitre-7-la-vitalite-en-mangeant",
    tag: "CHAPITRE 7",
    title: "La Vitalité en Mangeant : Menus et Synergies Vivantes",
    match: /^CHAPITRE SEPT\b/im
  },
  {
    id: "module-7-1-quels-aliments-consommer",
    tag: "MODULE 7.1",
    title: "Quels Aliments Consommer ? Fruits, Légumes, Graines et Noix",
    match: /^MODULE 7\.1\b/im
  },
  {
    id: "module-7-2-grande-table-des-aliments-acides-alcalins",
    tag: "MODULE 7.2",
    title: "Tableau Exhaustif des Aliments Acides et Alcalins",
    match: /^MODULE 7\.2\b/im
  },
  {
    id: "module-7-3-combinaisons-alimentaires",
    tag: "MODULE 7.3",
    title: "Le Rôle Capital des Bonnes Combinaisons Alimentaires",
    match: /^MODULE 7\.3\b/im
  },
  {
    id: "module-7-4-menus-du-miracle-de-la-detox",
    tag: "MODULE 7.4",
    title: "Les Menus du Miracle de la Détox (Régime Arc-en-Ciel)",
    match: /^MODULE 7\.4\b/im
  },
  {
    id: "module-7-5-le-menu-vitalite-detox",
    tag: "MODULE 7.5",
    title: "Le Menu Vitalité Détox (Transition sur 4 Semaines)",
    match: /^MODULE 7\.5\b/im
  },
  {
    id: "module-7-6-le-menu-detox-pour-les-audacieux",
    tag: "MODULE 7.6",
    title: "Le Menu Détox pour les Audacieux : 100% Fruits Vivants",
    match: /^MODULE 7\.6\b/im
  },
  {
    id: "module-7-7-jus-de-fruits-et-legumes-crus",
    tag: "MODULE 7.7",
    title: "Jus de Fruits et Légumes Crus : Recettes Électrisantes",
    match: /^MODULE 7\.7\b/im
  },
  {
    id: "module-7-8-legumineuses-et-cereales",
    tag: "MODULE 7.8",
    title: "Légumineuses et Céréales : Le Mythe du Soja & Bienfaits des Graines Germées",
    match: /^MODULE 7\.8\b/im
  },
  {
    id: "module-7-9-recettes-vivantes-gourmandes",
    tag: "MODULE 7.9",
    title: "Recettes Vivantes et Savoureuses du Dr. Morse",
    match: /^MODULE 7\.9\b/im
  },
  {
    id: "chapitre-8-le-pouvoir-des-plantes",
    tag: "CHAPITRE 8",
    title: "Le Pouvoir des Plantes : La Pharmacopée Vivante Régénératrice",
    match: /^CHAPITRE HUIT\b/im
  },
  {
    id: "module-8-1-usages-traditionnels-des-plantes",
    tag: "MODULE 8.1",
    title: "Usages Communs et Traditionnels des Plantes Médicinales",
    match: /^MODULE 8\.1\b/im
  },
  {
    id: "module-8-2-monographies-des-super-plantes",
    tag: "MODULE 8.2",
    title: "Monographies Détaillées des 50 Super-Plantes du Dr. Morse",
    match: /^MODULE 8\.2\b/im
  },
  {
    id: "module-8-3-formules-de-plantes-puissantes",
    tag: "MODULE 8.3",
    title: "Formules de Plantes Magistrales par Système et Émonctoire",
    match: /^MODULE 8\.3\b/im
  },
  {
    id: "module-8-4-regeneration-par-les-plantes-pour-chaque-systeme",
    tag: "MODULE 8.4",
    title: "Régénération par les Plantes pour Chaque Système Organique",
    match: /^MODULE 8\.4\b/im
  },
  {
    id: "module-8-5-antibiotiques-vs-anti-parasitaires-naturels",
    tag: "MODULE 8.5",
    title: "Antibiotiques Pharmaceutiques vs Antiparasitaires et Astringents Naturels",
    match: /^MODULE 8\.5\b/im
  },
  {
    id: "chapitre-9-des-outils-pour-une-vie-saine",
    tag: "CHAPITRE 9",
    title: "Des Outils pour une Vie Saine",
    match: /^CHAPITRE NEUF\b/im
  },
  {
    id: "module-9-1-neuf-habitudes-saines",
    tag: "MODULE 9.1",
    title: "Les Neuf Habitudes Saines du Quotidien",
    match: /^MODULE 9\.1\b/im
  },
  {
    id: "module-9-2-quatre-outils-therapeutiques-majeurs",
    tag: "MODULE 9.2",
    title: "Quatre Outils Thérapeutiques Majeurs (Purge du Foie, Eau Distillée, Cataplasmes, Enveloppement Froid)",
    match: /^MODULE 9\.2\b/im
  },
  {
    id: "chapitre-10-sante-et-spiritualite",
    tag: "CHAPITRE 10",
    title: "Santé et Spiritualité : L'Anatomie de la Création et des Corps Subtils",
    match: /^CHAPITRE DIX\b/im
  },
  {
    id: "annexe-a-temperature-basale-de-barnes",
    tag: "ANNEXE A",
    title: "Protocole Clinique de Température Basale pour la Fonction Thyroïdienne",
    match: /^ANNEXE A\b/im
  },
  {
    id: "annexe-b-famille-des-sciences-naturelles",
    tag: "ANNEXE B",
    title: "La Famille des Sciences Naturelles (Acupuncture, Iridologie, Naturopathie)",
    match: /^ANNEXE B\b/im
  },
  {
    id: "annexe-c-guide-des-ressources",
    tag: "ANNEXE C",
    title: "Guide des Ressources & Équipements de Santé Naturelle",
    match: /^ANNEXE C\b/im
  },
  {
    id: "annexe-d-analyses-de-sang-decodees",
    tag: "ANNEXE D",
    title: "Tout Savoir sur les Analyses de Sang : Décryptage Hygiéniste",
    match: /^ANNEXE D\b/im
  },
  {
    id: "annexe-e-analyse-minerale-tma-cheveux",
    tag: "ANNEXE E",
    title: "Analyse Minérale Tissulaire des Cheveux (TMA)",
    match: /^ANNEXE E\b/im
  },
  {
    id: "annexe-f-poids-et-mesures-conversions",
    tag: "ANNEXE F",
    title: "Poids, Mesures et Tables de Conversion",
    match: /^ANNEXE F\b/im
  },
  {
    id: "annexe-g-glossaire-vitaliste-exhaustif",
    tag: "ANNEXE G",
    title: "Dictionnaire & Glossaire Vitaliste Sourcé avec Références Académiques",
    match: /^ANNEXE G\b/im
  },
  {
    id: "annexe-h-prefixes-et-suffixes-medicaux",
    tag: "ANNEXE H",
    title: "Guide des Préfixes et Suffixes Médicaux Décodés",
    match: /^ANNEXE H\b/im
  }
];



// Trouver les positions de chaque section dans le texte intégral
const sectionPositions = [];
for (let sec of SECTION_DEFS) {
  const match = fullBookText.search(sec.match);
  if (match !== -1) {
    sectionPositions.push({ ...sec, pos: match });
  } else {
    console.warn(`⚠️ Section non trouvée directement par regex : ${sec.tag} - ${sec.title}`);
  }
}

// Trier par position croissante
sectionPositions.sort((a, b) => a.pos - b.pos);
console.log(`Sections repérées dans le texte : ${sectionPositions.length} / ${SECTION_DEFS.length}`);

// Dictionnaire exhaustif des tableaux, organigrammes et diagrammes structurés en Markdown
const SECTION_TABLES = {
  "chapitre-1-comprendre-notre-espece": [
    "### TABLEAU COMPARATIF D'ANATOMIE ET PHYSIOLOGIE DES VERTÉBRÉS",
    "| Caractéristique Anatomique | Carnivores Purs (Félins, Loup) | Omnivores (Ours, Porc, Chiens) | Herbivores (Vache, Cheval, Mouton) | Humain Frugivore (Homo Sapiens, Primates) |\n| :--- | :--- | :--- | :--- | :--- |\n| **Membres & Mains** | Griffes acérées pour déchirer la chair | Griffes, sabots ou coussinets | Sabots plats pour pâturer | Mains préhensiles à doigts agiles pour cueillir les fruits |\n| **Dents & Mâchoire** | Canines pointues, molaires tranchantes, mâchoire verticale | Canines/défenses et molaires plates | 24 molaires plates broyeuses, 8 incisives coupantes | Dents égales, incisives coupantes, molaires plates broyeuses |\n| **Salive & Déglutition** | Acide, pas de {{ptyaline}} (avale sans mâcher) | Peu active, digestion enzymatique faible | Fortement alcaline, imprégnation lente | Fortement alcaline, riche en {{ptyaline}} (amylase salivaire) |\n| **Estomac** | Petit, sphérique, acidité gastrique très forte (HCl pH 1-2) | Acidité gastrique modérée | Oblong, complexe (3-4 poches), acidité faible | Oblong avec duodénum, acidité modérée (pH 4-5 au repos) |\n| **Intestin Grêle** | Court (3x longueur du tronc), parois lisses | Moyen (10x longueur du tronc) | Très long (20-30x longueur du tronc) | Long et plissé (10-12x longueur du tronc) pour absorption |\n| **Côlon & Évacuation** | Court, lisse, évacuation rapide des chairs putrescibles | Modérément long, absorption minimale | Long, sacculaire et annelé | Long, sacculaire (bosselures) pour absorber l'eau vitale |\n| **Foie & Métabolisme** | Foie massif (50% plus grand), bile très abondante | Foie volumineux, élimination de l'acide urique | Foie semblable à l'homme | Foie moyen, incapable d'éliminer de grandes quantités d'acide urique |\n| **Reins & Urine** | Urine très acide, élimination massive d'urée/acides | Urine acide | Urine alcaline | Urine alcaline/neutre (devient acide en cas de toxémie) |\n| **Peau & Transpiration** | Glandes sudoripares uniquement sur coussinets (halète) | Glandes sudoripares minimales | Millions de pores sudoripares | Millions de pores sudoripares pour l'élimination transcutanée |"
  ],
  "module-2-1-quatre-processus-base": [
    "### ORGANIGRAMME DES QUATRE PROCESSUS DE BASE DE LA VIE CELLULAIRE",
    "```\n┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐\n│  1. DIGESTION   │ ────► │  2. ABSORPTION  │ ────► │ 3. UTILISATION  │ ────► │ 4. ÉLIMINATION  │\n│ (Bouche/Estomac)│       │ (Intestin Grêle)│       │ (Cellule / ATP) │       │ (Lymphe & Reins)│\n└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘\n```",
    "| Processus Vital | Description Physiologique | Organes et Éléments Impliqués | Conséquence Clinique du Dysfonctionnement |\n| :--- | :--- | :--- | :--- |\n| **1. Digestion** | Décomposition mécanique et chimique des aliments en éléments simples | Dents, salive, estomac, sucs pancréatiques, bile | Fermentations acides, putréfactions, gaz, lourdeurs digestives |\n| **2. Absorption** | Passage des micronutriments à travers la membrane des villosités intestinales | Paroi de l'intestin grêle, capillaires sanguins, chylifères lymphatiques | Carences nutritionnelles, atrophie cellulaire, plaque mucoïde |\n| **3. Utilisation** | Respiration cellulaire, synthèse d'énergie (ATP) et reconstruction tissulaire | Cellules, cytoplasme, mitochondries, hormones endocriniennes | Épuisement chronique, dysfonction métabolique, dégénérescence |\n| **4. Élimination** | Drainage et expulsion des acides résiduels et toxines cellulaires hors du corps | Système lymphatique, reins, côlon, peau (3e rein), poumons | Acidose systémique, kystes, tumeurs, calcifications, mort cellulaire |"
  ],
  "module-2-2-systemes-de-notre-corps": [
    "### TABLEAU SYNTHÉTIQUE DES 9 GRANDS SYSTÈMES DU CORPS HUMAIN",
    "| Système Anatomique | Structures et Organes Clés | Rôle Physiologique Majeur | Impact Thérapeutique de la Détoxification |\n| :--- | :--- | :--- | :--- |\n| **1. Système Cardiovasculaire** | Cœur, artères, veines, capillaires, sang | Distribution de l'oxygène et des nutriments aux cellules | Fluidification sanguine, normalisation de la tension artérielle |\n| **2. Système Digestif** | Bouche, estomac, foie, vésicule, intestin grêle, côlon | Décomposition, digestion et assimilation des aliments vivants | Nettoyage des parois intestinales, arrêt des fermentations toxiques |\n| **3. Système d'Élimination & Lymphe** | Lymphe (80%), ganglions, rate, reins, peau, poumons | Drainage et excrétion de tous les acides métaboliques du corps | Désengorgement ganglionnaire, filtration rénale massive des déchets |\n| **4. Système Endocrinien** | Hypophyse, thyroïde, parathyroïdes, surrénales, pancréas | Régulation hormonale, métabolisme basal, gestion du stress | Relance de la production de stéroïdes naturels et d'énergie |\n| **5. Système Musculaire** | Muscles squelettiques, lisses, myocarde, fascias | Mouvement, circulation, propulsion lymphatique et digestive | Soulagement des crampes, élimination des dépôts d'acide lactique |\n| **6. Système Nerveux** | Cerveau, cervelet, moelle épinière, nerfs autonomes | Contrôle conscient et involontaire de toutes les fonctions | Rétablissement de la conduction synaptique et du calme mental |\n| **7. Système Reproducteur** | Ovaires, utérus, trompes / Testicules, prostate | Reproduction, vitalité sexuelle, production hormonale | Dissolution des kystes, fibromes et décongestion prostatique |\n| **8. Système Respiratoire** | Nez, trachée, bronches, alvéoles pulmonaires | Hématose (oxygénation du sang) et élimination du CO2 et mucus | Évacuation des mucosités pulmonaires et clarté respiratoire |\n| **9. Système Squelettique** | Os, cartilages, articulations, moelle osseuse | Charpente, protection des organes, réservoir de minéraux | Reminéralisation osseuse, soulagement de l'arthrose et de l'arthrite |"
  ],
  "module-2-3-la-cellule": [
    "### TABLEAU COMPARATIF DES DEUX MODES DE DIVISION CELLULAIRE",
    "| Critère Biologique | Mitose (Cellules Somatiques) | Méiose (Cellules Reproductrices / Gamètes) |\n| :--- | :--- | :--- |\n| **Cellules Concernées** | Toutes les cellules du corps (peau, organes, tissus, os) | Cellules germinales (ovules chez la femme, spermatozoïdes chez l'homme) |\n| **Nombre de Cellules-Filles** | 2 cellules-filles génétiquement identiques | 4 cellules-filles génétiquement distinctes (recombinaison génétique) |\n| **Nombre de Chromosomes** | Diploïde (2n = 46 chromosomes chez l'humain) | Haploïde (n = 23 chromosomes chez l'humain) |\n| **Fonction Principale** | Croissance, réparation et régénération cellulaire des tissus | Reproduction sexuée et transmission du patrimoine génétique |\n| **Impact de l'Acidose Tissulaire** | Mutations cellulaires, division anarchique (tumeurs/cancers) | Altération de la fertilité, faiblesses génétiques congénitales |"
  ],
  "module-2-4-les-tissus": [
    "### TABLEAU DES QUATRE TISSUS PRIMAIRES DU CORPS HUMAIN",
    "| Tissu Primaire | Types de Cellules & Localisation | Fonction Physiologique Essentielle | Vulnérabilité Face à l'Acidose |\n| :--- | :--- | :--- | :--- |\n| **1. Tissu Épithélial** | Épiderme de la peau, parois des muqueuses (estomac, intestin, vessie) | Barrière protectrice, absorption des nutriments, sécrétion | Ulcères, brûlures, dermatoses, polypes, desquamations |\n| **2. Tissu Conjonctif** | Os, cartilages, tendons, ligaments, fascias, tissu adipeux, sang | Soutien structural, cohésion des organes, réserve d'énergie | Arthrose, hernies, varices, perte de collagène, ostéoporose |\n| **3. Tissu Musculaire** | Fibres musculaires squelettiques, myocarde cardiaque, muscles lisses | Contraction mécanique, pompage du sang, péristaltisme | Crampes, spasmes, atrophie musculaire, insuffisance cardiaque |\n| **4. Tissu Nerveux** | Neurones, cellules gliales, axones, gaines de myéline | Transmission rapide de l'influx électrique et coordination | Sclérose, névralgies, engourdissements, tremblements |"
  ],
  "module-2-5-systeme-cardiovasculaire-et-sang": [
    "### TABLEAU DES FLUIDES DES ESPÈCES ALCALINES ET EFFETS DE L'ACIDOSE",
    "| Fluide Corporel | Nature Physiologique Normale | Effets Dévastateurs de l'Acidose Tissulaire |\n| :--- | :--- | :--- |\n| **Salive** | Alcaline | Aphtes, gingivites, herpès buccal, déminéralisation dentaire |\n| **Urine** | Alcaline / Neutre | Infections urinaires, cystites récidivantes, calculs rénaux, cancer des reins ou de la vessie |\n| **Sucs Gastriques** | Acides (HCl concentré) | Ulcères gastriques, gastrites chroniques, reflux gastro-œsophagien, cancer de l'estomac |\n| **Sucs Intestinaux** | Alcalins | Ulcères, entérites, colites ulcéreuses, polypes intestinaux, cancer des intestins |\n| **Sang Artériel** | Alcalin (pH 7,35 - 7,45) | {{Acidose}} métabolique systémique, choc, coma, mort |"
  ],
  "module-2-6-systeme-digestif": [
    "### TABLEAU CHRONOLOGIQUE DU TRACTUS DIGESTIF ET DES SÉCRÉTIONS ENZYMATIQUES",
    "| Organe Digestif | Sécrétions & Enzymes Clés | Milieu Chimique (pH) | Rôle Métabolique dans la Digestion Vivante |\n| :--- | :--- | :--- | :--- |\n| **Bouche & Dents** | Salive, Amylase salivaire ({{ptyaline}}) | Alcalin / Neutre (pH 6,8 - 7,2) | Broyage mécanique, prédigestion enzymatique des amidons naturels |\n| **Estomac** | Sucs gastriques, Acide chlorhydrique (HCl), Pepsine | Fortement Acide (pH 1,5 - 2,5) | Dénaturation des protéines, stérilisation antibactérienne du bol |\n| **Duodénum** | Sucs pancréatiques (Bicarbonates, Amylase, Lipase), Bile | Alcalin (pH 7,8 - 8,5) | Neutralisation de l'acidité gastrique, émulsion des corps gras |\n| **Intestin Grêle (Jéjunum/Iléon)** | Enzymes intestinales (Maltase, Peptidases), Villosités | Alcalin (pH 7,5 - 8,0) | Absorption des sucres simples (fructose), acides aminés, vitamines |\n| **Gros Intestin (Côlon)** | Mucus lubrifiant, Microbiote symbiotique | Neutre à légèrement acide (pH 6,5 - 7,0) | Réabsorption de l'eau vitale et des minéraux, expulsion des fèces |"
  ],
  "module-2-7-systeme-elimination-lymphe": [
    "### ORGANIGRAMME DES SYSTÈMES D'ÉLIMINATION ET D'IMMUNITÉ",
    "```\n┌────────────────────────────────────────────────────────────────────────┐\n│                     SYSTÈMES D'ÉLIMINATION CORPORELS                   │\n└───────────────────────────────────┬────────────────────────────────────┘\n                                    │\n                    ┌───────────────┴───────────────┐\n                    ▼                               ▼\n      ┌───────────────────────────┐   ◄───►   ┌───────────────────────────┐\n      │    SYSTÈME LYMPHATIQUE    │           │    SYSTÈME IMMUNITAIRE    │\n      │ (80% des fluides du corps)│           │ (Globules Blancs & Nœuds) │\n      └─────────────┬─────────────┘           └─────────────┬─────────────┘\n                    │                                       │\n      ┌─────────────┴───────────────────────────────────────┴─────────────┐\n      │                                                                   │\n      ▼                         ▼                   ▼                     ▼\n┌──────────────┐      ┌──────────────────┐    ┌───────────┐        ┌─────────────┐\n│     PEAU     │      │      CÔLON       │    │   REINS   │        │   POUMONS   │\n│(3e grand     │      │(Évacuation fécale│    │ (Filtres  │        │ (Échanges   │\n│ rein du corps│      │  et des toxines) │    │  maîtres) │        │  gazeux &   │\n│ sueur/pores) │      │                  │    │           │        │  mucosités) │\n└──────────────┘      └──────────────────┘    └───────────┘        └─────────────┘\n```",
    "### TABLEAU DES PRINCIPAUX ANTICORPS OU IMMUNOGLOBULINES",
    "| Type d'Anticorps | Proportion Globale | Localisation Principale dans l'Organisme | Fonctions Physiologiques & Défense Immunitaire |\n| :--- | :--- | :--- | :--- |\n| **IgG (Immunoglobuline G)** | **80 %** | Sérum sanguin, liquide lymphatique, tissus | Désactive et lie les antigènes étrangers, active le système du complément, traverse le placenta |\n| **IgA (Immunoglobuline A)** | **15 %** | Muqueuses, salive, larmes, sécrétions digestives et respiratoires | Première ligne de défense mucosale contre les bactéries et virus à l'entrée des émonctoires |\n| **IgM (Immunoglobuline M)** | **5 %** | Sang et lymphe interstitielle | Réponse immunitaire primaire rapide lors des infections aiguës, puissant agglutinant d'antigènes |\n| **IgD (Immunoglobuline D)** | **0,2 %** | Surface des lymphocytes B matures | Récepteur membranaire d'activation et de différenciation des cellules productrices d'anticorps |\n| **IgE (Immunoglobuline E)** | **0,002 %** | Peau, muqueuses, mastocytes et basophiles | Déclencheur des réactions allergiques et de la libération d'histamine, défense antiparasitaire |"
  ],
  "module-2-8-systeme-glandulaire-endocrinien": [
    "### TABLEAU EXHAUSTIF DES GLANDES ENDOCRINES, HORMONES ET FONCTIONS CLINIQUES",
    "| Glande Endocrine | Hormones Clés Produites | Fonctions Physiologiques Majeures | Signes d'Hypo-activité / Acidose Tissulaire |\n| :--- | :--- | :--- | :--- |\n| **Hypophyse Antérieure** | GH (Croissance), TSH, ACTH, FSH, LH, Prolactine | Contrôle central de la croissance et commande des glandes cibles | Retard de croissance, hypothyroïdie secondaire, aménorrhée |\n| **Hypophyse Postérieure** | ADH (Vasopressine), Ocytocine | Réabsorption rénale de l'eau, contraction utérine, éjection du lait | Diabète insipide, déshydratation, inertie utérine |\n| **Glande Pinéale (Épiphyse)** | Mélatonine | Régulation du rythme circadien (sommeil/veille), glande spirituelle | Insomnies chroniques, décalage hormonal, dépression saisonnière |\n| **Glande Thyroïde** | Thyroxine (T4), Triiodothyronine (T3), Calcitonine | Vitesse du métabolisme basal cellulaire, production de chaleur corporelle | Frilosité, fatigue chronique, prise de poids, constipation, peau sèche |\n| **Glandes Parathyroïdes** | Parathormone (PTH) | Régulation et fixation biologique du calcium et du magnésium | Spasmes, crampes, ongles striés/cassants, ostéoporose, varices, hernies |\n| **Thymus** | Thymosines, Peptides thymiques | Maturation et programmation des lymphocytes T immunitaires | Vulnérabilité aux infections virales récidivantes, baisse de vitalité |\n| **Cortex Surrénalien** | Cortisol (Glucocorticoïde), Aldostérone (Minéralocorticoïde), DHEA | Anti-inflammatoire naturel suprême, régulation de la tension, sucres | Hypotension (< 11,8), fatigue profonde, anxiété, inflammation généralisée |\n| **Médulla Surrénalienne** | Adrénaline (Épinéphrine), Noradrénaline | Réaction d'urgence 'combat ou fuite', neurotransmission sympathique | Manque d'énergie nerveuse, épuisement adaptatif, syncopes |\n| **Pancréas (Îlots de Langerhans)** | Insuline, Glucagon, Somatostatine | Régulation fine de la glycémie sanguine, stockage et libération du glucose | Diabète de type I ou II, crises d'hypoglycémie, fermentations acides |\n| **Ovaires (Femme)** | Œstrogènes, Progestérone | Cycle menstruel, fertilité, maintien des tissus utérins et mammaires | SPM, kystes ovariens, endométriose, fibromes, ménopause difficile |\n| **Testicules (Homme)** | Testostérone, Androstérone | Production des spermatozoïdes, masse musculaire, énergie masculine | Fatigue, baisse de libido, hypertrophie ou inflammation prostatique |"
  ],
  "module-2-10-systeme-nerveux": [
    "### TABLEAU COMPARATIF DES DEUX BRANCHES DU SYSTÈME NERVEUX AUTONOME",
    "| Fonction / Organe Ciblé | Système Sympathique (Action / Stress / Surrénales) | Système Parasympathique (Repos / Digestion / Régénération) |\n| :--- | :--- | :--- |\n| **Rythme Cardiaque** | Accélération (Tachycardie d'effort) | Ralentissement (Bradychardie de repos réparateur) |\n| **Pression Artérielle** | Élévation (Vasoconstriction périphérique) | Baisse et normalisation (Vasodilatation) |\n| **Digestion & Péristaltisme** | Inhibition et mise en pause digestive | Stimulation active des sucs digestifs et du péristaltisme colique |\n| **Sécrétion Biliaire & Rénale** | Ralentissement de la filtration | Activation du drainage biliaire et de l'excrétion rénale |\n| **Bronches & Poumons** | Dilatation pour capter plus d'oxygène | Constriction et élimination des mucosités expiratoires |\n| **État Émotionnel & Mental** | Hyper-vigilance, anxiété, tension | Sérénité, relaxation profonde, propice à la détoxification |"
  ],
  "module-3-1-glucides-et-sucres": [
    "### TABLEAU DES GLUCIDES : SUCRES SIMPLES VIVANTS VS SUCRES COMPLEXES RAFFINÉS",
    "| Type de Glucide | Exemples et Sources | Vitesse d'Assimilation | Impact sur le Pancréas & la Lymphe |\n| :--- | :--- | :--- | :--- |\n| **Monosaccharides (Sucres Simples Vivants)** | Fructose et Glucose des fruits mûrs, baies, melons | Instantanée (sans travail digestif) | Pénètre la cellule par diffusion simple sans surcharger le pancréas ni acidifier |\n| **Disaccharides (Sucres Complexes)** | Saccharose (sucre blanc), Lactose (lait), Maltose | Lente, exige un clivage enzymatique | Génère des fermentations gastriques acides et une surproduction de mucus |\n| **Polysaccharides (Amidons & Féculents)** | Céréales, pâtes, pain, pommes de terre, maïs | Très lente et lourde (amylases) | Encombrement digestif majeur, acidose lymphatique, dépôts d'amidon |"
  ],
  "module-3-5-vitamines-coenzymes": [
    "### TABLEAU COMPARATIF DES VITAMINES NATURELLES ET SOURCES VIVANTES",
    "| Vitamine / Coenzyme | Rôle Physiologique Fondamental | Meilleures Sources Végétales Vivantes | Symptômes Majeurs de Carence |\n| :--- | :--- | :--- | :--- |\n| **Vitamine A (Bêta-carotène)** | Vision, intégrité épithéliale, régénération des muqueuses | Carottes, mangues, papayes, abricots, épinards, melon | Cécité crépusculaire, sécheresse oculaire et cutanée, polypes |\n| **Complexe B (B1 à B12)** | Métabolisme énergétique, influx nerveux, globules rouges | Graines germées, bananes, figues, avocat, baies sauvages | Névrites, asthénie profonde, irritabilité, anémie métabolique |\n| **Vitamine C (Complexe vivant)** | Antioxydant majeur, synthèse du collagène, élimination | Agrumes mûrs, baies sauvages, poivrons doux, cerises acérola | Fragilité capillaire, gingivite, scorbut, baisse immunitaire innée |\n| **Vitamine D (D3 naturelle)** | Fixation du calcium, régulation immunitaire, humeur | Exposition solaire intelligente et progressive (UVB) | Déminéralisation osseuse, faiblesse musculaire, déprime saisonnière |\n| **Vitamine E (Tocophérols)** | Protection des membranes cellulaires contre l'oxydation | Avocats, graines de tournesol germées, amandes crues | Dégénérescence musculaire, vieillissement cellulaire accéléré |\n| **Vitamine K (Phylloquinone)** | Coagulation sanguine normale et calcification osseuse | Feuilles vertes, persil, épinards, laitue romaine, brocoli | Hémorragies, ecchymoses faciles, retard de cicatrisation |"
  ],
  "module-3-6-elements-essentiels-mineraux": [
    "### TABLEAU DES MINÉRAUX MAJEURS ET OLIGO-ÉLÉMENTS BIODISPONIBLES",
    "| Minéral / Élément Essentiel | Rôle Biologique Vital | Sources Végétales Vivantes Privilégiées | Impact sur l'Équilibre Acido-Basique |\n| :--- | :--- | :--- | :--- |\n| **Potassium (K)** | Principal cation intracellulaire, conduction nerveuse, cœur | Bananes, dattes, raisins, melons, eau de coco fraîche | Puissamment alcalinisant (neutralise les acides) |\n| **Calcium (Ca)** | Structure osseuse, conduction neuromusculaire, hémostase | Feuilles vertes, figues sèches, graines de sésame, oranges | Tampon alcalinisant majeur de l'organisme |\n| **Magnésium (Mg)** | Cofacteur de 300+ enzymes, synthèse de l'ATP, détente | Cacao cru, légumes à feuilles vertes (chlorophylle) | Régulateur neuromusculaire alcalinisant |\n| **Sodium Organique (Na)** | Solubilisation du calcium, fluide lymphatique, sucs digestifs | Branches de céleri, blettes, concombres, tomates de plein champ | Maintient le calcium en solution colloïdale |\n| **Silice Organique (Si)** | Élasticité des artères, collagène, cheveux, ongles, os | Prêle des champs, ortie dioïque, peau de concombre, poivrons | Régénérateur du tissu conjonctif |\n| **Fer Organique (Fe)** | Transport de l'oxygène, hémoglobine, enzymes respiratoires | Raisins noirs, mûres sauvages, figues, spiruline, épinards | Oxygénateur cellulaire alcalinisant |\n| **Iode Végétal (I)** | Synthèse des hormones thyroïdiennes (T3, T4), métabolisme | Algues marines (dulse, kelp, nori), sel gemme naturel | Stimulateur glandulaire et métabolique |"
  ],
  "module-3-8-ph-des-aliments": [
    "### TABLEAU DE L'ÉCHELLE DU PH ET DE L'IMPACT ÉLECTROMAGNÉTIQUE",
    "| Degré de pH | Effet Métabolique Cellulaire | Aliments Typiques | Résonance en Angströms (Å) |\n| :--- | :--- | :--- | :--- |\n| **9,0 - 10,0 (Super-Alcalin)** | Dissolution massive de la lymphe, élimination rénale | Citron mûr, raisin noir à pépins, pastèque | 9 000 - 10 000 Å (Hautement Énergisant) |\n| **7,5 - 8,5 (Alcalin Moyen)** | Régénération cellulaire, apport d'électrolytes vivants | Mangues, papayes, bananes mûres, oranges douces | 8 000 - 8 500 Å (Vitalisant) |\n| **7,0 (Neutre / Doux)** | Nettoyage doux du côlon, maintien homéostatique | Concombres, courgettes, salades vertes, graines germées | 6 500 - 7 500 Å (Soutien Vital) |\n| **5,5 - 6,5 (Faiblement Acide)** | Ralentit le transit de détox, digestion dense | Noix trempées, graines de courge, céréales complètes cuites | 3 000 - 5 000 Å (Ralentisseur) |\n| **2,5 - 5,0 (Fortement Acide)** | Brûle les muqueuses, forme du mucus, épuise les reins | Viandes, fromages, farines blanches, sodas, alcools | 0 - 2 000 Å (Dévitalisant / Toxique) |"
  ],
  "module-4-1-probleme-du-lait-produits-laitiers": [
    "### TABLEAU COMPARATIF : LAIT MATERNEL HUMAIN VS LAIT DE VACHE",
    "| Composant Nutritionnel | Lait Maternel Humain (Physiologique) | Lait de Vache (Non Physiologique pour l'Homme) | Conséquence Clinique pour l'Organisme Humain |\n| :--- | :--- | :--- | :--- |\n| **Type de Protéine** | Lactalbumine (douce, liquide, facile à digérer) | Caséine (lourde, dense, gluante, destinée aux veaux) | Forme une colle visqueuse obstruant l'intestin et la lymphe |\n| **Teneur en Protéines** | 1,2 % (faible, adaptée à la croissance cérébrale) | 3,5 % (triple, adaptée au squelette massif du bovin) | Surcharge rénale majeure, production massive d'acide urique |\n| **Teneur en Lactose** | 7,0 % (sucre naturel nourrissant le cerveau) | 4,5 % (souvent non digéré par manque de lactase) | Fermentations intestinales acides, ballonnements, diarrhées |\n| **Assimilation du Calcium** | Haute biodisponibilité (rapport Ca/P idéal) | Faible biodisponibilité (trop de phosphore) | Déminéralisation paradoxale et acidose osseuse |"
  ],
  "module-5-1-trois-causes-premieres": [
    "### TABLEAU DES QUATRE STADES DE DÉGÉNÉRESCENCE PAR L'ACIDOSE TISSULAIRE",
    "| Stade Pathologique | Manifestations Cliniques Typiques | Réaction du Système Lymphatique | Approche Hygiéniste Morse |\n| :--- | :--- | :--- | :--- |\n| **1. Stade Aigu** | Fièvres, rhumes, éruptions cutanées, diarrhées, sueurs | Élimination active et rapide des toxines par les émonctoires | Soutenir la crise par le jeûne aux fruits sans bloquer les symptômes |\n| **2. Stade Sub-aigu** | Sinusites chroniques, bronchites récidivantes, fatigue, maux de tête | Lymphe épaissie, ganglions enflés, ralentissement de l'excrétion | Régime de transition cru, ouverture rénale par les plantes |\n| **3. Stade Chronique** | Ulcères, kystes, fibromes, calculs rénaux/biliaires, arthrite | Stase lymphatique lipidique massive, blocage complet des reins | Protocole 100% fruits vivants et formules glandulaires/rénales |\n| **4. Stade Dégénératif** | Cancers, leucémies, sclérose en plaques, atrophie organique | Destruction de la membrane cellulaire, hypoxie et mutation de l'ADN | Détoxication d'urgence, régénération cellulaire par les plantes souveraines |"
  ],
  "module-5-11-le-langage-corporel": [
    "### TABLEAU D'AUTO-ÉVALUATION DU LANGAGE CORPOREL SELON LE DR. MORSE",
    "| Signe Physique Observé | Organe ou Glande Affaiblie | Signification en Naturopathie Clinique | Action Thérapeutique Recommandée |\n| :--- | :--- | :--- | :--- |\n| **Tension Artérielle Systolique < 118** | Glandes Surrénales (Cortex) | Épuisement des surrénales, manque de neurotransmetteurs | Formule Surrénales, arrêt du sel raffiné, fruits vivants |\n| **Ongles Cassants, Striés ou Mous** | Glandes Parathyroïdes | Mauvaise utilisation biologique et fixation du calcium | Formule Parathyroïdes, prêle riche en silice, légumes verts |\n| **Cernes Foncées ou Poches sous les Yeux** | Reins & Vessie | Congestion lymphatique rénale et défaut de filtration | Formule Reins/Vessie, jus de pastèque, cure de raisin noir |\n| **Langue Blanche ou Jaunâtre** | Estomac & Système Digestif | Accumulation de mucus gastro-intestinal et toxémie chronique | Nettoyage intestinal, salade balai d'Ehret, jeûne au citron |\n| **Mains et Pieds Constamment Froids** | Glande Thyroïde | Ralentissement du métabolisme basal et de la circulation | Formule Thyroïde, kelp naturel, protocole de Barnes (Annexe A) |"
  ],
  "module-6-7-le-jeune-et-la-detoxification": [
    "### TABLEAU COMPARATIF DES PROTOCOLES DE JEÛNE THÉRAPEUTIQUE",
    "| Protocole de Jeûne | Aliments ou Liquides Autorisés | Puissance de Détoxication | Niveau Recommandé |\n| :--- | :--- | :--- | :--- |\n| **1. Jeûne aux Fruits Vivants (Mono-diète)** | Raisins noirs, melons, pastèques ou pommes à volonté | Élevée (nettoyage doux et constant avec maintien de l'énergie) | Débutants et personnes fatiguées |\n| **2. Jeûne aux Jus Crus Frais** | Jus de raisin, citronnade au miel pur, jus de pastèque | Très Élevée (dissolution lymphatique rapide sans digestion solide) | Intermédiaire et personnes motivées |\n| **3. Jeûne à l'Eau Pure Distillée** | Eau distillée ou eau de source très peu minéralisée | Extrême (autolyse cellulaire maximale, repos digestif total) | Expérimentés sous supervision stricte |"
  ],
  "module-7-2-grande-table-des-aliments-acides-alcalins": [
    "### LA GRANDE TABLE ACIDO-BASIQUE COMPLÈTE DU DR. MORSE",
    "| Catégorie & Niveau Métabolique | Aliments Représentatifs | Effet sur le Sang et la Lymphe | Recommandation en Cure de Vitalité |\n| :--- | :--- | :--- | :--- |\n| **Hautement Alcalinisants & Astringents (Détox Supérieure)** | Citron, Raisin noir à pépins, Pastèque, Melon, Mûres, Myrtilles, Framboises, Pamplemousse, Pommes acidulées | Dissolution massive de la lymphe stagnante, ouverture rénale | **Priorité Absolue en Cure Active** |\n| **Alcalinisants Majeurs (Régénération & Énergie)** | Mangue, Papaye, Banane bien mûre, Figues fraîches, Dattes fraîches, Oranges douces, Pêches, Céleri, Concombre | Apport de fructose pur, électrolytes vivants, régénération | Base quotidienne de vitalité |\n| **Alcalinisants Doux (Nettoyage & Reminéralisation)** | Salades vertes (romaine, roquette), Épinards crus, Courgettes crues, Graines germées, Légumes vapeur doux | Élimine les résidus fécaux, nettoie le côlon, reminéralise | Repas du soir ou phase de transition |\n| **Neutres à Faiblement Acidifiants (Transition)** | Noix crues trempées, Graines de courge, Quinoa, Riz sauvage, Patate douce cuite à la vapeur, Châtaignes | Ralentit le flux de détoxination sans encrasser massivement | Utiliser uniquement en transition |\n| **Hautement Acidifiants & Toxiques (À Proscrire)** | Viandes rouges et blanches, Poissons, Fromages, Lait animal, Farines blanches, Sucres raffinés, Alcool, Café | Génère acide urique, acide phosphorique, mucus épais et calculs | **À Proscrire Totalement** |"
  ],
  "module-7-3-combinaisons-alimentaires": [
    "### TABLEAU DES RÈGLES D'OR DES COMBINAISONS ALIMENTAIRES PHYSIOLOGIQUES",
    "| Famille d'Aliments | Combinaisons Harmonieuses | Combinaisons Incompatibles Toxiques | Explication Enzymatique et Métabolique |\n| :--- | :--- | :--- | :--- |\n| **Melons et Pastèques** | **À consommer strictement SEULS** | Tout autre aliment (fruits, légumes, graines) | Digestion en 15-20 min ; bloqués par d'autres aliments, ils fermentent en alcool toxique |\n| **Fruits Acides (Citrons, Pamplemousses)** | Fruits sub-acides, salades vertes douces | Féculents, céréales, pommes de terre, bananes | L'acide détruit l'amylase salivaire (ptyaline), bloquant la digestion des amidons |\n| **Fruits Doux (Bananes, Dattes, Figues)** | Fruits sub-acides, graines germées, feuilles vertes | Fruits acides, féculents lourds, protéines concentrées | Évite les fermentations digestives et les ballonnements gazeux |\n| **Légumes Feuilles & Salades** | Compatibles avec presque tous les aliments vivants | Aucune incompatibilité majeure | Riches en eau cellulaire structurée et fibres balais sans amidon |\n| **Protéines Concentrées & Féculents** | Légumes verts cuits vapeur sans amidon | Protéines concentrées + Féculents concentrés | L'acide gastrique (pepsine) et l'alcalin neutralisent mutuellement leur efficacité |"
  ],
  "module-8-2-monographies-des-super-plantes": [
    "### TABLEAU DES 50 SUPER-PLANTES SOUVERAINES DU DR. MORSE",
    "| Nom Commun Français | Nom Botanique Officiel | Partie Utilisée | Trophisme Organique & Propriétés Thérapeutiques Majeures |\n| :--- | :--- | :--- | :--- |\n| **Gaillet Gratteron** | *Galium aparine* | Plante entière | Dépuratif lymphatique suprême, résorbe les engorgements ganglionnaires |\n| **Baie de Genièvre** | *Juniperus communis* | Baies mûres | Tonique des néphrons rénaux, relance la filtration des acides urinaires |\n| **Racine de Pissenlit** | *Taraxacum officinale* | Racines séchées | Dépuratif hépatique et biliaire, stimule la digestion et les reins |\n| **Chardon-Marie** | *Silybum marianum* | Semences (Silymarine) | Protecteur et régénérateur cellulaire des hépatocytes du foie |\n| **Cascara Sagrada** | *Rhamnus purshiana* | Écorce vieillie | Tonifiant péristaltique musculaire du côlon sans créer d'accoutumance |\n| **Ginseng Sibérien** | *Eleutherococcus senticosus* | Racines adaptogènes | Reconstruit le cortex surrénalien, combat l'épuisement nerveux |\n| **Prêle des Champs** | *Equisetum arvense* | Tiges stériles | Silice organique colloïdale pour le collagène, les os et les parathyroïdes |\n| **Hydraste du Canada** | *Hydrastis canadensis* | Rhizome (Berbérine) | Puissant assainissant antibactérien et antiparasitaire des muqueuses |\n| **Gotu Kola** | *Centella asiatica* | Feuilles | Régénérateur de la mémoire, de la microcirculation cérébrale et de la peau |\n| **Orme Fauve** | *Ulmus rubra* | Écorce interne | Émollient souverain, apaise les muqueuses gastriques et intestinales enflammées |"
  ],
  "module-8-3-formules-de-plantes-puissantes": [
    "### TABLEAU DES FORMULES BOTANIQUES MAGISTRALES PAR ÉMONCTOIRE ET SYSTÈME",
    "| Système Organique | Plantes Souveraines Dépuratives & Toniques | Nom Botanique de Référence | Objectif Thérapeutique & Posologie Clinique |\n| :--- | :--- | :--- | :--- |\n| **Reins & Vessie** | Baie de Genièvre, Persil racine, Uva Ursi, Bardane, Barbe de maïs | *Juniperus communis*, *Petroselinum crispum*, *Arctostaphylos uva-ursi* | Forcer les reins à filtrer les acides cellulaires et ouvrir les voies urinaires |\n| **Système Lymphatique** | Gaillet Gratteron, Racine de Phytolaque, Stillingie, Trèfle rouge, Chaparral | *Galium aparine*, *Phytolacca americana*, *Stillingia sylvatica* | Briser les stases ganglionnaires, dissoudre les kystes et fluidifier la lymphe |\n| **Glandes Surrénales** | Ginseng Sibérien, Schisandra, Astragale, Rhodiola, Réglisse racine | *Eleutherococcus senticosus*, *Schisandra chinensis*, *Glycyrrhiza glabra* | Reconstruire la production de cortisol naturel, d'aldostérone et d'énergie |\n| **Gros Intestin (Côlon)** | Cascara Sagrada, Rhubarbe de Turquie, Guimauve, Orme fauve, Charbon | *Rhamnus purshiana*, *Rheum palmatum*, *Althaea officinalis* | Décoller la plaque mucoïde, régénérer les parois muqueuses et le péristaltisme |\n| **Foie & Vésicule** | Chardon-Marie, Racine de Pissenlit, Artichaut, Chélidoine, Boldo | *Silybum marianum*, *Taraxacum officinale*, *Cynara scolymus* | Nettoyer les conduits biliaires, régénérer les hépatocytes et dissoudre les calculs |\n| **Cerveau & Système Nerveux** | Gotu Kola, Ginkgo Biloba, Scutellaire, Millepertuis, Romarin | *Centella asiatica*, *Ginkgo biloba*, *Scutellaria lateriflora* | Relancer la mémoire, stimuler la microcirculation cérébrale et réparer la myéline |\n| **Système Endocrinien Global** | Baie de Gattilier, Saw Palmetto, Éleuthérocoque, Kelp | *Vitex agnus-castus*, *Serenoa repens*, *Laminaria digitata* | Harmoniser l'axe hypophyse-thyroïde-surrénales et équilibrer les hormones |"
  ],
  "module-9-2-quatre-outils-therapeutiques-majeurs": [
    "### TABLEAU DES QUATRE OUTILS THÉRAPEUTIQUES MAJEURS DU DR. MORSE",
    "| Outil Thérapeutique | Matériel Nécessaire | Mode d'Action Physiologique | Fréquence et Précautions Cliniques |\n| :--- | :--- | :--- | :--- |\n| **1. Purge Foie & Vésicule Biliaire** | Huile d'olive extra-vierge, jus de pamplemousse ou citron frais | Dilate les conduits biliaires et expulse les calculs et bouchons cholestériques | 1 fois par mois après préparation aux jus de pommes |\n| **2. Eau Pure Distillée à la Vapeur** | Distillateur d'eau domestique à condensation | Solvant universel pur, dissout les dépôts minéraux inorganiques (calcifications) | Boire entre les repas de fruits pour drainer les acides |\n| **3. Cataplasmes d'Huile de Ricin** | Huile de ricin pure pressée à froid, flanelle de coton, bouillotte | Stimule la microcirculation lymphatique et dissout les kystes et tumeurs | 3 à 4 soirs par semaine sur le foie, le bas-ventre ou les reins |\n| **4. Brossage à Sec & Enveloppement Froid** | Brosse en soies végétales naturelles, draps de lin humides froids | Exfolie la couche cornée, ouvre les millions de pores sudoripares (3e rein) | Quotidiennement avant la douche tiède / fraîche |"
  ],
  "annexe-a-temperature-basale-de-barnes": [
    "### TABLEAU D'ÉVALUATION CLINIQUE DU PROTOCOLE DE TEMPERATURE BASALE DE BARNES",
    "| Mesure Axillaire au Réveil (10 min) | Interprétation Fonctionnelle Globale | Organe ou Glande Ciblée | Recommandation Hygiéniste Morse |\n| :--- | :--- | :--- | :--- |\n| **Température < 36,4 °C** | **Hypothyroïdie fonctionnelle confirmée** | Thyroïde & Cortex Surrénalien | Protocole 100% fruits vivants, kelp naturel, formule thyroïde/surrénales |\n| **Température 36,4 °C à 36,6 °C** | Activité métabolique ralentie, début d'acidose | Glandes endocrines ralenties | Alimentation régénératrice crue, stimulation émonctorielle |\n| **Température 36,6 °C à 36,8 °C** | **Fonction endocrinienne optimale et saine** | Équilibre homéostatique parfait | Maintien de l'hygiène de vie vivante et des cures saisonnières |\n| **Température > 37,0 °C** | Hyperactivité glandulaire ou crise d'élimination | Inflammation aiguë ou infection | Hydratation abondante aux jus de fruits doux, repos complet |"
  ],
  "annexe-d-analyses-de-sang-decodees": [
    "### TABLEAU DES ANALYSES BIOLOGIQUES SANGUINES DÉCODÉES EN PHYSIOLOGIE NATURELLE",
    "| Paramètre Biologique | Normes Allopathiques Standard | Plage Optimale de Vitalité Morse | Interprétation Hygiéniste et Signification de l'Acidose |\n| :--- | :--- | :--- | :--- |\n| **Cholestérol Total** | 1,50 - 2,00 g/L | 1,40 - 1,80 g/L | Produit par le foie comme anti-acide protecteur en cas d'acidose lymphatique persistante |\n| **Triglycérides** | 0,50 - 1,50 g/L | 0,60 - 1,00 g/L | Reflète l'engorgement hépatique et la fermentation d'amidons ou de sucres industriels |\n| **Créatinine Sanguine** | 7 - 12 mg/L | 6 - 9 mg/L | Témoigne de la clairance rénale glomérulaire ; un taux élevé signale un blocage des reins |\n| **Acide Urique** | 30 - 70 mg/L | 25 - 45 mg/L | Déchet direct des purines carnées ; provoque goutte, calculs et arthrite inflammatoire |\n| **Glycémie à Jeun** | 0,70 - 1,10 g/L | 0,75 - 0,95 g/L | Contrôlée par le pancréas et les surrénales ; les fluctuations reflètent la faiblesse surrénalienne |\n| **Leucocytes (Globules Blancs)** | 4 000 - 10 000 /mm³ | 4 500 - 6 500 /mm³ | Une élévation traduit une toxémie aiguë ; une leucopénie traduit une fatigue de la moelle osseuse |"
  ],
  "annexe-f-poids-et-mesures-conversions": [
    "### TABLEAU DES CONVERSIONS DE POIDS, MESURES ET VOLUMES",
    "| Unité Américaine / Impériale | Équivalent Métrique Standard | Usage Courant dans le Livre du Dr. Morse |\n| :--- | :--- | :--- |\n| **1 Livre (lb)** | 453,6 grammes (0,453 kg) | Poids corporel et mesures de fruits/légumes |\n| **1 Once (oz - poids)** | 28,35 grammes | Dosage des plantes et graines |\n| **1 Once liquide (fl oz)** | 29,57 millilitres (~30 ml) | Dosage des jus frais et teintures de plantes |\n| **1 Tasse (cup)** | 240 millilitres (8 fl oz) | Volumes des recettes vivantes et tisanes |\n| **1 Pinte (pt)** | 473 millilitres (~0,5 L) | Quantité de jus de détoxification |\n| **1 Quart (qt)** | 946 millilitres (~1 L) | Ration d'eau distillée quotidienne |\n| **1 Gallon (gal)** | 3,785 litres | Volume pour les lavements et colema board |"
  ],
  "annexe-h-prefixes-et-suffixes-medicaux": [
    "### TABLEAU DES PRÉFIXES ET SUFFIXES MÉDICAUX DÉCODÉS EN LANGAGE SIMPLE",
    "| Préfixe ou Suffixe Médical | Origine & Signification Étymologique | Exemples Médicaux Courants | Traduction en Langage Vitaliste Clair |\n| :--- | :--- | :--- | :--- |\n| **-ite (-itis)** | Inflammation, rougeur, chaleur, douleur | Gastrite, Colite, Néphrite, Arthrite, Bronchite | Réaction défensive des tissus brûlés par la stagnation des acides cellulaires |\n| **-ose (-osis)** | État pathologique chronique, dégénérescence | Acidose, Arthrose, Néphrose, Sclérose, Mucoviscidose | Dégradation progressive et durcissement des tissus sous toxémie ancienne |\n| **-ome (-oma)** | Tumeur, gonflement, masse tissulaire | Carcinome, Adénome, Lipome, Fibrome, Sarcome | Kyste ou poche créée par l'organisme pour encapsuler des déchets corrosifs |\n| **Hyper-** | Au-dessus, excès, suractivité anormale | Hypertension, Hyperglycémie, Hyperplasie | Réaction d'urgence du corps tentant de forcer un barrage ou une obstruction |\n| **Hypo-** | En-dessous, déficit, insuffisance | Hypotension, Hypothyroïdie, Hypoglycémie | Épuisement cellulaire ou glandulaire par manque de carburant vivant |\n| **Hépa- / Hépato-** | Relatif au foie | Hépatite, Hépatomégalie, Hépatotoxique | Congestion ou nettoyage de l'usine biliaire et neutralisatrice de poisons |\n| **Néphro- / Réno-** | Relatif aux reins | Néphropathie, Néphrite, Néphron | Atteinte ou faiblesse des émonctoires maîtres chargés d'expulser la lymphe |"
  ]
};

// Découper le texte en chapitres / modules
const chaptersData = [];
for (let i = 0; i < sectionPositions.length; i++) {
  const current = sectionPositions[i];
  const nextPos = (i + 1 < sectionPositions.length) ? sectionPositions[i + 1].pos : fullBookText.length;
  
  let sectionRawText = fullBookText.slice(current.pos, nextPos).trim();
  
  // Nettoyage des titres initiaux redondants dans le texte
  const lines = sectionRawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Nettoyage des résidus bruts OCR de tableaux non formatés
  const filteredLines = lines.filter(line => {
    if (/^(FluideNatureEffets|SaliveAlcaline|Sucs gastriquesAcides|Sucs intestinauxAlcalins|SangAlcalinMort|Fluides alcalins|UrineAlcaline)/i.test(line)) return false;
    if (/(des reins ou de la vessie|cancer de l'estomac|cancer des intestins)/i.test(line) && current.id === "module-2-5-systeme-cardiovasculaire-et-sang") return false;
    if (current.id === "chapitre-1-comprendre-notre-espece" && /^(CARNIVORES|OMNIVORES|HERBIVORES|FRUGIVORES)$/.test(line)) return false;
    return true;
  });

  // Découper en paragraphes cohérents (regrouper les lignes de texte continu)
  const paragraphs = [];
  let currentParagraph = '';
  
  for (let line of filteredLines) {
    // Si c'est un sous-titre en majuscules ou débutant par un tiret / puce
    if (/^[A-ZÉÈÊËÀÂÎÏÔÙÛÇ\s–—\-]{4,}$/.test(line) && line.length < 60) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      paragraphs.push(`### ${line}`);
    } else if (/^[•\-\*]\s+/.test(line)) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      paragraphs.push(line);
    } else if (line.endsWith('.') || line.endsWith('!') || line.endsWith('?') || line.endsWith(':')) {
      currentParagraph += (currentParagraph ? ' ' : '') + line;
      if (currentParagraph.length > 180) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + line;
    }
  }
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  // Injecter les tableaux Markdown spécifiques à cette section
  if (SECTION_TABLES[current.id]) {
    paragraphs.push(...SECTION_TABLES[current.id]);
  }

  // Filtrer les paragraphes trop courts ou résiduels
  const cleanParagraphs = paragraphs.filter(p => p.length >= 2);

  chaptersData.push({
    id: current.id,
    tag: current.tag,
    title: current.title,
    paragraphs: cleanParagraphs.length > 0 ? cleanParagraphs : [sectionRawText]
  });
}

console.log(`✅ ${chaptersData.length} chapitres et modules complets structurés avec succès avec tableaux Markdown intégrés.`);

// Charger le glossaire riche complet (18 termes avec notes scientifiques et sources primaires)
const morseGlossary = JSON.parse(fs.readFileSync(path.join(__dirname, 'morse_full_glossary.json'), 'utf8'));

// Écrire le fichier complet
const fullCode = `/**
 * morseDetoxMiracleFr.js
 * 
 * ÉDITION INTÉGRALE FRANÇAISE & RESTAURÉE (387 PAGES / 10 CHAPITRES & 87 SECTIONS)
 * "Le Miracle de la Détoxination - Guide Pratique de Régénération Cellulaire"
 * par le Dr. Robert Morse, N.D.
 * 
 * Traduction intégrale vérifiée et adaptée pour la liseuse VitalTrack BookReader.
 */

export const morseDetoxMiracleFr = {
  id: "morse-detox-miracle-fr",
  title: "Le Miracle de la Détoxination : Guide de Régénération Cellulaire par les Plantes",
  shortTitle: "Le Miracle de la Détox",
  author: "Dr. Robert Morse, N.D.",
  year: "2004 / 2012",
  coverImage: "/images/books/morse-cover.jpg",
  accentColor: "#14b8a6",
  tagline: "Alimentation Vivante et Plantes pour une Régénération Cellulaire Complète",
  description: "L'ouvrage fondamental du Dr. Robert Morse détaillant la lymphe (80% des fluides), la filtration rénale, le rôle des glandes endocrines et les 50 plantes régénératrices.",
  pageCount: 387,
  pdfUrl: "/Miracle%20de%20la%20De%CC%81toxination%20-%20Robert%20Morse.pdf",
  pdfSource: "/Miracle%20de%20la%20De%CC%81toxination%20-%20Robert%20Morse.pdf",
  totalChapters: ${chaptersData.length},
  glossary: ${JSON.stringify(morseGlossary, null, 2)},
  chapters: ${JSON.stringify(chaptersData, null, 2)}
};
`;

const outputPath = path.join(__dirname, '../web-app/src/data/books/morseDetoxMiracleFr.js');
fs.writeFileSync(outputPath, fullCode, 'utf8');

console.log(`💾 Fichier ${outputPath} écrit avec succès (${(fullCode.length / 1024).toFixed(1)} Ko).`);
