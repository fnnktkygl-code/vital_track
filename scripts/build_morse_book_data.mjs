import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = '/Users/richard/Developer/vital_track/web-app/src/data/books/morseDetoxMiracleFr.js';

console.log('📖 Construction de l\'édition intégrale française du Dr. Robert Morse, N.D....');

// Import or construct the complete 14 chapters and 45 glossary entries
const bookData = {
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
    "moteur des 4 processus": {
      def: "Les quatre étapes indispensables à la vie cellulaire : 1. Digestion, 2. Absorption, 3. Utilisation/Assimilation, 4. Élimination. La faillite du 4ème engendre toutes les maladies.",
      note: "Correspond aux quatre fonctions physiologiques fondamentales du métabolisme intermédiaire et de l'excrétion rénale/digestive.",
      type: "science",
      sources: [
        "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed. (Elsevier)"
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
    "acides volatils vs non volatils": {
      def: "Distinction fondamentale entre les acides gazeux évacués par les poumons (acide carbonique sous forme de CO2) et les acides solides et chimiques devant impérativement être éliminés par les reins et la peau (acides sulfurique, phosphorique, urique).",
      note: "Base de la physiologie acido-basique : les poumons éliminent ~15 000 mmol/jour de CO2 (acide volatil), tandis que les reins éliminent 50 à 100 mmol/jour d'acides fixes non volatils.",
      type: "science",
      sources: [
        "Kellum, J. A. (2000). 'Determinants of blood pH in health and disease.' Critical Care, 4(1), 6-14. DOI: 10.1186/cc644",
        "Guyton & Hall (2020). 'Textbook of Medical Physiology', 14th Ed., Chapitre 31 : 'Acid-Base Regulation' (Elsevier)"
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
    "jus de fruits frais": {
      def: "Carburant liquide vivant apportant une énergie instantanée, des flavonoïdes et de l'eau cellulaire hautement structurée sans demander d'effort digestif lourd.",
      note: "Source concentrée de micronutriments antioxydants biodisponibles ; en clinique, leur consommation avec les fibres sous forme de fruits entiers est recommandée pour stabiliser l'index glycémique.",
      type: "science",
      sources: [
        "Aune, D., et al. (2017). 'Fruit and vegetable intake and the risk of cardiovascular disease, total cancer and all-cause mortality.' International Journal of Epidemiology, 46(3), 1029-1056. DOI: 10.1093/ije/dyw319"
      ]
    },
    "salade de transition": {
      def: "Repas du soir composé de légumes feuilles et légumes râpés crus ou légèrement cuits à la vapeur, servant de frein régulateur pour calmer une détoxication trop brutale.",
      note: "Apport de fibres insolubles et solubles régulant le transit colique et soutenant la synthèse d'acides gras à chaîne courte par le microbiote.",
      type: "science",
      sources: [
        "Slavin, J. (2013). 'Fiber and prebiotics: mechanisms and health benefits.' Nutrients, 5(4), 1417-1435. DOI: 10.3390/nu5041417"
      ]
    },
    "bio-disponibilité": {
      def: "Capacité réelle d'un minéral ou d'une vitamine organique vivante à être assimilé par la cellule sans laisser de résidus toxiques inorganiques.",
      note: "Fraction d'un nutriment ou principe actif qui pénètre dans la circulation systémique et devient accessible au site d'action cellulaire.",
      type: "science",
      sources: [
        "Gibson, R. S. (2007). 'The role of diet- and host-related factors in nutrient bioavailability and thus in nutrient-based dietary requirement estimates.' Food and Nutrition Bulletin, 28(1_suppl1), S77-S100. DOI: 10.1177/15648265070281S108"
      ]
    },
    "materia medica de morse": {
      def: "Compendium des 50 plantes thérapeutiques maîtresses sélectionnées par le Dr. Morse pour tonifier spécifiquement chaque glande et organe émonctoire.",
      note: "Formulation phyto-thérapeutique synergique combinant des plantes drainantes, toniques surrénaliennes et stimulantes immunitaires.",
      type: "science",
      sources: [
        "Morse, R. (2004). 'The Detox Miracle Sourcebook', Chapter 8 (One World Press)",
        "Duke, J. A. (2002). 'Handbook of Medicinal Herbs', 2nd Ed. (CRC Press)"
      ]
    },
    "parasites et vers": {
      def: "Micro-organismes et helminthes qui prolifèrent exclusivement dans un milieu intestinal encrassé de putréfactions et de mucus acide stagnant.",
      note: "Les parasitoses intestinales résultent de contaminations par eau, sol ou aliments et nécessitent une prise en charge ciblée anti-parasitaire en association avec l'hygiène sanitaire.",
      type: "science",
      sources: [
        "World Health Organization (WHO, 2020). 'Soil-transmitted helminthiases.' Technical Report Series",
        "Buhner, S. H. (2013). 'Herbal Antivirals' & 'Herbal Antibiotics' (Storey Publishing)"
      ]
    },
    "énergie des aliments": {
      def: "Notion vitaliste quantifiant la vitalité photonique et la fraîcheur des aliments crus cueillis à maturité versus les aliments industriels thermo-transformés dénaturés.",
      note: "Les aliments ultra-transformés et cuits à haute température génèrent des produits de glycation avancée (AGEs) pro-inflammatoires, alors que les végétaux crus conservent leurs enzymes et antioxydants thermolabiles.",
      type: "science",
      sources: [
        "Uribarri, J., et al. (2010). 'Advanced glycation end products in foods and a practical guide to their reduction in the diet.' Journal of the American Dietetic Association, 110(6), 911-916. DOI: 10.1016/j.jada.2010.03.018"
      ]
    },
    "côlon et diverticules": {
      def: "Hernies de la muqueuse colique causées par la pression des matières fécales durcies et de la constipation chronique, formant des poches d'auto-intoxication.",
      note: "La diverticulose colique résulte d'une augmentation de la pression intra-luminale favorisée par une alimentation pauvre en fibres végétales.",
      type: "science",
      sources: [
        "Strate, L. L., & Morris, A. M. (2019). 'Epidemiology, Pathophysiology, and Treatment of Diverticulitis.' Gastroenterology, 156(5), 1282-1298. DOI: 10.1053/j.gastro.2018.12.033"
      ]
    },
    "lavement et irrigation": {
      def: "Méthode hygiénique de nettoyage doux du gros intestin pour libérer les impactions fécales anciennes et soutenir le drainage lymphatique abdominal.",
      note: "L'irrigation rétrograde douce est utilisée en gastro-entérologie fonctionnelle pour évacuer les fécalomes et relancer l'évacuation colique.",
      type: "science",
      sources: [
        "Bazzocchi, G., et al. (2006). 'Retrograde colonic irrigation in the management of functional bowel disorders.' Diseases of the Colon & Rectum, 49(11), 1736-1743."
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
    "thymus": {
      def: "Glande de l'immunité et de la jeunesse énergétique située derrière le sternum, responsable de l'éducation des lymphocytes T.",
      note: "Organe lymphoïde primaire où s'effectue la maturation et la sélection positive et négative des lymphocytes T assurant la tolérance immunologique.",
      type: "science",
      sources: [
        "Janeway, C. A., et al. (2017). 'Immunobiology', 9th Ed., Chapitre 8 : 'T Cell Development' (Garland Science)"
      ]
    }
  }
};

console.log('✅ Structure de base construite. Génération du fichier complet...');
fs.writeFileSync('/tmp/morse_base.json', JSON.stringify(bookData, null, 2));
