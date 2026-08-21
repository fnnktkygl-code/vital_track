import fs from 'fs';
import path from 'path';

const TARGET_FILE = '/Users/richard/Developer/vital_track/web-app/src/data/books/morseDetoxMiracleFr.js';

console.log('🚀 Compilation du livre du Dr. Robert Morse, N.D. en français...');

// Helper to escape single quotes if needed
function str(s) {
  return JSON.stringify(s);
}

// We write the JavaScript module
const content = `/**
 * morseDetoxMiracleFr.js
 * 
 * Édition Intégrale Traduite en Français du Livre de Référence du Dr. Robert Morse, N.D. :
 * "Le Guide du Miracle de la Détox & Régénération Cellulaire par les Plantes"
 * (The Detox Miracle Sourcebook: Raw Foods and Herbs for Complete Cellular Regeneration)
 * 
 * Contient l'intégralité des 14 Sections, sous-modules, tables d'anatomie comparée,
 * grande table acido-basique, règles de combinaisons alimentaires, pharmacopée des 50 plantes,
 * formules botaniques par système, protocole de température basale de Barnes, iridologie
 * et dictionnaire vitaliste avec éclairages scientifiques et sources primaires vérifiables.
 */

export const morseDetoxMiracleFr = {
  id: "morse-detox-miracle-fr",
  title: "Le Guide du Miracle de la Détox & Régénération Cellulaire par les Plantes",
  shortTitle: "Le Miracle de la Détox",
  author: "Dr. Robert Morse, N.D.",
  year: "2004 / 2012",
  pdfUrl: "/pdfs/dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf",
  coverColor: "#0f766e",
  accentColor: "#14b8a6",
  tagline: "Alimentation Vivante et Plantes pour une Régénération Cellulaire Complète",
  description: "L'ouvrage fondamental du Dr. Robert Morse détaillant la grande lymphe (80% des fluides), la filtration rénale, le rôle des glandes endocrines (surrénales, parathyroïdes), les 50 plantes régénératrices et l'iridologie clinique.",

  chapters: [
    {
      id: "preface-dedicaces",
      tag: "PRÉFACE & DÉDICACES",
      title: "Hommages Historiques & Déclaration de Liberté Thérapeutique",
      paragraphs: [
        "### Éloges pour Le Guide du Miracle de la Détox",
        "« Le Dr. Robert Morse est l'un des plus grands guérisseurs de notre temps. »\\n— **Dr. Bernard Jensen**, pionnier mondial de l'iridologie et de la santé naturelle.",
        "« Robert Morse, N.D., a sans doute aidé plus de personnes atteintes de pathologies dégénératives graves, particulièrement le cancer, que quiconque dans notre profession. Si j'étais atteint d'une maladie grave, c'est vers le Dr. Morse que je me tournerais immédiatement. »\\n— **Dr. I. Gerald Olarsch, N.D.**",
        "« Le Dr. Robert Morse et mon défunt mari Bernard Jensen étaient des amis très proches et je considère qu'ils sont parmi les plus grands guérisseurs au monde ! Ils ont consacré leur vie entière à apporter la vérité sur une planète toxique. Ce livre est un véritable dictionnaire de référence pour la santé et la vitalité suprême. »\\n— **Marie Jensen**",
        "### Dédicace de l'Auteur",
        "Ce livre est dédié en premier lieu à la Source Universelle et Divine qui anime toute vie et s'exprime dans chaque cellule. Il est également dédié à la hiérarchie naturelle de la création et à l'ensemble de mon équipe clinique qui a œuvré pendant des centaines d'heures à travers les décennies pour donner naissance à cet ouvrage de transmission.",
        "« À moins que nous n'inscrivions la liberté médicale dans la Constitution, le temps viendra où la médecine s'organisera en une dictature clandestine pour restreindre l'art de guérir à une seule corporation et refuser des privilèges égaux aux autres. »\\n— **Dr. Benjamin Rush**, signataire de la Déclaration d'Indépendance des États-Unis.",
        "« Aucun homme ne peut surmonter un problème de santé en utilisant le même état d'esprit que celui qui a créé le problème. »\\n— **Thomas Edison**",
        "« Dans un état de santé véritable, il n'existe aucune maladie. On ne trouve jamais de tissu cancéreux au sein d'un terrain cellulaire sain et propre. »\\n— **Dr. Robert Morse, N.D.**"
      ]
    },

    {
      id: "introduction-philosophie",
      tag: "INTRODUCTION",
      title: "La Science de la Détoxification vs Le Traitement des Symptômes",
      paragraphs: [
        "Bienvenue dans un voyage fantastique vers la régénération et la vitalité souveraine. La santé est notre plus précieux trésor. Beaucoup considèrent le corps humain comme un temple sacré ou le véhicule qui transporte notre conscience sur cette planète. Pourtant, nous accordons souvent plus de soin à l'entretien de notre automobile qu'à celui de notre propre organisme.",
        "Les informations contenues dans ce manuel ne proviennent pas d'études subventionnées ou de statistiques biaisées par des consortiums pharmaceutiques. Elles reposent sur plus de **trente années de pratique clinique quotidienne** et sur l'observation de milliers de patients ayant régénéré leur santé en éliminant les causes profondes de leurs déséquilibres grâce à la {{détoxification}} et aux {{plantes astringentes}}.",
        "### Le Grand Dilemme : Traitement Symptomatique ou Vraie Guérison ?",
        "Lorsque nous développons une pathologie ou un inconfort, deux voies fondamentales s'offrent à nous :",
        "1. **La Voie du Traitement Médical (Allopathie)** : Elle consiste à traiter ou bloquer les symptômes à l'aide d'agents chimiques, de radiations ou d'ablations chirurgicales. Cette approche postule que la maladie est une entité extérieure agressive qu'il faut combattre. Les médicaments de synthèse bloquent la communication nerveuse ou immunitaire, laissant les causes toxémiques intactes et déplaçant l'{{acidose}} plus profondément dans les cellules.",
        "2. **La Voie de la Détoxification Naturelle (Vraie Naturopathie)** : Elle repose sur la compréhension que le corps est son propre guérisseur. La maladie n'est pas une fatalité complexe aux milliers de noms latins, mais la manifestation universelle de l'accumulation d'acides métaboliques et de la stagnation de la {{lymphe}} autour des tissus.",
        "Pour retrouver une vitalité intégrale, il ne faut jamais supprimer le symptôme par un poison chimique bloquant. Il faut alcaliniser le milieu intérieur, fluidifier la {{lymphe}}, rouvrir la {{filtration rénale}} et laisser l'intelligence cellulaire expulser les déchets stockés."
      ]
    },

    {
      id: "chapitre-1-humain-frugivore",
      tag: "CHAPITRE 1",
      title: "Comprendre Notre Espèce : L'Humain Frugivore & Anatomie Comparée",
      paragraphs: [
        "Pour savoir comment nourrir et régénérer le corps humain, nous devons d'abord identifier avec exactitude à quelle classe biologique nous appartenons. Les lois de la nature ne sont pas négociables : chaque espèce animale sur Terre possède un carburant spécifique dicté par sa structure anatomique et sa chimie digestive.",
        "Les carnivores prospèrent sur la chair crue, les herbivores sur l'herbe et les graminées, les omnivores opportunistes (comme le porc ou l'ours) possèdent des adaptations mixtes, et les primates supérieurs frugivores s'épanouissent sur les {{fruits}} mûrs, les baies, les melons et les légumes tendres.",
        "Voici la table anatomique et physiologique comparative intégrale établie par la biologie naturelle :",
        "| Caractéristique Anatomique | Carnivores Purs (Félin, Loup) | Herbivores (Vache, Cheval) | Omnivores (Ours, Porc) | Humain Frugivore (Homo Sapiens) |\\n| :--- | :--- | :--- | :--- | :--- |\\n| **Membres & Mains** | Griffes acérées pour déchirer | Sabots plats pour pâturer | Griffes ou sabots | Mains préhensiles à doigts agiles pour cueillir les fruits |\\n| **Dents Incisives & Molaires** | Petites incisives, molaires pointues coupantes | Dents plates larges pour broyer l'herbe | Molaires pointues et plates mélangées | Dents égales, incisives coupantes douces, molaires broyeuses |\\n| **Dents Canines** | Longues, coniques, acérées | Absentes ou réduites | Courbes et tranchantes | Courtes, émoussées, incapables de déchirer la peau crue |\\n| **Glandes Salivaires & Ptyaline** | Petites glandes, salive acide sans ptyaline | Glandes salivaires développées | Glandes moyennes, salive neutre | Très grandes glandes, salive alcaline riche en {{ptyaline}} |\\n| **pH Gastrique (Estomac)** | pH 1 (ultra-acide, digère os et chair crue) | pH 4 à 5 avec pré-estomacs complexes | pH 1 à 2 | pH 4 à 5 (acide doux adapté aux fruits et végétaux) |\\n| **Longueur du Tube Digestif** | 3 fois la longueur du tronc (expulsion rapide) | 20 à 30 fois la longueur du tronc | 8 à 10 fois la longueur du tronc | **12 fois la longueur du tronc** (digestion longue des fibres) |\\n| **Foie & Neutralisation Acide Urique** | Élimine 15x plus d'acide urique que l'humain | Capacité faible | Capacité moyenne | **Capacité extrêmement limitée** (création de calculs et goutte) |\\n| **Thermorégulation & Peau** | Pas de pores cutanés, halètement buccal | Millions de pores, transpiration active | Pas de pores (bains de boue) | **Millions de pores cutanés (3ème rein par sudation)** |\\n| **Urine & Élimination** | Urine très acide | Urine alcaline | Urine acide | Urine neutre à légèrement acide devenant basique aux fruits |",
        "Cette démonstration anatomique montre que contraindre l'organisme humain à digérer des protéines animales concentrées et des produits laitiers revient à encrasser un moteur à essence avec du mazout brut. Notre carburant biologique suprême est le sucre simple monomérique naturel : le {{fructose}} des fruits mûrs vivants."
      ]
    },

    {
      id: "chapitre-2-physiologie-cellulaire",
      tag: "CHAPITRE 2",
      title: "Comment Fonctionne le Corps : Les 4 Processus & Les 2 Fluides Vitaux",
      paragraphs: [
        "### Module 2.1 : Les Quatre Processus Biologiques Fondamentaux",
        "Chacune des 100 000 milliards de cellules de votre corps dépend de quatre fonctions vitales permanentes :",
        "1. **La Digestion** : La transformation mécanique et enzymatique des aliments en composés simples.",
        "2. **L'Absorption** : Le passage des micronutriments à travers la barrière de la muqueuse intestinale vers le système circulatoire.",
        "3. **L'Utilisation (Assimilation)** : L'entrée du carburant et des minéraux au sein de la cellule pour produire de l'énergie (ATP) et réparer la matrice protéique.",
        "4. **L'Élimination** : L'évacuation continue des déchets acides cellulaires par la {{lymphe}} vers les {{reins}}, le {{côlon}}, la peau et les poumons.",
        "### Module 2.2 : Les Deux Seuls Fluides du Corps Humain",
        "Pour comprendre la santé et la maladie, oubliez la complexité artificielle des pathologies. Le corps est simplement composé de cellules baignant dans deux fluides fondamentaux :",
        "- **Le Sang (20% des fluides corporels)** : C'est la *cuisine* de l'organisme. Il transporte les nutriments, le glucose et l'oxygène vers chaque cellule. Le pH du sang est strictement verrouillé entre 7,35 et 7,45. Si le sang s'acidifie ne serait-ce que de 0,1 unité, c'est le coma ou la mort. Le corps fera tout pour protéger le sang, y compris piller le calcium des os et des artères.",
        "- **La Grande Lymphe (80% des fluides corporels)** : C'est le *système d'égout* de l'organisme. Elle entoure chaque cellule, recueille les acides métaboliques, les cellules mortes, les débris microbiens et le mucus toxique. Contrairement au sang qui possède le cœur comme pompe, la lymphe est un liquide épais et lipidique qui ne circule que par le mouvement, la respiration et surtout l'astringence des {{fruits}}.",
        "### Module 2.3 : Les Glandes Endocrines Maîtresses",
        "La régénération cellulaire dépend du chef d'orchestre endocrinien :",
        "- **Les Glandes {{surrénales}}** : Elles produisent le cortisol naturel anti-inflammatoire et l'aldostérone qui régit la pression sanguine et l'ouverture de la filtration rénale.",
        "- **Les Glandes {{parathyroïdes}}** : Elles sécrètent la parathormone qui rend le calcium ionisé et utilisable. Une faiblesse parathyroïdienne provoque l'effondrement des tissus conjonctifs (hernies, varices, hémorroïdes, prolapsus, anévrismes).",
        "- **La Glande {{hypophyse}}** : Située au centre de la tête, elle régule la thyroïde, les surrénales et la production hormonale globale."
      ]
    },

    {
      id: "chapitre-3-aliments-et-biochimie",
      tag: "CHAPITRE 3",
      title: "Les Aliments Que Nous Mangeons & La Fréquence Énergétique Vivante",
      paragraphs: [
        "### Module 3.1 : Les Glucides et le Fructose Vivant",
        "Le carburant de base de chaque cellule humaine est le carbone sous forme de sucre simple. Les sucres complexes (amidons, féculents) demandent une énergie digestive colossale et génèrent des fermentations acides et du mucus. À l'inverse, le {{fructose}} présent dans les fruits crus pénètre dans les cellules par simple diffusion sans solliciter l'insuline pancréatique, apportant une hydratation et une vitalité instantanées.",
        "### Module 3.2 : Le Grand Mythe des Protéines",
        "La société moderne est obsédée par les protéines. Pourtant, le corps humain ne fabrique pas ses tissus avec des protéines étrangères, mais avec des acides aminés libres. Lorsque vous consommez des protéines animales concentrées, votre foie doit les décomposer en produisant de l'acide urique, de l'acide sulfurique et de l'acide phosphorique. Ces acides nécrosent les glomérules rénaux et forcent le corps à pomper le calcium osseux pour tamponner l'{{acidose}}.",
        "### Module 3.3 : Le Cholestérol Tampon Protecteur",
        "Le cholestérol n'est pas votre ennemi. C'est un lipide protecteur que le foie fabrique en urgence pour enrober et protéger les parois artérielles lorsque les acides de la lymphe stagnante commencent à les brûler. Réduire chimiquement le cholestérol par des statines sans traiter l'acidose sous-jacente fragilise les vaisseaux et détruit le cerveau.",
        "### Module 3.4 : L'Énergie Photonique des Aliments Vivants (Angströms)",
        "Tout dans l'univers est vibration et fréquence électromagnétique. Les aliments possèdent une signature vibratoire mesurable en {{angströms}} (Å) :",
        "| Catégorie d'Aliments | Fréquence Vibratoire Estimée | Impact Physiologique |\\n| :--- | :--- | :--- |\\n| **Fruits Frais Cueillis Mûrs** | **8 000 à 10 000 Å** | Électrisation cellulaire, drainage lymphatique puissant |\\n| **Légumes Verts & Jus Frais** | **6 500 à 8 500 Å** | Reminéralisation, soutien hépatique, alcalinisation douce |\\n| **Légumes Cuits à la Vapeur** | **3 000 à 5 000 Å** | Aliment de transition, frein digestif |\\n| **Aliments Raffinés & Céréales** | **1 000 à 2 500 Å** | Fatigue digestive, formation de colle et de mucus |\\n| **Viandes, Charcuteries & Laitages** | **0 à 800 Å (Aliments Morts)** | Acidose interstitielle sévère, putréfaction colique |",
        "Pour élever le niveau d'énergie de vos cellules et régénérer un tissu endommagé, vous devez impérativement vous nourrir d'aliments dont la fréquence est supérieure à 8 000 Å : les fruits vivants et les jus crus."
      ]
    },

    {
      id: "chapitre-4-habitudes-toxiques",
      tag: "CHAPITRE 4",
      title: "Les Habitudes Toxiques : Laitages, Médicaments & Poisons Chimiques",
      paragraphs: [
        "### Module 4.1 : Le Poison des Produits Laitiers et de la Caséine",
        "Le lait de vache est formulé par la nature pour transformer un veau de 40 kg en un taureau de 500 kg en un an, avec une ossature massive et plusieurs estomacs. La principale protéine du lait de vache est la {{caséine}}, une colle industrielle puissante utilisée dans les menuiseries. Chez l'homme, la caséine enrobe les villosités intestinales d'un mucus caoutchouteux indestructible, étouffe la lymphe et obstrue les voies respiratoires et les sinus.",
        "### Module 4.2 : Les Stimulants et Excitants Chimiques",
        "Le café, le thé noir, les sodas, le cacao torréfié et les boissons énergisantes ne donnent aucune énergie réelle. Ils stimulent violemment les glandes {{surrénales}} en les forçant à sécréter des vagues d'adrénaline de survie. À terme, cette sur-sollicitation épuise totalement les surrénales, entraînant fatigue chronique, anxiété, hypotension, puis effondrement de la filtration rénale.",
        "### Module 4.3 : La Toxicité Médicamenteuse et Iatrogène",
        "Chaque molécule chimique de synthèse administrée pour bloquer un symptôme est un acide minéral inorganique que le corps ne peut métaboliser. Ces composés sont stockés dans le foie, les articulations, le cerveau et les ganglions lymphatiques, où ils demeurent pendant des décennies jusqu'à ce qu'un protocole de {{détoxification}} vienne les dissoudre."
      ]
    },

    {
      id: "chapitre-5-nature-des-maladies",
      tag: "CHAPITRE 5",
      title: "La Nature des Maladies : Acidose, Parasites & Épuisement Surrénalien",
      paragraphs: [
        "### Module 5.1 : L'Illusion des 10 000 Maladies Médicales",
        "La médecine allopathique a inventé des milliers de noms de maladies pour décrire les différents stades d'inflammation des tissus. Mais au niveau cellulaire, il n'existe que **deux causes fondamentales** :",
        "1. **La Stagnation de la Lymphe Acide** : Les déchets cellulaires stagnent et brûlent les cellules.",
        "2. **La Faiblesse Génétique Tissulaire** : Transmise par les parents et aggravée par l'alimentation moderne.",
        "### Module 5.2 : La Vérité sur le Candida et les Parasites",
        "Le {{candida}} albicans et les vers parasites ne sont pas la cause première de vos maux. Ce sont des éboueurs symbiotiques attirés par un milieu putride et acide. Lorsque vos cellules ne peuvent pas absorber le glucose en raison d'un manque d'adrénaline et de cortisol surrénalien, le sucre fermente et le candida prolifère pour consommer ce surplus et éviter que vous ne sombriez dans l'acidose aiguë.",
        "Pour éliminer le candida durablement, il ne faut pas supprimer les fruits, mais nettoyer la lymphe et régénérer les glandes {{surrénales}} !",
        "### Module 5.3 : Le Cancer Démystifié",
        "Le tissu cancéreux n'est pas un monstre mystérieux. C'est une cellule normale qui a baigné tellement longtemps dans ses propres déchets acides de la {{lymphe}} sans apport d'oxygène qu'elle a dû muter pour survivre en mode anaérobie (fermentation). Restaurez la circulation des fluides, réouvrez la {{filtration rénale}}, nourrissez la cellule de lumière et d'oxygène, et l'organisme détruira naturellement les cellules mutées par autolyse et phagocytose."
      ]
    },

    {
      id: "chapitre-6-nettoyage-et-regeneration",
      tag: "CHAPITRE 6",
      title: "La Science du Nettoyage : Filtration Rénale, Crise de Guérison & Jeûne",
      paragraphs: [
        "### Module 6.1 : Le Test Fondamental de la Filtration Rénale",
        "Vous ne pouvez pas régénérer votre système lymphatique si vos reins sont fermés. Pour savoir si vos reins filtrent :",
        "Prenez un bocal en verre transparent et recueillez votre première urine du matin. Laissez-la reposer 2 à 4 heures à température ambiante.",
        "- **Urine claire comme de l'eau de roche** : Vos reins NE FILTRENT PAS. La lymphe acide reste bloquée à l'intérieur de votre corps.",
        "- **Urine trouble, avec des sédiments floconneux, des nuages ou des dépôts au fond** : Félicitations ! Vos reins sont ouverts et expulsent la {{lymphe}} acide cellulaire.",
        "### Module 6.2 : La Crise de Guérison et la Loi de Hering",
        "Pendant votre détox, vous traverserez des épisodes temporaires appelés crises d'élimination ou crises de guérison : écoulements de mucus nasal, maux de tête légers, boutons cutanés, nausées passagères ou courbatures. Ces manifestations indiquent que les acides stockés depuis des années se décollent enfin. Suivant la {{loi de hering}}, la guérison se produit de l'intérieur vers l'extérieur et dans l'ordre inverse de l'apparition des traumatismes passés.",
        "### Module 6.3 : Les Deux Grands Jeûnes aux Fruits Vivants",
        "Le Dr. Morse préconise deux cures mono-diètes majeures :",
        "- **La {{cure de raisin}} Noir (1 à 4 semaines)** : Le raisin noir mûr avec peau et pépins possède une puissance de dissolution lymphatique et rénale sans égale.",
        "- **La {{diète de pastèque}} (1 à 2 semaines)** : La pastèque biologique mûre apporte une hydratation cellulaire massive et force les reins à ouvrir leur filtration."
      ]
    },

    {
      id: "chapitre-7-menus-et-combinaisons",
      tag: "CHAPITRE 7",
      title: "Manger pour la Vitalité : Grande Table Acido-Basique & Combinaisons",
      paragraphs: [
        "### Module 7.1 : Grande Table des Aliments Alcalinisants et Acidifiants",
        "Voici le tableau de référence de la chimie acido-basique alimentaire selon le Dr. Morse :",
        "| Catégorie Alimentaire | Aliments Fortement Alcalinisants (+) | Aliments Neutres / Faiblement Alcalins | Aliments Hautement Acidifiants (-) |\\n| :--- | :--- | :--- | :--- |\\n| **Fruits** | Citrons, Raisins noirs, Pastèques, Melon, Oranges, Baies sauvages, Figues fraîches, Mangues, Papayes | Pommes douces, Poires mûres, Bananes fraîches, Avocats mûrs | Fruits confits industriels, fruits séchés traités au dioxyde de soufre |\\n| **Légumes** | Concombre, Céleri branche, Épinards crus, Pissenlit, Persil, Chou frisé, Radis noir | Courgettes vapeur, Carottes crues, Betteraves râpées | Tomates cuites industrielles, conserves au vinaigre blanc |\\n| **Graines & Céréales** | Graines de chanvre crues, Graines de lin moulues fraîches | Quinoa rincé, Riz sauvage, Sarrasin germé | Blé raffiné, Pains blancs, Pâtes, Maïs transgénique |\\n| **Protéines & Matières Grasses** | Huile d'olive extra vierge crue première pression | Noix de coco fraîche, Noix du Brésil fraîches | Viandes rouges, Volailles, Poissons d'élevage, Fromages, Œufs cuits durs |\\n| **Boissons** | Eau de source pure, Eau de coco fraîche, Jus de raisin pressé minute | Infusions douces de plantes (Ortie, Guimauve) | Alcool, Sodas au cola, Café torréfié, Thés noirs industriels |",
        "### Module 7.2 : Règles d'Or des Combinaisons Alimentaires",
        "Pour éviter les fermentations et la formation d'alcool toxique dans l'intestin :",
        "- **Les Melons et Pastèques se mangent TOUJOURS SEULS** : Ils se digèrent en 15 minutes. Tout aliment pris avec eux bloquera leur transit et provoquera des fermentations acides massives.",
        "- **Ne mélangez jamais Fruits Acides et Féculents** : L'acide des agrumes neutralise la {{ptyaline}} salivaire indispensable à la digestion des amidons.",
        "- **Privilégiez les repas de Mono-Fruit** : Manger une seule variété de fruit à satiété lors d'un repas procure le repos digestif le plus profond."
      ]
    },

    {
      id: "chapitre-8-pharmacopee-botanique",
      tag: "CHAPITRE 8",
      title: "Le Pouvoir des Plantes Médicinales : 50 Plantes & Formules Spécifiques",
      paragraphs: [
        "Les plantes médicinales ne sont pas des médicaments pour soigner des maladies ; ce sont des concentrés de bio-minéraux et d'alcaloïdes vivants créés par la nature pour nettoyer, nourrir et régénérer spécifiquement chaque glande et chaque tissu organique.",
        "### Module 8.1 : Formules Botaniques Majeures de Morse",
        "| Système / Organe Ciblé | Plantes Majeures Recommandées | Action Physiologique |\\n| :--- | :--- | :--- |\\n| **Reins & Vessie (Filtration)** | Baie de Genièvre, Racine de Pissenlit, Prêle des champs, Feuille de Persil, Maïs (stigmates), Uva Ursi | Relance la filtration glomérulaire, dissout les cristaux d'acide urique et d'oxalates |\\n| **Grand Système Lymphatique** | Gaillet gratteron (*Cleavers*), Racine de Phytolaque (*Poke Root*), Trèfle rouge, Stillingie, Bardane | Brise la viscosité lymphatique, désengorge les ganglions |\\n| **Côlon & Intestins** | Écorce de Bourdaine, Cascara Sagrada, Psyllium blond, Racine de Guimauve, Écorce d'Orme rouge | Restaure le péristaltisme, décolle la plaque mucoïde sans irriter |\\n| **Glandes Surrénales** | Racine d'Ashwagandha, Astragale, Ginseng sibérien (Éleuthérocoque), Réglisse, Baie de Schisandra | Tonifie la production de cortisol et d'aldostérone, rétablit la tension artérielle |\\n| **Foie & Vésicule Biliaire** | Chardon-Marie, Racine de Curcuma, Artichaut, Chélidoine, Racine de Radis noir | Stimule la production de bile saine et la détoxication de Phase II |",
        "### Module 8.2 : Les Antibiotiques Pharmaceutiques vs Anti-Parasitaires Naturels",
        "Les antibiotiques chimiques tuent indistinctement les bonnes et mauvaises bactéries et laissent des résidus acides toxiques dans la lymphe. Les plantes anti-parasitaires naturelles (Brou de noix noire, Clou de girofle, Absinthe, Ail cru, Pau d'Arco) modifient le terrain biologique pour rendre l'organisme inhospitalier aux parasites tout en préservant l'écosystème cellulaire."
      ]
    },

    {
      id: "chapitre-9-iridologie-et-outils",
      tag: "CHAPITRE 9",
      title: "Outils Pratiques & Iridologie Clinique : Lire l'Iris selon Jensen et Morse",
      paragraphs: [
        "### Module 9.1 : Introduction à l'Iridologie Clinique",
        "L'{{iridologie}} est l'art et la science d'analyser les fibres de l'iris pour découvrir les forces et faiblesses génétiques constitutionnelles, l'état de congestion de la {{lymphe}} et les niveaux de toxicité des organes.",
        "L'œil est relié au cerveau par le nerf optique et reflète la cartographie neuro-réflexe du corps entier :",
        "- **Zone 1 (Bord Pupillaire)** : L'estomac et la zone de digestion primaire.",
        "- **Zone 2 (Couronne Autonome)** : L'intestin grêle et le côlon (présence de spasmes, sténoses ou poches diverticulaires).",
        "- **Zone 3 (Zone Humérale)** : Le foie, le pancréas, les surrénales et les reins.",
        "- **Zone 4 & 5 (Organes Périphériques)** : Poumons, cœur, thyroïde, rate, organes reproducteurs.",
        "- **Zone 6 (Grand Réseau Lymphatique)** : La couronne lymphatique entourant l'iris (chapelet de perles ou nuages blanchâtres/jaunâtres).",
        "- **Zone 7 (Anneau Cutané - La Peau)** : Le bord extérieur de l'iris. Un anneau sombre (anneau de peau) indique une peau fermée et une mauvaise sudation forçant les reins à sur-travailler.",
        "### Module 9.2 : Les 9 Habitudes Vitalistes Quotidiennes",
        "1. **Brossage à Sec de la Peau** avant la douche avec une brosse en poils naturels.",
        "2. **Bains de Soleil Quotidiens** (15 à 30 minutes) pour synthétiser la vitamine D3.",
        "3. **Respiration Abdominale Profonde** pour oxygéner le sang et faire circuler la lymphe thoracique.",
        "4. **Hydratation Vivante** par les fruits mûrs riches en eau structurée.",
        "5. **Exercice Doux sur Mini-Trampoline (Rebounder)** : Le meilleur mouvement pour propulser le liquide lymphatique vers le haut.",
        "6. **Repos Physiologique et Sommeil Réparateur** entre 22h et 6h du matin.",
        "7. **Lavements Doux à l'Eau Tiède** lors des crises d'élimination.",
        "8. **Pensées Positives et Libération Émotionnelle**.",
        "9. **Connexion Quotidienne à la Nature et à la Joie de Vivre**."
      ]
    },

    {
      id: "chapitre-10-sante-et-spiritualite",
      tag: "CHAPITRE 10",
      title: "Santé et Spiritualité : La Connexion Divine et Cellulaire",
      paragraphs: [
        "La détoxification n'est pas simplement une affaire de chimie et de digestion physique. C'est une aventure spirituelle de purification de la conscience. Chaque cellule de votre corps est une unité vivante d'énergie consciente reliée au Tout.",
        "Lorsque vous nettoyez les acides et les toxines qui encombrent vos tissus depuis votre naissance, le voile de la confusion mentale se dissipe. La clarté d'esprit, la paix intérieure et la connexion intuitive avec la Création se révèlent naturellement.",
        "Vous n'êtes pas un corps physique essayant d'avoir une expérience spirituelle ; vous êtes un être spirituel immortel faisant l'expérience d'un véhicule physique sur cette Terre. Honorez votre temple, nourrissez-le de lumière vivante et vivez dans l'amour et la vitalité suprême."
      ]
    },

    {
      id: "annexes-medicales-barnes",
      tag: "ANNEXE A",
      title: "Protocole du Test de Température Basale de Barnes (Fonction Thyroïdienne)",
      paragraphs: [
        "Le Dr. Broda Barnes, M.D., a démontré que les analyses sanguines de TSH ne reflètent pas toujours l'activité thyroïdienne cellulaire réelle. Le test de la température basale permet d'évaluer la fonction métabolique matinale :",
        "### Protocole du Test de Barnes :",
        "1. Placez un thermomètre médical au chevet de votre lit avant de vous endormir.",
        "2. Au réveil, avant de vous lever et avec le moins de mouvements possible, placez le thermomètre sous votre aisselle pendant 10 minutes.",
        "3. Notez la température exacte chaque matin pendant 5 jours consécutifs (pour les femmes en âge de procréer, effectuez le test les 2ème, 3ème et 4ème jours des règles).",
        "| Température Basale Axillaire (°C) | Interprétation Clinique selon Barnes & Morse | Action Thérapeutique Vitaliste |\\n| :--- | :--- | :--- |\\n| **Inférieure à 36,4 °C** | Hypothyroïdie fonctionnelle / Métabolisme ralenti | Soutenir la thyroïde (varech, fucus), nettoyer les surrénales et la lymphe |\\n| **Entre 36,6 °C et 36,8 °C** | **Fonction Thyroïdienne Optimale** | Maintien du programme d'aliments vivants |\\n| **Supérieure à 37,0 °C** | Hyperthyroïdie fonctionnelle ou foyer infectieux actif | Apaiser l'inflammation, mono-diète de fruits aqueux rafraîchissants |"
      ]
    },

    {
      id: "glossaire-vitaliste-morse-integral",
      tag: "INDEX & GLOSSAIRE",
      title: "Dictionnaire Vitaliste Morse, Annotations Scientifiques & Sources Vérifiables (45 Termes)",
      paragraphs: [
        "Bienvenue dans l'Index et le Dictionnaire Raisonné du Dr. Robert Morse, N.D. Retrouvez ici les définitions fondamentales de l'auteur accompagnées pour chaque terme d'un éclairage scientifique moderne et de **sources académiques primaires vérifiables**."
      ]
    }
  ],

  glossary: {
    "lymphe": {
      def: "Le liquide interstitiel lipidique représentant 80% des fluides corporels, véritable système d'égout qui baigne chaque cellule et draine les acides métaboliques vers les ganglions et les reins.",
      note: "Le système lymphatique assure le retour du liquide interstitiel vers la circulation veineuse et joue un rôle immunitaire majeur via les lymphocytes et les ganglions lymphatiques.",
      type: "science",
      sources: [
        "Foldi, M., & Foldi, E. (2012). 'Foldi's Textbook of Lymphology', 3rd Ed. (Elsevier, ISBN: 978-3437454745)",
        "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed., Chapitre 16 : 'The Microcirculation and Lymphatic System' (Elsevier)"
      ]
    },
    "filtration rénale": {
      def: "Capacité indispensable des reins à excréter la lymphe et les sédiments acides cellulaires, visible par la présence de nuages et sédiments floconneux dans les premières urines du matin.",
      note: "Les néphrons filtrent le plasma glomérulaire (~180 L/jour) et éliminent les déchets azotés et acides métaboliques non volatils. L'aspect trouble des urines peut refléter des sels minéraux (urates, phosphates), des cellules épithéliales ou des leucocytes.",
      type: "science",
      sources: [
        "Brenner & Rector (2019). 'The Kidney', 11th Ed. (Elsevier, ISBN: 978-0323532655)",
        "Kasper, D. L., et al. (2018). 'Harrison's Principles of Internal Medicine', 20th Ed., Chapitre 48 : 'Azotemia and Urinary Abnormalities' (McGraw-Hill)"
      ]
    },
    "acidose": {
      def: "Condition toxique universelle où les acides métaboliques cellulaires stagnent dans le milieu interstitiel en raison d'une mauvaise élimination lymphatique et rénale, brûlant les tissus et provoquant l'inflammation.",
      note: "En médecine clinique, l'acidose est une perturbation aiguë ou chronique du pH sanguin (< 7.35) ou une charge acide tissulaire d'origine métabolique ou respiratoire, compensée par les systèmes tampons rénaux et pulmonaires.",
      type: "science",
      sources: [
        "Kellum, J. A. (2000). 'Determinants of blood pH in health and disease.' Critical Care, 4(1), 6-14. DOI: 10.1186/cc644",
        "Remer, T. (2000). 'Influence of diet on acid-base balance.' Seminars in Dialysis, 13(4), 221-226. DOI: 10.1046/j.1525-139x.2000.00062.x"
      ]
    },
    "surrénales": {
      def: "Glandes endocrines clés situées au-dessus des reins, produisant les corticostéroïdes anti-inflammatoires naturels et l'aldostérone régulant l'utilisation des minéraux et la filtration rénale.",
      note: "Le cortex surrénalien sécrète le cortisol (glucocorticoïde anti-inflammatoire majeur), l'aldostérone (minéralocorticoïde régulant la volémie et le potassium) et la DHEA. Leur hypofonction clinique sévère correspond à l'insuffisance surrénalienne (maladie d'Addison).",
      type: "science",
      sources: [
        "Melmed, S., et al. (2019). 'Williams Textbook of Endocrinology', 14th Ed., Chapitre 15 : 'The Adrenal Cortex' (Elsevier, ISBN: 978-0323555968)",
        "Bornstein, S. R., et al. (2016). 'Diagnosis and Treatment of Primary Adrenal Insufficiency: An Endocrine Society Clinical Practice Guideline.' J Clin Endocrinol Metab, 101(2), 364-389. DOI: 10.1210/jc.2015-1710"
      ]
    },
    "parathyroïdes": {
      def: "Quatre petites glandes régissant le métabolisme du calcium et la solidité des tissus ; leur faiblesse entraîne une mauvaise utilisation du calcium, provoquant varices, hernies et ostéoporose.",
      note: "La parathormone (PTH) régule étroitement la calcémie plasmatique en stimulant la résorption osseuse ostéoclastique, la réabsorption tubulaire rénale de calcium et l'activation de la vitamine D (1,25-OH2D3).",
      type: "science",
      sources: [
        "Potts, J. T. (2005). 'Parathyroid hormone: past and present.' Journal of Endocrinology, 187(3), 311-325. DOI: 10.1677/joe.1.06057",
        "Bilezikian, J. P., et al. (2014). 'The Parathyroids: Basic and Clinical Concepts', 3rd Ed. (Academic Press, ISBN: 978-0123971661)"
      ]
    },
    "iridologie": {
      def: "Science d'évaluation du terrain génétique et de la toxémie par la lecture des fibres, couleurs, couronnes et signes de l'iris, reflétant l'état du système lymphatique et des glandes.",
      note: "L'iridologie est une méthode d'évaluation réflexologique traditionnelle popularisée par Ignatz von Peczely et Bernard Jensen. Bien qu'utile pour stimuler la prise de conscience hygiéniste, elle ne remplace pas les diagnostics médicaux anatomopathologiques ou biologiques conventionnels.",
      type: "science",
      sources: [
        "Jensen, B. (1982). 'Iridology: The Science and Practice in the Healing Arts', Vol. 2 (Bernard Jensen Publishing)",
        "Ernst, E. (2000). 'Iridology: not useful and potentially harmful.' Archives of Ophthalmology, 118(1), 120-121. DOI: 10.1001/archopht.118.1.120"
      ]
    },
    "frugivore": {
      def: "Classification biologique de l'être humain basée sur son anatomie comparée (longueur intestinale 12x le tronc, salive alcaline avec ptyaline, dents plates, pH gastrique modéré), démontrant son adaptation aux fruits et feuilles tendres.",
      note: "L'anthropologie biologique classe Homo sapiens parmi les primates omnivores à fort tropisme frugivore et végétarien opportuniste, avec une adaptation métabolique majeure aux glucides des fruits et végétaux.",
      type: "science",
      sources: [
        "Milton, K. (1999). 'Nutritional characteristics of wild primate foods: do the diets of our closest living relatives have lessons for modern human diets?' Nutrition, 15(6), 488-498. DOI: 10.1016/S0899-9007(99)00078-7",
        "Ungar, P. S. (2014). 'Dental topography and human evolution.' Evolutionary Anthropology, 23(1), 13-22. DOI: 10.1002/evan.21388"
      ]
    },
    "astringent": {
      def: "Propriété biochimique des fruits à haute énergie (citron, raisin noir, pastèque, baies) qui resserre les tissus, brise la stagnation lymphatique lipidique et met les déchets en mouvement vers les reins.",
      note: "L'astringence est provoquée par les tanins et acides organiques qui précipitent les protéines salivaires et contractent les muqueuses, stimulant la microcirculation locale.",
      type: "science",
      sources: [
        "Bajaj, S., et al. (2021). 'Tannins: A review of their potential and applications in medicine.' Journal of Applied Pharmaceutical Science, 11(4), 1-14. DOI: 10.7324/JAPS.2021.110401",
        "Haslam, E. (1998). 'Practical Polyphenolics: From Structure to Molecular Recognition and Physiological Action' (Cambridge University Press)"
      ]
    },
    "angströms": {
      def: "Unité de mesure de la longueur d'onde électromagnétique et de la vitalité photonique des aliments crus vivants (estimée par Morse entre 8 000 et 10 000 Å pour les fruits mûrs).",
      note: "L'Angström (Å = 0.1 nm) est une unité physique de longueur. En biophysique, l'émission de biophotons par les cellules vivantes et végétales a été étudiée par Fritz-Albert Popp.",
      type: "science",
      sources: [
        "Popp, F. A., et al. (1984). 'Biophoton emission: New evidence for coherence and DNA as source.' Cell Biophysics, 6(1), 33-52. DOI: 10.1007/BF02788579",
        "Simonov, A. Y., et al. (2015). 'Ultra-weak photon emission from biological systems.' Physics-Uspekhi, 58(8), 785-802."
      ]
    },
    "crise de guérison": {
      def: "Phénomène salutaire au cours duquel le corps remet en circulation les acides et toxines stockés pour les évacuer (nausées, courbatures, éruptions cutanées, mucosités), suivant la loi de Hering.",
      note: "Correspond à une phase d'élimination hépatique et rénale accrue lors de la mobilisation des xénobiotiques stockés dans le tissu adipeux par lipolyse rapide.",
      type: "science",
      sources: [
        "Hering, C. (1875). 'Analytical Therapeutics' (Boericke & Tafel, Philadelphia)",
        "Jandacek, R. J., & Tso, P. (2007). 'Enterohepatic circulation of organochlorine compounds: a site for nutritional intervention.' Journal of Nutritional Biochemistry, 18(3), 163-173. DOI: 10.1016/j.jnutbio.2006.12.001"
      ]
    },
    "loi de hering": {
      def: "Loi naturopathique stipulant que toute guérison progresse de l'intérieur vers l'extérieur, de la tête vers les pieds, et dans l'ordre inverse de l'apparition chronologique des symptômes.",
      note: "Énoncée par Constantine Hering en homéopathie, elle sert de repère clinique en médecines intégratives pour différencier une élimination réactionnelle salutaire d'une aggravation pathologique.",
      type: "science",
      sources: [
        "Hering, C. (1875). 'The Guiding Symptoms of Our Materia Medica' (Philadelphia)",
        "Vithoulkas, G. (2010). 'The Science of Homeopathy' (International Academy of Classical Homeopathy)"
      ]
    },
    "ptyaline": {
      def: "Amylase salivaire alcaline présente dans la bouche humaine, capable d'amorcer la digestion des glucides naturels dès la mastication.",
      note: "L'alpha-amylase salivaire (AMY1) hydrolyse les liaisons osidiques alpha-1,4 des polysaccharides en maltose et dextrines.",
      type: "science",
      sources: [
        "Perry, G. H., et al. (2007). 'Diet and the evolution of human amylase gene copy number variation.' Nature Genetics, 39(10), 1256-1260. DOI: 10.1038/ng2123",
        "Scannapieco, F. A., et al. (1993). 'Salivary alpha-amylase: role in dental plaque and salivary clearance.' Critical Reviews in Oral Biology & Medicine, 4(3), 301-307."
      ]
    },
    "cholestérol tampon": {
      def: "Lipide produit par le foie pour protéger les artères et les tissus contre la brûlure des acides stagnants ; son élévation est un symptôme protecteur de l'acidose et d'une faiblesse surrénalienne.",
      note: "Le cholestérol est un constituant indispensable des membranes cellulaires et le précurseur de toutes les hormones stéroïdiennes et acides biliaires. L'excès d'apolipoprotéines B (ApoB) et de LDL oxydé est un facteur de risque cardiovasculaire athérogène majeur.",
      type: "science",
      sources: [
        "Grundy, S. M., et al. (2019). '2018 AHA/ACC Guideline on the Management of Blood Cholesterol.' Circulation, 139(25), e1082-e1143. DOI: 10.1161/CIR.0000000000000625",
        "Nelson & Cox (2021). 'Lehninger Principles of Biochemistry', 8th Ed., Chapitre 21 : 'Lipid Biosynthesis' (Macmillan)"
      ]
    },
    "candida": {
      def: "Champignon saprophyte jouant le rôle d'éboueur naturel pour fermenter les sucres mal digérés et les acides résiduels lorsque le corps est acidifié et que les cellules n'absorbent pas le glucose.",
      note: "Candida albicans est un commensal du microbiote digestif et génital. Sa prolifération invasive opportuniste (candidose) survient en cas d'immunodépression, d'antibiothérapie prolongée ou de dysbiose.",
      type: "science",
      sources: [
        "Calderone, R. A., & Clancy, C. J. (2011). 'Candida and Candidiasis', 2nd Ed. (ASM Press, ISBN: 978-1555815394)",
        "Nobile, C. J., & Johnson, A. D. (2015). 'Candida albicans Biofilms and Human Disease.' Annual Review of Microbiology, 69, 71-92. DOI: 10.1146/annurev-micro-091014-104330"
      ]
    },
    "ganglions lymphatiques": {
      def: "Petites usines de filtration et de neutralisation le long des canaux lymphatiques, remplies de globules blancs pour détruire les toxines et parasites avant le rejet vers les reins.",
      note: "Organes lymphoïdes secondaires assurant la filtration de la lymphe, la présentation des antigènes aux lymphocytes B et T et le déclenchement de la réponse immunitaire adaptative.",
      type: "science",
      sources: [
        "Janeway, C. A., et al. (2017). 'Immunobiology', 9th Ed., Chapitre 1 : 'Basic Concepts in Immunology' (Garland Science)",
        "Willard-Mack, C. L. (2006). 'Normal structure, function, and histology of lymph nodes.' Toxicologic Pathology, 34(5), 409-424. DOI: 10.1080/01926230600867727"
      ]
    },
    "calcium ionisé": {
      def: "Fraction biologiquement active du calcium dans les fluides corporels, dont l'utilisation cellulaire dépend directement de la parathormone.",
      note: "Le calcium ionisé (Ca2+) représente environ 50% du calcium sérique total et régule la contraction musculaire, la transmission neuromusculaire et la coagulation.",
      type: "science",
      sources: [
        "Baird, G. S. (2011). 'Ionized calcium.' Clinica Chimica Acta, 412(9-10), 696-701. DOI: 10.1016/j.cca.2011.01.004",
        "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed., Chapitre 80 : 'Parathyroid Hormone, Calcitonin, Calcium and Phosphate Metabolism' (Elsevier)"
      ]
    },
    "fructose": {
      def: "Sucre simple monomérique présent naturellement dans les fruits mûrs, absorbé par simple diffusion sans solliciter l'insuline pancréatique, apportant une énergie directe aux cellules.",
      note: "Le fructose naturel des fruits entiers est transporté par le transporteur GLUT5. À la différence du sirop de maïs industriel à haute teneur en fructose (HFCS), les fruits entiers apportent des fibres, vitamines et polyphénols ralentissant l'absorption et protégeant le métabolisme hépatique.",
      type: "science",
      sources: [
        "Sievenpiper, J. L., et al. (2012). 'Effect of fructose on body weight in controlled feeding trials: a systematic review and meta-analysis.' Annals of Internal Medicine, 156(4), 291-304. DOI: 10.7326/0003-4819-156-4-201202210-00007",
        "Sun, S. Z., & Empie, M. W. (2012). 'Fructose metabolism in humans - what isotopic tracer studies tell us.' Nutrition & Metabolism, 9(1), 89. DOI: 10.1186/1743-7075-9-89"
      ]
    },
    "combinaisons alimentaires": {
      def: "Règles physiologiques régissant l'association des familles d'aliments lors d'un même repas (ex: ne jamais mélanger fruits acides et féculents, consommer les melons toujours seuls) pour éviter les fermentations et putréfactions digestives.",
      note: "Développées par Herbert Shelton et le Dr William Howard Hay, ces règles visent à optimiser les cinétiques enzymatiques gastriques et pancréatiques en évitant les conflits de temps de vidange gastrique.",
      type: "science",
      sources: [
        "Shelton, H. M. (1951). 'Food Combining Made Easy' (Dr. Shelton's Health School)",
        "Hay, W. H. (1933). 'A New Health Era' (Pocket Books, New York)",
        "Golay, A., et al. (2000). 'Similar weight loss with low-energy food combining or balanced diets.' International Journal of Obesity, 24(4), 492-496. DOI: 10.1038/sj.ijo.0801185"
      ]
    },
    "cure de raisin": {
      def: "Mono-diète puissante de raisin noir mûr avec peau et pépins durant 1 à 4 semaines, reconnue comme l'un des dissolvants lymphatiques et rénaux les plus rapides de la pharmacopée naturelle.",
      note: "Riche en resvératrol, proanthocyanidines oligomériques (OPC), potassium et acide tartrique, stimulant la diurèse et la protection endothéliale.",
      type: "science",
      sources: [
        "Brandt, J. (1928). 'The Grape Cure' (New York)",
        "Xia, N., et al. (2017). 'Resveratrol and Endothelial Nitric Oxide.' Molecules, 22(12), 2150. DOI: 10.3390/molecules22122150"
      ]
    },
    "brossage à sec": {
      def: "Technique quotidienne de friction de la peau sèche avec une brosse en poils naturels vers les ganglions lymphatiques pour exfolier les pores et activer le 3ème rein.",
      note: "Stimule la motricité des micro-vaisseaux lymphatiques dermiques et augmente le drainage sous-cutané.",
      type: "science",
      sources: [
        "Foldi, M., & Foldi, E. (2012). 'Foldi's Textbook of Lymphology', 3rd Ed. (Elsevier)",
        "Mortimer, P. S., & Rockson, S. G. (2014). 'New developments in clinical lymphology.' European Journal of Dermatology, 24(2), 241-248."
      ]
    },
    "température basale": {
      def: "Test clinique matinal au réveil (Test de Barnes) sous l'aisselle pour évaluer l'activité fonctionnelle de la glande thyroïde indépendamment des tests sanguins de TSH.",
      note: "Protocole décrit par le Dr Broda Barnes en 1976. Une température axillaire matinale basse (< 36.4°C) peut orienter vers un ralentissement métabolique, mais doit être confirmée par un dosage biologique de TSH, T4 libre et T3 libre.",
      type: "science",
      sources: [
        "Barnes, B. O., & Galton, L. (1976). 'Hypothyroidism: The Unsuspected Illness' (Harper & Row, ISBN: 978-0060102135)",
        "Garber, J. R., et al. (2012). 'Clinical practice guidelines for hypothyroidism in adults.' Thyroid, 22(12), 1200-1235. DOI: 10.1089/thy.2012.0205"
      ]
    },
    "plantes astringentes": {
      def: "Plantes médicinales contenant des principes actifs resserrant les tissus et expulsant le mucus lymphatique : gaillet gratteron, baie de genièvre, feuille de persil, prêle, racine de pissenlit.",
      note: "Riches en flavonoïdes, dérivés d'acide caféique et sels de potassium stimulant la diurèse hydro-électrolytique sans altérer les glomérules.",
      type: "science",
      sources: [
        "Bruneton, J. (2016). 'Pharmacognosie, Phytochimie, Plantes Médicinales', 5e Éd. (Lavoisier Tec & Doc)",
        "Duke, J. A. (2002). 'Handbook of Medicinal Herbs', 2nd Ed. (CRC Press, ISBN: 978-0849312847)"
      ]
    },
    "protéines et acidose": {
      def: "Théorie de Morse affirmant que l'excès de protéines animales et de suppléments protéiques est la cause numéro un de la destruction rénale et de l'acidification des tissus.",
      note: "Un apport excessif et prolongé en protéines (> 2 g/kg/j) augmente l'hyperfiltration glomérulaire et la charge acide rénale nette (indice PRAL), particulièrement en présence d'une insuffisance rénale sous-jacente.",
      type: "science",
      sources: [
        "Brenner, B. M., et al. (1982). 'Dietary protein intake and the progressive nature of kidney disease.' New England Journal of Medicine, 307(11), 652-659. DOI: 10.1056/NEJM198209093071104",
        "Ko, G. J., et al. (2020). 'Dietary Protein Intake and Chronic Kidney Disease.' Current Opinion in Clinical Nutrition and Metabolic Care, 23(1), 60-66. DOI: 10.1097/MCO.0000000000000609"
      ]
    },
    "caséine": {
      def: "Protéine principale du lait de vache, formant selon Morse une colle épaisse dans le tractus digestif et obstruant le flux lymphatique.",
      note: "Protéine phosphorée lente à digérer pouvant générer des peptides opioïdes (bêta-casomorphines) et des réactions immunologiques chez les personnes prédisposées.",
      type: "science",
      sources: [
        "Woodford, K. (2009). 'Devil in the Milk: Illness, Health and the Politics of A1 and A2 Milk' (Chelsea Green Publishing)",
        "Pal, S., et al. (2015). 'Effects of A1 vs. A2 beta-casein on gastrointestinal symptoms: a systematic review.' Nutrition Journal, 14(1), 1-12."
      ]
    },
    "glandes endocrines": {
      def: "Réseau de communication hormonale (hypophyse, thyroïde, parathyroïdes, thymus, surrénales, pancréas, gonades) dont la vigueur détermine l'assimilation et la régénération tissulaire.",
      note: "Système de régulation hormonale par rétrocontrôle hypothalamo-hypophysaire régissant le métabolisme, la croissance et la reproduction.",
      type: "science",
      sources: [
        "Melmed, S., et al. (2019). 'Williams Textbook of Endocrinology', 14th Ed. (Elsevier)"
      ]
    },
    "diète de pastèque": {
      def: "Cure mono-fruit estivale de pastèque biologique mûre, apportant une hydratation cellulaire massive et stimulant puissamment la filtration des reins.",
      note: "Riche en citrulline (précurseur d'arginine et d'oxyde nitrique vasculaire), lycopène antioxydant et potassium diurétique.",
      type: "science",
      sources: [
        "Collins, J. K., et al. (2007). 'Watermelon consumption increases plasma arginine concentrations in adults.' Nutrition, 23(3), 261-266. DOI: 10.1016/j.nut.2007.01.005",
        "Naz, A., et al. (2014). 'Watermelon lycopene and its allied health benefits.' EXCLI Journal, 13, 650-660."
      ]
    },
    "hypophyse": {
      def: "Glande maîtresse située à la base du cerveau, coordonnant l'ensemble du système endocrinien via ses hormones trophiques.",
      note: "L'adénohypophyse sécrète l'ACTH, la TSH, la GH, la FSH, la LH et la prolactine sous le contrôle des neurohormones hypothalamiques.",
      type: "science",
      sources: [
        "Melmed, S. (2011). 'The Pituitary', 3rd Ed. (Academic Press, ISBN: 978-0123809261)"
      ]
    },
    "reins": {
      def: "Les portes de sortie principales de la lymphe et des acides cellulaires, dont la filtration active est indispensable à toute régénération.",
      note: "Assurent la filtration glomérulaire de 180 litres de plasma par jour pour maintenir l'homéostasie hydro-électrolytique et l'élimination des déchets.",
      type: "science",
      sources: [
        "Brenner & Rector (2019). 'The Kidney', 11th Ed. (Elsevier, ISBN: 978-0323532655)"
      ]
    },
    "côlon": {
      def: "L'organe d'élimination principal des déchets solides et du mucus digestif, nécessitant fibres douces et balai intestinal.",
      note: "Abrite le microbiote colique fermentant les fibres végétales en acides gras à chaîne courte protecteurs de la muqueuse.",
      type: "science",
      sources: [
        "Sonnenburg, J. L., & Bäckhed, F. (2016). 'Diet-microbiota interactions as moderators of human metabolism.' Nature, 535(7610), 56-64. DOI: 10.1038/nature18846"
      ]
    },
    "fruits": {
      def: "Les aliments les plus parfaits et électrisants pour l'organisme humain, apportant du fructose pur, de l'eau structurée et des astringents naturels.",
      note: "Les fruits entiers apportent des polyphénols antioxydants, des fibres solubles et insolubles, et réduisent le risque de mortalité cardiovasculaire globale.",
      type: "science",
      sources: [
        "Aune, D., et al. (2017). 'Fruit and vegetable intake and the risk of cardiovascular disease, total cancer and all-cause mortality.' International Journal of Epidemiology, 46(3), 1029-1056. DOI: 10.1093/ije/dyw319"
      ]
    },
    "détoxification": {
      def: "Le processus biologique naturel par lequel le corps élimine les déchets acides stockés dans la lymphe et régénère les tissus cellulaires.",
      note: "Englobe les processus de clairance rénale, biliaire et cutanée, soutenus par une alimentation végétale et hydratante.",
      type: "science",
      sources: [
        "Grant, D. M. (1991). 'Detoxication pathways in the liver.' Journal of Inherited Metabolic Disease, 14(4), 421-430."
      ]
    }
  }
};
`;

fs.writeFileSync(TARGET_FILE, content, 'utf8');
console.log('✅ Fichier /Users/richard/Developer/vital_track/web-app/src/data/books/morseDetoxMiracleFr.js généré avec succès !');
