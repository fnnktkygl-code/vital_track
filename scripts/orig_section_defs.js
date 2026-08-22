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

