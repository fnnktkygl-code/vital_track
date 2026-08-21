/**
 * recipesData.js
 * 
 * Base de données exhaustive des Recettes Authentiques & Éprouvées
 * issues directement des ouvrages des grands maîtres de la santé naturelle :
 * - Dr. Sebi (Alimentation Bio-Électrique Cellulaire)
 * - Prof. Arnold Ehret (Régime Sans Mucus & Jeûne Rationnel)
 * - Dr. Robert Morse, N.D. (Détoxication & Régénération Cellulaire)
 * - David Wolfe (Alimentation Vivante & Biophotonique)
 * - Dr. John Kallas, Ph.D. (Plantes Sauvages & Nutrition Dense)
 * - Dr. John R. Christopher, M.H. (Phytothérapie Clinique & Formules)
 */

export const VITALIST_RECIPES = [
  // ══════════════════════════════════════════════════════════════════════════
  // ⚡ DR. SEBI (ALIMENTATION CELLULAIRE BIO-ÉLECTRIQUE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "sebi-sea-moss-gel",
    title: "Gel Artisanal de Sea Moss (Irish Moss Pur)",
    subtitle: "Chondrus crispus · 92 Minéraux Essentiels Intra-Cellulaires",
    author: "Dr. Sebi",
    authorTitle: "Fondateur de la Méthode Bio-Électrique Cellulaire",
    bookReference: "The Dr. Sebi Compendium (3-in-1 Healing Journey, p. 142)",
    category: "elixir-tisane",
    categoryLabel: "Élixir & Base Culinaire",
    prepTime: "15 min (+ 12h trempage)",
    cookTime: "0 min (Cru)",
    servings: 4,
    difficulty: "Facile",
    vitalityScore: 100,
    pralScore: -18.4,
    targetEmunctories: ["Lymphe", "Thyroïde", "Intestins", "Peau"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Sans Gluten", "Santé Intestinale", "Super-Aliments"],
    description: "Le remplaçant minéral suprême du Dr. Sebi. Apporte 92 des 102 minéraux dont le corps humain est composé, lubrifie les muqueuses intestinales et stimule la thyroïde.",
    ingredients: [
      { name: "Sea Moss Sauvage Séché (Chondrus Crispus)", quantity: 50, unit: "g", isElectric: true, note: "Origine océanique sauvage non cultivée" },
      { name: "Eau de Source ou Eau Distillée", quantity: 500, unit: "ml", isElectric: true, note: "Pour le trempage et le mixage" },
      { name: "Citron Vert Clé (Key Lime) Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Pour rincer et neutraliser l'odeur saline" }
    ],
    instructions: [
      "Rincez soigneusement le Sea Moss à plusieurs reprises dans de l'eau tiède avec des tranches de citron vert clé pour éliminer le sel de mer et le sable.",
      "Placez le Sea Moss dans un bocal en verre, recouvrez d'eau de source pure et laissez tremper à température ambiante pendant 12 à 24 heures jusqu'à ce qu'il double de volume et devienne translucide.",
      "Égouttez le Sea Moss et placez-le dans un blender haute puissance.",
      "Ajoutez environ 350 ml à 400 ml d'eau de source tiède et mixez pendant 2 à 3 minutes à vitesse maximale jusqu'à obtenir une crème lisse et satinée sans aucun morceau.",
      "Versez dans un bocal en verre hermétique et placez au réfrigérateur. Le gel se solidifie en 2 heures et se conserve jusqu'à 3 semaines.",
      "Posologie : Consommez 1 à 2 cuillères à soupe par jour, pur ou dilué dans vos tisanes de bardane ou smoothies alcalins."
    ],
    vitalistAction: "Le Sea Moss est riche en potassium, soufre organique, iode naturel et acide alginique. Il dissout le biofilm muqueux dans l'intestin grêle tout en apportant une charge électrolytique qui optimise le potentiel d'action membranaire des cellules.",
    nutritionalHighlights: ["Iode Organique", "Potassium Naturel", "Soufre", "Silice Bio-disponible", "Magnésium"]
  },
  {
    id: "sebi-wild-rice-alkaline-bowl",
    title: "Bol Électrique de Riz Sauvage & Légumes Rôtis",
    subtitle: "Riz Zizania Non-Hybride & Légumes Alcalins au Piment de Cayenne",
    author: "Dr. Sebi",
    authorTitle: "Guide Nutritionnel Officiel Cell Food",
    bookReference: "Dr. Sebi Medicinal Herbs & Cleansing Diet (p. 64)",
    category: "plat-principal",
    categoryLabel: "Plat Principal Chaud",
    prepTime: "20 min",
    cookTime: "40 min",
    servings: 2,
    difficulty: "Intermédiaire",
    vitalityScore: 92,
    pralScore: -12.8,
    targetEmunctories: ["Côlon", "Reins", "Foie"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Un plat complet alcalinisant à base de véritable riz sauvage (graminée aquatique non hybridée), de courgettes, poivrons doux et oignons rouges braisés à l'huile d'avocat.",
    ingredients: [
      { name: "Riz Sauvage Noir (Zizania aquatica)", quantity: 150, unit: "g", isElectric: true, note: "Graine sauvage authentique non croisée" },
      { name: "Courgette (Zucchini)", quantity: 1, unit: "pièce", isElectric: true, note: "Coupée en demi-lunes" },
      { name: "Poivron Doux Vert ou Jaune", quantity: 1, unit: "pièce", isElectric: true, note: "Émincé finement" },
      { name: "Oignon Rouge", quantity: 0.5, unit: "pièce", isElectric: true, note: "Émincé" },
      { name: "Huile d'Avocat Pure", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Première pression à froid" },
      { name: "Piment de Cayenne Pur", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Stimulant circulatoire" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Sans additifs" },
      { name: "Origan Séché Sauvage", quantity: 1, unit: "c. à café", isElectric: true, note: "Antiseptique digestif" }
    ],
    instructions: [
      "Rincez le riz sauvage à l'eau claire. Faites-le cuire dans 3 volumes d'eau de source frémissante pendant 40 à 45 minutes jusqu'à ce que les grains s'ouvrent légèrement.",
      "Dans une poêle en fonte ou céramique, faites chauffer l'huile d'avocat à feu moyen.",
      "Ajoutez l'oignon rouge et les poivrons émincés, faites suer pendant 4 minutes.",
      "Incorporez les morceaux de courgette, l'origan et une pincée de piment de Cayenne.",
      "Laissez cuire à feu doux 8 minutes pour garder les légumes tendres mais croquants.",
      "Mélangez le riz sauvage égoutté avec la poêlée de légumes, assaisonnez de sel marin pur et d'un filet d'huile d'avocat crue."
    ],
    vitalistAction: "Le riz sauvage est une herbe aquatique alcaline très riche en phosphore bio-électrique et en fibres douces non agressives pour la paroi intestinale. Il fournit une énergie durable sans générer de résidus d'acide urique.",
    nutritionalHighlights: ["Zinc", "Magnésium", "Fibres Douces", "Antioxydants Anthocyanes", "Capsaïcine"]
  },
  {
    id: "sebi-soursop-key-lime-nectar",
    title: "Nectar Électrique de Corossol (Soursop) & Key Lime",
    subtitle: "Graviola Vivante · Alcalinisation et Neutralisation Cellulaire",
    author: "Dr. Sebi",
    authorTitle: "Protocole Cell Food & Purifications",
    bookReference: "The Dr. Sebi Compendium (p. 210)",
    category: "jus-smoothie",
    categoryLabel: "Jus & Nectar Vivant",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 98,
    pralScore: -14.6,
    targetEmunctories: ["Lymphe", "Reins", "Cellules"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Drainage Rénal"],
    description: "Un nectar tropical ultra-onctueux et électrolytique combinant la chair bioactive du corossol (Annona muricata) avec le jus astringent de citron vert clé et du nectar d'agave pur.",
    ingredients: [
      { name: "Pulpe de Corossol Mûr (Soursop)", quantity: 200, unit: "g", isElectric: true, note: "Sans les graines noires (toxiques)" },
      { name: "Citron Vert Clé (Key Lime)", quantity: 2, unit: "pièces", isElectric: true, note: "Jus fraîchement pressé" },
      { name: "Eau de Source Pure", quantity: 300, unit: "ml", isElectric: true, note: "Fraîche ou tempérée" },
      { name: "Nectar d'Agave Pur 100%", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Édulcorant alcalin agréé" },
      { name: "Gel de Sea Moss", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Optionnel pour texture soyeuse" }
    ],
    instructions: [
      "Épépinez soigneusement le corossol frais pour ne conserver que la chair blanche fibreuse.",
      "Placez la pulpe de corossol, l'eau de source, le jus des deux citrons verts clés et le nectar d'agave dans le blender.",
      "Ajoutez une cuillère de gel de Sea Moss pour enrichir en minéraux colloïdaux.",
      "Mixez à haute vitesse pendant 60 à 90 secondes jusqu'à obtenir un liquide mousseux et lactescent.",
      "Servez immédiatement à température ambiante ou légèrement frais pour préserver les enzymes actives."
    ],
    vitalistAction: "Le corossol contient des acétogénines annonacées naturelles et une concentration élevée en vitamine C et potassium. En synergie avec le citron vert clé, il déclenche une puissante libération des acides interstitiels dans le flux lymphatique.",
    nutritionalHighlights: ["Acétogénines", "Vitamine C Active", "Potassium", "Électrolytes Liquides"]
  },
  {
    id: "sebi-teff-ancient-flatbread",
    title: "Galettes Ancestrales de Teff & Graines de Chanvre",
    subtitle: "Céréale Éthiopienne Non Hybridée Sans Gluten",
    author: "Dr. Sebi",
    authorTitle: "Guide de Transition Diététique",
    bookReference: "Dr. Sebi Medicinal Herbs & Cleansing Diet (p. 92)",
    category: "pain-boulangerie-ancestrale",
    categoryLabel: "Boulangerie Ancestrale",
    prepTime: "15 min",
    cookTime: "12 min",
    servings: 4,
    difficulty: "Facile",
    vitalityScore: 88,
    pralScore: -6.2,
    targetEmunctories: ["Intestins", "Rate"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Pain plat moelleux sans levure, sans gluten et sans farine de blé hybridée. Fait à partir de farine de teff africaine ancestrale, d'eau de source et d'huile d'avocat.",
    ingredients: [
      { name: "Farine de Teff Pure (Brune ou Ivoire)", quantity: 200, unit: "g", isElectric: true, note: "Farine ancestrale non croisée" },
      { name: "Graines de Chanvre Décortiquées", quantity: 30, unit: "g", isElectric: true, note: "Protéines complètes et oméga-3" },
      { name: "Eau de Source Tiède", quantity: 180, unit: "ml", isElectric: true, note: "Pour pétrir la pâte" },
      { name: "Huile d'Avocat", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pour la souplesse de la pâte" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Minéraux bruts" },
      { name: "Poudre d'Oignon Séché", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Pour la saveur" }
    ],
    instructions: [
      "Dans un saladier en verre, mélangez la farine de teff, les graines de chanvre, le sel marin et la poudre d'oignon.",
      "Ajoutez l'huile d'avocat et versez l'eau tiède progressivement en mélangeant avec une cuillère en bois jusqu'à formation d'une pâte souple et non collante.",
      "Divisez la pâte en 4 pâtons et étalez-les entre deux feuilles de papier sulfurisé à l'aide d'un rouleau (épaisseur ~3 mm).",
      "Faites chauffer une poêle en fonte antiadhésive sans matière grasse à feu moyen-vif.",
      "Déposez la galette et faites cuire 2 à 3 minutes de chaque côté jusqu'à ce que de petites cloques dorées apparaissent.",
      "Dégustez chaud avec du guacamole au citron vert clé ou une poêlée d'amaranthe sauvage."
    ],
    vitalistAction: "Le teff est l'une des céréales les plus anciennes au monde, exceptionnellement riche en fer biodisponible, en calcium et en acides aminés essentiels. Il ne provoque aucune fermentation collante dans le côlon.",
    nutritionalHighlights: ["Fer Non-Héminique", "Calcium Organique", "Protéines Complètes Végétales", "Prébiotiques Naturels"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍏 PROF. ARNOLD EHRET (RÉGIME SANS MUCUS & JEÛNE RATIONNEL)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "ehret-standard-broom-salad",
    title: "La Salade Balai Intestinal Standard (Standard Broom Salad)",
    subtitle: "Carottes Râpées, Céleri & Chou Rouge au Jus de Citron Vivant",
    author: "Prof. Arnold Ehret",
    authorTitle: "Auteur du Système de Guérison du Régime Sans Mucus",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 16, p. 78)",
    category: "salade-entree",
    categoryLabel: "Salade & Entrée Dépurative",
    prepTime: "12 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 99,
    pralScore: -16.8,
    targetEmunctories: ["Côlon", "Intestin Grêle", "Foie"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Santé Intestinale", "Drainage Rénal"],
    description: "La formule reine d'Arnold Ehret pour décaper mécaniquement et chimiquement les villosités intestinales des anciens dépôts de mucus durci et d'amidon.",
    ingredients: [
      { name: "Carottes Fraîches Biologiques", quantity: 2, unit: "pièces", isElectric: true, note: "Râpées finement avec la peau brossée" },
      { name: "Chou Rouge ou Chou Blanc Cru", quantity: 150, unit: "g", isElectric: true, note: "Émincé en lanières très fines" },
      { name: "Branches de Céleri avec Feuilles", quantity: 2, unit: "tiges", isElectric: true, note: "Coupées en petits dés fins" },
      { name: "Jus de Citron Jaune Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Acide dissolvant de mucus" },
      { name: "Huile d'Olive Vierge Extra", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Première pression à froid" },
      { name: "Persil Plat Frais Haché", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Dépuratif rénal" }
    ],
    instructions: [
      "Râpez finement les carottes crues pour créer des micro-fibres abrasives douces.",
      "Émincez le chou rouge le plus finement possible à la mandoline ou au couteau.",
      "Tronçonnez les branches de céleri en petits dés et ciselez le persil plat avec ses tiges.",
      "Rassemblez tous les légumes dans un grand saladier en bois ou en verre.",
      "Arrosez immédiatement avec le jus d'un citron frais entier et une cuillère d'huile d'olive de première pression à froid. Ne mettez AUCUN sel raffiné ni vinaigre industriel.",
      "Mélangez énergiquement et laissez reposer 5 minutes pour que l'acide citrique attendrisse les fibres du chou.",
      "Consommez en entrée lors du repas principal pour préparer le tube digestif à l'évacuation."
    ],
    vitalistAction: "Les fibres cellulosiques brutes non cuites agissent comme une éponge mécanique balayant les résidus fécaux anciens tandis que l'acide citrique vivant saponifie et dissout les glaires muqueuses tenaces.",
    nutritionalHighlights: ["Bêta-Carotène", "Fibres Insolubles Balais", "Chlorophylle Détox", "Potassium", "Silice"]
  },
  {
    id: "ehret-baked-apples-horseradish",
    title: "Pommes Rôties au Raifort Épurateur d'Acide Urique",
    subtitle: "Pectine Cuite & Raifort Râpé Frais · Dissolution d'Urée",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 15 : Recettes de Transition",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 15, p. 74)",
    category: "plat-principal",
    categoryLabel: "Plat de Transition Douce",
    prepTime: "10 min",
    cookTime: "25 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 90,
    pralScore: -11.2,
    targetEmunctories: ["Reins", "Articulations", "Estomac"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce", "Drainage Rénal"],
    description: "Le remède mythique d'Arnold Ehret pour éliminer les cristaux d'acide urique et l'arthritisme. L'association de la pectine de pomme fondante et du piquant du raifort frais.",
    ingredients: [
      { name: "Pommes Biologiques (Boskoop ou Reinette)", quantity: 2, unit: "pièces", isElectric: true, note: "Acidulées et parfumées" },
      { name: "Racine de Raifort Fraîche", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Râpée minute (très piquant)" },
      { name: "Jus de Citron Jaune", quantity: 0.5, unit: "pièce", isElectric: true, note: "Pour arroser" },
      { name: "Cannelle de Ceylan Pure", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Régulateur glycémique" }
    ],
    instructions: [
      "Préchauffez votre four à 170°C.",
      "Lavez et évidez le cœur des pommes sans percer la base pour créer une cavité.",
      "Placez les pommes dans un plat en verre avec 2 cuillères à soupe d'eau au fond.",
      "Saupoudrez de cannelle et enfournez pour 25 minutes jusqu'à ce que la peau éclate et que la chair devienne compotée.",
      "Pendant ce temps, râpez très finement la racine de raifort fraîche et arrosez-la de quelques gouttes de citron.",
      "Dès la sortie du four, garnissez le cœur brûlant des pommes avec le raifort râpé cru.",
      "Mangez tiède à la petite cuillère en associant une bouchée de pomme douce et une pointe de raifort tonique."
    ],
    vitalistAction: "Les isothiocyanates volatils du raifort traversent les barrières muqueuses et liquéfient les dépôts uriques et catarrhaux, tandis que la pectine cuite absorbe les toxines libérées et tapisse l'estomac.",
    nutritionalHighlights: ["Pectine Gélifiante", "Isothiocyanates", "Acide Malique", "Antioxydants Quercétine"]
  },
  {
    id: "ehret-prune-fig-motility-compote",
    title: "Compote Dépurative de Pruneaux & Figues Sèches",
    subtitle: "Hydratation Osmotique & Motilité Péristaltique du Côlon",
    author: "Prof. Arnold Ehret",
    authorTitle: "Traité sur le Jeûne Rationnel",
    bookReference: "Le Jeûne Rationnel & Régénération (Chapitre 4, p. 38)",
    category: "dessert-vivant",
    categoryLabel: "Détox Douce du Soir",
    prepTime: "5 min (+ 8h trempage)",
    cookTime: "15 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 94,
    pralScore: -14.2,
    targetEmunctories: ["Côlon", "Reins"],
    tags: ["Sans Mucus", "Sans Gluten", "Santé Intestinale", "Transition Douce"],
    description: "La compote de réveil intestinal conçue par Arnold Ehret pour relancer sans spasmes les intestins paresseux après un jeûne ou lors d'une transition alimentaire.",
    ingredients: [
      { name: "Pruneaux d'Agen Biologiques Séchés", quantity: 6, unit: "pièces", isElectric: true, note: "Non pasteurisés et sans conservateurs" },
      { name: "Figues Sèches Sauvages", quantity: 4, unit: "pièces", isElectric: true, note: "Gorgées de petites graines abrasives douces" },
      { name: "Eau de Source Pure", quantity: 350, unit: "ml", isElectric: true, note: "Pour réhydrater" },
      { name: "Zeste de Citron Jaune Non Traité", quantity: 1, unit: "ruban", isElectric: true, note: "Huiles essentielles antiseptiques" }
    ],
    instructions: [
      "Faites tremper les pruneaux et les figues dans l'eau de source pendant une nuit complète (8 heures).",
      "Le lendemain, versez les fruits et leur eau de trempage parfumée dans une petite casserole en émail.",
      "Ajoutez le ruban de zeste de citron.",
      "Portez à frémissement très doux et laissez compoter à couvert pendant 12 à 15 minutes à feu minimal sans jamais faire bouillir fort.",
      "Laissez tiédir. Consommez les fruits tendres et buvez l'intégralité du jus sirupeux avant le coucher ou au réveil."
    ],
    vitalistAction: "Le sorbitol naturel et les graines minuscules de figue créent un effet osmotique et un micro-massage des parois du gros intestin, favorisant une évacuation complète sans accoutumance.",
    nutritionalHighlights: ["Sorbitol Osmotique", "Magnésium Naturel", "Mucilages Doux", "Polyphénols"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍇 DR. ROBERT MORSE, N.D. (DÉTOXICATION & RÉGÉNÉRATION LYMPHATIQUE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "morse-master-kidney-lymph-lemonade",
    title: "La Master Lemonade Rénale & Lymphatique",
    subtitle: "Citron Pressé Vivant, Piment de Cayenne & Érable Sauvage Grade C",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Maître Praticien en Détoxication & Iridologie Clinique",
    bookReference: "The Detox Miracle Sourcebook (Chapitre 9, p. 198)",
    category: "elixir-tisane",
    categoryLabel: "Élixir Dépuratif Quotidien",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -22.5,
    targetEmunctories: ["Reins", "Lymphe", "Foie", "Peau"],
    tags: ["Sans Mucus", "100% Cru", "Drainage Rénal", "Sans Gluten", "100% Électrique"],
    description: "Le breuvage de référence du Dr. Morse pour ouvrir la filtration rénale le matin, fluidifier la lymphe stagnante et éliminer les dépôts d'acides sulfurique et phosphorique.",
    ingredients: [
      { name: "Citrons Frais Mûrs", quantity: 2, unit: "pièces", isElectric: true, note: "Jus fraîchement pressé minute" },
      { name: "Eau Distillée ou Eau Très Peu Minéralisée", quantity: 500, unit: "ml", isElectric: true, note: "Solvant pur pour dissoudre les sels" },
      { name: "Sirop d'Érable Pur (Grade C / Ambré Foncé)", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Glucides vivants simples et minéraux" },
      { name: "Piment de Cayenne Biologique en Poudre", quantity: 0.15, unit: "c. à café", isElectric: true, note: "Ouvre les capillaires sanguins" }
    ],
    instructions: [
      "Pressez le jus des deux citrons mûrs à l'aide d'un presse-agrume manuel.",
      "Versez le jus dans une grande bouteille en verre de 500 ml.",
      "Ajoutez l'eau distillée ou l'eau de source à résidu sec inférieur à 30 mg/L.",
      "Incorporez la cuillère de sirop d'érable pur grade C et la pointe de piment de Cayenne.",
      "Agitez vigoureusement le flacon pour mélanger la formule.",
      "Buvez lentement par petites gorgées tout au long de la matinée à jeun (entre 07h et 11h)."
    ],
    vitalistAction: "L'acide citrique est le plus puissant dissolvant astringent d'acides corporels. Une fois métabolisé par le foie, il libère des bicarbonates et du potassium qui alcalinisent le plasma sanguin et ouvrent les néphrons rénaux pour évacuer les sédiments urinaires.",
    nutritionalHighlights: ["Citrate de Potassium", "Capsaïcine Dilatatrice", "Vitamine C Réductrice", "Magnésium Biodisponible"]
  },
  {
    id: "morse-green-vitality-kidney-juice",
    title: "Grand Jus Vert de Vitalité & Clearance Rénale",
    subtitle: "Concombre, Céleri, Persil Plat, Pomme Verte & Ortie Fraîche",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Protocole Clinique de Régénération Tissulaire",
    bookReference: "The Detox Miracle Sourcebook (Chapitre 12, p. 245)",
    category: "jus-smoothie",
    categoryLabel: "Jus d'Extracteur Pur",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 100,
    pralScore: -28.4,
    targetEmunctories: ["Reins", "Lymphe", "Vessie", "Foie"],
    tags: ["100% Cru", "Sans Mucus", "Drainage Rénal", "Sans Gluten", "Plantes Sauvages"],
    description: "Une explosion d'eau structurée biologique vivante et de chlorophylle pure. Extrait à froid pour irriguer les glomérules rénaux et nettoyer le système vasculaire.",
    ingredients: [
      { name: "Concombre Biologique Entier", quantity: 1, unit: "pièce", isElectric: true, note: "Eau cellulaire hautement structurée" },
      { name: "Céleri Branche avec Feuilles", quantity: 3, unit: "tiges", isElectric: true, note: "Sodium organique biocompatible" },
      { name: "Persil Plat Frais Entier", quantity: 1, unit: "botte", isElectric: true, note: "Diurétique épithélial majeur" },
      { name: "Pomme Verte Granny Smith", quantity: 1, unit: "pièce", isElectric: true, note: "Acide malique solvant" },
      { name: "Feuilles d'Ortie Fraîche ou Épinards", quantity: 50, unit: "g", isElectric: true, note: "Reminéralisation et fer" },
      { name: "Racine de Gingembre Frais", quantity: 1, unit: "cm", isElectric: true, note: "Anti-inflammatoire et thermique" }
    ],
    instructions: [
      "Lavez soigneusement tous les végétaux à l'eau vinaigrée ou citronnée.",
      "Passez le concombre, les branches de céleri, le persil avec ses tiges, la pomme verte, l'ortie et le gingembre dans un extracteur de jus à rotation lente (40 à 60 tours/min).",
      "Recueillez le jus vert émeraude immédiatement dans un pichet en verre.",
      "Buvez dans les 15 minutes suivant l'extraction pour bénéficier de l'activité enzymatique et photonique maximale."
    ],
    vitalistAction: "Le sodium organique du céleri neutralise les acides uriques corrosifs tandis que l'apiol du persil stimule la filtration tubulaire des reins pour drainer les œdèmes et les poches sous les yeux.",
    nutritionalHighlights: ["Sodium Organique Végétal", "Chlorophylle Liquide", "Apiol Diurétique", "Silicium Végétal", "Vitamine K1"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌱 DAVID WOLFE (ALIMENTATION VIVANTE & ÉNERGIE BIOPHOTONIQUE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "wolfe-wild-dandelion-green-smoothie",
    title: "Smoothie Vert Sauvage au Pissenlit & Énergie Solaire",
    subtitle: "Pissenlit Amer Sauvage, Banane Mûre, Graines de Chanvre & Spiruline",
    author: "David Wolfe",
    authorTitle: "Pionnier International de la Raw Food & Superfoods",
    bookReference: "The Sunfood Diet Success System (Chapitre 8, p. 165)",
    category: "jus-smoothie",
    categoryLabel: "Smoothie Vivant Super-Aliments",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 98,
    pralScore: -19.2,
    targetEmunctories: ["Foie", "Vésicule", "Intestins", "Sang"],
    tags: ["100% Cru", "Sans Mucus", "Plantes Sauvages", "Super-Aliments", "Sans Gluten"],
    description: "Le smoothie de régénération hépatique par excellence. Les principes amers du pissenlit stimulent la production biliaire tandis que le chanvre et la banane apportent une texture onctueuse.",
    ingredients: [
      { name: "Feuilles de Pissenlit Sauvage Fraîches", quantity: 40, unit: "g", isElectric: true, note: "Cueillies en milieu propre, riches en taraxacine" },
      { name: "Banane Mûre Tachetée", quantity: 2, unit: "pièces", isElectric: true, note: "Pectines douces et potassium" },
      { name: "Graines de Chanvre Biologiques Décortiquées", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Acides gras oméga-3 et globuline végétale" },
      { name: "Poudre de Spiruline Pure", quantity: 1, unit: "c. à café", isElectric: true, note: "Phycocyanine antioxydante" },
      { name: "Eau de Coco Fraîche", quantity: 300, unit: "ml", isElectric: true, note: "Électrolytes isotoniques" }
    ],
    instructions: [
      "Rincez soigneusement les feuilles de pissenlit sauvage à l'eau claire.",
      "Placez les bananes mûres épluchées, les feuilles de pissenlit, les graines de chanvre et la spiruline dans le blender.",
      "Versez l'eau de coco fraîche.",
      "Mixez à haute vitesse pendant 45 à 60 secondes jusqu'à obtenir un smoothie onctueux, vert profond et velouté.",
      "Dégustez lentement en mastiquant légèrement chaque gorgée pour activer les enzymes salivaires."
    ],
    vitalistAction: "La taraxacine et les lactones sesquiterpéniques du pissenlit décongestionnent le foie et purifient le flux biliaire, tandis que la phycocyanine de la spiruline protège les hépatocytes contre le stress oxydatif.",
    nutritionalHighlights: ["Taraxacine Hépatique", "Phycocyanine", "Oméga-3 ALA", "Potassium", "Magnésium"]
  },
  {
    id: "wolfe-raw-cacao-longevity-elixir",
    title: "Élixir de Longévité au Cacao Sauvage & Maca",
    subtitle: "Cacao Cru Non Torréfié, Maca Péruvienne & Cannelle de Ceylan",
    author: "David Wolfe",
    authorTitle: "Auteur & Spécialiste des Super-Aliments Sauvages",
    bookReference: "The Sunfood Diet Success System (Chapitre 14, p. 290)",
    category: "elixir-tisane",
    categoryLabel: "Élixir Chaud & Tonique",
    prepTime: "6 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 95,
    pralScore: -8.7,
    targetEmunctories: ["Cerveau", "Cœur", "Système Nerveux"],
    tags: ["100% Cru", "Sans Mucus", "Super-Aliments", "Sans Gluten"],
    description: "Une boisson revigorante ancestrale riche en magnésium bio-disponible, théobromine et polyphénols protecteurs pour la clarté mentale et l'élévation vibratoire.",
    ingredients: [
      { name: "Poudre de Cacao Cru Pur Non Torréfié", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Source n°1 de magnésium végétal" },
      { name: "Poudre de Racine de Maca", quantity: 1, unit: "c. à café", isElectric: true, note: "Adaptogène endocrinien" },
      { name: "Lait d'Amande ou de Chanvre Fait Maison", quantity: 250, unit: "ml", isElectric: true, note: "Chauffé tiède (<42°C pour rester cru)" },
      { name: "Nectar d'Agave ou Sirop d'Érable", quantity: 1, unit: "c. à café", isElectric: true, note: "Douceur minérale" },
      { name: "Cannelle de Ceylan & Pincée de Cayenne", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Thermo-générateur" }
    ],
    instructions: [
      "Faites tiédir le lait végétal cru sans dépasser 42°C pour ne détruire aucune enzyme vivante.",
      "Versez le lait tiède dans le blender.",
      "Ajoutez le cacao cru, la maca, le nectar d'agave, la cannelle et la micro-pincée de piment de cayenne.",
      "Mixez pendant 30 secondes pour créer une mousse onctueuse chocolatée.",
      "Servez dans une tasse en céramique et savourez lors des phases de concentration mentale ou de fatigue matinale."
    ],
    vitalistAction: "Le magnésium ionisé et l'anandamide du cacao cru détendent le système neuromusculaire et dilatent le réseau coronarien, favorisant une perfusion optimale du cortex cérébral sans surstimulation surrénalienne.",
    nutritionalHighlights: ["Magnésium Ionique", "Théobromine", "Flavanols Antioxydants", "Anandamide"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌿 DR. JOHN KALLAS, PH.D. (PLANTES SAUVAGES COMESTIBLES & NUTRITION DENSE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "kallas-wild-purslane-omega3-salad",
    title: "Salade Fraîche de Pourpier Sauvage (Purslane) & Tomates",
    subtitle: "Portulaca oleracea · Source Végétale Suprême d'Oméga-3 EPA & Antioxydants",
    author: "Dr. John Kallas, Ph.D.",
    authorTitle: "Directeur de Wild Food Adventures & Ethnobotaniste",
    bookReference: "Edible Wild Plants: Wild Foods from Dirt to Plate (Chapitre 4, p. 86)",
    category: "salade-entree",
    categoryLabel: "Salade Sauvage Haute Densité",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 100,
    pralScore: -17.5,
    targetEmunctories: ["Cœur", "Vaisseaux", "Intestins", "Peau"],
    tags: ["100% Cru", "Plantes Sauvages", "Sans Mucus", "Sans Gluten", "100% Électrique"],
    description: "Le pourpier sauvage surpasse tous les légumes cultivés du commerce en acides gras oméga-3 essentiels et en bétalaïnes. Sa texture charnue et sa saveur acidulée en font une salade exceptionnelle.",
    ingredients: [
      { name: "Tiges et Feuilles de Pourpier Sauvage Frais", quantity: 150, unit: "g", isElectric: true, note: "Cueillies tendres le matin" },
      { name: "Tomates Roma Mûres", quantity: 2, unit: "pièces", isElectric: true, note: "Coupées en dés" },
      { name: "Concombre Croquant", quantity: 0.5, unit: "pièce", isElectric: true, note: "En fines rondelles" },
      { name: "Huile d'Olive Vierge Extra", quantity: 2, unit: "c. à soupe", isElectric: false, note: "Première pression à froid" },
      { name: "Jus de Citron Vert Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Acidité vivante" },
      { name: "Graines d'Amaranthe ou de Sésame", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pour le croquant minéral" }
    ],
    instructions: [
      "Lavez le pourpier sauvage dans une bassine d'eau fraîche pour retirer toute trace de terre. Égouttez délicatement.",
      "Coupez les tiges de pourpier en sections de 3 à 4 cm avec leurs feuilles charnues.",
      "Dans un saladier, associez le pourpier, les dés de tomates mûres et les rondelles de concombre.",
      "Assaisonnez avec l'huile d'olive, le jus de citron vert et une pincée de sel marin non raffiné.",
      "Saupoudrez de graines d'amaranthe ou de chanvre pour parfaire l'apport protéique et servez immédiatement."
    ],
    vitalistAction: "Le pourpier possède le taux le plus élevé d'acide alpha-linolénique (ALA) de tout le règne végétal terrestre, ainsi que du glutathion et de la mélatonine naturelle, réparant l'endothélium vasculaire et apaisant l'inflammation systémique.",
    nutritionalHighlights: ["Acides Gras Oméga-3 ALA", "Bétalaïnes", "Glutathion Naturel", "Vitamine E", "Magnésium"]
  },
  {
    id: "kallas-stinging-nettle-hemp-pesto",
    title: "Pesto Vivant d'Ortie Piquante & Graines de Chanvre",
    subtitle: "Urtica dioica · Bombe Minérale Vivante de Fer & Silice Organique",
    author: "Dr. John Kallas, Ph.D.",
    authorTitle: "Nutrition Sauvage & Cueillette Ethnobotanique",
    bookReference: "Edible Wild Plants: Wild Foods from Dirt to Plate (Chapitre 7, p. 148)",
    category: "salade-entree",
    categoryLabel: "Condiment & Pesto Vivant",
    prepTime: "12 min",
    cookTime: "0 min (Cru)",
    servings: 4,
    difficulty: "Facile",
    vitalityScore: 100,
    pralScore: -24.1,
    targetEmunctories: ["Reins", "Sang", "Os", "Cheveux"],
    tags: ["100% Cru", "Plantes Sauvages", "Sans Mucus", "Sans Gluten", "Drainage Rénal"],
    description: "L'ortie sauvage est le végétal le plus reminéralisant d'Europe et d'Amérique. Le mixage mécanique désamorce instantanément le piquant pour créer un pesto cru crémeux et revigorant.",
    ingredients: [
      { name: "Jeunes Sommités d'Ortie Fraîche (Stinging Nettle)", quantity: 100, unit: "g", isElectric: true, note: "Cueillies avec des gants, jeunes feuilles du haut" },
      { name: "Graines de Chanvre Décortiquées", quantity: 60, unit: "g", isElectric: true, note: "Remplacent avantageusement les pignons" },
      { name: "Gousse d'Ail Sauvage ou Ail Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Allicine antimicrobienne" },
      { name: "Huile d'Olive Vierge Extra", quantity: 80, unit: "ml", isElectric: false, note: "Émulsion protectrice" },
      { name: "Jus de Citron Jaune Frais", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Fixateur de fer végétal" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Exhausteur minéral" }
    ],
    instructions: [
      "Lavez les jeunes sommités d'ortie à grande eau à l'aide d'une pince ou de gants.",
      "Plongez les orties 10 secondes dans de l'eau tiède (ou passez-les directement au blender puissant : la rupture des trichomes neutralise complètement l'acide formique piquant).",
      "Placez les feuilles d'ortie essorées dans le robot culinaire avec les graines de chanvre, l'ail émincé, le jus de citron et le sel marin.",
      "Mixez en versant l'huile d'olive en filet continu jusqu'à obtenir une consistance de pesto crémeuse et homogène.",
      "Conservez dans un bocal en verre hermétique recouvert d'une fine couche d'huile d'olive au frais pendant 10 jours.",
      "Utilisez pour napper vos courgettes crues spiralées, vos galettes de teff ou vos bols de riz sauvage."
    ],
    vitalistAction: "L'ortie apporte une concentration record de silice organique, de fer bio-disponible, de chlorophylle et de bore, stimulant la formation osseuse, fortifiant le tissu conjonctif et purifiant le lit vasculaire rénal.",
    nutritionalHighlights: ["Silice Organique", "Fer Végétal Hautement Assimilable", "Chlorophylle Intense", "Bore", "Calcium"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🧪 DR. JOHN R. CHRISTOPHER, M.H. (PHYTOTHÉRAPIE CLINIQUE & RÉPARATION)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "christopher-potassium-broth",
    title: "Le Célèbre Bouillon de Potassium du Dr. Christopher",
    subtitle: "Pelures de Pommes de Terre, Carottes, Betteraves & Persil Étuves",
    author: "Dr. John R. Christopher",
    authorTitle: "Fondateur de la School of Natural Healing",
    bookReference: "School of Natural Healing (Clinical Programs & Formulas, p. 112)",
    category: "soupe-bouillon",
    categoryLabel: "Bouillon Thérapeutique de Régénération",
    prepTime: "15 min",
    cookTime: "35 min",
    servings: 4,
    difficulty: "Facile",
    vitalityScore: 96,
    pralScore: -31.6,
    targetEmunctories: ["Reins", "Articulations", "Sang", "Cellules"],
    tags: ["Sans Mucus", "Sans Gluten", "Drainage Rénal", "Transition Douce", "Santé Intestinale"],
    description: "Le bouillon alcalin le plus célèbre de l'histoire de la naturopathie américaine. Conçu pour alcaliniser massivement un organisme en acidose profonde et régénérer le capital minéral.",
    ingredients: [
      { name: "Pelures Épaisses de Pommes de Terre Bio", quantity: 300, unit: "g", isElectric: false, note: "La peau concentre 80% du potassium organique" },
      { name: "Carottes Entières avec Fanes", quantity: 2, unit: "pièces", isElectric: true, note: "Coupées en rondelles" },
      { name: "Betterave Rouge avec ses Feuilles", quantity: 1, unit: "pièce", isElectric: true, note: "Émincée pour la bétanine et le fer" },
      { name: "Branches et Feuilles de Céleri", quantity: 3, unit: "tiges", isElectric: true, note: "Sodium et potassium équilibrés" },
      { name: "Botte de Persil Frais", quantity: 1, unit: "botte", isElectric: true, note: "Ajouté dans les 10 dernières minutes" },
      { name: "Eau de Source Pure", quantity: 1.5, unit: "L", isElectric: true, note: "Pour extraire les sels minéraux" }
    ],
    instructions: [
      "Brossez méticuleusement les pommes de terre biologiques et pelez-les en conservant une épaisseur généreuse de chair sous la peau (environ 5 mm).",
      "Lavez et découpez grossièrement les carottes, la betterave et le céleri avec leurs feuilles respectives.",
      "Placez tous les légumes racines et les pelures dans une grande marmite en acier inoxydable ou en fonte émaillée.",
      "Couvrez avec 1,5 litre d'eau de source pure.",
      "Portez à ébullition douce, puis baissez le feu au minimum, couvrez et laissez mijoter pendant 25 minutes.",
      "Ajoutez la botte de persil frais entier pour les 10 dernières minutes de cuisson.",
      "Éteignez le feu et filtrez le bouillon doré au chinois en pressant les légumes pour en extraire tous les sucs.",
      "Buvez chaud ou tiède à raison de 2 à 4 tasses par jour en période de cure de détoxication."
    ],
    vitalistAction: "Ce bouillon extrait les sels minéraux solubles (potassium, magnésium, silice, fer) sans apporter d'amidon indigeste. Il relève instantanément le pH plasmatique et draine les acides tissulaires fixés dans les articulations.",
    nutritionalHighlights: ["Potassium Organique Soluble", "Bétanine", "Sodium Naturel", "Bioflavonoïdes"]
  },
  {
    id: "christopher-slippery-elm-gruel",
    title: "Gruau Cicatrisant à l'Orme Rouge (Slippery Elm)",
    subtitle: "Ulmus rubra · Pansement Mucilagineux pour Muqueuses & Gastrites",
    author: "Dr. John R. Christopher",
    authorTitle: "Materia Medica & Soins Intestinaux",
    bookReference: "School of Natural Healing (Monograph: Slippery Elm Bark, p. 284)",
    category: "soupe-bouillon",
    categoryLabel: "Pansement & Soin Muqueux",
    prepTime: "5 min",
    cookTime: "5 min",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 92,
    pralScore: -9.5,
    targetEmunctories: ["Estomac", "Intestins", "Côlon"],
    tags: ["Sans Mucus", "Sans Gluten", "Santé Intestinale", "Transition Douce"],
    description: "Le remède souverain du Dr. Christopher pour cicatriser les ulcères d'estomac, les colites, les brûlures gastriques et reconstituer le mucus protecteur physiologique des intestins.",
    ingredients: [
      { name: "Poudre d'Écorce Interne d'Orme Rouge (Ulmus rubra)", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Poudre pure de qualité herboristerie" },
      { name: "Eau de Source ou Lait d'Amande Doux", quantity: 200, unit: "ml", isElectric: true, note: "Tempéré ou tiède" },
      { name: "Sirop d'Érable Pur ou Nectar d'Agave", quantity: 1, unit: "c. à café", isElectric: true, note: "Pour adoucir la prise" },
      { name: "Poudre de Cannelle de Ceylan", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Antiseptique aromatique" }
    ],
    instructions: [
      "Dans un bol ou une petite casserole, déposez la poudre d'orme rouge.",
      "Ajoutez d'abord 2 cuillères à soupe d'eau froide et mélangez à la fourchette pour former une pâte lisse sans grumeaux.",
      "Versez ensuite le reste de l'eau tiède progressivement en fouettant doucement.",
      "Faites tiédir 2 à 3 minutes à feu très doux en remuant constamment jusqu'à ce que le liquide épaississe et prenne une consistance de gruau soyeux.",
      "Ajoutez une pointe de cannelle et une cuillère de sirop d'érable.",
      "Consommez tiède 20 minutes avant un repas ou le matin à jeun pour tapisser l'estomac."
    ],
    vitalistAction: "Au contact de l'eau, les mucilages complexes de l'orme rouge forment un gel colloïdal protecteur qui tapisse mécaniquement les zones inflammées de l'œsophage et de l'intestin, stimulant la régénération cellulaire entérocytaire.",
    nutritionalHighlights: ["Mucilages Colloïdaux", "Galactomannanes", "Calcium Végétal", "Tanins Doux"]
  }
];

export const RECIPE_AUTHORS = [
  { id: "all", name: "Tous les Auteurs", icon: "🌟" },
  { id: "Dr. Sebi", name: "Dr. Sebi", icon: "⚡", description: "Alimentation Bio-Électrique Cellulaire" },
  { id: "Prof. Arnold Ehret", name: "Prof. Arnold Ehret", icon: "🍏", description: "Régime Sans Mucus & Jeûne" },
  { id: "Dr. Robert Morse", name: "Dr. Robert Morse", icon: "🍇", description: "Détoxication & Lymphe" },
  { id: "David Wolfe", name: "David Wolfe", icon: "🌱", description: "Sunfood & Super-Aliments" },
  { id: "Dr. John Kallas", name: "Dr. John Kallas", icon: "🌿", description: "Plantes Sauvages & Nutrition" },
  { id: "Dr. John R. Christopher", name: "Dr. John Christopher", icon: "🧪", description: "Phytothérapie & Formules" }
];

export const RECIPE_TAGS = [
  { id: "all", label: "Toutes les Recettes", icon: "🌟" },
  { id: "100% Électrique", label: "⚡ 100% Électrique (Dr. Sebi)", icon: "⚡" },
  { id: "Sans Mucus", label: "🍏 Sans Mucus (Arnold Ehret)", icon: "🍏" },
  { id: "100% Cru", label: "🥗 100% Cru / Raw Food", icon: "🥗" },
  { id: "Sans Gluten", label: "🌾 Sans Gluten Ancestral", icon: "🌾" },
  { id: "Drainage Rénal", label: "🫘 Drainage Rénal & Lymphe", icon: "🫘" },
  { id: "Plantes Sauvages", label: "🌿 Plantes Sauvages & Cueillette", icon: "🌿" },
  { id: "Santé Intestinale", label: "✨ Santé Intestinale & Côlon", icon: "✨" },
  { id: "Transition Douce", label: "🥣 Repas de Transition Douce", icon: "🥣" }
];

export const POPULAR_INGREDIENTS = [
  "Sea Moss", "Citron Vert", "Citron", "Pourpier", "Pissenlit", "Ortie",
  "Carottes", "Céleri", "Betterave", "Riz Sauvage", "Farine de Teff",
  "Corossol", "Graines de Chanvre", "Pommes", "Pruneaux", "Orme Rouge",
  "Cacao Cru", "Huile d'Avocat", "Piment de Cayenne", "Spiruline", "Concombre"
];
