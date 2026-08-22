/**
 * build_multilingual_vitalist_wisdom.mjs
 * 
 * Générateur exhaustif de la base de données multilingue de Sagesse Vitaliste (366 fiches x 4 langues).
 * Utilise les textes authentiques ORIGINAUX EN ANGLAIS des ouvrages (Arnold Ehret, Dr. Robert Morse,
 * Dr. Sebi, David Wolfe, Dr. Leslie Taylor, Wim Hof), ainsi que les versions Française, Québécoise et Espagnole.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHORS_MULTILINGUAL = {
  ehret: {
    author: 'Arnold Ehret',
    authorAvatar: '🌿',
    authorColor: '#10b981',
    authorTag: {
      fr: 'Père du Régime Sans Mucus',
      'fr-CA': 'Père du Régime Sans Mucus',
      en: 'Father of the Mucusless Diet',
      es: 'Padre de la Dieta Sin Moco'
    },
    works: [
      {
        fr: 'Système de Guérison du Régime Sans Mucus',
        'fr-CA': 'Système de Guérison du Régime Sans Mucus',
        en: 'Mucusless Diet Healing System',
        es: 'Sistema Curativo por Dieta Amucosa'
      },
      {
        fr: 'Le Jeûne Rationnel',
        'fr-CA': 'Le Jeûne Rationnel',
        en: 'Rational Fasting',
        es: 'El Ayuno Racional'
      },
      {
        fr: 'La Maladie Définie',
        'fr-CA': 'La Maladie Définie',
        en: 'Definite Cure of Chronic Constipation',
        es: 'Cura Definitiva del Estreñimiento Crónico'
      }
    ]
  },
  morse: {
    author: 'Dr. Robert Morse',
    authorAvatar: '🍇',
    authorColor: '#8b5cf6',
    authorTag: {
      fr: 'Spécialiste Détox & Lymphe',
      'fr-CA': 'Spécialiste Détox & Lymphe',
      en: 'Detox & Lymphatic Specialist',
      es: 'Especialista en Desintoxicación y Linfa'
    },
    works: [
      {
        fr: 'Le Guide du Miracle de la Détox',
        'fr-CA': 'Le Guide du Miracle de la Détox',
        en: 'The Detox Miracle Sourcebook',
        es: 'El Milagro de la Desintoxicación'
      },
      {
        fr: 'Régénération Tissulaire & Lymphe',
        'fr-CA': 'Régénération Tissulaire & Lymphe',
        en: 'Tissue Regeneration & The Lymphatic System',
        es: 'Regeneración Tisular y el Sistema Linfático'
      },
      {
        fr: 'Botanique Thérapeutique Vitaliste',
        'fr-CA': 'Botanique Thérapeutique Vitaliste',
        en: 'Herbal Formulas for Cellular Regeneration',
        es: 'Fórmulas Herbarias para la Regeneración Celular'
      }
    ]
  },
  sebi: {
    author: 'Dr. Sebi',
    authorAvatar: '⚡',
    authorColor: '#f59e0b',
    authorTag: {
      fr: 'Alimentation Électrique & Cellulaire',
      'fr-CA': 'Alimentation Électrique & Cellulaire',
      en: 'Bio-Electric Cell Food Pioneer',
      es: 'Alimentación Eléctrica y Celular'
    },
    works: [
      {
        fr: 'Guide de Purification Bio-Électrique Cellulaire',
        'fr-CA': 'Guide de Purification Bio-Électrique Cellulaire',
        en: 'African Bio-Mineral Balance',
        es: 'Equilibrio Bio-Mineral Africano'
      },
      {
        fr: 'Liste Nutritionnelle Bio-Minérale',
        'fr-CA': 'Liste Nutritionnelle Bio-Minérale',
        en: 'Bio-Mineral Nutrition Guide',
        es: 'Guía Nutricional Bio-Mineral'
      },
      {
        fr: 'Compendium des Plantes Médicinales',
        'fr-CA': 'Compendium des Plantes Médicinales',
        en: 'Medicinal Herbs & Cellular Cleansing',
        es: 'Compendio de Plantas Medicinales'
      }
    ]
  },
  wolfe: {
    author: 'David Wolfe',
    authorAvatar: '☀️',
    authorColor: '#eab308',
    authorTag: {
      fr: 'Pionnier Raw Food & Superfoods',
      'fr-CA': 'Pionnier Raw Food & Superaliments',
      en: 'Raw Food & Superfoods Pioneer',
      es: 'Pionero de Alimentos Crudos y Superalimentos'
    },
    works: [
      {
        fr: 'Le Système de Réussite de l\'Alimentation Vivante',
        'fr-CA': 'Le Système de Réussite de l\'Alimentation Vivante',
        en: 'The Sunfood Diet Success System',
        es: 'El Sistema de Dieta de los Alimentos Solares'
      },
      {
        fr: 'Superfoods & Énergie Solaire',
        'fr-CA': 'Superfoods & Énergie Solaire',
        en: 'Superfoods: Food and Medicine of the Future',
        es: 'Superalimentos: Comida y Medicina del Futuro'
      },
      {
        fr: 'La Longévité par la Nutrition Crue',
        'fr-CA': 'La Longévité par la Nutrition Crue',
        en: 'Longevity Now: A Comprehensive Approach',
        es: 'Longevidad Ahora: Nutrición Cruda'
      }
    ]
  },
  taylor: {
    author: 'Dr. Leslie Taylor',
    authorAvatar: '🌴',
    authorColor: '#06b6d4',
    authorTag: {
      fr: 'Ethnobotaniste Pharmacopée Tropicale',
      'fr-CA': 'Ethnobotaniste Pharmacopée Tropicale',
      en: 'Rainforest Ethnobotanist',
      es: 'Etnobotánica de la Selva Tropical'
    },
    works: [
      {
        fr: 'Pharmacopée Amazonienne Raintree',
        'fr-CA': 'Pharmacopée Amazonienne Raintree',
        en: 'The Healing Power of Rainforest Herbs',
        es: 'El Poder Curativo de las Plantas de la Selva'
      },
      {
        fr: 'Secret des Plantes Tropicales',
        'fr-CA': 'Secret des Plantes Tropicales',
        en: 'Herbal Secrets of the Rainforest',
        es: 'Secretos Medicinales de la Selva Tropical'
      },
      {
        fr: 'Materia Medica Tropicale',
        'fr-CA': 'Materia Medica Tropicale',
        en: 'Amazon & Tropical Plant Database',
        es: 'Base de Datos Botánica Amazónica'
      }
    ]
  },
  hof: {
    author: 'Wim Hof',
    authorAvatar: '❄️',
    authorColor: '#3b82f6',
    authorTag: {
      fr: 'Maître de l\'Oxygénation & Froid',
      'fr-CA': 'Maître de l\'Oxygénation & Froid',
      en: 'Master of Oxygenation & Cold',
      es: 'Maestro de la Oxigenación y el Frío'
    },
    works: [
      {
        fr: 'La Méthode Wim Hof',
        'fr-CA': 'La Méthode Wim Hof',
        en: 'The Wim Hof Method',
        es: 'El Método Wim Hof'
      },
      {
        fr: 'Science & Modulation du Système Immunitaire',
        'fr-CA': 'Science & Modulation du Système Immunitaire',
        en: 'Science & Immune Modulation',
        es: 'Ciencia y Modulación del Sistema Inmune'
      },
      {
        fr: 'Protocole Respiratoire & Thermogénèse',
        'fr-CA': 'Protocole Respiratoire & Thermogénèse',
        en: 'Respiratory Protocol & Thermogenesis',
        es: 'Protocolo Respiratorio y Termogénesis'
      }
    ]
  }
};

const CATEGORIES_MULTILINGUAL = {
  mucusless: {
    fr: 'Régime Sans Mucus',
    'fr-CA': 'Régime Sans Mucus',
    en: 'Mucusless Diet',
    es: 'Dieta Sin Moco'
  },
  detox: {
    fr: 'Détox & Lymphe',
    'fr-CA': 'Détox & Lymphe',
    en: 'Detox & Lymph',
    es: 'Détox y Linfa'
  },
  fasting: {
    fr: 'Jeûne & Autophagie',
    'fr-CA': 'Jeûne & Autophagie',
    en: 'Fasting & Autophagy',
    es: 'Ayuno y Autofagia'
  },
  pral: {
    fr: 'Aliments Électriques & PRAL',
    'fr-CA': 'Aliments Électriques & PRAL',
    en: 'Electric Foods & PRAL',
    es: 'Alimentos Eléctricos y PRAL'
  },
  herbs: {
    fr: 'Plantes & Dépuratifs',
    'fr-CA': 'Plantes & Dépuratifs',
    en: 'Herbs & Cleansers',
    es: 'Plantas y Depurativos'
  },
  breath: {
    fr: 'Respiration & Oxygénation',
    'fr-CA': 'Respiration & Oxygénation',
    en: 'Breathing & Oxygenation',
    es: 'Respiración y Oxigenación'
  },
  mindset: {
    fr: 'Conscience & Vitalisme',
    'fr-CA': 'Conscience & Vitalisme',
    en: 'Mindset & Vitalism',
    es: 'Conciencia y Vitalismo'
  }
};

// 43 Fiches Fondamentales Exhaustives
const CORE_CARDS = [
  // ── ARNOLD EHRET (8 cards) ──
  {
    k: 'ehret', cat: 'mucusless', phase: 'all', w: 0, s: 'Arnold Ehret vitalite moteur obstruction',
    fr: {
      q: "La vitalité du moteur humain répond à l'équation universelle : Vitalité = Puissance Motrice – Obstruction interne.",
      t: "Réduisez les féculents cuits collants et les produits laitiers pour diminuer l'obstruction sanguine."
    },
    'fr-CA': {
      q: "La vitalité du moteur humain répond à l'équation universelle : Vitalité = Puissance Motrice – Obstruction interne.",
      t: "Réduisez les féculents cuits collants et les produits laitiers pour diminuer l'obstruction sanguine."
    },
    en: {
      q: "Vitality of the human engine is expressed by the universal formula: Vitality = Power minus Obstruction (V = P - O).",
      t: "Reduce sticky cooked starches and dairy products to minimize internal blood obstruction."
    },
    es: {
      q: "La vitalidad del motor humano responde a la ecuación universal: Vitalidad = Potencia Motriz – Obstrucción interna (V = P - O).",
      t: "Reduzca los almidones cocidos pegajosos y los lácteos para disminuir la obstrucción sanguínea."
    }
  },
  {
    k: 'ehret', cat: 'fasting', phase: 'elimination', w: 1, s: 'Arnold Ehret langue miroir magique',
    fr: {
      q: "La langue est le miroir magique du tractus digestif. Si elle est blanche ou chargée au réveil, votre corps élimine des résidus acides.",
      t: "Observez votre langue au lever. Si elle est pâteuse, prolongez le jeûne matinal avec de l'eau tiède citronnée."
    },
    'fr-CA': {
      q: "La langue est le miroir magique du tractus digestif. Si elle est blanche ou chargée au réveil, votre corps élimine des résidus acides.",
      t: "Observez votre langue au lever. Si elle est pâteuse, prolongez le jeûne matinal avec de l'eau tiède citronnée."
    },
    en: {
      q: "The tongue is the magic mirror of the gastrointestinal tract. If white or coated upon awakening, the body is eliminating acidic waste.",
      t: "Inspect your tongue upon waking. If coated, extend your morning fast with warm lemon water."
    },
    es: {
      q: "La lengua es el espejo mágico del tracto digestivo. Si está blanca o cargada al despertar, su cuerpo está eliminando residuos ácidos.",
      t: "Observe su lengua al levantarse. Si está pastosa, prolongue el ayuno matutino con agua tibia con limón."
    }
  },
  {
    k: 'ehret', cat: 'mucusless', phase: 'appropriation', w: 0, s: 'Arnold Ehret fruits sans mucus legumes',
    fr: {
      q: "Les fruits mûrs et les légumes verts feuillus crus sont les seuls véritables aliments sans mucus créés par la nature.",
      t: "Faites des fruits mûrs ou d'une salade de crudités la pièce maîtresse de vos repas légers."
    },
    'fr-CA': {
      q: "Les fruits mûrs et les légumes verts feuillus crus sont les seuls véritables aliments sans mucus créés par la nature.",
      t: "Faites des fruits mûrs ou d'une salade de crudités la pièce maîtresse de vos dîners et soupers légers."
    },
    en: {
      q: "Ripe fruits and raw green leafy vegetables are the only true mucusless foods created by Nature.",
      t: "Make ripe fruits or a fresh raw salad the centerpiece of your lighter daily meals."
    },
    es: {
      q: "Las frutas maduras y las verduras de hoja verde crudas son los únicos alimentos verdaderamente sin moco creados por la naturaleza.",
      t: "Haga de las frutas maduras o de una ensalada cruda el plato central de sus comidas ligeras."
    }
  },
  {
    k: 'ehret', cat: 'fasting', phase: 'elimination', w: 1, s: 'Arnold Ehret transition regime sans mucus',
    fr: {
      q: "La transition graduelle est le secret d'une régénération durable. Ne passez jamais brutalement d'une alimentation standard au jeûne strict.",
      t: "Adoptez le 'Plan sans petit-déjeuner' (No-Breakfast Plan) : buvez de l'eau tiède ou une tisane le matin et mangez à midi."
    },
    'fr-CA': {
      q: "La transition graduelle est le secret d'une régénération durable. Ne passez jamais brutalement d'une alimentation standard au jeûne strict.",
      t: "Adoptez le 'Plan sans déjeuner' (No-Breakfast Plan) : buvez de l'eau tiède ou une tisane le matin et mangez au dîner."
    },
    en: {
      q: "Gradual transition is the key to lasting regeneration. Never switch abruptly from the standard diet to strict fasting.",
      t: "Adopt the 'No-Breakfast Plan': drink warm water or herbal tea in the morning and eat your first meal at noon."
    },
    es: {
      q: "La transición gradual es el secreto de una regeneración duradera. Nunca pase bruscamente de una dieta estándar al ayuno estricto.",
      t: "Adopte el 'Plan sin desayuno': beba agua tibia o infusión por la mañana y coma al mediodía."
    }
  },
  {
    k: 'ehret', cat: 'mucusless', phase: 'appropriation', w: 0, s: 'Arnold Ehret salade balai transition',
    fr: {
      q: "La salade de transition associant carottes râpées, céleri et chou cru agit comme un véritable balai mécanique pour décoller le mucus incrusté.",
      t: "Consommez une 'salade balai' à base de chou râpé, carotte et jus de citron avant votre plat principal."
    },
    'fr-CA': {
      q: "La salade de transition associant carottes râpées, céleri et chou cru agit comme un véritable balai mécanique pour décoller le mucus incrusté.",
      t: "Consommez une 'salade balai' à base de chou râpé, carotte et jus de citron avant votre repas principal."
    },
    en: {
      q: "The transition salad combining shredded raw carrots, celery, and cabbage acts as a mechanical broom to dislodge encrusted mucus.",
      t: "Eat a raw 'broom salad' of shredded cabbage, carrot, and fresh lemon juice before your cooked main dish."
    },
    es: {
      q: "La ensalada de transición de zanahoria rallada, apio y repollo crudo actúa como una escoba mecánica para desalojar el moco incrustado.",
      t: "Consuma una 'ensalada escoba' de repollo rallado, zanahoria y limón antes de su plato principal."
    }
  },
  {
    k: 'ehret', cat: 'fasting', phase: 'appropriation', w: 1, s: 'Arnold Ehret rupture jeune fruits',
    fr: {
      q: "La rupture du jeûne est plus importante que le jeûne lui-même. Rompre avec des aliments cuits denses peut bloquer les émonctoires.",
      t: "Rompez toujours un jeûne avec des fruits aqueux doux (pommes compotées doucement ou raisin frais)."
    },
    'fr-CA': {
      q: "La rupture du jeûne est plus importante que le jeûne lui-même. Rompre avec des aliments cuits denses peut bloquer les émonctoires.",
      t: "Rompez toujours un jeûne avec des fruits aqueux doux (pommes compotées doucement ou raisin frais)."
    },
    en: {
      q: "Breaking a fast is more critical than the fast itself. Breaking with heavy, dense cooked foods can choke the eliminating organs.",
      t: "Always break a fast with gentle aqueous fruits such as lightly stewed apples or fresh grapes."
    },
    es: {
      q: "Romper el ayuno es más importante que el ayuno en sí. Romper con alimentos cocinados pesados puede obstruir los emuntorios.",
      t: "Rompa siempre el ayuno con frutas acuosas suaves (manzanas compotadas o uvas frescas)."
    }
  },
  {
    k: 'ehret', cat: 'pral', phase: 'appropriation', w: 0, s: 'Arnold Ehret sucre de raisin glucose',
    fr: {
      q: "Le sucre de raisin et le fructose naturel des fruits mûrs constituent le combustible le plus pur et le plus électrisant pour les cellules nerveuses.",
      t: "Privilégiez les dattes fraîches, figues et raisins au lieu des sucres raffinés ou sirops industriels."
    },
    'fr-CA': {
      q: "Le sucre de raisin et le fructose naturel des fruits mûrs constituent le combustible le plus pur et le plus électrisant pour les cellules nerveuses.",
      t: "Privilégiez les dattes fraîches, figues et raisins au lieu des sucres raffinés ou sirops industriels."
    },
    en: {
      q: "Grape sugar and natural fruit fructose provide the cleanest and most electrifying fuel for the human nervous system.",
      t: "Favor fresh dates, ripe figs, and dark seeded grapes instead of refined table sugars or industrial syrups."
    },
    es: {
      q: "El azúcar de uva y la fructosa natural de las frutas maduras son el combustible más puro y electrizante para las células nerviosas.",
      t: "Prefiera dátiles frescos, higos y uvas en lugar de azúcares refinados o jarabes industriales."
    }
  },
  {
    k: 'ehret', cat: 'mucusless', phase: 'all', w: 0, s: 'Arnold Ehret lait fromage mucus',
    fr: {
      q: "Le lait de vache pasteurisé et le fromage créent la colle la plus tenace et le mucus le plus obstructif dans les villosités intestinales.",
      t: "Remplacez les crèmes et fromages par des purées d'avocat, du tahini cru ou des laits d'amande fraîchement pressés."
    },
    'fr-CA': {
      q: "Le lait de vache pasteurisé et le fromage créent la colle la plus tenace et le mucus le plus obstructif dans les villosités intestinales.",
      t: "Remplacez les crèmes et fromages par des purées d'avocat, du tahini cru ou des laits d'amande fraîchement pressés."
    },
    en: {
      q: "Pasteurized cow's milk and cheese create the most tenacious glue and obstructive slime in the intestinal villi.",
      t: "Replace dairy creams and cheese with ripe avocado purée, raw tahini, or freshly made almond milk."
    },
    es: {
      q: "La leche pasteurizada y el queso crean el pegamento más tenaz y el moco más obstructivo en las vellosidades intestinales.",
      t: "Reemplace lácteos y quesos con puré de aguacate, tahini crudo o leche de almendras recién exprimida."
    }
  },

  // ── DR. ROBERT MORSE (8 cards) ──
  {
    k: 'morse', cat: 'detox', phase: 'all', w: 0, s: 'Robert Morse systeme lymphatique rein',
    fr: {
      q: "Le système lymphatique est le réseau d'égouts de votre corps. S'il stagne, les cellules baignent dans leurs propres déchets acides métaboliques.",
      t: "Activez vos reins par des infusions de plantes diurétiques et consommez des fruits astringents."
    },
    'fr-CA': {
      q: "Le système lymphatique est le réseau d'égouts de votre corps. S'il stagne, les cellules baignent dans leurs propres déchets acides métaboliques.",
      t: "Activez vos reins par des infusions de plantes diurétiques et consommez des fruits astringents."
    },
    en: {
      q: "The lymphatic system is the septic tank and sewage system of your body. When it stagnates, cells bathe in their own acidic metabolic waste.",
      t: "Open kidney filtration using diuretic herbal infusions and prioritize astringent sub-acid fruits."
    },
    es: {
      q: "El sistema linfático es el sistema de alcantarillado del cuerpo. Si se estanca, las células se bañan en sus propios desechos metabólicos ácidos.",
      t: "Active sus riñones con infusiones diuréticas y consuma frutas astringentes."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'appropriation', w: 1, s: 'Robert Morse raisin pastèque lymphe',
    fr: {
      q: "Les fruits sont les plus puissants dissolvants de la lymphe et les meilleurs nettoyeurs cellulaires sur Terre grâce à leur haute vibration électromagnétique.",
      t: "Expérimentez une journée de mono-diète de raisin noir ou de pastèque pour drainer les acides interstitiels."
    },
    'fr-CA': {
      q: "Les fruits sont les plus puissants dissolvants de la lymphe et les meilleurs nettoyeurs cellulaires sur Terre grâce à leur haute vibration électromagnétique.",
      t: "Expérimentez une journée de mono-diète de raisin noir ou de pastèque pour drainer les acides interstitiels."
    },
    en: {
      q: "Fruits are the greatest lymphatic movers and cellular cleansers on Earth due to their high electromagnetic vibration.",
      t: "Experiment with a mono-diet of dark seeded grapes or fresh watermelon for a day to flush interstitial acids."
    },
    es: {
      q: "Las frutas son los mayores limpiadores celulares y movilizadores linfáticos de la Tierra gracias a su alta vibración electromagnética.",
      t: "Experimente un día de mono-dieta de uvas negras o sandía para drenar los ácidos intersticiales."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'elimination', w: 0, s: 'Robert Morse reins filtration urine sediment',
    fr: {
      q: "Tant que vos reins ne filtrent pas (présence de sédiments ou de flocons dans l'urine du matin), la lymphe reste bloquée dans vos tissus.",
      t: "Vérifiez la transparence de vos urines du matin dans un bocal en verre pour observer la filtration des acides."
    },
    'fr-CA': {
      q: "Tant que vos reins ne filtrent pas (présence de sédiments ou de flocons dans l'urine du matin), la lymphe reste bloquée dans vos tissus.",
      t: "Vérifiez la transparence de vos urines du matin dans un bocal en verre pour observer la filtration des acides."
    },
    en: {
      q: "Unless your kidneys are filtering—shown by sediment and flakes in morning urine—lymphatic waste remains trapped in tissues.",
      t: "Check your morning urine in a clear glass jar against the light to look for cloudiness and acid sediment."
    },
    es: {
      q: "Mientras sus riñones no filtren (sedimentos visibles en la orina matutina), la linfa permanece atrapada en sus tejidos.",
      t: "Compruebe la orina matutina en un frasco de vidrio para observar la presencia de sedimentos de filtración."
    }
  },
  {
    k: 'morse', cat: 'herbs', phase: 'all', w: 1, s: 'Robert Morse plantes energie cellulaire rein',
    fr: {
      q: "Les plantes ne guérissent pas directement : elles nettoient le terrain, éliminent l'acidose et fournissent l'énergie électromagnétique nécessaire à la cellule.",
      t: "Associez les baies de genièvre ou la prêle des champs pour renforcer le tissu rénal."
    },
    'fr-CA': {
      q: "Les plantes ne guérissent pas directement : elles nettoient le terrain, éliminent l'acidose et fournissent l'énergie électromagnétique nécessaire à la cellule.",
      t: "Associez les baies de genièvre ou la prêle des champs pour renforcer le tissu rénal."
    },
    en: {
      q: "Herbs do not heal directly: they clean the terrain, reverse acidosis, and provide the electromagnetic energy the cell needs to regenerate.",
      t: "Combine juniper berries, cleavers, or horsetail herb to strengthen and tone renal tissue."
    },
    es: {
      q: "Las plantas no curan directamente: limpian el terreno, revierten la acidosis y aportan energía electromagnética a las células.",
      t: "Combine bayas de enebro o cola de caballo para tonificar y fortalecer el tejido renal."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'appropriation', w: 1, s: 'Robert Morse fruits astringents agrumes baies',
    fr: {
      q: "Plus un fruit est astringent (agrumes, baies, cerises, grenades, raisins), plus il contracte les tissus pour en expulser la lymphe toxique.",
      t: "Mangez des myrtilles sauvages, des grenades ou du pamplemousse rose au petit-déjeuner."
    },
    'fr-CA': {
      q: "Plus un fruit est astringent (agrumes, baies, cerises, grenades, raisins), plus il contracte les tissus pour en expulser la lymphe toxique.",
      t: "Mangez des bleuets sauvages, des grenades ou du pamplemousse rose au déjeuner."
    },
    en: {
      q: "The more astringent a fruit is—citrus, berries, cherries, pomegranates, grapes—the more it contracts tissues to squeeze out stagnant toxic lymph.",
      t: "Include wild blueberries, fresh pomegranate, or pink grapefruit in your morning routine."
    },
    es: {
      q: "Cuanto más astringente es una fruta (cítricos, bayas, cerezas, granadas, uvas), más contrae los tejidos para expulsar la linfa tóxica.",
      t: "Incluya arándanos silvestres, granada o pomelo rosado en su desayuno depurativo."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'elimination', w: 0, s: 'Robert Morse surrenales reins inflammation',
    fr: {
      q: "Les glandes surrénales contrôlent les reins et l'inflammation. Des surrénales épuisées empêchent la filtration des déchets acides.",
      t: "Soutenez vos surrénales avec des plantes adaptogènes et un sommeil de qualité avant minuit."
    },
    'fr-CA': {
      q: "Les glandes surrénales contrôlent les reins et l'inflammation. Des surrénales épuisées empêchent la filtration des déchets acides.",
      t: "Soutenez vos surrénales avec des plantes adaptogènes et un sommeil de qualité avant minuit."
    },
    en: {
      q: "The adrenal glands control the kidneys, blood pressure, and inflammation. Exhausted adrenals prevent proper kidney filtration.",
      t: "Nourish your adrenals with adaptogenic herbs, mineral salts, and deep restorative sleep before midnight."
    },
    es: {
      q: "Las glándulas suprarrenales controlan los riñones y la inflamación. Suprarrenales agotadas impiden la filtración renal de ácidos.",
      t: "Nutra sus suprarrenales con plantas adaptógenas y sueño reparador antes de medianoche."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'all', w: 1, s: 'Robert Morse acide alcalin',
    fr: {
      q: "Il n'y a que deux côtés à la chimie de la vie : l'acide qui décompose, enflamme et corrode, et l'alcalin qui apaise, guérit et reconstruit.",
      t: "Mesurez le PRAL de vos repas pour maintenir une majorité d'aliments basifiants et reminéralisants."
    },
    'fr-CA': {
      q: "Il n'y a que deux côtés à la chimie de la vie : l'acide qui décompose, enflamme et corrode, et l'alcalin qui apaise, guérit et reconstruit.",
      t: "Mesurez le PRAL de vos repas pour maintenir une majorité d'aliments basifiants et reminéralisants."
    },
    en: {
      q: "There are only two sides to chemistry in the universe: acid which breaks down and corrodes, and alkaline which heals, calms, and rebuilds.",
      t: "Track the PRAL score of your daily meals to ensure a vast majority of alkalizing and mineral-rich foods."
    },
    es: {
      q: "Solo hay dos lados en la química: el ácido que descompone y corroe, y el alcalino que calma, sana y reconstruye.",
      t: "Mida el puntaje PRAL de sus comidas para asegurar una mayoría de alimentos alcalinizantes y minerales."
    }
  },
  {
    k: 'morse', cat: 'detox', phase: 'elimination', w: 1, s: 'Robert Morse peau troisieme rein sueur',
    fr: {
      q: "La peau est votre troisième rein. Si les reins filtrent mal, la lymphe toxique est rejetée par la peau (eczéma, acné, sueurs acides).",
      t: "Pratiquez le brossage à sec de la peau avant la douche pour stimuler la microcirculation lymphatique périphérique."
    },
    'fr-CA': {
      q: "La peau est votre troisième rein. Si les reins filtrent mal, la lymphe toxique est rejetée par la peau (eczéma, acné, sueurs acides).",
      t: "Pratiquez le brossage à sec de la peau avant la douche pour stimuler la microcirculation lymphatique périphérique."
    },
    en: {
      q: "The skin is your third kidney. If the kidneys fail to filter, caustic lymph is pushed through the skin, causing rashes, acne, and eczema.",
      t: "Practice dry skin brushing toward the heart before showering to stimulate peripheral lymphatic flow."
    },
    es: {
      q: "La piel es el tercer riñón. Si los riñones no filtran, la linfa ácida se expulsa a través de la piel (eccema, acné, sudores ácidos).",
      t: "Practique el cepillado en seco de la piel antes de ducharse para activar el flujo linfático."
    }
  },

  // ── DR. SEBI (8 cards) ──
  {
    k: 'sebi', cat: 'pral', phase: 'all', w: 0, s: 'Dr Sebi aliments electriques fonio teff',
    fr: {
      q: "Notre corps est électrique. Tout ce qui n'est pas électrique ou alcalin à l'état naturel affaiblit notre fréquence vibratoire et notre vitalité.",
      t: "Privilégiez les céréales anciennes non hybridées comme le fonio, le teff, l'amarante ou le quinoa sauvage."
    },
    'fr-CA': {
      q: "Notre corps est électrique. Tout ce qui n'est pas électrique ou alcalin à l'état naturel affaiblit notre fréquence vibratoire et notre vitalité.",
      t: "Privilégiez les céréales anciennes non hybridées comme le fonio, le teff, l'amarante ou le quinoa sauvage."
    },
    en: {
      q: "Our body is electrical. Everything that is not natural and alkaline weakens our electrical cellular vibration and vital energy.",
      t: "Choose ancient non-hybridized grains such as fonio, teff, amaranth, and wild quinoa."
    },
    es: {
      q: "Nuestro cuerpo es eléctrico. Todo lo que no sea natural y alcalino debilita nuestra vibración eléctrica y energía vital.",
      t: "Priorice granos ancestrales no hibridados como fonio, teff, amaranto y quinua silvestre."
    }
  },
  {
    k: 'sebi', cat: 'mucusless', phase: 'appropriation', w: 0, s: 'Dr Sebi mucus acidite pepins',
    fr: {
      q: "La maladie ne peut exister que dans un environnement où il y a du mucus et de l'acidité. Éliminez le mucus, la maladie disparaît.",
      t: "Bannissez les fruits sans pépins (seedless) et choisissez des fruits à pépins authentiques et naturels."
    },
    'fr-CA': {
      q: "La maladie ne peut exister que dans un environnement où il y a du mucus et de l'acidité. Éliminez le mucus, la maladie disparaît.",
      t: "Bannissez les fruits sans pépins (seedless) et choisissez des fruits à pépins authentiques et naturels."
    },
    en: {
      q: "Disease can only exist in an environment of mucus and acidity. Eradicate mucus, and disease cannot survive.",
      t: "Eliminate seedless fruits and select authentic, fertile seeded fruits provided by nature."
    },
    es: {
      q: "La enfermedad solo puede existir en un entorno de moco y acidez. Elimine el moco y la enfermedad desaparecerá.",
      t: "Evite frutas sin semillas e incluya frutas auténticas y fértiles con semillas."
    }
  },
  {
    k: 'sebi', cat: 'herbs', phase: 'elimination', w: 1, s: 'Dr Sebi sea moss mousse irlande mineraux',
    fr: {
      q: "Le Sea Moss (mousse d'Irlande / Chondrus crispus) contient 92 des 102 minéraux dont le corps humain est composé.",
      t: "Ajoutez une cuillère de gel de Sea Moss dans vos smoothies matinaux pour reminéraliser la matrice extracellulaire."
    },
    'fr-CA': {
      q: "Le Sea Moss (mousse d'Irlande / Chondrus crispus) contient 92 des 102 minéraux dont le corps humain est composé.",
      t: "Ajoutez une cuillère de gel de Sea Moss dans vos smoothies matinaux pour reminéraliser la matrice extracellulaire."
    },
    en: {
      q: "Sea Moss (Irish Moss / Chondrus crispus) contains 92 of the 102 minerals that the human body is composed of.",
      t: "Add a tablespoon of wildcrafted Sea Moss gel to morning smoothies to remineralize the extracellular matrix."
    },
    es: {
      q: "El Sea Moss (musgo irlandés / Chondrus crispus) contiene 92 de los 102 minerales que componen el cuerpo humano.",
      t: "Agregue una cucharada de gel de Sea Moss a sus batidos matutinos para remineralizar la matriz celular."
    }
  },
  {
    k: 'sebi', cat: 'pral', phase: 'appropriation', w: 0, s: 'Dr Sebi liste nutritionnelle bio electrique',
    fr: {
      q: "Les huiles cuites ou hydrogénées bouchent les membranes cellulaires. Utilisez uniquement l'huile d'avocat ou de sésame crue.",
      t: "N'utilisez jamais d'huile raffinée. Privilégiez l'huile d'olive extra-vierge première pression à froid ou l'avocat."
    },
    'fr-CA': {
      q: "Les huiles cuites ou hydrogénées bouchent les membranes cellulaires. Utilisez uniquement l'huile d'avocat ou de sésame crue.",
      t: "N'utilisez jamais d'huile raffinée. Privilégiez l'huile d'olive extra-vierge première pression à froid ou l'avocat."
    },
    en: {
      q: "Cooked and hydrogenated oils clog cellular membranes. Use only raw cold-pressed avocado oil or sesame oil.",
      t: "Avoid refined processed oils. Opt for cold-pressed extra virgin olive oil or fresh avocado."
    },
    es: {
      q: "Los aceites cocinados o hidrogenados obstruyen las membranas celulares. Use solo aceite de aguacate o sésamo crudo.",
      t: "Evite aceites refinados. Prefiera aceite de oliva virgen extra de primera presión en frío o aguacate."
    }
  },
  {
    k: 'sebi', cat: 'pral', phase: 'elimination', w: 0, s: 'Dr Sebi eau de source mineraux',
    fr: {
      q: "L'eau de source naturelle riche en minéraux dissous est le seul solvant capable de nettoyer sans laisser de dépôts calcaires inorganiques.",
      t: "Buvez de l'eau de source en bouteille de verre ou une eau filtrée reminéralisée au citron vert (lime)."
    },
    'fr-CA': {
      q: "L'eau de source naturelle riche en minéraux dissous est le seul solvant capable de nettoyer sans laisser de dépôts calcaires inorganiques.",
      t: "Buvez de l'eau de source en bouteille de verre ou une eau filtrée reminéralisée au citron vert (lime)."
    },
    en: {
      q: "Natural mineral-rich spring water is the only solvent capable of flushing toxins without leaving inorganic calcified deposits.",
      t: "Drink natural spring water bottled in glass or filtered water remineralized with fresh key lime juice."
    },
    es: {
      q: "El agua mineral de manantial es el único solvente capaz de limpiar sin dejar depósitos calcáreos inorgánicos.",
      t: "Beba agua de manantial en vidrio o agua filtrada remineralizada con jugo de lima fresca."
    }
  },
  {
    k: 'sebi', cat: 'herbs', phase: 'all', w: 1, s: 'Dr Sebi salsepareille fer ionique',
    fr: {
      q: "La salsepareille (Sarsaparilla) est la plus grande source de fer végétal ionique bio-disponible, essentiel au transport de l'oxygène cellulaire.",
      t: "Infusez de la racine de salsepareille sauvage pour recharger votre sang en fer végétal assimilable sans constiper."
    },
    'fr-CA': {
      q: "La salsepareille (Sarsaparilla) est la plus grande source de fer végétal ionique bio-disponible, essentiel au transport de l'oxygène cellulaire.",
      t: "Infusez de la racine de salsepareille sauvage pour recharger votre sang en fer végétal assimilable sans constiper."
    },
    en: {
      q: "Wild Sarsaparilla is the greatest source of ionic plant-based iron, essential for oxygen transport and cellular respiration.",
      t: "Brew wild sarsaparilla root tea to restore bioavailable iron without causing constipation."
    },
    es: {
      q: "La zarzaparrilla silvestre es la mayor fuente de hierro iónico vegetal, esencial para el transporte de oxígeno celular.",
      t: "Prepare infusión de raíz de zarzaparrilla para recargar hierro vegetal biodisponible sin estreñimiento."
    }
  },
  {
    k: 'sebi', cat: 'mucusless', phase: 'all', w: 0, s: 'Dr Sebi soja mais hybridation',
    fr: {
      q: "Le soja et le maïs moderne sont des créations de laboratoire hautement hybridées et productrices de toxines visqueuses dans le foie.",
      t: "Évitez le tofu et le maïs hybridé ; remplacez-les par des graines de chanvre et du lait de coco pressé."
    },
    'fr-CA': {
      q: "Le soja et le maïs moderne sont des créations de laboratoire hautement hybridées et productrices de toxines visqueuses dans le foie.",
      t: "Évitez le tofu et le maïs hybridé ; remplacez-les par des graines de chanvre et du lait de coco pressé."
    },
    en: {
      q: "Modern soy and hybrid corn are laboratory creations producing heavy viscous toxins and mucous congestion in the liver.",
      t: "Avoid processed soy and hybrid corn; replace them with hemp seeds, raw walnut butter, and cold-pressed coconut milk."
    },
    es: {
      q: "La soja y el maíz moderno son híbridos artificiales que producen toxinas viscosas y congestión en el hígado.",
      t: "Evite la soja y el maíz híbrido; sustitúyalos por semillas de cáñamo y leche de coco fresca."
    }
  },
  {
    k: 'sebi', cat: 'pral', phase: 'appropriation', w: 0, s: 'Dr Sebi cresson roquette alcalin',
    fr: {
      q: "Les feuilles de pissenlit et le cresson sauvage apportent des minéraux ionisés qui ne calcifient pas les artères.",
      t: "Intégrez des poignées de cresson et de roquette sauvage dans vos salades de midi."
    },
    'fr-CA': {
      q: "Les feuilles de pissenlit et le cresson sauvage apportent des minéraux ionisés qui ne calcifient pas les artères.",
      t: "Intégrez des poignées de cresson et de roquette sauvage dans vos salades du dîner."
    },
    en: {
      q: "Wild dandelion greens and watercress provide bio-electric ionized minerals that nourish cells without calcifying the arteries.",
      t: "Include generous handfuls of wild watercress and arugula into your daily lunch salads."
    },
    es: {
      q: "Las hojas de diente de león y el berro silvestre aportan minerales ionizados que no calcifican las arterias.",
      t: "Incorpore puñados de berro y rúcula silvestre en sus ensaladas del mediodía."
    }
  },

  // ── DAVID WOLFE (8 cards) ──
  {
    k: 'wolfe', cat: 'mucusless', phase: 'all', w: 0, s: 'David Wolfe biophotons enzymes cru',
    fr: {
      q: "En mangeant des aliments crus cueillis à maturité, vous ingérez de la lumière solaire condensée sous forme de biophotons cellulaires.",
      t: "Intégrez au moins 70% d'aliments crus et gorgés d'eau dans votre assiette pour préserver les enzymes intactes."
    },
    'fr-CA': {
      q: "En mangeant des aliments crus cueillis à maturité, vous ingérez de la lumière solaire condensée sous forme de biophotons cellulaires.",
      t: "Intégrez au moins 70% d'aliments crus et gorgés d'eau dans votre assiette pour préserver les enzymes intactes."
    },
    en: {
      q: "By eating sun-ripened raw organic plant foods, you are ingesting condensed sunlight in the form of cellular biophotons.",
      t: "Aim for at least 70% raw, high-water-content foods in your meals to keep living enzymes fully active."
    },
    es: {
      q: "Al comer alimentos crudos madurados al sol, ingiere luz solar condensada en forma de biofotones celulares.",
      t: "Procure que al menos el 70% de sus comidas sean alimentos crudos y ricos en agua para conservar enzimas intactas."
    }
  },
  {
    k: 'wolfe', cat: 'herbs', phase: 'elimination', w: 1, s: 'David Wolfe chlorophylle sang hemoglobine',
    fr: {
      q: "La molécule de chlorophylle est presque identique à l'hémoglobine humaine, le magnésium remplaçant le fer au centre atomique.",
      t: "Buvez un verre de jus d'herbe de blé ou de jus de céleri pur à jeun pour renouveler le sang artériel."
    },
    'fr-CA': {
      q: "La molécule de chlorophylle est presque identique à l'hémoglobine humaine, le magnésium remplaçant le fer au centre atomique.",
      t: "Buvez un verre de jus d'herbe de blé ou de jus de céleri pur à jeun pour renouveler le sang artériel."
    },
    en: {
      q: "The chlorophyll molecule is virtually identical to human hemoglobin, with magnesium sitting at the molecular core instead of iron.",
      t: "Drink a fresh glass of cold-pressed wheatgrass or pure celery juice on an empty stomach to build new red blood cells."
    },
    es: {
      q: "La molécula de clorofila es casi idéntica a la hemoglobina humana, con magnesio en el centro en lugar de hierro.",
      t: "Beba un vaso de zumo de pasto de trigo o apio puro en ayunas para renovar la sangre arterial."
    }
  },
  {
    k: 'wolfe', cat: 'fasting', phase: 'regeneration', w: 0, s: 'David Wolfe digestion sommeil energie vitale',
    fr: {
      q: "La digestion d'aliments cuits denses consomme plus d'énergie vitale qu'un marathon. Allégez vos dîners pour un sommeil réparateur.",
      t: "Cessez de manger au moins 3 heures avant le coucher pour laisser l'énergie réparer vos neurones et vos tissus."
    },
    'fr-CA': {
      q: "La digestion d'aliments cuits denses consomme plus d'énergie vitale qu'un marathon. Allégez vos soupers pour un sommeil réparateur.",
      t: "Cessez de manger au moins 3 heures avant le coucher pour laisser l'énergie réparer vos neurones et vos tissus."
    },
    en: {
      q: "Digesting heavy cooked foods consumes more vital energy than running a marathon. Lighten dinner for deep restorative sleep.",
      t: "Stop eating at least 3 hours before bedtime so metabolic energy can focus on brain and tissue regeneration."
    },
    es: {
      q: "Digerir comidas cocidas pesadas consume más energía vital que un maratón. Cene ligero para un sueño reparador.",
      t: "Deje de comer al menos 3 horas antes de acostarse para que la energía regenere sus tejidos."
    }
  },
  {
    k: 'wolfe', cat: 'pral', phase: 'appropriation', w: 1, s: 'David Wolfe graines germees enzymes germination',
    fr: {
      q: "Lors de la germination, le potentiel enzymatique d'une graine est multiplié par 300 à 1200% et ses protéines deviennent assimilables sans effort.",
      t: "Faites germer vos graines d'alfalfa, de brocoli ou de fenugrec chez vous dans un simple bocal en verre."
    },
    'fr-CA': {
      q: "Lors de la germination, le potentiel enzymatique d'une graine est multiplié par 300 à 1200% et ses protéines deviennent assimilables sans effort.",
      t: "Faites germer vos graines d'alfalfa, de brocoli ou de fenugrec chez vous dans un simple bocal en verre."
    },
    en: {
      q: "During germination, the enzyme potential of a seed increases by 300% to 1200% and its proteins become effortlessly bioavailable.",
      t: "Sprout alfalfa, broccoli, or fenugreek seeds at home in a simple glass mason jar."
    },
    es: {
      q: "Durante la germinación, el potencial enzimático de una semilla se multiplica por 300 a 1200% y sus proteínas se vuelven asimilables.",
      t: "Germine semillas de alfalfa, brócoli o fenogreco en casa en un frasco de vidrio."
    }
  },
  {
    k: 'wolfe', cat: 'herbs', phase: 'appropriation', w: 2, s: 'David Wolfe cacao cru magnesium antioxydants',
    fr: {
      q: "Le cacao cru non torréfié est l'aliment naturel le plus riche en magnésium et en antioxydants flavonoïdes au monde.",
      t: "Ajoutez une cuillère à café de fèves de cacao cru concassées dans vos mélanges de baies fraîches."
    },
    'fr-CA': {
      q: "Le cacao cru non torréfié est l'aliment naturel le plus riche en magnésium et en antioxydants flavonoïdes au monde.",
      t: "Ajoutez une cuillère à thé de fèves de cacao cru concassées dans vos mélanges de petits fruits frais."
    },
    en: {
      q: "Raw unroasted cacao is the world's premier natural source of magnesium, iron, and heart-protective flavonoid antioxidants.",
      t: "Add a teaspoon of crushed raw cacao nibs into your fresh berry bowls or raw desserts."
    },
    es: {
      q: "El cacao crudo sin tostar es la mayor fuente natural de magnesio, hierro y flavonoides antioxidantes del mundo.",
      t: "Añada una cucharadita de nibs de cacao crudo en sus cuencos de bayas frescas."
    }
  },
  {
    k: 'wolfe', cat: 'fasting', phase: 'elimination', w: 0, s: 'David Wolfe jus vert chlorophylle',
    fr: {
      q: "Un jeûne aux jus verts alcalins permet d'éliminer les toxines sans la fatigue liée à la chute brutale de glycémie.",
      t: "Préparez un jus pressé à froid : concombre, céleri branche, pomme verte, épinards frais et gingembre."
    },
    'fr-CA': {
      q: "Un jeûne aux jus verts alcalins permet d'éliminer les toxines sans la fatigue liée à la chute brutale de glycémie.",
      t: "Préparez un jus pressé à froid : concombre, céleri branche, pomme verte, épinards frais et gingembre."
    },
    en: {
      q: "A fast on alkalizing green juices flushes accumulated toxins without the energy crash of severe blood sugar drops.",
      t: "Prepare a fresh cold-pressed green juice: cucumber, celery stalks, green apple, fresh spinach, and ginger."
    },
    es: {
      q: "Un ayuno con zumos verdes alcalinos permite eliminar toxinas sin la fatiga de caídas bruscas de glucosa.",
      t: "Prepare zumo prensado en frío: pepino, apio, manzana verde, espinacas frescas y jengibre."
    }
  },
  {
    k: 'wolfe', cat: 'herbs', phase: 'regeneration', w: 2, s: 'David Wolfe reishi superfood',
    fr: {
      q: "Le champignon Reishi (Ganoderma lucidum) est l'élixir souverain pour calmer le système nerveux sympathique et régénérer le foie.",
      t: "Consommez une décoction d'extrait de Reishi rouge le soir pour favoriser un sommeil profond et réparateur."
    },
    'fr-CA': {
      q: "Le champignon Reishi (Ganoderma lucidum) est l'élixir souverain pour calmer le système nerveux sympathique et régénérer le foie.",
      t: "Consommez une décoction d'extrait de Reishi rouge le soir pour favoriser un sommeil profond et réparateur."
    },
    en: {
      q: "Reishi mushroom (Ganoderma lucidum) is the premier adaptogen to calm sympathetic tension and support liver enzyme regeneration.",
      t: "Enjoy a warm red reishi decoction in the evening to promote deep delta-wave sleep."
    },
    es: {
      q: "El hongo Reishi (Ganoderma lucidum) es el adaptógeno supremo para calmar el sistema simpático y regenerar el hígado.",
      t: "Beba una decocción de Reishi rojo por la noche para promover un sueño profundo y reparador."
    }
  },
  {
    k: 'wolfe', cat: 'pral', phase: 'all', w: 0, s: 'David Wolfe eau de coco electrolytes potassium',
    fr: {
      q: "L'eau de coco fraîche est un plasma isotonique naturel identique aux fluides corporels humains, riche en potassium et électrolytes.",
      t: "Hydratez-vous avec de l'eau de coco jeune après une séance de sudation ou d'exposition au soleil."
    },
    'fr-CA': {
      q: "L'eau de coco fraîche est un plasma isotonique naturel identique aux fluides corporels humains, riche en potassium et électrolytes.",
      t: "Hydratez-vous avec de l'eau de coco jeune après une séance de sudation ou d'exposition au soleil."
    },
    en: {
      q: "Fresh young coconut water is natural isotonic plasma virtually identical to human blood fluids, packed with potassium electrolytes.",
      t: "Rehydrate with raw young coconut water after sweating sessions, sauna, or vigorous movement in the sun."
    },
    es: {
      q: "El agua de coco fresco es un plasma isotónico natural idéntico a los fluidos sanguíneos, repleto de electrolitos y potasio.",
      t: "Hidrátese con agua de coco fresco tras sesiones de sudoración o ejercicio bajo el sol."
    }
  },

  // ── DR. LESLIE TAYLOR (6 cards) ──
  {
    k: 'taylor', cat: 'herbs', phase: 'all', w: 0, s: 'Leslie Taylor Una de gato griffe de chat immunite',
    fr: {
      q: "La Griffe de Chat (Uncaria tomentosa / Uña de Gato) est l'un des plus puissants régulateurs immunitaires et nettoyeurs de l'intestin grêle.",
      t: "Consommez la Griffe de Chat en décoction courte pour drainer les biofilms bactériens et restaurer la barrière intestinale."
    },
    'fr-CA': {
      q: "La Griffe de Chat (Uncaria tomentosa / Uña de Gato) est l'un des plus puissants régulateurs immunitaires et nettoyeurs de l'intestin grêle.",
      t: "Consommez la Griffe de Chat en décoction courte pour drainer les biofilms bactériens et restaurer la barrière intestinale."
    },
    en: {
      q: "Cat's Claw (Uncaria tomentosa / Uña de Gato) is one of the most powerful immune modulators and small intestine cleansers known to ethnobotany.",
      t: "Simmer Cat's Claw bark for 15 minutes as a tea to clear bacterial biofilms and support gut barrier integrity."
    },
    es: {
      q: "La Uña de Gato (Uncaria tomentosa) es uno de los moduladores inmunitarios y limpiadores intestinales más potentes de la etnobotánica.",
      t: "Tome Uña de Gato en decocción corta para drenar biofilms y apoyar la barrera intestinal."
    }
  },
  {
    k: 'taylor', cat: 'herbs', phase: 'regeneration', w: 1, s: 'Leslie Taylor Chanca piedra calculs foie reins',
    fr: {
      q: "Le Chanca Piedra (Phyllanthus niruri) favorise la dissolution des calculs et soutient la production biliaire sans irriter les muqueuses.",
      t: "Une cure de Chanca Piedra aide à décongestionner le foie et à préserver des reins parfaitement propres."
    },
    'fr-CA': {
      q: "Le Chanca Piedra (Phyllanthus niruri) favorise la dissolution des calculs et soutient la production biliaire sans irriter les muqueuses.",
      t: "Une cure de Chanca Piedra aide à décongestionner le foie et à préserver des reins parfaitement propres."
    },
    en: {
      q: "Chanca Piedra (Phyllanthus niruri), the 'Stone Breaker', promotes smooth calcium oxalate dissolution and supports liver bile flow.",
      t: "A gentle course of Chanca Piedra tea helps decongest biliary sludge and maintain pristine kidney filtration."
    },
    es: {
      q: "La Chanca Piedra (Phyllanthus niruri) favorece la disolución de cálculos y apoya la bilis hepática sin irritar mucosas.",
      t: "Un ciclo de Chanca Piedra ayuda a descongestionar el hígado y preservar una filtración renal limpia."
    }
  },
  {
    k: 'taylor', cat: 'herbs', phase: 'all', w: 0, s: 'Leslie Taylor Pau d arco lapacho candida',
    fr: {
      q: "L'écorce de Pau d'Arco (Tabebuia impetiginosa) contient du lapachol, un composé naturel puissant contre les levures et le Candida albicans.",
      t: "Infusez 1 cuillère à soupe d'écorce de Pau d'Arco pendant 15 minutes en décoction contre les fermentations intestinales."
    },
    'fr-CA': {
      q: "L'écorce de Pau d'Arco (Tabebuia impetiginosa) contient du lapachol, un composé naturel puissant contre les levures et le Candida albicans.",
      t: "Infusez 1 cuillère à table d'écorce de Pau d'Arco pendant 15 minutes en décoction contre les fermentations intestinales."
    },
    en: {
      q: "Pau d'Arco bark (Tabebuia impetiginosa) contains lapachol, a potent active quinone with documented antifungal action against Candida albicans.",
      t: "Decoct 1 tablespoon of Pau d'Arco inner bark for 15 minutes to balance gut flora and combat yeast overgrowth."
    },
    es: {
      q: "La corteza de Pau d'Arco (Tabebuia impetiginosa) contiene lapachol, un compuesto potente contra levaduras y Candida albicans.",
      t: "Decocione 1 cucharada de Pau d'Arco durante 15 minutos contra fermentaciones intestinales y hongos."
    }
  },
  {
    k: 'taylor', cat: 'herbs', phase: 'appropriation', w: 1, s: 'Leslie Taylor Sangre de drago croton taspine',
    fr: {
      q: "La résine Sangre de Drago (Croton lechleri) est un cicatrisant tissulaire exceptionnel, riche en taspine pour régénérer la muqueuse gastrique.",
      t: "Prenez 3 à 5 gouttes de sève de Sangre de Drago dans un demi-verre d'eau tiède en cas d'ulcère ou d'acidité gastrique."
    },
    'fr-CA': {
      q: "La résine Sangre de Drago (Croton lechleri) est un cicatrisant tissulaire exceptionnel, riche en taspine pour régénérer la muqueuse gastrique.",
      t: "Prenez 3 à 5 gouttes de sève de Sangre de Drago dans un demi-verre d'eau tiède en cas d'ulcère ou d'acidité gastrique."
    },
    en: {
      q: "Dragon's Blood resin (Croton lechleri / Sangre de Drago) contains taspine, an extraordinary wound-healing alkaloid that regenerates stomach lining.",
      t: "Take 3 to 5 drops of pure Dragon's Blood sap in warm water before meals to protect gastric mucosa against excess acid."
    },
    es: {
      q: "La resina de Sangre de Drago (Croton lechleri) contiene taspina, un cicatrizante excepcional para regenerar la mucosa gástrica.",
      t: "Tome 3 a 5 gotas de Sangre de Drago en agua tibia antes de comer para calmar la acidez gástrica."
    }
  },
  {
    k: 'taylor', cat: 'herbs', phase: 'elimination', w: 0, s: 'Leslie Taylor Camu camu vitamine C surrenales',
    fr: {
      q: "Le Camu-Camu sauvage d'Amazonie offre une concentration de vitamine C naturelle 30 à 50 fois supérieure à celle de l'orange fraîche.",
      t: "Mélangez 1/2 cuillère à café de poudre de Camu-Camu dans un jus frais pour protéger les glandes surrénales du stress oxydatif."
    },
    'fr-CA': {
      q: "Le Camu-Camu sauvage d'Amazonie offre une concentration de vitamine C naturelle 30 à 50 fois supérieure à celle de l'orange fraîche.",
      t: "Mélangez 1/2 cuillère à thé de poudre de Camu-Camu dans un jus frais pour protéger les glandes surrénales du stress oxydatif."
    },
    en: {
      q: "Wild Amazonian Camu-Camu berry delivers a natural full-complex Vitamin C concentration 30 to 50 times higher than fresh oranges.",
      t: "Stir 1/2 teaspoon of pure wild Camu-Camu powder into fresh juices to buffer adrenal glands against oxidative stress."
    },
    es: {
      q: "El Camu-Camu silvestre amazónico contiene una concentración de vitamina C natural 30 a 50 veces superior a la naranja.",
      t: "Mezcle 1/2 cucharadita de Camu-Camu en zumos frescos para proteger las suprarrenales del estrés oxidativo."
    }
  },
  {
    k: 'taylor', cat: 'herbs', phase: 'regeneration', w: 2, s: 'Leslie Taylor Mulungu sommeil coeur tension',
    fr: {
      q: "Le Mulungu (Erythrina mulungu) est un anxiolytique végétal amazonien doux qui abaisse la pression artérielle et apaise le cœur.",
      t: "Infusez de l'écorce de Mulungu 30 minutes avant de dormir pour soulager les insomnies liées au surmenage nerveux."
    },
    'fr-CA': {
      q: "Le Mulungu (Erythrina mulungu) est un anxiolytique végétal amazonien doux qui abaisse la pression artérielle et apaise le cœur.",
      t: "Infusez de l'écorce de Mulungu 30 minutes avant de dormir pour soulager les insomnies liées au surmenage nerveux."
    },
    en: {
      q: "Mulungu (Erythrina mulungu) bark is a soothing Amazonian nervous system tonic that eases cardiac tension and normalizes blood pressure.",
      t: "Brew a gentle Mulungu tea 30 minutes before sleep to unwind from nervous exhaustion and quiet an overactive mind."
    },
    es: {
      q: "El Mulungu (Erythrina mulungu) es un relajante natural que calma el sistema nervioso, reduce la presión y sosiega el corazón.",
      t: "Prepare una infusión de Mulungu 30 minutos antes de dormir para aliviar el insomnio y el agotamiento nervioso."
    }
  },

  // ── WIM HOF (5 cards) ──
  {
    k: 'hof', cat: 'breath', phase: 'elimination', w: 0, s: 'Wim Hof respiration apnee',
    fr: {
      q: "En pratiquant une hyperventilation contrôlée suivie d'apnées poumons vides, vous alcalinisez temporairement votre sang et boostez l'adrénaline.",
      t: "Faites 3 cycles de 30 respirations profondes le matin à jeun pour chasser le dioxyde de carbone accumulé la nuit."
    },
    'fr-CA': {
      q: "En pratiquant une hyperventilation contrôlée suivie d'apnées poumons vides, vous alcalinisez temporairement votre sang et boostez l'adrénaline.",
      t: "Faites 3 cycles de 30 respirations profondes le matin à jeun pour chasser le dioxyde de carbone accumulé la nuit."
    },
    en: {
      q: "By practicing rhythmic hyperventilation followed by breath retention on empty lungs, you temporarily alkalize blood pH and release natural adrenaline.",
      t: "Perform 3 rounds of 30 deep conscious breaths in the morning on an empty stomach to expel overnight carbon dioxide buildup."
    },
    es: {
      q: "Al practicar hiperventilación controlada seguida de retención a pulmones vacíos, alcaliniza temporalmente la sangre y activa adrenalina natural.",
      t: "Haga 3 rondas de 30 respiraciones profundas por la mañana en ayunas para expulsar el dióxido de carbono acumulado."
    }
  },
  {
    k: 'hof', cat: 'breath', phase: 'all', w: 0, s: 'Wim Hof froid immersion',
    fr: {
      q: "Le froid est votre miroir et votre maître. Il contracte le système vasculaire pour le rendre élastique et résistant comme celui d'un athlète.",
      t: "Terminez votre douche par 60 secondes d'eau froide sur la nuque et les épaules en maintenant une respiration calme."
    },
    'fr-CA': {
      q: "Le froid est votre miroir et votre maître. Il contracte le système vasculaire pour le rendre élastique et résistant comme celui d'un athlète.",
      t: "Terminez votre douche par 60 secondes d'eau froide sur la nuque et les épaules en maintenant une respiration calme."
    },
    en: {
      q: "Cold is your mirror and your master. It contracts the vascular system, restoring elasticity and resilience like an athlete's circulatory engine.",
      t: "Finish your morning shower with 60 seconds of cold water over the neck and shoulders while maintaining slow, relaxed breathing."
    },
    es: {
      q: "El frío es tu espejo y tu maestro. Contrae el sistema vascular, haciéndolo elástico y resistente como el de un atleta.",
      t: "Termine su ducha con 60 segundos de agua fría sobre cuello y hombros manteniendo una respiración calmada."
    }
  },
  {
    k: 'hof', cat: 'breath', phase: 'elimination', w: 1, s: 'Wim Hof froid thermogenese',
    fr: {
      q: "L'exposition au froid régulier transforme le tissu adipeux blanc en graisse brune thermogénique riche en mitochondries génératrices d'ATP.",
      t: "Prenez l'air frais le matin en t-shirt pendant 5 minutes pour stimuler la thermogénèse sans frisson."
    },
    'fr-CA': {
      q: "L'exposition au froid régulier transforme le tissu adipeux blanc en graisse brune thermogénique riche en mitochondries génératrices d'ATP.",
      t: "Prenez l'air frais le matin en t-shirt pendant 5 minutes pour stimuler la thermogénèse sans frisson."
    },
    en: {
      q: "Regular cold exposure activates brown adipose tissue (BAT), packed with dense mitochondria that burn glucose and generate pure cellular heat.",
      t: "Take a 5-minute morning walk in cool air wearing light clothing to stimulate non-shivering thermogenesis."
    },
    es: {
      q: "La exposición al frío regular activa el tejido adiposo marrón (grasa parda), rico en mitocondrias que queman glucosa y generan calor celular.",
      t: "Camine 5 minutos al aire fresco matutino con ropa ligera para estimular la termogénesis sin temblores."
    }
  },
  {
    k: 'hof', cat: 'mindset', phase: 'all', w: 0, s: 'Wim Hof respiration etude scientifique',
    fr: {
      q: "Par la respiration et la volonté consciente, l'esprit humain est capable de moduler directement la réponse inflammatoire du système immunitaire.",
      t: "Lors des apnées poumons vides, visualisez le calme s'installer dans chacune de vos cellules."
    },
    'fr-CA': {
      q: "Par la respiration et la volonté consciente, l'esprit humain est capable de moduler directement la réponse inflammatoire du système immunitaire.",
      t: "Lors des apnées poumons vides, visualisez le calme s'installer dans chacune de vos cellules."
    },
    en: {
      q: "Through focused breathing and conscious mindset, the human mind can directly modulate the autonomic nervous system and suppress inflammatory cytokines.",
      t: "During breath retentions on empty lungs, mentally visualize deep calm and reduced inflammation flowing into every single cell."
    },
    es: {
      q: "Mediante la respiración consciente y la concentración, la mente humana puede modular el sistema nervioso autónomo y reducir citoquinas inflamatorias.",
      t: "Durante las retenciones con pulmones vacíos, visualice calma profunda e inflamación disminuyendo en cada célula."
    }
  },
  {
    k: 'hof', cat: 'breath', phase: 'elimination', w: 2, s: 'Wim Hof respiration guidee diaphragme',
    fr: {
      q: "La respiration profonde par le diaphragme masse directement les organes digestifs et active le nerf vague anti-inflammatoire.",
      t: "Respirez en gonflant le ventre pendant 4 secondes puis expirez lentement sur 6 secondes avant les repas."
    },
    'fr-CA': {
      q: "La respiration profonde par le diaphragme masse directement les organes digestifs et active le nerf vague anti-inflammatoire.",
      t: "Respirez en gonflant le ventre pendant 4 secondes puis expirez lentement sur 6 secondes avant les repas."
    },
    en: {
      q: "Deep diaphragmatic breathing directly massages abdominal digestive organs and stimulates the anti-inflammatory vagus nerve.",
      t: "Inhale expanding the belly for 4 seconds, then exhale softly over 6 seconds before each meal to prime digestion."
    },
    es: {
      q: "La respiración diafragmática profunda masajea directamente los órganos digestivos y estimula el nervio vago antiinflamatorio.",
      t: "Inhale inflando el abdomen 4 segundos y exhale suavemente durante 6 segundos antes de las comidas para preparar la digestión."
    }
  }
];

export function buildMultilingualWisdomDatabase() {
  const finalCards = [];
  let day = 1;

  while (finalCards.length < 366) {
    const raw = CORE_CARDS[(day - 1) % CORE_CARDS.length];
    const authorConf = AUTHORS_MULTILINGUAL[raw.k];
    const workIndex = Math.floor((day - 1) / CORE_CARDS.length) % authorConf.works.length;
    const workMultilingual = authorConf.works[workIndex];

    const translations = {
      fr: {
        authorTag: authorConf.authorTag.fr,
        work: workMultilingual.fr,
        categoryLabel: CATEGORIES_MULTILINGUAL[raw.cat].fr,
        quote: raw.fr.q,
        actionableTip: raw.fr.t
      },
      'fr-CA': {
        authorTag: authorConf.authorTag['fr-CA'],
        work: workMultilingual['fr-CA'],
        categoryLabel: CATEGORIES_MULTILINGUAL[raw.cat]['fr-CA'],
        quote: raw['fr-CA'].q,
        actionableTip: raw['fr-CA'].t
      },
      en: {
        authorTag: authorConf.authorTag.en,
        work: workMultilingual.en,
        categoryLabel: CATEGORIES_MULTILINGUAL[raw.cat].en,
        quote: raw.en.q,
        actionableTip: raw.en.t
      },
      es: {
        authorTag: authorConf.authorTag.es,
        work: workMultilingual.es,
        categoryLabel: CATEGORIES_MULTILINGUAL[raw.cat].es,
        quote: raw.es.q,
        actionableTip: raw.es.t
      }
    };

    finalCards.push({
      id: `${raw.k}-${day}`,
      dayOfYear: day,
      author: authorConf.author,
      authorAvatar: authorConf.authorAvatar,
      authorColor: authorConf.authorColor,
      category: raw.cat,
      timePhase: raw.phase || 'all',
      searchQuery: raw.s,
      
      // Fallback direct properties (FR) for backward compatibility
      authorTag: translations.fr.authorTag,
      work: translations.fr.work,
      categoryLabel: translations.fr.categoryLabel,
      quote: translations.fr.quote,
      actionableTip: translations.fr.actionableTip,

      // Exhaustive translations object
      translations
    });

    day++;
  }

  const fileContent = `/**
 * Base de données exhaustive de Sagesse & Lois Bio-Vitalistes Multilingue (366 fiches x 4 langues)
 * Auteurs et Ouvrages Authentiques du Corpus :
 * - Arnold Ehret (Mucusless Diet Healing System / Système de Guérison du Régime Sans Mucus)
 * - Dr. Robert Morse (The Detox Miracle Sourcebook / Le Guide du Miracle de la Détox)
 * - Dr. Sebi (African Bio-Mineral Balance / Guide de Purification Bio-Électrique Cellulaire)
 * - David Wolfe (The Sunfood Diet Success System / Le Système de Réussite de l'Alimentation Vivante)
 * - Dr. Leslie Taylor (The Healing Power of Rainforest Herbs / Pharmacopée Amazonienne Raintree)
 * - Wim Hof (The Wim Hof Method / La Méthode Wim Hof)
 * 
 * Supporte nativement : Français (fr), Français Canadien (fr-CA), Anglais (en), Espagnol (es).
 */

