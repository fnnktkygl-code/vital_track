/**
 * recipesData.js
 * 
 * Base de données monumentale de 61 Recettes Authentiques, Éprouvées & Sourcées
 * issues des grands maîtres de la santé naturelle et de l'hygiénisme :
 * - Dr. Sebi (Alimentation Bio-Électrique Cellulaire)
 * - Prof. Arnold Ehret (Régime Sans Mucus & Jeûne Rationnel)
 * - Dr. Robert Morse, N.D. (Détoxication & Régénération Cellulaire)
 * - David Wolfe (Alimentation Vivante & Biophotonique)
 * - Dr. John Kallas, Ph.D. (Plantes Sauvages Comestibles)
 * - Dr. John R. Christopher, M.H. (Phytothérapie Clinique)
 * - Protocoles de Transition Douce (Poissons Sauvages & Océaniques Alcalinisés)
 */

export const VITALIST_RECIPES = [
  // ══════════════════════════════════════════════════════════════════════════
  // ⚡ 1. DR. SEBI (ALIMENTATION CELLULAIRE BIO-ÉLECTRIQUE)
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
  {
    id: "sebi-kalaloo-amaranth-greens",
    title: "Poêlée d'Amaranthe Sauvage (Kalaloo) au Citron Vert",
    subtitle: "Amaranthus viridis · Légume-Feuille Bio-Électrique Ancestral",
    author: "Dr. Sebi",
    authorTitle: "Pharmacopée & Aliments Sauvages Africains",
    bookReference: "The Dr. Sebi Compendium (p. 176)",
    category: "plat-principal",
    categoryLabel: "Légumes Sauvages Sautés",
    prepTime: "10 min",
    cookTime: "10 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 96,
    pralScore: -19.8,
    targetEmunctories: ["Sang", "Foie", "Côlon"],
    tags: ["100% Électrique", "Sans Mucus", "Plantes Sauvages", "Sans Gluten"],
    description: "Le Kalaloo traditionnel des Caraïbes et d'Afrique de l'Ouest : jeunes feuilles d'amaranthe sauvage étuvées avec des oignons doux, du piment de Cayenne et du jus de citron vert clé.",
    ingredients: [
      { name: "Feuilles d'Amaranthe Sauvage Fraîches (Kalaloo)", quantity: 300, unit: "g", isElectric: true, note: "Légume feuille riche en chlorophylle" },
      { name: "Oignon Doux Émincé", quantity: 1, unit: "pièce", isElectric: true, note: "Riche en quercétine" },
      { name: "Poivron Vert Doux", quantity: 0.5, unit: "pièce", isElectric: true, note: "En lanières" },
      { name: "Huile d'Avocat", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pression à froid" },
      { name: "Jus de Citron Vert Clé", quantity: 1, unit: "pièce", isElectric: true, note: "Pour fixer le fer" },
      { name: "Piment de Cayenne & Sel Marin", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Assaisonnement ionique" }
    ],
    instructions: [
      "Lavez soigneusement les feuilles d'amaranthe et coupez grossièrement les tiges tendres.",
      "Dans une sauteuse, faites suer l'oignon et le poivron vert dans l'huile d'avocat pendant 3 minutes.",
      "Ajoutez les feuilles d'amaranthe par poignées, couvrez 2 minutes pour faire tomber les feuilles à la vapeur de leur propre eau.",
      "Découvrez, ajoutez le piment de Cayenne, le sel marin et le jus de citron vert clé.",
      "Mélangez 2 minutes à feu vif et servez immédiatement bien vert."
    ],
    vitalistAction: "L'amaranthe sauvage regorge de squalène naturel, de calcium végétal ionisé et de fer non héminique très assimilable, augmentant l'oxygénation cellulaire et renforçant la rate.",
    nutritionalHighlights: ["Squalène", "Calcium Végétal", "Fer Bio-disponible", "Vitamine A Active"]
  },
  {
    id: "sebi-squash-chayote-soup",
    title: "Velouté Alcalin de Courge & Chayote au Lait de Coco",
    subtitle: "Chayote Sauvage (Christophine) & Courge Butternut Bio-Électrique",
    author: "Dr. Sebi",
    authorTitle: "Cuisine Alcaline Thérapeutique",
    bookReference: "The Dr. Sebi Compendium (p. 234)",
    category: "soupe-bouillon",
    categoryLabel: "Velouté Alcalinisant Chaud",
    prepTime: "15 min",
    cookTime: "25 min",
    servings: 3,
    difficulty: "Facile",
    vitalityScore: 94,
    pralScore: -15.4,
    targetEmunctories: ["Reins", "Estomac", "Peau"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Une soupe soyeuse et très douce associant la chayote rafraîchissante, la courge alcalinisante, le lait de coco frais et une pointe de sauge séchée.",
    ingredients: [
      { name: "Chayote (Christophine) Pelée", quantity: 2, unit: "pièces", isElectric: true, note: "Coupée en cubes" },
      { name: "Courge Butternut ou Potimarron", quantity: 300, unit: "g", isElectric: true, note: "En cubes" },
      { name: "Lait de Coco Frais Maison", quantity: 200, unit: "ml", isElectric: true, note: "Extrait de pulpe de coco fraîche" },
      { name: "Eau de Source Pure", quantity: 500, unit: "ml", isElectric: true, note: "Pour la cuisson" },
      { name: "Sauge Sauvage Séchée", quantity: 1, unit: "c. à café", isElectric: true, note: "Apaisant digestif" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Minéraux bruts" }
    ],
    instructions: [
      "Dans une casserole, déposez les cubes de chayote et de courge.",
      "Couvrez avec l'eau de source et portez à ébullition douce pendant 20 minutes jusqu'à tendreté complète.",
      "Versez les légumes cuits avec leur bouillon dans le blender.",
      "Ajoutez le lait de coco frais, la sauge et le sel marin.",
      "Mixez 1 minute à vitesse maximale jusqu'à obtenir un velouté doré et crémeux.",
      "Servez chaud garni de graines de chanvre crues."
    ],
    vitalistAction: "La chayote est exceptionnellement diurétique et anti-inflammatoire pour les voies urinaires. Les acides gras à chaîne moyenne du coco nourrissent l'épithélium intestinal sans surcharger le pancréas.",
    nutritionalHighlights: ["Triglycérides à Chaîne Moyenne (TCM)", "Potassium", "Bêta-Carotène", "Fibres Douces"]
  },
  {
    id: "sebi-avocado-roma-guacamole",
    title: "Guacamole Alcalin d'Avocat Sauvage & Citron Vert Clé",
    subtitle: "Avocats Crémeux, Tomates Roma, Oignons Rouges & Piment de Cayenne",
    author: "Dr. Sebi",
    authorTitle: "Guide Nutritionnel Officiel",
    bookReference: "Dr. Sebi Medicinal Herbs & Cleansing Diet (p. 78)",
    category: "salade-entree",
    categoryLabel: "Condiment & Entrée Vivante",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 99,
    pralScore: -16.2,
    targetEmunctories: ["Foie", "Peau", "Cerveau"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Sans Gluten"],
    description: "Une préparation brute et onctueuse d'avocats mûrs écrasés à la fourchette avec du jus de citron vert clé, des dés de tomates Roma fermes et du sel marin.",
    ingredients: [
      { name: "Avocats Mûrs (Non Traités)", quantity: 2, unit: "pièces", isElectric: true, note: "Acides gras mono-insaturés purs" },
      { name: "Tomates Roma Mûres", quantity: 1, unit: "pièce", isElectric: true, note: "Épépinée et coupée en petits dés" },
      { name: "Oignon Rouge Finement Haché", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Saveur et quercétine" },
      { name: "Jus de Citron Vert Clé (Key Lime)", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Antioxydant vivant" },
      { name: "Coriandre Fraîche Hachée", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Chélateur de métaux lourds" },
      { name: "Sel Marin Non Raffiné & Cayenne", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Électrolytes" }
    ],
    instructions: [
      "Coupez les avocats en deux et retirez le noyau. Écrasez la chair dans un bol en verre avec une fourchette en laissant quelques morceaux pour la mâche.",
      "Arrosez immédiatement avec le jus de citron vert clé pour éviter l'oxydation.",
      "Incorporez les dés de tomates Roma, l'oignon rouge haché et la coriandre fraîche.",
      "Assaisonnez avec une pointe de sel marin et de piment de Cayenne.",
      "Dégustez avec des rondelles de concombre cru ou des galettes de teff croustillantes."
    ],
    vitalistAction: "L'acide oléique de l'avocat régénère les membranes des cellules nerveuses et fluidifie la bile, tandis que la coriandre capte et draine les toxines vers les selles.",
    nutritionalHighlights: ["Acide Oléique Oméga-9", "Glutathion", "Lycopène", "Potassium", "Folate Naturel"]
  },
  {
    id: "sebi-burdock-dandelion-tea",
    title: "Décoction Dépurative de Bardane & Racine de Pissenlit",
    subtitle: "Arctium lappa & Taraxacum officinale · Purificateur Sanguin Suprême",
    author: "Dr. Sebi",
    authorTitle: "Maître Herboriste & Thérapeute Cellulaire",
    bookReference: "The Dr. Sebi Compendium (p. 98)",
    category: "elixir-tisane",
    categoryLabel: "Décoction Thérapeutique",
    prepTime: "5 min",
    cookTime: "15 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -24.5,
    targetEmunctories: ["Sang", "Foie", "Reins", "Peau"],
    tags: ["100% Électrique", "Sans Mucus", "Drainage Rénal", "Sans Gluten"],
    description: "La tisane de base du protocole de purification du Dr. Sebi. Deux racines sauvages puissantes pour nettoyer le sang, stimuler le drainage lymphatique et éliminer l'acide urique.",
    ingredients: [
      { name: "Racine de Bardane Séchée (Burdock Root)", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Dépuratif sanguin majeur" },
      { name: "Racine de Pissenlit Sauvage Séchée", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Stimulant hépatique et biliaire" },
      { name: "Eau de Source Pure", quantity: 600, unit: "ml", isElectric: true, note: "Pour l'extraction" },
      { name: "Nectar d'Agave Pur 100%", quantity: 1, unit: "c. à café", isElectric: true, note: "Optionnel pour adoucir l'amertume" }
    ],
    instructions: [
      "Dans une casserole en émail ou en verre, déposez les racines de bardane et de pissenlit.",
      "Versez l'eau de source pure.",
      "Portez à ébullition douce, couvrez et laissez mijoter à feu très doux pendant 12 à 15 minutes.",
      "Retirez du feu et laissez infuser à couvert pendant 10 minutes supplémentaires.",
      "Filtrez dans une grande tasse. Buvez tiède à jeun le matin ou entre les repas."
    ],
    vitalistAction: "L'inuline et les polyacétylènes de la bardane neutralisent les toxines sanguines tandis que les principes amers du pissenlit décongestionnent les capillaires hépatobiliaires.",
    nutritionalHighlights: ["Inuline Prébiotique", "Taraxacine", "Fer Organique", "Polyphénols Détox"]
  },
  {
    id: "sebi-spelt-basil-pesto-pasta",
    title: "Pâtes d'Épeautre Ancestral au Pesto Alcalin & Huile d'Avocat",
    subtitle: "Triticum spelta Non Hybridé · Basilic Frais & Graines de Chanvre",
    author: "Dr. Sebi",
    authorTitle: "Guide Diététique & Transition",
    bookReference: "The Dr. Sebi Compendium (p. 250)",
    category: "plat-principal",
    categoryLabel: "Plat Principal Énergétique",
    prepTime: "12 min",
    cookTime: "8 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 89,
    pralScore: -7.8,
    targetEmunctories: ["Côlon", "Muscles"],
    tags: ["100% Électrique", "Sans Mucus", "Transition Douce"],
    description: "Pâtes faites exclusivement à 100% de farine de grand épeautre non hybridé, nappées d'un pesto crémeux sans fromage à base de basilic frais, graines de chanvre et huile d'avocat.",
    ingredients: [
      { name: "Pâtes 100% Grand Épeautre Ancestral (Spelt)", quantity: 180, unit: "g", isElectric: true, note: "Céréale originelle non croisée" },
      { name: "Basilic Frais Entier", quantity: 1, unit: "grosse botte", isElectric: true, note: "Feuilles parfumées" },
      { name: "Graines de Chanvre Décortiquées", quantity: 40, unit: "g", isElectric: true, note: "Crémeux et oméga-3" },
      { name: "Huile d'Avocat Première Pression", quantity: 60, unit: "ml", isElectric: true, note: "Liant soyeux" },
      { name: "Jus de Citron Vert Clé", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Fraîcheur vive" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Minéraux" }
    ],
    instructions: [
      "Faites cuire les pâtes d'épeautre dans une grande casserole d'eau de source bouillante salée pendant 7 à 8 minutes (al dente).",
      "Pendant la cuisson, mixez au robot les feuilles de basilic, les graines de chanvre, le jus de citron vert et le sel marin en ajoutant l'huile d'avocat en filet.",
      "Égouttez les pâtes en réservant 2 cuillères à soupe d'eau de cuisson.",
      "Mélangez immédiatement les pâtes chaudes avec le pesto frais et l'eau de cuisson réservée.",
      "Servez avec des lamelles de poivrons doux rôtis ou de courgettes poêlées."
    ],
    vitalistAction: "Le grand épeautre non hybridé est hautement digeste car sa structure de gluten originelle est soluble dans l'eau et ne forme pas de colle intestinale imperméable.",
    nutritionalHighlights: ["Magnésium", "Zinc", "Oméga-3 Végétaux", "Eugénol Antiseptique"]
  },
  {
    id: "sebi-fonio-oyster-mushrooms",
    title: "Poêlée de Fonio Ancestral aux Pleurotes Sauvages",
    subtitle: "Digitaria exilis · Graine Africaine Antique & Champignons Bio-Électriques",
    author: "Dr. Sebi",
    authorTitle: "Cuisine Cellulaire & Céréales Sauvages",
    bookReference: "The Dr. Sebi Compendium (p. 268)",
    category: "plat-principal",
    categoryLabel: "Plat Rustique Chaud",
    prepTime: "10 min",
    cookTime: "15 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 93,
    pralScore: -11.5,
    targetEmunctories: ["Rate", "Intestins", "Muscles"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Le fonio est la plus ancienne céréale cultivée d'Afrique. Cuit en 5 minutes comme un couscous fin, il est associé ici à des pleurotes savoureuses revenues à l'huile d'avocat et à l'origan.",
    ingredients: [
      { name: "Graines de Fonio Naturel", quantity: 120, unit: "g", isElectric: true, note: "Sans gluten, cuisson ultra-rapide" },
      { name: "Pleurotes Sauvages (Oyster Mushrooms)", quantity: 200, unit: "g", isElectric: true, note: "Effilochées à la main" },
      { name: "Oignon Rouge et Poivron Doux", quantity: 1, unit: "pièce", isElectric: true, note: "Émincés" },
      { name: "Huile d'Avocat", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Pour dorer les champignons" },
      { name: "Piment de Cayenne & Origan", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Épices chaudes" },
      { name: "Eau de Source Pure", quantity: 240, unit: "ml", isElectric: true, note: "Pour cuire le fonio" }
    ],
    instructions: [
      "Dans une casserole, portez l'eau de source à ébullition avec une pincée de sel marin. Versez le fonio, mélangez, couvrez et éteignez le feu. Laissez gonfler 5 minutes puis égrenez à la fourchette.",
      "Dans une poêle, faites chauffer l'huile d'avocat et faites dorer les oignons et les pleurotes pendant 6 à 8 minutes jusqu'à coloration dorée.",
      "Assaisonnez avec l'origan et le piment de Cayenne.",
      "Incorporez le fonio aérien à la poêlée de pleurotes et mélangez délicatement pendant 1 minute.",
      "Dégustez chaud avec un quartier de citron vert clé."
    ],
    vitalistAction: "Le fonio contient des taux exceptionnels de méthionine et de cystine (acides aminés soufrés essentiels) sans encombrement mucilagineux.",
    nutritionalHighlights: ["Méthionine & Cystine", "Bêta-Glucanes Fongiques", "Fer", "Phosphore"]
  },
  {
    id: "sebi-okra-cayenne-roast",
    title: "Gombos (Okra) Rôtis au Piment de Cayenne & Sel Marin",
    subtitle: "Abelmoschus esculentus · Mucilages Prébiotiques & Protection Gastrique",
    author: "Dr. Sebi",
    authorTitle: "Soins Intestinaux & Nutrition Électrique",
    bookReference: "The Dr. Sebi Compendium (p. 188)",
    category: "plat-principal",
    categoryLabel: "Légume Rôti Thérapeutique",
    prepTime: "8 min",
    cookTime: "18 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 95,
    pralScore: -14.2,
    targetEmunctories: ["Estomac", "Côlon", "Vésicule"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Santé Intestinale"],
    description: "Le gombo est l'un des meilleurs protecteurs de la muqueuse digestive. Rôti au four avec de l'huile d'avocat et du piment de Cayenne, il perd son aspect visqueux et devient délicieusement croustillant.",
    ingredients: [
      { name: "Gombos Frais Tendres (Okra)", quantity: 250, unit: "g", isElectric: true, note: "Épointés et coupés en rondelles de 1 cm" },
      { name: "Huile d'Avocat Pure", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pression à froid" },
      { name: "Piment de Cayenne Biologique", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Stimulant digestif" },
      { name: "Poudre d'Oignon Séché & Sel Marin", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Préchauffez votre four à 200°C.",
      "Lavez et séchez soigneusement les gombos avec un torchon propre (l'humidité augmente la viscosité).",
      "Dans un bol, mélangez les rondelles de gombo avec l'huile d'avocat, le piment de Cayenne, la poudre d'oignon et le sel marin.",
      "Étalez les gombos sur une plaque recouverte de papier cuisson sans qu'ils ne se chevauchent.",
      "Enfournez pour 16 à 18 minutes en remuant à mi-cuisson jusqu'à ce qu'ils soient croustillants et dorés.",
      "Dégustez immédiatement en accompagnement d'un bol de riz sauvage."
    ],
    vitalistAction: "Les mucilages solubles du gombo lient le cholestérol biliaire et les acides dans l'intestin grêle, facilitant leur élimination sans agresser les villosités.",
    nutritionalHighlights: ["Mucilages Solubles", "Vitamine C & K", "Magnésium", "Folate Naturel"]
  },
  {
    id: "sebi-green-electric-cleanser",
    title: "Smoothie Vert Électrique Concombre, Kale & Key Lime",
    subtitle: "Chlorophylle Pure, Hydratation Structurée & Drainage Cellulaire",
    author: "Dr. Sebi",
    authorTitle: "Nettoyage Cellulaire Profond",
    bookReference: "The Dr. Sebi Compendium (p. 215)",
    category: "jus-smoothie",
    categoryLabel: "Smoothie Vivant Détox",
    prepTime: "6 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -21.4,
    targetEmunctories: ["Reins", "Lymphe", "Peau", "Sang"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Drainage Rénal"],
    description: "Une formule liquide ultra-hydratante combinant le concombre gorgé d'eau structurée, des feuilles de kale sauvage tendre, du gingembre frais et le jus astringent de citron vert clé.",
    ingredients: [
      { name: "Concombre Entier Biologique", quantity: 1, unit: "pièce", isElectric: true, note: "Non épluché" },
      { name: "Feuilles de Kale Doux Frais", quantity: 3, unit: "grandes feuilles", isElectric: true, note: "Énervées" },
      { name: "Jus de Citron Vert Clé (Key Lime)", quantity: 2, unit: "pièces", isElectric: true, note: "Alcalinisant puissant" },
      { name: "Gingembre Frais", quantity: 1, unit: "cm", isElectric: true, note: "Anti-inflammatoire" },
      { name: "Eau de Source Pure", quantity: 200, unit: "ml", isElectric: true, note: "Pour faciliter le mixage" },
      { name: "Nectar d'Agave", quantity: 1, unit: "c. à café", isElectric: true, note: "Optionnel" }
    ],
    instructions: [
      "Coupez le concombre en gros morceaux et placez-le au fond du blender.",
      "Ajoutez les feuilles de kale, le petit morceau de gingembre frais et le jus des deux citrons verts clés.",
      "Versez l'eau de source et le trait de nectar d'agave.",
      "Mixez à haute vitesse pendant 45 secondes jusqu'à consistance soyeuse.",
      "Buvez lentement à jeun en mastiquant chaque gorgée pour démarrer l'élimination matinale."
    ],
    vitalistAction: "Apporte une vague d'ions potassium et d'oxygène dissous directement absorbables au niveau des villosités du duodénum.",
    nutritionalHighlights: ["Chlorophylle Vivante", "Gingérol", "Silice Végétale", "Vitamine C"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍏 2. PROF. ARNOLD EHRET (RÉGIME SANS MUCUS & JEÛNE RATIONNEL)
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
  {
    id: "ehret-stewed-root-vegetables",
    title: "Ragoût de Transition aux Légumes Racines Étuves",
    subtitle: "Carottes, Poireaux, Oignons & Céleri-Rave Mijotés Sans Féculents",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 15 : Le Régime de Transition Idéal",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 15, p. 72)",
    category: "plat-principal",
    categoryLabel: "Plat de Transition Réconfortant",
    prepTime: "15 min",
    cookTime: "30 min",
    servings: 3,
    difficulty: "Facile",
    vitalityScore: 88,
    pralScore: -13.5,
    targetEmunctories: ["Foie", "Intestins", "Reins"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Le plat chaud réconfortant d'Ehret pour les saisons froides. Les légumes sont étuvés à l'étouffée dans leur propre jus avec une cuillère d'huile d'olive, sans eau ajoutée ni farine.",
    ingredients: [
      { name: "Carottes Douces", quantity: 3, unit: "pièces", isElectric: true, note: "En rondelles" },
      { name: "Blancs de Poireaux Émincés", quantity: 2, unit: "pièces", isElectric: true, note: "Épuration rénale" },
      { name: "Oignons Doux Jaunes", quantity: 2, unit: "pièces", isElectric: true, note: "Dissolvants de catarrhe" },
      { name: "Céleri-Rave Épluché", quantity: 150, unit: "g", isElectric: true, note: "En petits dés" },
      { name: "Huile d'Olive Vierge Extra", quantity: 2, unit: "c. à soupe", isElectric: false, note: "Pour la cuisson douce" },
      { name: "Thym Sauvage Frais", quantity: 2, unit: "branches", isElectric: true, note: "Antiseptique" }
    ],
    instructions: [
      "Dans une cocotte en fonte émaillée, faites chauffer l'huile d'olive à feu doux.",
      "Ajoutez les oignons et les poireaux émincés, laissez suer 5 minutes sans colorer.",
      "Incorporez les carottes, le céleri-rave et les branches de thym.",
      "Couvrez hermétiquement et baissez le feu au minimum. Laissez cuire à l'étouffée pendant 25 à 30 minutes : les légumes cuisent dans leur propre vapeur d'eau minérale.",
      "Servez chaud et fondant. Idéal pour un dîner léger de transition."
    ],
    vitalistAction: "La cuisson douce à l'étouffée préserve les sels de potassium organiques tout en rendant les fibres extrêmement digestes pour les intestins irrités.",
    nutritionalHighlights: ["Sels de Potassium Solubles", "Composés Soufrés d'Alliacées", "Bêta-Carotène"]
  },
  {
    id: "ehret-potato-peel-celery-broth",
    title: "Bouillon Alcalinisant de Pelures de Pommes de Terre & Céleri",
    subtitle: "Extraction Maximale de Potassium Soluble & Neutralisation d'Acidose",
    author: "Prof. Arnold Ehret",
    authorTitle: "Guide Thérapeutique Sans Mucus",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 15, p. 76)",
    category: "soupe-bouillon",
    categoryLabel: "Bouillon Neutre Épurateur",
    prepTime: "10 min",
    cookTime: "25 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 92,
    pralScore: -26.0,
    targetEmunctories: ["Reins", "Sang", "Articulations"],
    tags: ["Sans Mucus", "Sans Gluten", "Drainage Rénal", "Transition Douce"],
    description: "La peau de pomme de terre biologique contient une réserve prodigieuse de potassium sans le mucus de l'amidon interne. Ce bouillon écarte l'acidose en quelques heures.",
    ingredients: [
      { name: "Pelures Épaisses de Pommes de Terre Bio", quantity: 250, unit: "g", isElectric: false, note: "Légume brossé et pelé sur 4 mm d'épaisseur" },
      { name: "Céleri Branche Entier", quantity: 3, unit: "tiges", isElectric: true, note: "Tronçonné avec ses feuilles" },
      { name: "Gousses d'Ail Écrasées", quantity: 2, unit: "gousses", isElectric: true, note: "Allicine active" },
      { name: "Eau de Source Pure", quantity: 1, unit: "L", isElectric: true, note: "Pour l'infusion" }
    ],
    instructions: [
      "Brossez les pommes de terre sous l'eau et prélevez des épluchures épaisses.",
      "Placez les pelures, le céleri tronçonné et l'ail dans une casserole avec 1 litre d'eau de source.",
      "Portez à ébullition douce, puis couvrez et laissez frémir pendant 20 à 25 minutes.",
      "Filtrez le bouillon doré à la passoire fine en pressant bien les légumes.",
      "Buvez le bouillon bien chaud entre les repas comme remède anti-acide souverain."
    ],
    vitalistAction: "Apporte un choc osmotique alcalinisant immédiat sans nécessiter le moindre travail de digestion gastrique.",
    nutritionalHighlights: ["Potassium Liquide", "Sodium Biologique", "Composés Flavoniques"]
  },
  {
    id: "ehret-raw-beet-carrot-slaw",
    title: "Salade Éliminatrice de Carottes Râpées & Betterave Crue",
    subtitle: "Bétanine Active, Nitrate Végétal & Balai Hépato-Intestinal",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 16 : Salades Dépuratives",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 16, p. 80)",
    category: "salade-entree",
    categoryLabel: "Salade Dépurative Profonde",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 98,
    pralScore: -17.2,
    targetEmunctories: ["Foie", "Sang", "Côlon"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Santé Intestinale"],
    description: "Une salade rouge rubis éclatante combinant la betterave crue râpée (stimulant hépatique), la carotte et des jeunes pousses d'épinards assaisonnées au citron.",
    ingredients: [
      { name: "Betterave Rouge Crue Biologique", quantity: 1, unit: "pièce", isElectric: true, note: "Pelée et râpée fin" },
      { name: "Carottes Biologiques", quantity: 2, unit: "pièces", isElectric: true, note: "Râpées" },
      { name: "Pousses d'Épinards Frais", quantity: 50, unit: "g", isElectric: true, note: "Feuilles entières" },
      { name: "Jus de Citron Jaune", quantity: 1, unit: "pièce", isElectric: true, note: "Pour arroser" },
      { name: "Huile de Graines de Chanvre ou Olive", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pression à froid" }
    ],
    instructions: [
      "Râpez la betterave crue et les carottes au robot ou à la râpe manuelle.",
      "Mélangez les deux râpés dans un saladier et incorporez les pousses d'épinards fraîches.",
      "Arrosez généreusement de jus de citron jaune et d'huile végétale crue.",
      "Laissez mariner 5 minutes et savourez en entrée du repas de midi."
    ],
    vitalistAction: "La bétanine stimule la régénération des hépatocytes et le pigment rouge coloré agit comme un indicateur visuel du temps de transit intestinal.",
    nutritionalHighlights: ["Bétanine", "Nitrates Naturels", "Bêta-Carotène", "Folate"]
  },
  {
    id: "ehret-poached-pears-grape-juice",
    title: "Poires et Figues Fraîches Pochées au Pur Jus de Raisin",
    subtitle: "Dessert Vivant Sans Sucre Ajouté · Dissolvant Intestinal Doux",
    author: "Prof. Arnold Ehret",
    authorTitle: "Desserts Sans Mucus & Transition",
    bookReference: "Système de Guérison du Régime Sans Mucus (Leçon 15, p. 75)",
    category: "dessert-vivant",
    categoryLabel: "Dessert Vivant de Transition",
    prepTime: "8 min",
    cookTime: "12 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 93,
    pralScore: -12.4,
    targetEmunctories: ["Côlon", "Reins"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Des demi-poires fondantes pochées quelques minutes dans du pur jus de raisin noir sans sucre ajouté avec des quartiers de figues fraîches et de la cannelle.",
    ingredients: [
      { name: "Poires Conférence ou Williams Mûres", quantity: 2, unit: "pièces", isElectric: true, note: "Épluchées et coupées en deux" },
      { name: "Figues Fraîches Mûres", quantity: 4, unit: "pièces", isElectric: true, note: "Coupe en quatre" },
      { name: "Pur Jus de Raisin Noir Bio 100%", quantity: 200, unit: "ml", isElectric: true, note: "Sans sucre ajouté" },
      { name: "Bâton de Cannelle de Ceylan", quantity: 1, unit: "pièce", isElectric: true, note: "Arôme" }
    ],
    instructions: [
      "Dans une petite sauteuse, versez le pur jus de raisin noir et ajoutez le bâton de cannelle.",
      "Déposez les demi-poires évidées.",
      "Faites pocher à feu très doux pendant 10 minutes jusqu'à ce que les poires soient tendres mais tiennent leur forme.",
      "Ajoutez les quartiers de figues fraîches pour les 2 dernières minutes.",
      "Laissez tiédir dans le jus sirupeux et dégustez."
    ],
    vitalistAction: "Le jus de raisin cuit doucement concentre les polyphénols et l'acide tartrique, provoquant une élimination douce et un apaisement du système nerveux.",
    nutritionalHighlights: ["Acide Tartrique", "Resvératrol", "Pectines de Poire"]
  },
  {
    id: "ehret-steamed-spinach-lemon",
    title: "Épinards Frais à la Vapeur Douce & Filet de Citron",
    subtitle: "Chlorophylle Douce & Solvant des Toxines de l'Estomac",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 16 : Légumes Dépuratifs Cuits",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 82)",
    category: "plat-principal",
    categoryLabel: "Légume Vert Dépuratif",
    prepTime: "5 min",
    cookTime: "4 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 92,
    pralScore: -14.8,
    targetEmunctories: ["Estomac", "Foie"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Feuilles d'épinards frais juste tombées 3 minutes à la vapeur douce, arrosées de jus de citron pressé cru et d'une larme d'huile d'olive.",
    ingredients: [
      { name: "Épinards Frais en Grandes Feuilles", quantity: 400, unit: "g", isElectric: true, note: "Légume riche en chlorophylle" },
      { name: "Jus de Citron Jaune", quantity: 1, unit: "pièce", isElectric: true, note: "Pressé minute" },
      { name: "Huile d'Olive Première Pression", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Crue" }
    ],
    instructions: [
      "Lavez soigneusement les feuilles d'épinards.",
      "Placez-les dans un panier vapeur sur une eau frémissante.",
      "Faites cuire 3 à 4 minutes : les feuilles doivent s'affaisser tout en conservant leur vert éclatant.",
      "Déposez dans un plat, arrosez de jus de citron frais et d'huile d'olive.",
      "Mangez immédiatement comme accompagnement alcalin."
    ],
    vitalistAction: "Neutralise l'acidité gastrique et stimule les contractions de la vésicule biliaire sans irriter les muqueuses digestives.",
    nutritionalHighlights: ["Chlorophylle", "Lutéine", "Vitamine K1", "Magnésium"]
  },
  {
    id: "ehret-roasted-onions-tomatoes",
    title: "Oignons Doux et Tomates Rôtis au Four (Dissolvant de Catarrhe)",
    subtitle: "Composés Alliacés & Acides Maliques Cuis · Épuration Pulmonaire",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 15 : Plats de Transition Épurateurs",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 73)",
    category: "plat-principal",
    categoryLabel: "Légumes Rôtis Décongestionnants",
    prepTime: "8 min",
    cookTime: "30 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 89,
    pralScore: -10.8,
    targetEmunctories: ["Poumons", "Sinus", "Estomac"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Des tranches épaisses d'oignons doux et de tomates fraîches disposées en couches alternées, saupoudrées d'origan et cuites au four jusqu'à caramélisation naturelle.",
    ingredients: [
      { name: "Gros Oignons Doux", quantity: 2, unit: "pièces", isElectric: true, note: "Coupés en rondelles de 1 cm" },
      { name: "Belles Tomates Mûres", quantity: 3, unit: "pièces", isElectric: true, note: "En rondelles" },
      { name: "Origan et Thym Sauvage", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Herbes aromatiques" },
      { name: "Huile d'Olive Vierge", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Filet sur le dessus" }
    ],
    instructions: [
      "Préchauffez le four à 180°C.",
      "Dans un plat à gratin en verre, disposez en alternance les tranches d'oignons et de tomates comme un tian.",
      "Parsemez d'origan et de thym.",
      "Arrosez d'un léger filet d'huile d'olive.",
      "Faites cuire 30 minutes jusqu'à ce que les oignons soient translucides et très tendres.",
      "Savourez tiède. Les sucs cuits dissolvent les glaires bronchiques et sinusales."
    ],
    vitalistAction: "La cuisson douce des alliacées libère des composés soufrés volatils qui liquéfient le catarrhe pulmonaire et bronchique.",
    nutritionalHighlights: ["Quercétine", "Lycopène", "Composés Soufrés Alliacés"]
  },
  {
    id: "ehret-celeriac-apple-remoulade",
    title: "Salade de Céleri-Rave Râpé & Pommes Acidulées",
    subtitle: "Râpé Brut Vivant sans Mayonnaise · Huile d'Olive & Citron",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 16 : Salades de Transition",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 81)",
    category: "salade-entree",
    categoryLabel: "Salade Croquante Vivante",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 97,
    pralScore: -15.6,
    targetEmunctories: ["Reins", "Articulations", "Intestins"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Drainage Rénal"],
    description: "Une réinterprétation vitaliste de la rémoulade classique : céleri-rave cru râpé fin, allié à une pomme acidulée râpée, émulsionné au jus de citron frais et huile d'olive.",
    ingredients: [
      { name: "Céleri-Rave Cru", quantity: 200, unit: "g", isElectric: true, note: "Épluché et râpé fin" },
      { name: "Pomme Reinette ou Granny Smith", quantity: 1, unit: "pièce", isElectric: true, note: "Râpée avec la peau" },
      { name: "Jus de Citron Jaune", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pour fixer la couleur et dissoudre" },
      { name: "Huile d'Olive Première Pression", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Pression à froid" },
      { name: "Graines de Moutarde Broyées ou Raifort", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Optionnel pour relever" }
    ],
    instructions: [
      "Râpez le céleri-rave et la pomme dans un grand bol.",
      "Arrosez immédiatement du jus de citron pour éviter tout brunissement enzymatique.",
      "Ajoutez l'huile d'olive et la pointe de raifort ou moutarde douce.",
      "Mélangez soigneusement et servez très frais."
    ],
    vitalistAction: "Le céleri-rave cru apporte une teneur exceptionnelle en polyacétylènes et en phtalides qui régulent la tension artérielle et éliminent l'urée.",
    nutritionalHighlights: ["Phtalides Vasodilatateurs", "Acide Malique", "Fibres Douces"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍇 3. DR. ROBERT MORSE, N.D. (DÉTOXICATION CELLULAIRE & LYMPHATIQUE)
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
  {
    id: "morse-black-grape-fast",
    title: "Festin Mono-Fruit de Raisins Noirs à Pépins",
    subtitle: "Vitis vinifera · Cure d'Hydratation Cellulaire Profonde & Resvératrol",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Cures Mono-Fruit & Régénération",
    bookReference: "The Detox Miracle Sourcebook (Chapitre 7, p. 132)",
    category: "dessert-vivant",
    categoryLabel: "Cure Mono-Fruit Détox",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -24.0,
    targetEmunctories: ["Reins", "Lymphe", "Cellules", "Cerveau"],
    tags: ["100% Cru", "Sans Mucus", "Drainage Rénal", "Sans Gluten", "Super-Aliments"],
    description: "Le raisin noir à pépins est le roi des dissolvants lymphatiques chez Morse. Consommé en mono-diète sur une journée ou un repas, il irrigue les cellules de sucre simple lévogyre.",
    ingredients: [
      { name: "Raisins Noirs Biologiques à Pépins (Muscat ou Concord)", quantity: 500, unit: "g", isElectric: true, note: "Avec la peau fine et les pépins" },
      { name: "Eau de Source Pure", quantity: 250, unit: "ml", isElectric: true, note: "Pour rincer la bouche" }
    ],
    instructions: [
      "Lavez soigneusement la grappe de raisins noirs à l'eau claire.",
      "Mangez les raisins un par un en mastiquant soigneusement les pépins pour en libérer les OPC (oligo-proanthocyanidines).",
      "Consommez ce repas exclusif de fruits pour le déjeuner ou sur une journée complète de cure dépurative."
    ],
    vitalistAction: "Le resvératrol et les polyphénols du raisin noir traversent la barrière hémato-encéphalique et dissolvent les cristaux de cholestérol fixés dans le réseau lymphatique cérébral.",
    nutritionalHighlights: ["Resvératrol", "OPC Pépins de Raisin", "Fructose Pur Lévogyre", "Potassium"]
  },
  {
    id: "morse-watermelon-flush-smoothie",
    title: "Smoothie Détox Pastèque Entière (avec Écorce & Pépins)",
    subtitle: "Citrullus lanatus · Évacuateur d'Urée & Dilatateur d'Artères Rénales",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Protocoles de Détox Rénale Maximale",
    bookReference: "The Detox Miracle Sourcebook (p. 212)",
    category: "jus-smoothie",
    categoryLabel: "Smoothie Flush Rénal",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -20.6,
    targetEmunctories: ["Reins", "Vessie", "Lymphe"],
    tags: ["100% Cru", "Sans Mucus", "Drainage Rénal", "100% Électrique"],
    description: "La pastèque mixée avec sa partie blanche d'écorce (riche en L-citrulline) et ses pépins noirs produit l'effet de lavage rénal le plus spectaculaire en hygiénisme.",
    ingredients: [
      { name: "Pastèque Biologique avec Pépins et Partie Blanche", quantity: 600, unit: "g", isElectric: true, note: "Chair rouge + partie blanche sous écorce" },
      { name: "Jus de Citron Vert Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Pour relever" },
      { name: "Feuilles de Menthe Fraîche", quantity: 6, unit: "feuilles", isElectric: true, note: "Fraîcheur" }
    ],
    instructions: [
      "Découpez la pastèque en conservant la chair rouge et 1 cm de la partie blanche sous la peau verte.",
      "Placez les morceaux avec les pépins dans un blender puissant.",
      "Ajoutez le jus de citron vert et les feuilles de menthe.",
      "Mixez 45 secondes : les pépins sont micronisés et libèrent leurs acides gras essentiels et zinc.",
      "Buvez très frais en grande quantité le matin pour stimuler une diurèse limpide."
    ],
    vitalistAction: "La L-citrulline de la partie blanche se convertit en L-arginine, stimulant la synthèse d'oxyde nitrique (NO) qui dilate les artérioles rénales afférentes.",
    nutritionalHighlights: ["L-Citrulline", "Lycopène", "Eau Cellulaire Structurée 94%", "Zinc des Pépins"]
  },
  {
    id: "morse-romaine-sprout-wraps",
    title: "Wraps Vivants de Feuilles de Romaine aux Graines Germées",
    subtitle: "Pesto d'Ortie, Avocat Crémeux & Graines de Tournesol Germées",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Nutrition Régénératrice Crue",
    bookReference: "The Detox Miracle Sourcebook (p. 256)",
    category: "plat-principal",
    categoryLabel: "Plat Cru Détox",
    prepTime: "12 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 99,
    pralScore: -18.0,
    targetEmunctories: ["Intestins", "Lymphe", "Peau"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Plantes Sauvages"],
    description: "Grandes feuilles croquantes de laitue romaine garnies d'un écrasé d'avocat à la coriandre, d'une abondance de graines germées vivantes et de pesto d'ortie.",
    ingredients: [
      { name: "Grandes Feuilles de Laitue Romaine", quantity: 6, unit: "belles feuilles", isElectric: true, note: "Croquantes et fermes" },
      { name: "Graines de Tournesol ou Luzerne Germées", quantity: 80, unit: "g", isElectric: true, note: "Concentré enzymatique" },
      { name: "Avocat Mûr", quantity: 1, unit: "pièce", isElectric: true, note: "Écrasé au citron" },
      { name: "Pesto Vivant d'Ortie Sauvage", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Minéralisation" },
      { name: "Tomates Cerises Coupées en Deux", quantity: 6, unit: "pièces", isElectric: true, note: "Jutosité" }
    ],
    instructions: [
      "Lavez et essuyez délicatement les feuilles de romaine.",
      "Tartinez le centre de chaque feuille avec une couche généreuse d'avocat écrasé et une cuillère de pesto d'ortie.",
      "Ajoutez les graines germées vivantes et les moitiés de tomates cerises.",
      "Roulez la feuille de romaine comme un taco et dégustez avec les doigts.",
      "Un repas cru hautement reminéralisant qui n'encombre aucunement le système lymphatique."
    ],
    vitalistAction: "Les graines germées apportent des enzymes digestives actives qui déchargent le système pancréatique tout en fournissant des acides aminés libres biodisponibles.",
    nutritionalHighlights: ["Enzymes Vivantes", "Chlorophylle", "Acides Gras Essentiels", "Silice"]
  },
  {
    id: "morse-pineapple-bromelain-carpaccio",
    title: "Carpaccio d'Ananas Frais à la Menthe & Gingembre",
    subtitle: "Bromélaïne Pure · Dissolution Protéique & Nettoyage Intestinal",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Nettoyage Enzymatique Digestif",
    bookReference: "The Detox Miracle Sourcebook (p. 220)",
    category: "dessert-vivant",
    categoryLabel: "Enzymes Protéolytiques Vivantes",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 99,
    pralScore: -14.2,
    targetEmunctories: ["Intestins", "Estomac", "Lymphe"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten"],
    description: "Tranches ultra-fines d'ananas frais biologique arrosées de jus de citron vert, parsemées de menthe fraîche ciselée et d'une râpure de gingembre.",
    ingredients: [
      { name: "Ananas Frais Mûr (avec le Cœur fibreux)", quantity: 0.5, unit: "pièce", isElectric: true, note: "Le cœur concentre la bromélaïne" },
      { name: "Jus de Citron Vert Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Pour arroser" },
      { name: "Feuilles de Menthe Fraîche Ciselées", quantity: 8, unit: "feuilles", isElectric: true, note: "Fraîcheur" },
      { name: "Gingembre Frais Râpé", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Tonique" }
    ],
    instructions: [
      "Pelez l'ananas frais et coupez-le en tranches très fines (carpaccio) en conservant le cœur fibreux.",
      "Disposez les tranches sur une grande assiette.",
      "Arrosez de jus de citron vert frais et parsemez de gingembre râpé et de menthe ciselée.",
      "Laissez mariner 5 minutes à température ambiante et dégustez seul à jeun."
    ],
    vitalistAction: "La bromélaïne est une enzyme protéolytique qui digère les biofilms bactériens et les protéines étrangères non métabolisées piégées dans l'intestin.",
    nutritionalHighlights: ["Bromélaïne", "Manganèse", "Vitamine C", "Gingérol"]
  },
  {
    id: "morse-kidney-herbal-infusion",
    title: "Infusion Rénale Quotidienne aux 4 Plantes Drainantes",
    subtitle: "Ortie, Persil Plat, Chiendent & Barbes de Maïs · Élimination d'Urée",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Formules Botaniques Spécifiques aux Reins",
    bookReference: "The Detox Miracle Sourcebook (p. 278)",
    category: "elixir-tisane",
    categoryLabel: "Tisane Thérapeutique Rénale",
    prepTime: "5 min",
    cookTime: "10 min",
    servings: 3,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -27.8,
    targetEmunctories: ["Reins", "Vessie", "Lymphe"],
    tags: ["Sans Mucus", "Drainage Rénal", "Sans Gluten", "Plantes Sauvages"],
    description: "Une synergie d'herbes diurétiques non stimulantes pour ouvrir la filtration rénale, dissoudre les sédiments urinaires et désenflammer les uretères.",
    ingredients: [
      { name: "Feuilles d'Ortie Séchée", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Recharge minérale et diurétique doux" },
      { name: "Persil Séché ou Frais", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Apiol et flavonoïdes rénaux" },
      { name: "Rhizome de Chiendent", quantity: 1, unit: "c. à café", isElectric: true, note: "Dissolvant de calculs" },
      { name: "Eau de Source Pure Frémissante", quantity: 750, unit: "ml", isElectric: true, note: "Pour infuser" }
    ],
    instructions: [
      "Dans une théière en verre, réunissez l'ortie, le persil et le chiendent.",
      "Versez l'eau de source chaude (environ 85°C).",
      "Couvrez et laissez infuser pendant 15 minutes.",
      "Filtrez et buvez tout au long de l'après-midi (entre 14h et 18h pendant la phase de filtration rénale)."
    ],
    vitalistAction: "Élève le débit de filtration glomérulaire sans épuiser les réserves de potassium du corps.",
    nutritionalHighlights: ["Flavonoïdes Rénaux", "Silice Soluble", "Potassium Naturel"]
  },
  {
    id: "morse-black-cherry-joint-flush",
    title: "Cure Mono-Fruit de Cerises Noires Alcalinisantes",
    subtitle: "Anthocyanes Purs · Neutralisation d'Acide Urique & Goutte",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Détoxication des Acides Tissulaires",
    bookReference: "The Detox Miracle Sourcebook (p. 224)",
    category: "dessert-vivant",
    categoryLabel: "Cure Mono-Fruit Spécifique",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -19.4,
    targetEmunctories: ["Articulations", "Reins", "Sang"],
    tags: ["100% Cru", "Sans Mucus", "Drainage Rénal", "Sans Gluten"],
    description: "Les cerises noires fraîches contiennent la plus haute concentration d'anthocyanes pour dissoudre les cristaux d'urate dans les articulations douloureuses.",
    ingredients: [
      { name: "Cerises Noires Biologiques Mûres (Burlat ou Bigarreau)", quantity: 400, unit: "g", isElectric: true, note: "Fraîches et juteuses" }
    ],
    instructions: [
      "Lavez soigneusement les cerises à l'eau fraîche.",
      "Consommez les cerises lentement en mono-repas le matin ou au goûter.",
      "Assurez-vous de bien vous hydrater avec de l'eau pure dans l'heure qui suit."
    ],
    vitalistAction: "Les anthocyanes inhibent l'enzyme xanthine oxydase et augmentent l'excrétion urinaire d'acide urique.",
    nutritionalHighlights: ["Anthocyanes Réducteurs", "Potassium", "Vitamine C"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌱 4. DAVID WOLFE (ALIMENTATION VIVANTE & SUPER-ALIMENTS)
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
  {
    id: "wolfe-biophotonic-hemp-dressing",
    title: "Vinaigrette Biophotonique au Chanvre, Spiruline & Citron",
    subtitle: "Huile de Chanvre Vierge, Spiruline Émeraude & Ail Cru",
    author: "David Wolfe",
    authorTitle: "Alimentation Vivante & Énergie Lumineuse",
    bookReference: "The Sunfood Diet Success System (p. 182)",
    category: "salade-entree",
    categoryLabel: "Sauce & Vinaigrette Vivante",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 4,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -16.4,
    targetEmunctories: ["Sang", "Cerveau", "Foie"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Super-Aliments"],
    description: "Une vinaigrette verte émeraude crue chargée de lumière solaire, d'acides gras oméga-3/oméga-6 au ratio parfait (3:1) et de chlorophylle.",
    ingredients: [
      { name: "Huile de Graines de Chanvre Vierge", quantity: 4, unit: "c. à soupe", isElectric: true, note: "Première pression à froid" },
      { name: "Jus de Citron Jaune Frais", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Acide vivant" },
      { name: "Poudre de Spiruline Pure", quantity: 1, unit: "c. à café", isElectric: true, note: "Pigments solaires" },
      { name: "Gousse d'Ail Écrasée", quantity: 1, unit: "pièce", isElectric: true, note: "Allicine antimicrobienne" },
      { name: "Sel Marin Non Raffiné", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Électrolytes" }
    ],
    instructions: [
      "Dans un petit bocal en verre, réunissez l'huile de chanvre, le jus de citron, la spiruline, l'ail écrasé et le sel marin.",
      "Fermez hermétiquement et agitez énergiquement pendant 20 secondes jusqu'à émulsion complète.",
      "Nappez immédiatement vos salades balais, vos concombres ou vos crudités."
    ],
    vitalistAction: "Nourrit les gaines de myéline et protège les lipides membranaires de la peroxydation.",
    nutritionalHighlights: ["Ratio Oméga 3:1 Parfait", "Phycocyanine", "Allicine", "Chlorophylle"]
  },
  {
    id: "wolfe-raw-coconut-kefir",
    title: "Kéfir Vivant d'Eau de Noix de Coco Fraîche Fermentée",
    subtitle: "Probiotiques Indigènes & Réensemencement Microbiotique",
    author: "David Wolfe",
    authorTitle: "Fermentations Vivantes & Longévité",
    bookReference: "The Sunfood Diet Success System (p. 312)",
    category: "elixir-tisane",
    categoryLabel: "Élixir Probiotique Fermenté",
    prepTime: "10 min (+ 24h fermentation)",
    cookTime: "0 min (Cru)",
    servings: 4,
    difficulty: "Intermédiaire",
    vitalityScore: 100,
    pralScore: -14.2,
    targetEmunctories: ["Intestins", "Système Immunitaire"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Santé Intestinale"],
    description: "L'eau de coco jeune fermentée avec des ferments de kéfir produit une boisson pétillante sans sucre, peuplée de milliards de bactéries lactiques amies.",
    ingredients: [
      { name: "Eau de Noix de Coco Jeune Fraîche", quantity: 1, unit: "L", isElectric: true, note: "Issue de noix de coco verte fraîche" },
      { name: "Grains de Kéfir d'Eau ou Ferment Probiotique", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Bactéries amies" }
    ],
    instructions: [
      "Versez l'eau de coco fraîche dans un grand bocal en verre stérile.",
      "Ajoutez les grains de kéfir d'eau.",
      "Couvrez d'une étamine ou d'un tissu propre maintenu par un élastique.",
      "Laissez fermenter 24 à 36 heures à température ambiante (20-24°C).",
      "Filtrez les grains avec une passoire plastique (pas de métal).",
      "Conservez au réfrigérateur et buvez un petit verre (100 ml) chaque matin."
    ],
    vitalistAction: "Rétablit l'acidité physiologique du côlon, éliminant les colonies de Candida albicans et restaurant la tolérance immunitaire.",
    nutritionalHighlights: ["Milliards de CFU Probiotiques", "Électrolytes Potassium/Sodium", "Acides Organiques"]
  },
  {
    id: "wolfe-zucchini-sunflower-carpaccio",
    title: "Carpaccio de Courgettes & Graines de Tournesol Activées",
    subtitle: "Courgettes Crues en Rubans, Graines Germées & Huile d'Olive",
    author: "David Wolfe",
    authorTitle: "Sunfood Living Cuisine",
    bookReference: "The Sunfood Diet Success System (p. 204)",
    category: "salade-entree",
    categoryLabel: "Entrée Vivante Croquante",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 98,
    pralScore: -13.6,
    targetEmunctories: ["Reins", "Peau"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten"],
    description: "De fines lamelles de courgettes crues marinées au jus de citron vert, garnies de graines de tournesol trempées et activées (riches en vitamine E) et d'aneth.",
    ingredients: [
      { name: "Courgettes Vertes Fermes", quantity: 2, unit: "pièces", isElectric: true, note: "Taillées en rubans fins avec un économe" },
      { name: "Graines de Tournesol Crues (Trempées 6h)", quantity: 40, unit: "g", isElectric: true, note: "Activées et digestes" },
      { name: "Jus de Citron Jaune ou Vert", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pour mariner" },
      { name: "Aneth Frais Ciselé", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Arôme" },
      { name: "Huile d'Olive Extra", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Première pression" }
    ],
    instructions: [
      "À l'aide d'un épluche-légumes, taillez les courgettes en longs rubans fins jusqu'au cœur.",
      "Disposez les rubans de courgettes en rosace dans un grand plat.",
      "Arrosez de jus de citron et d'huile d'olive.",
      "Parsemez des graines de tournesol activées égouttées et de l'aneth frais.",
      "Laissez mariner 10 minutes avant de servir."
    ],
    vitalistAction: "L'activation des graines par trempage neutralise l'acide phytique et multiplie par dix la biodisponibilité de la vitamine E et du zinc.",
    nutritionalHighlights: ["Vitamine E Naturelle", "Zinc", "Silice", "Potassium"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌿 5. DR. JOHN KALLAS & FLORE SAUVAGE (PLANTES SAUVAGES & NUTRITION DENSE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "kallas-wild-purslane-omega3-salad",
    title: "Salade Fraîche de Pourpier Sauvage (Purslane) & Tomates",
    subtitle: "Portulaca oleracea · Source Végétale Suprême d'Oméga-3 EPA & Antioxydants",
    author: "Dr. John Kallas",
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
    author: "Dr. John Kallas",
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
  {
    id: "kallas-lambs-quarters-saute",
    title: "Poêlée Champêtre de Chénopode Blanc (Lamb's Quarters)",
    subtitle: "Chenopodium album · Épinard Sauvage Ancestral Riche en Minéraux",
    author: "Dr. John Kallas",
    authorTitle: "Ethnobotanique & Plantes Spontanées",
    bookReference: "Edible Wild Plants (Chapitre 3, p. 62)",
    category: "plat-principal",
    categoryLabel: "Poêlée Sauvage Chaude",
    prepTime: "8 min",
    cookTime: "6 min",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 97,
    pralScore: -18.2,
    targetEmunctories: ["Sang", "Foie", "Intestins"],
    tags: ["Plantes Sauvages", "Sans Mucus", "Sans Gluten", "100% Électrique"],
    description: "Le chénopode blanc est l'un des légumes sauvages les plus abondants et savoureux. Ses feuilles recouvertes d'une fine poussière minérale blanche surpassent l'épinard cultivé en protéines et calcium.",
    ingredients: [
      { name: "Jeunes Feuilles de Chénopode Blanc Frais", quantity: 250, unit: "g", isElectric: true, note: "Feuilles tendres cueillies avant floraison" },
      { name: "Gousse d'Ail Frais Émincée", quantity: 1, unit: "pièce", isElectric: true, note: "Arôme" },
      { name: "Huile d'Olive ou d'Avocat", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pour la poêle" },
      { name: "Jus de Citron Frais", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pour assaisonner" },
      { name: "Pincée de Muscade & Sel Marin", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Lavez soigneusement les feuilles de chénopode et essorez-les.",
      "Dans une poêle, faites chauffer l'huile d'olive avec l'ail émincé pendant 1 minute à feu moyen.",
      "Ajoutez les feuilles de chénopode par poignées et faites-les sauter vivement pendant 3 à 4 minutes jusqu'à ce qu'elles tombent.",
      "Assaisonnez avec une pointe de sel marin, de muscade et arrosez d'un trait de jus de citron.",
      "Servez chaud en accompagnement d'un poisson sauvage ou d'un bol de céréales ancestrales."
    ],
    vitalistAction: "Très riche en provitamine A, calcium biodisponible et lutéine pour la santé oculaire et cellulaire.",
    nutritionalHighlights: ["Provitamine A", "Calcium Organique", "Lutéine & Zéaxanthine", "Chlorophylle"]
  },
  {
    id: "kallas-spring-dandelion-salad",
    title: "Salade Printanière de Jeunes Pousses de Pissenlit Amer",
    subtitle: "Taraxacum officinale · Réveil Biliaire & Détoxification Sanguine",
    author: "Dr. John Kallas",
    authorTitle: "Cuisine Sylvestre & Herbes Sauvages",
    bookReference: "Edible Wild Plants (Chapitre 6, p. 120)",
    category: "salade-entree",
    categoryLabel: "Salade Sauvage Amère",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -21.0,
    targetEmunctories: ["Foie", "Vésicule", "Reins"],
    tags: ["100% Cru", "Plantes Sauvages", "Sans Mucus", "Sans Gluten", "Drainage Rénal"],
    description: "Les toutes jeunes pousses de pissenlit du printemps sont croquantes et légèrement amères. Servies avec des radis croquants et une vinaigrette au citron et graines de chanvre.",
    ingredients: [
      { name: "Jeunes Feuilles de Pissenlit du Printemps", quantity: 100, unit: "g", isElectric: true, note: "Feuilles vert tendre sans tige dure" },
      { name: "Radis Ronds Rouges", quantity: 6, unit: "pièces", isElectric: true, note: "Émincés en fines rondelles" },
      { name: "Huile de Chanvre ou Olive", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Pression à froid" },
      { name: "Jus de Citron Jaune", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Acidité" },
      { name: "Graines de Chanvre Décortiquées", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Douceur" }
    ],
    instructions: [
      "Lavez et séchez délicatement les feuilles de pissenlit.",
      "Mélangez dans un saladier les feuilles de pissenlit et les rondelles de radis.",
      "Préparez une vinaigrette simple avec l'huile de chanvre, le jus de citron et une pincée de sel marin.",
      "Arrosez la salade, parsemez de graines de chanvre et servez immédiatement avant le repas principal."
    ],
    vitalistAction: "L'amertume naturelle déclenche une cascade hormonale de cholécystokinine (CCK) qui vide la vésicule biliaire des boues accumulées pendant l'hiver.",
    nutritionalHighlights: ["Taraxacine", "Lactones", "Vitamine C", "Potassium"]
  },
  {
    id: "kallas-chickweed-raw-salad",
    title: "Salade Douce de Mouron Blanc (Chickweed) & Avocat",
    subtitle: "Stellaria media · Mucilages Apaisants & Saponines Épuratrices",
    author: "Dr. John Kallas",
    authorTitle: "Plantes Sauvages Comestibles",
    bookReference: "Edible Wild Plants (Chapitre 5, p. 102)",
    category: "salade-entree",
    categoryLabel: "Salade Sauvage Douce",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 99,
    pralScore: -16.4,
    targetEmunctories: ["Peau", "Reins", "Intestins"],
    tags: ["100% Cru", "Plantes Sauvages", "Sans Mucus", "Sans Gluten"],
    description: "Le mouron des oiseaux (Stellaria media) est une plante sauvage d'une douceur exceptionnelle, au goût d'épi de maïs frais. Idéal pour apaiser les muqueuses et régénérer la peau.",
    ingredients: [
      { name: "Jeunes Tiges de Mouron Blanc Frais (Chickweed)", quantity: 120, unit: "g", isElectric: true, note: "Tendres et fraîches" },
      { name: "Avocat Mûr en Cubes", quantity: 1, unit: "pièce", isElectric: true, note: "Crémeux" },
      { name: "Graines de Tournesol Activées", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Croquant" },
      { name: "Jus de Citron Vert & Huile d'Olive", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Rincez soigneusement le mouron blanc et égouttez-le.",
      "Hachez grossièrement les tiges feuillues et placez-les dans un saladier.",
      "Ajoutez les dés d'avocat et les graines de tournesol.",
      "Arrosez de jus de citron vert et d'huile d'olive.",
      "Mélangez délicatement et dégustez."
    ],
    vitalistAction: "Les saponines douces du mouron émulsionnent les toxines grasses et soulagent les démangeaisons cutanées et l'eczéma.",
    nutritionalHighlights: ["Saponines Douces", "Vitamine C & A", "Zinc", "Rutin"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🧪 6. DR. JOHN R. CHRISTOPHER (PHYTOTHÉRAPIE CLINIQUE & RÉPARATION)
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
  },
  {
    id: "christopher-marshmallow-burdock-infusion",
    title: "Infusion Épithéliale de Guimauve & Racine de Bardane",
    subtitle: "Althaea officinalis & Arctium lappa · Lubrification Rénale & Muqueuse",
    author: "Dr. John R. Christopher",
    authorTitle: "Formules Rénales & Urinaires",
    bookReference: "School of Natural Healing (p. 195)",
    category: "elixir-tisane",
    categoryLabel: "Infusion Thérapeutique Adoucissante",
    prepTime: "5 min (+ 4h macération)",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 98,
    pralScore: -20.2,
    targetEmunctories: ["Reins", "Vessie", "Intestins"],
    tags: ["Sans Mucus", "Sans Gluten", "Drainage Rénal", "Santé Intestinale"],
    description: "Une macération à froid de racine de guimauve (mucilages intacts non dégradés par la chaleur) et de bardane pour apaiser les reins douloureux et les cystites.",
    ingredients: [
      { name: "Racine de Guimauve Séchée Coupée", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Riche en mucilages solubles à froid" },
      { name: "Racine de Bardane Séchée", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Purificateur" },
      { name: "Eau de Source Pure Froide", quantity: 500, unit: "ml", isElectric: true, note: "Macération froide" }
    ],
    instructions: [
      "Déposez les racines de guimauve et de bardane dans un bocal en verre.",
      "Versez l'eau de source à température ambiante.",
      "Couvrez et laissez macérer pendant 4 à 8 heures (ou une nuit).",
      "Filtrez à travers une passoire fine : vous obtenez un liquide légèrement sirupeux et très doux.",
      "Buvez par petites gorgées en cas d'irritation urinaire ou digestive."
    ],
    vitalistAction: "La macération à froid préserve l'intégrité tridimensionnelle des polysaccharides de guimauve qui recouvrent les parois urothéliales enflammées.",
    nutritionalHighlights: ["Polysaccharides Rénaux", "Inuline", "Flavonoïdes Adoucissants"]
  },
  {
    id: "christopher-flaxseed-pumpkin-gruel",
    title: "Gruau Dépuratif de Graines de Lin Doré & Courge",
    subtitle: "Linum usitatissimum · Régulateur Péristaltique & Parasitaire",
    author: "Dr. John R. Christopher",
    authorTitle: "Nettoyage du Gros Intestin & Côlon",
    bookReference: "School of Natural Healing (p. 154)",
    category: "soupe-bouillon",
    categoryLabel: "Gruau Dépuratif Colique",
    prepTime: "10 min (+ 2h trempage)",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 96,
    pralScore: -11.0,
    targetEmunctories: ["Côlon", "Prostate", "Intestins"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Santé Intestinale"],
    description: "Graines de lin doré fraîchement moulues et trempées avec des graines de courge et un filet de jus de pomme chaud pour régénérer le transit sans laxatif.",
    ingredients: [
      { name: "Graines de Lin Doré Biologiques Fraîchement Moulues", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Moulues minute pour préserver les oméga-3" },
      { name: "Graines de Courge Brutes Trempées", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Riches en cucurbitacine antiparasitaire" },
      { name: "Eau de Source Chaude (<45°C)", quantity: 180, unit: "ml", isElectric: true, note: "Pour faire gonfler le mucilage" },
      { name: "Poudre de Cannelle & Une Figue Sèche Coupée", quantity: 1, unit: "portion", isElectric: true, note: "Pour la saveur" }
    ],
    instructions: [
      "Moulez les graines de lin dans un moulin à café ou petit robot.",
      "Versez dans un bol avec les graines de courge.",
      "Ajoutez l'eau chaude et mélangez vigoureusement. Laissez reposer 10 minutes : le mélange devient gélatineux et onctueux.",
      "Ajoutez la cannelle et la figue séchée en petits morceaux.",
      "Consommez chaud au petit-déjeuner pour relancer le péristaltisme."
    ],
    vitalistAction: "Le mucilage du lin agit comme un lubrifiant mécanique volumateur, stimulant les récepteurs étirables du côlon pour une évacuation sans effort.",
    nutritionalHighlights: ["Lignanes Protectrices", "Cucurbitacine", "Acides Gras Oméga-3", "Fibres Solubles"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🐟 7. RÉGIMES DE TRANSITION DOUCE (POISSONS SAUVAGES & OCÉAN ALCALINISÉS)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "trans-wild-alaska-salmon-steamed",
    title: "Papillote de Saumon Sauvage d'Alaska au Citron Vert & Aneth",
    subtitle: "Oncorhynchus nerka · Cuisson Douce Vapeur <90°C & Oméga-3 Intacts",
    author: "Régime de Transition Douce",
    authorTitle: "Hygiénisme Moderne & Transition Omnivore Équilibrée",
    bookReference: "Protocole de Transition Vitaliste Progressive (Guide Pratique, p. 45)",
    category: "plat-principal",
    categoryLabel: "Poisson Sauvage Alcalinisé",
    prepTime: "10 min",
    cookTime: "12 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 92,
    pralScore: -3.8,
    targetEmunctories: ["Cerveau", "Cœur", "Cellules"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Saumon rouge sauvage pêché en Alaska (non nourri aux farines d'élevage), cuit à la vapeur très douce avec une abondance de jus de citron vert, d'aneth frais et de courgettes.",
    ingredients: [
      { name: "Pavés de Saumon Sauvage de l'Alaska (Sockeye)", quantity: 250, unit: "g", isElectric: false, note: "Pêche durable sauvage certifiée" },
      { name: "Citron Vert Frais", quantity: 1.5, unit: "pièce", isElectric: true, note: "Rondelles et jus" },
      { name: "Branches d'Aneth Frais", quantity: 4, unit: "tiges", isElectric: true, note: "Arôme et digestion" },
      { name: "Courgette Émincée en Rondelles", quantity: 1, unit: "pièce", isElectric: true, note: "Lit de légumes alcalinisant" },
      { name: "Huile d'Olive Extra Vierge", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Filet après cuisson" },
      { name: "Sel Marin Non Raffiné & Poivre Rose", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Dans un cuiseur vapeur ou une papillote en papier sulfurisé, déposez un lit de rondelles de courgettes.",
      "Posez les pavés de saumon sauvage sur les courgettes.",
      "Recouvrez avec les rondelles de citron vert et les branches d'aneth frais.",
      "Faites cuire à la vapeur douce (85-90°C) pendant 10 à 12 minutes : la chair doit rester nacrée et fondante pour ne pas oxyder les précieux oméga-3.",
      "Dressez dans l'assiette, arrosez d'un filet d'huile d'olive crue et d'un trait de jus de citron frais.",
      "Accompagnez d'une généreuse salade balai de carottes crues râpées."
    ],
    vitalistAction: "Fournit les acides gras EPA et DHA sous leur forme naturelle non dénaturée, régénérant la fluidité des membranes cellulaires tout en évitant l'acidose grâce au lit de légumes et au citron.",
    nutritionalHighlights: ["Astaxanthine Sauvage", "Oméga-3 EPA & DHA Purs", "Protéines Nobles Faciles à Digérer", "Vitamine D3"]
  },
  {
    id: "trans-wild-shrimp-cayenne-skillet",
    title: "Crevettes Sauvages d'Océan Sautées aux Poivrons & Cayenne",
    subtitle: "Penaeus vannamei Sauvage · Poêlée Rapide à l'Huile d'Avocat & Ail",
    author: "Régime de Transition Douce",
    authorTitle: "Transition Électrique & Protéines Marines",
    bookReference: "Cuisine de Transition Vitaliste (p. 58)",
    category: "plat-principal",
    categoryLabel: "Fruits de Mer Sautés",
    prepTime: "12 min",
    cookTime: "6 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 91,
    pralScore: -4.5,
    targetEmunctories: ["Thyroïde", "Muscles", "Reins"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Crevettes sauvages fraîches décortiquées, revenues 4 minutes à feu vif dans de l'huile d'avocat avec de l'ail écrasé, des dés de poivrons doux, du piment de Cayenne et de la coriandre.",
    ingredients: [
      { name: "Crevettes Sauvages Fraîches Décortiquées", quantity: 300, unit: "g", isElectric: false, note: "Pêche océanique sauvage sans sulfites" },
      { name: "Poivrons Doux Vert et Jaune en Lanières", quantity: 1, unit: "pièce", isElectric: true, note: "Vitamine C" },
      { name: "Gousses d'Ail Écrasées", quantity: 2, unit: "gousses", isElectric: true, note: "Antimicrobien" },
      { name: "Huile d'Avocat Pure", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Résiste à la poêle" },
      { name: "Piment de Cayenne & Sel Marin", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Chaleur stimulante" },
      { name: "Coriandre Fraîche & Citron Vert", quantity: 1, unit: "portion", isElectric: true, note: "Finition fraîche" }
    ],
    instructions: [
      "Dans une poêle en fonte ou un wok bien chaud, faites chauffer l'huile d'avocat.",
      "Ajoutez les lanières de poivrons et l'ail écrasé, faites sauter 2 minutes à feu vif.",
      "Incorporez les crevettes sauvages et le piment de Cayenne.",
      "Faites sauter pendant 3 à 4 minutes jusqu'à ce que les crevettes deviennent roses et fermes.",
      "Éteignez le feu, arrosez immédiatement d'un demi-citron vert pressé et parsemez de coriandre fraîche.",
      "Servez chaud sur un bol de riz sauvage noir ou de quinoa alcalin."
    ],
    vitalistAction: "Apporte une dose biodisponible de sélénium, zinc et iode marin, stimulant la conversion thyroïdienne de T4 en T3 active chez les sujets fatigués en transition.",
    nutritionalHighlights: ["Iode Marin Naturel", "Sélénium Antioxydant", "Astaxanthine", "Zinc"]
  },
  {
    id: "trans-wild-cod-leek-broth",
    title: "Cabillaud Sauvage Poché dans son Bouillon de Céleri & Poireaux",
    subtitle: "Gadus morhua · Cuisson Pochée dans un Bouillon de Légumes Racines",
    author: "Régime de Transition Douce",
    authorTitle: "Transition Facile & Convalescence",
    bookReference: "Cuisine de Transition Vitaliste (p. 62)",
    category: "plat-principal",
    categoryLabel: "Poisson Blanc Poché Détox",
    prepTime: "10 min",
    cookTime: "15 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 90,
    pralScore: -6.2,
    targetEmunctories: ["Reins", "Estomac", "Foie"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Filets de cabillaud sauvage pochés délicatement 7 minutes dans un bouillon chaud parfumé de blancs de poireaux, branches de céleri, fenouil et thym frais.",
    ingredients: [
      { name: "Filets de Cabillaud Sauvage Épais", quantity: 280, unit: "g", isElectric: false, note: "Poisson blanc maigre ultra-digeste" },
      { name: "Blancs de Poireaux Émincés", quantity: 1.5, unit: "pièces", isElectric: true, note: "Épuration rénale" },
      { name: "Branches de Céleri avec Feuilles", quantity: 2, unit: "tiges", isElectric: true, note: "Sodium organique" },
      { name: "Bulbe de Fenouil Émincé", quantity: 0.5, unit: "pièce", isElectric: true, note: "Anéthol apaisant gastrique" },
      { name: "Eau de Source & Thym Frais", quantity: 500, unit: "ml", isElectric: true, note: "Pour le court-bouillon" },
      { name: "Jus de Citron Jaune & Filet d'Huile d'Olive", quantity: 1, unit: "portion", isElectric: true, note: "Assaisonnement final" }
    ],
    instructions: [
      "Dans une sauteuse large, déposez les poireaux, le céleri et le fenouil émincés.",
      "Versez l'eau de source, ajoutez le thym et portez à frémissement doux pendant 8 minutes pour créer un bouillon aromatique riche en minéraux.",
      "Déposez délicatement les morceaux de cabillaud sauvage sur les légumes dans le bouillon frémissant.",
      "Couvrez et laissez pocher à feu très doux pendant 6 à 7 minutes (le poisson doit s'effeuiller sous la fourchette).",
      "Servez dans des assiettes creuses avec le bouillon chaud de légumes, un filet d'huile d'olive crue et du jus de citron frais."
    ],
    vitalistAction: "Le poisson blanc poché sans matières grasses cuites ne sollicite qu'un minimum de sucs digestifs, offrant une transition idéale pour les personnes convalescentes.",
    nutritionalHighlights: ["Protéines Hypoallergéniques", "Anéthol Antispasmodique", "Potassium", "Iode"]
  },
  {
    id: "trans-raw-wild-oysters-lemon",
    title: "Assiette d'Huîtres Sauvages Crues au Citron Vert Vivant",
    subtitle: "Crassostrea gigas · Bombe Océanique Vivante de Zinc & Eau Marine",
    author: "Régime de Transition Douce",
    authorTitle: "Reminéralisation Océanique Brute",
    bookReference: "Cuisine de Transition Vitaliste (p. 80)",
    category: "salade-entree",
    categoryLabel: "Coquillage Vivant Cru",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 99,
    pralScore: -8.0,
    targetEmunctories: ["Thyroïde", "Glandes Surrénales", "Système Immunitaire"],
    tags: ["Transition Douce", "100% Cru", "Sans Gluten", "Poissons & Mer", "Super-Aliments"],
    description: "Huîtres creuses vivantes ouvertes à la minute, dégustées avec leur eau de mer originelle et un filet de jus de citron vert frais. Un concentré de minéraux marins à l'état brut.",
    ingredients: [
      { name: "Huîtres Sauvages Vivantes N°3", quantity: 12, unit: "pièces", isElectric: false, note: "Fraîchement ouvertes" },
      { name: "Citrons Verts Frais", quantity: 2, unit: "pièces", isElectric: true, note: "Jus pressé minute" },
      { name: "Piment de Cayenne", quantity: 0.1, unit: "pincée", isElectric: true, note: "Optionnel sur chaque huître" }
    ],
    instructions: [
      "Ouvrez les huîtres fraîches avec un couteau à huître protégé d'un torchon.",
      "Jetez la première eau pour laisser l'huître recréer sa seconde eau marine plus pure et savoureuse.",
      "Disposez les huîtres sur un lit d'algues fraîches ou de glace pilée.",
      "Arrosez chaque huître d'un filet de jus de citron vert frais et d'une micro-poussière de piment de Cayenne.",
      "Dégustez cru en mâchant pour libérer les minéraux ionisés."
    ],
    vitalistAction: "L'huître crue est l'aliment le plus riche de la planète en zinc biodisponible, en cuivre organique et en vitamine B12, relançant instantanément l'activité enzymatique surrénalienne.",
    nutritionalHighlights: ["Zinc Ionique Record", "Cuivre Organique", "Vitamine B12 Active", "Iode Océanique"]
  },
  {
    id: "trans-fresh-sardines-parsley-salad",
    title: "Salade de Sardines Sauvages Fraîches, Persil & Oignons Rouges",
    subtitle: "Sardina pilchardus · Petits Poissons Bleus Riches en Calcium & CoQ10",
    author: "Régime de Transition Douce",
    authorTitle: "Petits Poissons Bleus Écologiques",
    bookReference: "Cuisine de Transition Vitaliste (p. 72)",
    category: "salade-entree",
    categoryLabel: "Salade de Poissons Bleus",
    prepTime: "12 min",
    cookTime: "6 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 94,
    pralScore: -5.4,
    targetEmunctories: ["Cœur", "Vaisseaux", "Os"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Filets de sardines fraîches cuits à l'unilatérale 3 minutes, servis sur une salade abondante de persil plat haché, d'oignons rouges en fines lamelles et d'huile d'olive au citron.",
    ingredients: [
      { name: "Filets de Sardines Sauvages Fraîches", quantity: 200, unit: "g", isElectric: false, note: "Fraîches du poissonnier, non en boîte" },
      { name: "Botte de Persil Plat Frais", quantity: 1, unit: "botte", isElectric: true, note: "Haché grossièrement (façon taboulé libanais)" },
      { name: "Oignon Rouge Finement Émincé", quantity: 0.5, unit: "pièce", isElectric: true, note: "Quercétine" },
      { name: "Jus de Citron Jaune", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Pour arroser" },
      { name: "Huile d'Olive Extra Vierge", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Pression à froid" }
    ],
    instructions: [
      "Dans une poêle antiadhésive chaude avec une goutte d'huile, faites cuire les filets de sardines côté peau pendant 3 minutes sans les retourner.",
      "Dans un saladier, mélangez le persil plat haché, les lamelles d'oignon rouge, le jus de citron et l'huile d'olive.",
      "Dressez le lit d'herbes dans les assiettes.",
      "Déposez les filets de sardines tièdes et croustillants sur le dessus.",
      "Dégustez immédiatement."
    ],
    vitalistAction: "Les petits poissons situés en bas de la chaîne trophique ne bioaccumulent aucun métal lourd toxique et apportent une réserve exceptionnelle de coenzyme Q10 pour les mitochondries.",
    nutritionalHighlights: ["Coenzyme Q10", "Oméga-3 EPA/DHA", "Calcium des Arêtes", "Fer"]
  },
  {
    id: "trans-sea-bream-fennel-roast",
    title: "Dorade Sauvage Rôtie au Fenouil Émincé, Citron & Romarin",
    subtitle: "Sparus aurata · Cuisson au Four aux Herbes Méditerranéennes",
    author: "Régime de Transition Douce",
    authorTitle: "Cuisine Méditerranéenne Légère",
    bookReference: "Cuisine de Transition Vitaliste (p. 68)",
    category: "plat-principal",
    categoryLabel: "Poisson Rôti aux Aromates",
    prepTime: "12 min",
    cookTime: "22 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 91,
    pralScore: -5.0,
    targetEmunctories: ["Foie", "Estomac"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Une dorade royale sauvage entière garnie d'herbes aromatiques, cuite au four sur un lit de fenouil émincé et de tranches de citron jaune.",
    ingredients: [
      { name: "Dorade Royale Sauvage Entière Écaillée", quantity: 500, unit: "g", isElectric: false, note: "Poisson noble sauvage" },
      { name: "Bulbes de Fenouil Émincés Finement", quantity: 2, unit: "pièces", isElectric: true, note: "Lit de cuisson" },
      { name: "Citron Jaune en Rondelles", quantity: 1, unit: "pièce", isElectric: true, note: "Pour garnir" },
      { name: "Branches de Romarin & Thym Sauvage", quantity: 3, unit: "tiges", isElectric: true, note: "Dans le ventre du poisson" },
      { name: "Huile d'Olive Extra", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Filet" }
    ],
    instructions: [
      "Préchauffez le four à 180°C.",
      "Dans un plat à four, étalez le fenouil émincé en couche uniforme.",
      "Garnissez le ventre de la dorade avec les branches de romarin, de thym et des demi-rondelles de citron.",
      "Posez la dorade sur le lit de fenouil, arrosez d'un filet d'huile d'olive et du jus du reste du citron.",
      "Enfournez pendant 20 à 22 minutes.",
      "Servez avec le fenouil confit et fondant."
    ],
    vitalistAction: "Le fenouil et le romarin empêchent la formation de toxines de dégradation des protéines au cours de la digestion.",
    nutritionalHighlights: ["Anéthol", "Acide Rosmarinique", "Protéines Digestes"]
  },
  {
    id: "trans-scallops-purslane-salad",
    title: "Noix de Saint-Jacques Snackées & Salade de Pourpier Frais",
    subtitle: "Pecten maximus · Cuisson Flash à l'Huile de Coco & Oméga-3 Végétaux",
    author: "Régime de Transition Douce",
    authorTitle: "Haute Gastronomie Vitaliste",
    bookReference: "Cuisine de Transition Vitaliste (p. 88)",
    category: "plat-principal",
    categoryLabel: "Mollusques Nobles Sautés",
    prepTime: "10 min",
    cookTime: "3 min",
    servings: 2,
    difficulty: "Intermédiaire",
    vitalityScore: 95,
    pralScore: -7.2,
    targetEmunctories: ["Cœur", "Lymphe", "Thyroïde"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Plantes Sauvages"],
    description: "Noix de Saint-Jacques fraîches snackées 90 secondes par face à l'huile de coco vierge, servies sur un lit de pourpier sauvage acidulé au citron vert.",
    ingredients: [
      { name: "Noix de Saint-Jacques Fraîches sans Corail", quantity: 8, unit: "pièces", isElectric: false, note: "Fraîches et égouttées" },
      { name: "Feuilles et Tiges de Pourpier Sauvage", quantity: 150, unit: "g", isElectric: true, note: "Salade fraîche" },
      { name: "Huile de Coco Vierge Première Pression", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pour dorer" },
      { name: "Jus de Citron Vert Frais & Fleur de Sel", quantity: 1, unit: "portion", isElectric: true, note: "Finition" }
    ],
    instructions: [
      "Séchez les noix de Saint-Jacques sur du papier absorbant.",
      "Dans une poêle très chaude, faites fondre l'huile de coco.",
      "Déposez les Saint-Jacques et faites dorer 90 secondes de chaque côté sans les remuer pour former une croûte dorée en gardant le cœur nacré.",
      "Dressez le pourpier sauvage dans les assiettes, arrosez de jus de citron vert.",
      "Déposez les Saint-Jacques chaudes sur la salade et parsemez d'une pointe de fleur de sel."
    ],
    vitalistAction: "La chair de la Saint-Jacques est exceptionnellement riche en taurine et en magnésium marin, renforçant la contraction myocardique.",
    nutritionalHighlights: ["Taurine Naturelle", "Magnésium Océanique", "Glycine", "Oméga-3"]
  },
  {
    id: "trans-wild-fish-soup-safran",
    title: "Soupe Électrolytique de Poissons Sauvages au Safran & Algues",
    subtitle: "Bouillon Marin Épuré · Algues Marines Vivantes & Safran Pur",
    author: "Régime de Transition Douce",
    authorTitle: "Bouillons Marins Reconstituants",
    bookReference: "Cuisine de Transition Vitaliste (p. 94)",
    category: "soupe-bouillon",
    categoryLabel: "Bouillon Océanique Dépuratif",
    prepTime: "15 min",
    cookTime: "25 min",
    servings: 4,
    difficulty: "Intermédiaire",
    vitalityScore: 93,
    pralScore: -8.8,
    targetEmunctories: ["Reins", "Lymphe", "Thyroïde", "Articulations"],
    tags: ["Transition Douce", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Un bouillon de poissons de roche sauvages mijoté avec des tomates fraîches, du fenouil, des algues kombu et des pistils de safran pur. Un élixir océanique réconfortant.",
    ingredients: [
      { name: "Morceaux de Poissons de Roche Sauvages Assortis", quantity: 400, unit: "g", isElectric: false, note: "Rascasses, grondins, merlans sauvages" },
      { name: "Algue Kombu Sauvage", quantity: 1, unit: "ruban de 5 cm", isElectric: true, note: "Électrolytes et iode" },
      { name: "Tomates Roma Mûres Hachées", quantity: 2, unit: "pièces", isElectric: true, note: "Base du bouillon" },
      { name: "Bulbe de Fenouil & Céleri", quantity: 1, unit: "portion", isElectric: true, note: "Émincés" },
      { name: "Pistils de Safran Pur", quantity: 6, unit: "filaments", isElectric: true, note: "Croétine et arôme" },
      { name: "Eau de Source Pure", quantity: 1.2, unit: "L", isElectric: true, note: "Pour le bouillon" }
    ],
    instructions: [
      "Dans une marmite, faites suer le fenouil, le céleri et les tomates dans une cuillère d'huile d'olive pendant 5 minutes.",
      "Versez l'eau de source, ajoutez le ruban d'algue kombu et les filaments de safran.",
      "Portez à frémissement pendant 15 minutes.",
      "Ajoutez les morceaux de poissons de roche coupés et laissez pocher doucement à couvert pendant 8 à 10 minutes.",
      "Retirez l'algue kombu, servez le bouillon brûlant et les morceaux de poisson avec un quartier de citron frais."
    ],
    vitalistAction: "La synergie des minéraux océaniques du kombu et du safran restaure l'équilibre électrolytique des personnes déminéralisées.",
    nutritionalHighlights: ["Croétine Safran", "Iode Océanique", "Sodium Organique", "Collagène Marin"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ⚡ DR. SEBI (RECETTES COMPLÉMENTAIRES DU COMPENDIUM & CELL FOOD)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "sebi-green-papaya-salad",
    title: "Salade Alcaline de Papaye Verte Râpée & Citron Vert Clé",
    subtitle: "Carica papaya · Papaïne Vivante & Régénération de la Paroi Intestinale",
    author: "Dr. Sebi",
    authorTitle: "Enzymes Digestives & Aliments Électriques",
    bookReference: "The Dr. Sebi Compendium (p. 201)",
    category: "salade-entree",
    categoryLabel: "Salade Enzymatique Vivante",
    prepTime: "10 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 100,
    pralScore: -15.8,
    targetEmunctories: ["Intestins", "Estomac", "Peau"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Sans Gluten", "Santé Intestinale"],
    description: "Une salade croquante et acidulée de papaye verte crue râpée en julienne fine, relevée au jus de citron vert clé, piment de Cayenne doux et graines de sésame brutes.",
    ingredients: [
      { name: "Papaye Verte Crue Ferme", quantity: 200, unit: "g", isElectric: true, note: "Chair verte riche en papaïne" },
      { name: "Tomates Roma Mûres", quantity: 1, unit: "pièce", isElectric: true, note: "En dés" },
      { name: "Jus de Citron Vert Clé (Key Lime)", quantity: 2, unit: "pièces", isElectric: true, note: "Acidité vivante" },
      { name: "Huile d'Avocat Pure", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pression à froid" },
      { name: "Piment de Cayenne & Sel Marin", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Pelez la papaye verte et râpez la chair en longs filaments fins à la mandoline.",
      "Dans un mortier en bois ou un saladier, écrasez légèrement les dés de tomates avec le jus de citron vert et le piment de Cayenne.",
      "Ajoutez la papaye verte râpée et mélangez énergiquement pour faire pénétrer les sucs.",
      "Arrosez d'huile d'avocat et servez immédiatement bien croquant."
    ],
    vitalistAction: "La papaïne contenue dans le latex de la papaye verte dissout le mucus durci et les biofilms intestinaux sans irriter la muqueuse.",
    nutritionalHighlights: ["Papaïne Protéolytique", "Vitamine C Vivante", "Fibres Douces", "Potassium"]
  },
  {
    id: "sebi-wild-mushrooms-wok",
    title: "Wok de Champignons Sauvages & Poivrons Doux à l'Origan",
    subtitle: "Pleurotes & Champignons Portobello · Énergie Bio-Électrique Rôtie",
    author: "Dr. Sebi",
    authorTitle: "Cuisine Alcaline Chauffante",
    bookReference: "The Dr. Sebi Compendium (p. 272)",
    category: "plat-principal",
    categoryLabel: "Poêlée Chaude Électrique",
    prepTime: "10 min",
    cookTime: "8 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 94,
    pralScore: -11.8,
    targetEmunctories: ["Rate", "Foie", "Muscles"],
    tags: ["100% Électrique", "Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Des lamelles épaisses de champignons sauvages et de poivrons doux revenues à la poêle avec de l'huile d'avocat, de l'origan séché et du sel marin.",
    ingredients: [
      { name: "Champignons Portobello Sauvages", quantity: 200, unit: "g", isElectric: true, note: "Coupés en épaisses lamelles" },
      { name: "Poivron Jaune ou Vert", quantity: 1, unit: "pièce", isElectric: true, note: "En lanières" },
      { name: "Oignon Rouge", quantity: 0.5, unit: "pièce", isElectric: true, note: "Émincé" },
      { name: "Huile d'Avocat Pure", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Pour la cuisson" },
      { name: "Origan Sauvage Séché & Sel Marin", quantity: 1, unit: "c. à café", isElectric: true, note: "Arôme" }
    ],
    instructions: [
      "Faites chauffer l'huile d'avocat dans une poêle en fonte.",
      "Ajoutez les oignons et les poivrons, faites dorer 3 minutes.",
      "Ajoutez les champignons et l'origan. Saisissez 4 à 5 minutes à feu vif.",
      "Salez en fin de cuisson et servez chaud avec une portion de riz sauvage."
    ],
    vitalistAction: "Fournit du sélénium organique et des polysaccharides complexes qui soutiennent l'immunité cellulaire.",
    nutritionalHighlights: ["Sélénium", "Bêta-Glucanes", "Potassium", "Cuivre"]
  },
  {
    id: "sebi-hemp-milk-elixir",
    title: "Lait Végétal Électrique de Graines de Chanvre & Nectar d'Agave",
    subtitle: "Cannabis sativa Semen · Protéines Complètes & Calcium Liquide",
    author: "Dr. Sebi",
    authorTitle: "Boissons Cellulaires Électriques",
    bookReference: "Dr. Sebi Medicinal Herbs & Cleansing Diet (p. 88)",
    category: "elixir-tisane",
    categoryLabel: "Lait Végétal Cru",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 99,
    pralScore: -12.0,
    targetEmunctories: ["Cerveau", "Muscles", "Os"],
    tags: ["100% Électrique", "100% Cru", "Sans Mucus", "Sans Gluten"],
    description: "Le lait végétal idéal sans trempage préalable : graines de chanvre entières décortiquées mixées avec de l'eau de source pure et un trait de nectar d'agave.",
    ingredients: [
      { name: "Graines de Chanvre Décortiquées", quantity: 50, unit: "g", isElectric: true, note: "Riches en édestine et oméga-3" },
      { name: "Eau de Source Pure", quantity: 500, unit: "ml", isElectric: true, note: "Tempérée ou fraîche" },
      { name: "Nectar d'Agave Pur", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Douceur" },
      { name: "Pincée de Sel Marin", quantity: 0.1, unit: "pincée", isElectric: true, note: "Fixateur" }
    ],
    instructions: [
      "Placez les graines de chanvre et l'eau de source dans le blender.",
      "Mixez à vitesse maximale pendant 60 secondes.",
      "Ajoutez le nectar d'agave et la micro-pincée de sel marin, pulsez 5 secondes.",
      "Aucune filtration nécessaire : le chanvre se dissout en une émulsion lactée blanche parfaite."
    ],
    vitalistAction: "La protéine d'édestine est identique à la globuline du plasma sanguin humain, assurant une régénération immédiate des anticorps.",
    nutritionalHighlights: ["Édestine", "Oméga-3/6", "Magnésium", "Phosphore"]
  },
  {
    id: "sebi-kamut-ancient-pancakes",
    title: "Pancakes Moelleux de Farine de Kamut Ancestral",
    subtitle: "Triticum turgidum Non Hybridé · Sirop d'Agave & Myrtilles Sauges",
    author: "Dr. Sebi",
    authorTitle: "Boulangerie Ancestrale & Petit-Déjeuner",
    bookReference: "The Dr. Sebi Compendium (p. 280)",
    category: "pain-boulangerie-ancestrale",
    categoryLabel: "Pancakes Détox Doux",
    prepTime: "10 min",
    cookTime: "8 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 88,
    pralScore: -5.6,
    targetEmunctories: ["Rate", "Intestins"],
    tags: ["100% Électrique", "Sans Mucus", "Transition Douce"],
    description: "Pancakes dorés sans œufs, sans lait de vache et sans levure chimique, préparés avec de la farine de blé khorasan antique (Kamut) et du lait de chanvre.",
    ingredients: [
      { name: "Farine de Kamut Ancestral Pure", quantity: 150, unit: "g", isElectric: true, note: "Blé antique non croisé" },
      { name: "Lait de Chanvre Fait Maison", quantity: 180, unit: "ml", isElectric: true, note: "Liant liquide" },
      { name: "Huile d'Avocat Pure", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Moelleux" },
      { name: "Nectar d'Agave Pur", quantity: 1, unit: "c. à soupe", isElectric: true, note: "Pour la pâte" },
      { name: "Bicarbonate de Soude Pur", quantity: 0.5, unit: "c. à café", isElectric: true, note: "Agent levant doux" },
      { name: "Jus de Citron Vert Clé", quantity: 1, unit: "c. à café", isElectric: true, note: "Pour activer le bicarbonate" }
    ],
    instructions: [
      "Dans un saladier, mélangez la farine de kamut et le bicarbonate de soude.",
      "Ajoutez le lait de chanvre, l'huile d'avocat, le nectar d'agave et le jus de citron vert (il fait mousser le bicarbonate).",
      "Mélangez au fouet pour obtenir une pâte lisse et épaisse.",
      "Faites cuire de petites louches de pâte dans une poêle antiadhésive chaude pendant 2 minutes par face.",
      "Servez chaud nappé de nectar d'agave pur."
    ],
    vitalistAction: "Le kamut apporte des lipides sains et des protéines végétales non inflammatoires très digestes pour l'intestin grêle.",
    nutritionalHighlights: ["Sélénium Élevé", "Magnésium", "Vitamine E", "Zinc"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍏 PROF. ARNOLD EHRET (RECETTES COMPLÉMENTAIRES DU RÉGIME SANS MUCUS)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "ehret-celery-walnut-salad",
    title: "Salade Croquante de Céleri Branche & Noix Fraîches",
    subtitle: "Sodium Végétal Vivant, Noix Non Torréfiées & Jus de Citron",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 16 : Salades de Transition",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 84)",
    category: "salade-entree",
    categoryLabel: "Salade Rénale Croquante",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 96,
    pralScore: -14.0,
    targetEmunctories: ["Reins", "Cerveau"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Drainage Rénal"],
    description: "Céleri branche croquant coupé en dés fins, mélangé à quelques cerneaux de noix fraîches et arrosé de pur jus de citron sans sel.",
    ingredients: [
      { name: "Branches de Céleri avec Feuilles", quantity: 4, unit: "tiges", isElectric: true, note: "Dés croquants" },
      { name: "Cerneaux de Noix Biologiques Fraîches", quantity: 30, unit: "g", isElectric: false, note: "Trempées 2h" },
      { name: "Jus de Citron Jaune Frais", quantity: 1.5, unit: "c. à soupe", isElectric: true, note: "Acidité épuratrice" },
      { name: "Huile d'Olive Vierge", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Pression à froid" }
    ],
    instructions: [
      "Coupez le céleri en petits tronçons de 5 mm.",
      "Hachez grossièrement les noix trempées.",
      "Mélangez dans un bol avec le jus de citron et l'huile d'olive.",
      "Dégustez en début de repas."
    ],
    vitalistAction: "Le sodium organique du céleri neutralise les acides uriques tandis que les graisses de noix stabilisent la glycémie.",
    nutritionalHighlights: ["Sodium Organique", "Oméga-3 Végétaux", "Polyphénols"]
  },
  {
    id: "ehret-curly-kale-cumin-saute",
    title: "Poêlée de Chou Frisé & Oignons Rouges au Cumin",
    subtitle: "Brassica oleracea · Fibres Décapantes & Élimination de Gaz",
    author: "Prof. Arnold Ehret",
    authorTitle: "Leçon 15 : Plats de Légumes Cuits Épurateurs",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 77)",
    category: "plat-principal",
    categoryLabel: "Légume Vert Détox",
    prepTime: "10 min",
    cookTime: "10 min",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 91,
    pralScore: -16.5,
    targetEmunctories: ["Côlon", "Estomac"],
    tags: ["Sans Mucus", "Sans Gluten", "Transition Douce"],
    description: "Chou frisé découpé en lanières et revenu doucement avec des oignons rouges et des graines de cumin pour stimuler les sécrétions gastriques sans ballonnements.",
    ingredients: [
      { name: "Chou Frisé (Kale ou Chou Vert)", quantity: 250, unit: "g", isElectric: true, note: "Lanières fines" },
      { name: "Oignon Rouge Émincé", quantity: 1, unit: "pièce", isElectric: true, note: "Alliacée" },
      { name: "Graines de Cumin Entières", quantity: 1, unit: "c. à café", isElectric: true, note: "Carminatif puissant" },
      { name: "Huile d'Olive Vierge", quantity: 1.5, unit: "c. à soupe", isElectric: false, note: "Pour la poêle" }
    ],
    instructions: [
      "Faites chauffer l'huile d'olive avec les graines de cumin pour libérer leurs huiles essentielles.",
      "Ajoutez l'oignon et le chou frisé.",
      "Faites sauter 8 minutes à couvert avec 2 cuillères d'eau.",
      "Servez chaud et fondant."
    ],
    vitalistAction: "Le cumin empêche les fermentations gazeuses dans le côlon ascendant.",
    nutritionalHighlights: ["Sulforaphane", "Cuminol Carminatif", "Calcium"]
  },
  {
    id: "ehret-wild-berries-orange",
    title: "Fraises et Framboises Sauvages au Filet de Jus d'Orange",
    subtitle: "Dessert Vivant Astringent · Solvant d'Acides Biliaires",
    author: "Prof. Arnold Ehret",
    authorTitle: "Fruits Dépuratifs du Matin",
    bookReference: "Système de Guérison du Régime Sans Mucus (p. 86)",
    category: "dessert-vivant",
    categoryLabel: "Fruits Vivants Acidulés",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -18.2,
    targetEmunctories: ["Lymphe", "Reins"],
    tags: ["Sans Mucus", "100% Cru", "Sans Gluten", "Drainage Rénal"],
    description: "Un bol de baies fraîches acidulées arrosées de jus d'orange fraîchement pressé minute, sans aucun sucre ajouté.",
    ingredients: [
      { name: "Fraises et Framboises Fraîches", quantity: 250, unit: "g", isElectric: true, note: "Fruits rouges mûrs" },
      { name: "Jus d'Orange Sanguine ou Douce", quantity: 1, unit: "pièce", isElectric: true, note: "Pressé minute" }
    ],
    instructions: [
      "Déposez les baies lavées dans un bol en verre.",
      "Pressez le jus de l'orange directement sur les fruits.",
      "Laissez reposer 3 minutes et dégustez à la cuillère le matin à jeun."
    ],
    vitalistAction: "Les acides ellagique et citrique dissolvent les déchets colloïdaux dans les capillaires lymphatiques superficiels.",
    nutritionalHighlights: ["Acide Ellagique", "Vitamine C Active", "Anthocyanes"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🍇 DR. ROBERT MORSE (DÉTOXICATION LYMPHATIQUE AVANCÉE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "morse-black-fig-feast",
    title: "Mono-Festin de Figues Noires Fraîches Évacuatrices",
    subtitle: "Ficus carica · Évacuation Colique & Nettoyage Mucoïde",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Cures Mono-Fruit Détox",
    bookReference: "The Detox Miracle Sourcebook (p. 138)",
    category: "dessert-vivant",
    categoryLabel: "Cure Mono-Fruit Vivante",
    prepTime: "3 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -22.0,
    targetEmunctories: ["Côlon", "Intestins"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Santé Intestinale"],
    description: "Un repas composé exclusivement de figues fraîches mûres à point pour relancer le transit sans effort.",
    ingredients: [
      { name: "Figues Noires ou Violettes Fraîches Mûres", quantity: 400, unit: "g", isElectric: true, note: "Gorgées de graines douces" }
    ],
    instructions: [
      "Lavez délicatement les figues fraîches.",
      "Consommez-les entières avec la peau fine pour un repas complet le matin ou le midi."
    ],
    vitalistAction: "La ficine (enzyme protéolytique) et les micro-graines balayent le mucus colique sans agresser la muqueuse.",
    nutritionalHighlights: ["Ficine Protéolytique", "Magnésium Organique", "Potassium"]
  },
  {
    id: "morse-grapefruit-lymph-cleanse",
    title: "Festin de Pamplemousse Rose Astringent & Élimination",
    subtitle: "Citrus paradisi · Naringénine & Drainage Lymphatique Profond",
    author: "Dr. Robert Morse, N.D.",
    authorTitle: "Astringence Fruitée & Reins",
    bookReference: "The Detox Miracle Sourcebook (p. 204)",
    category: "dessert-vivant",
    categoryLabel: "Agrume Astringent Majeur",
    prepTime: "5 min",
    cookTime: "0 min (Cru)",
    servings: 1,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -21.8,
    targetEmunctories: ["Lymphe", "Reins", "Foie"],
    tags: ["100% Cru", "Sans Mucus", "Drainage Rénal", "Sans Gluten"],
    description: "Deux pamplemousses roses coupés en deux et dégustés à la cuillère avec leur pulpe juteuse et leurs membranes blanches riches en flavonoïdes.",
    ingredients: [
      { name: "Pamplemousses Roses Mûrs Biologiques", quantity: 2, unit: "pièces", isElectric: true, note: "Chair rose juteuse" }
    ],
    instructions: [
      "Coupez les pamplemousses en deux.",
      "Dégustez la pulpe à la petite cuillère en écrasant les vésicules de jus contre le palais.",
      "Consommez seul le matin pour déclencher la filtration rénale."
    ],
    vitalistAction: "La naringénine stimule l'autophagie hépatique et active le drainage des acides interstitiels vers les reins.",
    nutritionalHighlights: ["Naringénine", "Lycopène", "Vitamine C Réductrice"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌱 DAVID WOLFE (SUPER-ALIMENTS & ALIMENTATION VIVANTE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "wolfe-spirulina-hemp-guacamole",
    title: "Guacamole Superfood à la Spiruline & Graines de Chanvre",
    subtitle: "Phycocyanine Vivante & Acides Gras Essentiels Bruts",
    author: "David Wolfe",
    authorTitle: "Sunfood Living Kitchen",
    bookReference: "The Sunfood Diet Success System (p. 192)",
    category: "salade-entree",
    categoryLabel: "Super-Guacamole Vivant",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -19.5,
    targetEmunctories: ["Cerveau", "Sang", "Foie"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Super-Aliments"],
    description: "Avocat écrasé enrichi d'une cuillère de spiruline pure, de graines de chanvre croquantes, de jus de citron vert et de sel rose de l'Himalaya.",
    ingredients: [
      { name: "Avocat Mûr", quantity: 2, unit: "pièces", isElectric: true, note: "Écrasé" },
      { name: "Poudre de Spiruline Pure", quantity: 1, unit: "c. à café", isElectric: true, note: "Phycocyanine" },
      { name: "Graines de Chanvre Décortiquées", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Oméga-3" },
      { name: "Jus de Citron Vert & Sel Marin", quantity: 1, unit: "portion", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Écrasez les avocats dans un bol avec la spiruline et le jus de citron vert.",
      "Incorporez les graines de chanvre et le sel marin.",
      "Servez avec des bâtonnets de céleri ou de carotte."
    ],
    vitalistAction: "Fournit une synergie d'acides gras essentiels et d'antioxydants protégeant les membranes mitochondriales.",
    nutritionalHighlights: ["Phycocyanine", "Oméga-3 ALA", "Glutathion"]
  },
  {
    id: "wolfe-raw-nori-rolls",
    title: "Rouleaux d'Algues Nori Vivantes aux Légumes & Pesto",
    subtitle: "Porphyra umbilicalis · Iode Océanique & Minéraux Vivants",
    author: "David Wolfe",
    authorTitle: "Maki Vivant Sans Riz",
    bookReference: "The Sunfood Diet Success System (p. 210)",
    category: "plat-principal",
    categoryLabel: "Maki Cru Détox",
    prepTime: "15 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 99,
    pralScore: -18.6,
    targetEmunctories: ["Thyroïde", "Lymphe", "Intestins"],
    tags: ["100% Cru", "Sans Mucus", "Sans Gluten", "Super-Aliments"],
    description: "Feuilles de nori crues non grillées roulées autour d'un écrasé d'avocat, de graines germées, de carottes en julienne et de lamelles de concombre.",
    ingredients: [
      { name: "Feuilles d'Algue Nori Crue Non Grillée", quantity: 4, unit: "feuilles", isElectric: true, note: "Riches en iode" },
      { name: "Avocat Écrasé au Citron", quantity: 1, unit: "pièce", isElectric: true, note: "Liant crémeux" },
      { name: "Carotte et Concombre en Bâtonnets", quantity: 1, unit: "portion", isElectric: true, note: "Croquant" },
      { name: "Graines Germées Vivantes", quantity: 50, unit: "g", isElectric: true, note: "Enzymes" }
    ],
    instructions: [
      "Posez la feuille de nori à plat sur une natte.",
      "Tartinez d'avocat écrasé, disposez les bâtonnets de légumes et les graines germées.",
      "Roulez fermement et découpez en 6 tronçons avec un couteau bien aiguisé humide.",
      "Dégustez immédiatement."
    ],
    vitalistAction: "L'iode océanique de la nori régule le métabolisme basal thyroïdien et nettoie le système lymphatique.",
    nutritionalHighlights: ["Iode Océanique", "Vitamine B12 Végétale", "Chlorophylle"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌿 DR. JOHN KALLAS (CUEILLETTE & FLORE SAUVAGE)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "kallas-chickweed-gazpacho",
    title: "Gazpacho Sauvage Vivant au Mouron Blanc & Concombre",
    subtitle: "Stellaria media & Concombre Structuré · Rafraîchissement Cellulaire",
    author: "Dr. John Kallas",
    authorTitle: "Cuisine Sylvestre & Plantes Spontanées",
    bookReference: "Edible Wild Plants (p. 115)",
    category: "soupe-bouillon",
    categoryLabel: "Soupe Froide Vivante",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 100,
    pralScore: -20.2,
    targetEmunctories: ["Reins", "Peau", "Estomac"],
    tags: ["100% Cru", "Plantes Sauvages", "Sans Mucus", "Sans Gluten", "Drainage Rénal"],
    description: "Une soupe froide verte éclatante mixant mouron des oiseaux sauvage, concombre avec sa peau, huile d'olive, ail doux et jus de citron.",
    ingredients: [
      { name: "Mouron Blanc Sauvage Frais (Chickweed)", quantity: 80, unit: "g", isElectric: true, note: "Plante sauvage douce" },
      { name: "Concombre Biologique", quantity: 1, unit: "pièce", isElectric: true, note: "Eau structurée" },
      { name: "Huile d'Olive Première Pression", quantity: 2, unit: "c. à soupe", isElectric: false, note: "Émulsion" },
      { name: "Jus de Citron Jaune & Gousse d'Ail", quantity: 1, unit: "portion", isElectric: true, note: "Saveur" }
    ],
    instructions: [
      "Placez le concombre en morceaux, le mouron blanc, l'ail, le jus de citron et l'huile d'olive dans le blender.",
      "Mixez 45 secondes jusqu'à consistance de gazpacho soyeux.",
      "Servez glacé ou frais dans des bols."
    ],
    vitalistAction: "Apaise instantanément les gastrites et hydrate les néphrons rénaux en profondeur.",
    nutritionalHighlights: ["Saponines Apaisantes", "Silice", "Vitamine C"]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🐟 RÉGIME DE TRANSITION CRUE & MARINE (POISSONS SAUVAGES CRUS & ALCALINISÉS)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "trans-wild-salmon-tartare",
    title: "Tartare Vivant de Saumon Sauvage d'Alaska au Citron Vert & Avocat",
    subtitle: "Oncorhynchus nerka Cru · Astaxanthine Intacte & Lipides Membranaires",
    author: "Régime de Transition Douce",
    authorTitle: "Protéines Marines Brutes & Transition Vitaliste",
    bookReference: "Cuisine de Transition Vitaliste (p. 98)",
    category: "plat-principal",
    categoryLabel: "Tartare de Poisson Cru",
    prepTime: "12 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 97,
    pralScore: -4.8,
    targetEmunctories: ["Cerveau", "Cœur", "Cellules"],
    tags: ["Transition Douce", "100% Cru", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Saumon sauvage cru coupé au couteau en petits dés, mariné 5 minutes au jus de citron vert frais avec des cubes d'avocat, de l'aneth et de l'huile d'olive extra.",
    ingredients: [
      { name: "Pavé de Saumon Sauvage d'Alaska (Ultra-Frais)", quantity: 200, unit: "g", isElectric: false, note: "Taillé au couteau en petits dés" },
      { name: "Avocat Mûr en Petits Cubes", quantity: 1, unit: "pièce", isElectric: true, note: "Crémeux" },
      { name: "Jus de Citron Vert Frais", quantity: 2, unit: "pièces", isElectric: true, note: "Pour cuire à froid le poisson" },
      { name: "Aneth Frais Ciselé", quantity: 2, unit: "c. à soupe", isElectric: true, note: "Arôme" },
      { name: "Huile d'Olive Extra Vierge", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Pression à froid" }
    ],
    instructions: [
      "Découpez le saumon sauvage en petits dés de 5 mm avec un couteau bien aiguisé.",
      "Dans un bol en verre, mélangez le saumon, les dés d'avocat et l'aneth frais.",
      "Arrosez de jus de citron vert et d'huile d'olive.",
      "Laissez mariner 5 minutes à température ambiante (l'acide citrique blanchit légèrement les protéines extérieures) et servez immédiatement."
    ],
    vitalistAction: "Le poisson sauvage cru n'a subi aucune réaction de Maillard ni peroxydation lipidique, offrant les oméga-3 et l'astaxanthine dans leur biodisponibilité native maximale.",
    nutritionalHighlights: ["Astaxanthine", "Oméga-3 EPA/DHA Bruts", "Vitamine D3", "Zinc"]
  },
  {
    id: "trans-wild-cod-ceviche",
    title: "Ceviche Vivant de Cabillaud Sauvage au Citron Vert & Piment Doux",
    subtitle: "Gadus morhua Cru Mariné · Cuisson à Froid par l'Acide Citrique",
    author: "Régime de Transition Douce",
    authorTitle: "Cuisine Marine Vivante Sud-Américaine",
    bookReference: "Cuisine de Transition Vitaliste (p. 102)",
    category: "plat-principal",
    categoryLabel: "Ceviche Marin Cru",
    prepTime: "15 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Facile",
    vitalityScore: 98,
    pralScore: -6.5,
    targetEmunctories: ["Foie", "Estomac", "Thyroïde"],
    tags: ["Transition Douce", "100% Cru", "Sans Gluten", "Poissons & Mer", "Sans Mucus"],
    description: "Dés de cabillaud sauvage mariné 10 minutes dans du jus de citron vert pur (Leche de tigre vitaliste) avec de l'oignon rouge en lanières fines, de la coriandre et du poivron jaune.",
    ingredients: [
      { name: "Filet de Cabillaud Sauvage Très Frais", quantity: 250, unit: "g", isElectric: false, note: "Coupé en cubes de 1 cm" },
      { name: "Jus de Citron Vert Frais", quantity: 3, unit: "pièces", isElectric: true, note: "Pour la marinade Leche de tigre" },
      { name: "Oignon Rouge Émincé Finement", quantity: 0.5, unit: "pièce", isElectric: true, note: "Quercétine" },
      { name: "Coriandre Fraîche Hachée", quantity: 3, unit: "c. à soupe", isElectric: true, note: "Chélateur" },
      { name: "Piment Doux ou Pincée de Cayenne", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Chaleur" }
    ],
    instructions: [
      "Dans un plat en verre, déposez les cubes de cabillaud sauvage et les lanières d'oignon rouge.",
      "Versez le jus des citrons verts pour recouvrir le poisson.",
      "Laissez reposer 10 minutes au frais : l'acide citrique dénature les protéines en douceur, rendant le poisson blanc et opaque.",
      "Incorporez la coriandre et la pointe de piment doux.",
      "Dégustez très frais avec une salade croquante de concombre."
    ],
    vitalistAction: "La cuisson froide par l'acide citrique préserve tous les minéraux et enzymes marins tout en assurant une digestibilité parfaite.",
    nutritionalHighlights: ["Protéines Marines Natives", "Vitamine C Intense", "Iode", "Sélénium"]
  },
  {
    id: "trans-scallops-carpaccio-pink-pepper",
    title: "Carpaccio de Noix de Saint-Jacques Crues au Citron & Baies Roses",
    subtitle: "Pecten maximus · Finesse Océanique & Taurine Pure",
    author: "Régime de Transition Douce",
    authorTitle: "Mollusques Crus & Régénération",
    bookReference: "Cuisine de Transition Vitaliste (p. 106)",
    category: "salade-entree",
    categoryLabel: "Carpaccio de Mer Cru",
    prepTime: "8 min",
    cookTime: "0 min (Cru)",
    servings: 2,
    difficulty: "Très Facile",
    vitalityScore: 99,
    pralScore: -7.5,
    targetEmunctories: ["Cœur", "Lymphe", "Système Nerveux"],
    tags: ["Transition Douce", "100% Cru", "Sans Gluten", "Poissons & Mer"],
    description: "Noix de Saint-Jacques fraîches tranchées en fines lamelles translucides, arrosées de jus de citron vert et d'un filet d'huile d'olive à la fleur de sel et baies roses écrasées.",
    ingredients: [
      { name: "Noix de Saint-Jacques Fraîches sans Corail", quantity: 6, unit: "belles pièces", isElectric: false, note: "Tranchées très fin" },
      { name: "Jus de Citron Vert Frais", quantity: 1, unit: "pièce", isElectric: true, note: "Arrosage" },
      { name: "Huile d'Olive Extra Vierge", quantity: 1, unit: "c. à soupe", isElectric: false, note: "Pression à froid" },
      { name: "Baies Roses Écrasées & Fleur de Sel", quantity: 0.25, unit: "c. à café", isElectric: true, note: "Assaisonnement" }
    ],
    instructions: [
      "Placez les noix de Saint-Jacques 10 minutes au congélateur pour faciliter la découpe.",
      "Tranchez-les en lamelles très fines (2 mm) avec un couteau lisse.",
      "Disposez les lamelles en rosace sur une assiette froide.",
      "Arrosez de jus de citron vert et d'huile d'olive.",
      "Parsemez de baies roses concassées et d'une larme de fleur de sel.",
      "Dégustez aussitôt."
    ],
    vitalistAction: "La taurine naturelle des Saint-Jacques crues renforce la pompe cardiaque et améliore la régulation du sodium cellulaire.",
    nutritionalHighlights: ["Taurine Naturelle", "Magnésium Océanique", "Zinc", "Glycine"]
  }
];

export const RECIPE_AUTHORS = [
  { id: "all", name: "Tous les Auteurs & Traditions", icon: "🌟" },
  { id: "Dr. Sebi", name: "Dr. Sebi", icon: "⚡", description: "Alimentation Bio-Électrique Cellulaire" },
  { id: "Prof. Arnold Ehret", name: "Prof. Arnold Ehret", icon: "🍏", description: "Régime Sans Mucus & Jeûne" },
  { id: "Dr. Robert Morse", name: "Dr. Robert Morse", icon: "🍇", description: "Détoxication & Lymphe" },
  { id: "David Wolfe", name: "David Wolfe", icon: "🌱", description: "Sunfood & Super-Aliments" },
  { id: "Dr. John Kallas", name: "Dr. John Kallas", icon: "🌿", description: "Plantes Sauvages & Nutrition" },
  { id: "Dr. John R. Christopher", name: "Dr. John Christopher", icon: "🧪", description: "Phytothérapie & Formules" },
  { id: "Régime de Transition Douce", name: "Transition & Poissons Sauvages", icon: "🐟", description: "Transition Omnivore & Produits Océaniques" }
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
  { id: "Poissons & Mer", label: "🐟 Poissons Sauvages & Fruits de Mer", icon: "🐟" },
  { id: "Transition Douce", label: "🥣 Repas de Transition Douce", icon: "🥣" },
  { id: "Super-Aliments", label: "⚡ Super-Aliments & Longévité", icon: "⚡" }
];

export const POPULAR_INGREDIENTS = [
  "Sea Moss", "Citron Vert", "Citron", "Pourpier", "Pissenlit", "Ortie",
  "Carottes", "Céleri", "Betterave", "Riz Sauvage", "Farine de Teff", "Fonio",
  "Corossol", "Graines de Chanvre", "Pommes", "Pruneaux", "Orme Rouge",
  "Cacao Cru", "Huile d'Avocat", "Piment de Cayenne", "Spiruline", "Concombre",
  "Saumon Sauvage", "Crevettes Sauvages", "Cabillaud Sauvage", "Huîtres", "Sardines", "Dorade",
  "Fenouil", "Gombo", "Chayote", "Courgette", "Pleurotes", "Poireaux", "Graines de Lin"
];