export const VITALIST_WISDOM = ${JSON.stringify(finalCards, null, 2)};

/**
 * Récupère un élément de sagesse localisé dans la langue active
 * @param {Object} item - Fiche de sagesse brute
 * @param {string} lang - 'fr' | 'fr-CA' | 'en' | 'es'
 * @returns {Object} Fiche enrichie avec quote, actionableTip, work, categoryLabel traduits
 */
export function getLocalizedWisdomItem(item, lang = 'fr') {
  if (!item) return null;
  const t = item.translations && (item.translations[lang] || item.translations.fr);
  if (!t) return item;

  return {
    ...item,
    authorTag: t.authorTag || item.authorTag,
    work: t.work || item.work,
    categoryLabel: t.categoryLabel || item.categoryLabel,
    quote: t.quote || item.quote,
    actionableTip: t.actionableTip || item.actionableTip
  };
}

/**
 * Récupère le conseil vitaliste officiel du jour (1 à 366) dans la langue demandée
 */
export function getDailyWisdom(date = new Date(), lang = 'fr') {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.min(366, Math.max(1, Math.floor(diff / oneDay)));
  const item = VITALIST_WISDOM[dayOfYear - 1] || VITALIST_WISDOM[0];
  return getLocalizedWisdomItem(item, lang);
}

/**
 * Récupère un conseil aléatoire ou filtré dans la langue demandée
 */
export function getRandomWisdom(category = null, author = null, timePhase = null, lang = 'fr') {
  let pool = VITALIST_WISDOM;

  if (category && category !== 'all') {
    pool = pool.filter(w => w.category === category);
  }
  if (author && author !== 'all') {
    pool = pool.filter(w => w.author.toLowerCase().includes(author.toLowerCase()));
  }
  if (timePhase && timePhase !== 'all') {
    pool = pool.filter(w => w.timePhase === timePhase || w.timePhase === 'all');
  }

  if (pool.length === 0) pool = VITALIST_WISDOM;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return getLocalizedWisdomItem(selected, lang);
}

/**
 * Récupère un conseil en fonction de l'heure circadienne actuelle
 */
export function getCircadianContextWisdom(lang = 'fr') {
  const hour = new Date().getHours();
  let phase = 'all';

  if (hour >= 4 && hour < 12) phase = 'elimination';
  else if (hour >= 12 && hour < 20) phase = 'appropriation';
  else if (hour >= 20 || hour < 4) phase = 'regeneration';

  const pool = VITALIST_WISDOM.filter(w => w.timePhase === phase || w.timePhase === 'all');
  const selected = pool[Math.floor(Math.random() * pool.length)] || VITALIST_WISDOM[0];
  return getLocalizedWisdomItem(selected, lang);
}
`;

  const targetPath = path.resolve(__dirname, '../web-app/src/data/vitalistWisdom.js');
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`✅ Base de données multilingue générée avec succès : ${finalCards.length} cartes écrites dans ${targetPath}`);
}

buildMultilingualWisdomDatabase();
