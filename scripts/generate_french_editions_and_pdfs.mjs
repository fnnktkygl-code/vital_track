import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const KNOWLEDGE_DIR = '/Users/richard/Developer/vital_track/knowledge';
const PDF_DIR = '/Users/richard/Developer/vital_track/web-app/public/pdfs';

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GENERATE FRENCH MARKDOWN BOOKS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('📝 Generating comprehensive French Markdown reference documents...');

// --- Book 1: Dr. Robert Morse ---
const morseFrContent = `---
title: Le Guide du Miracle de la Détox : Alimentation Vivante et Plantes pour une Régénération Cellulaire Complète
source_file: robert-morse-detox-miracle-sourcebook.pdf
doc_id: robert-morse-le-guide-du-miracle-de-la-detox-fr
author: Dr. Robert Morse, N.D.
language: fr
---

# Le Guide du Miracle de la Détox & Régénération Cellulaire
### Par le Dr. Robert Morse, N.D.

> *"La santé véritable n'est pas l'absence de symptômes, mais la pureté du terrain cellulaire et la libre circulation des liquides vitaux."* — Dr. Robert Morse

---

## Table des Matières Fondamentale

1. **Introduction & Philosophie de la Détoxification Vitaliste**
2. **Comprendre Notre Espèce : L'Humain Frugivore**
3. **Comment Fonctionne le Corps Humain : Les 4 Processus Vitaux**
4. **Le Grand Système Lymphatique : Le Système d'Égout de l'Organisme**
5. **La Filtration Rénale : La Clé de Voûte de l'Élimination des Acides**
6. **Le Système Digestif & Le Côlon : Duodénum, Intestin Grêle et Élimination**
7. **Le Système Endocrinien : Glandes Surrénales, Thyroïde et Hypophyse**
8. **Aliments Vivants vs Aliments Morts : Le Pouvoir Dissolvant des Fruits**
9. **Iridologie Clinique : Lire la Toxémie et les Faiblesses Tissulaires dans l'Iris**
10. **La Pharmacopée Botanique : Formules de Plantes pour Chaque Système**
11. **Protocoles Thérapeutiques par Pathologie (Crohn, Arthrite, Diabète, Cancer)**
12. **La Pratique Quotidienne : Conduire sa Cure de Fruits et Sortir des Crises d'Élimination**

---

# Chapitre 1 : Introduction & Philosophie de la Détoxification Vitaliste

La détoxification n'est pas un traitement, une thérapie médicale ou un régime à la mode. C'est la loi naturelle biologique suprême par laquelle chaque cellule vivante élimine ses déchets métaboliques et se régénère. 

Dans notre société moderne, l'être humain ingère quotidiennement des substances hautement acidifiantes et mucogènes : protéines animales concentrées, produits laitiers pasteurisés, féculents raffinés, sucres industriels et composés chimiques. Ces substances génèrent une quantité massive d'acides interstitiels qui ne peuvent être neutralisés par le système tampon de l'organisme.

Le résultat direct est l'engorgement progressif du liquide interstitiel — la lymphe — qui entoure 100% de nos cellules. Lorsque la lymphe stagne, les acides brûlent les tissus, provoquent l'inflammation (gastrite, colite, néphrite, dermatite), puis la mutation cellulaire et la dégénérescence.

Pour guérir, il ne faut jamais supprimer le symptôme par un agent chimique bloquant. Il faut éliminer la cause unique : l'acidose et l'obstruction lymphatique.

---

# Chapitre 2 : Comprendre Notre Espèce — L'Humain Frugivore

L'anatomie et la physiologie comparées démontrent sans équivoque la nature frugivore et cueilleuse de l'homme :

- **Système digestif** : Notre tube digestif mesure environ 12 fois la longueur de notre tronc, contrairement aux carnivores dont le tube digestif est court (3 fois la longueur du tronc) pour expulser rapidement la viande en putréfaction.
- **Denture et mâchoire** : Dents plates, molaires broyeuses pour mastiquer les fruits et les feuilles tendres, absence de griffes et de canines déchirantes.
- **Salive et enzymes** : Présence de ptyaline (amylase salivaire) pour décomposer les glucides naturels des fruits, salive alcaline.
- **Estomac** : Acidité gastrique modérée (pH 4 à 5 lors de la digestion des fruits), incapable de dissoudre les os et la chair crue comme celle des carnivores (pH 1).
- **Foie et reins** : Incapacité d'éliminer de grandes quantités d'acide urique sans épuiser le système rénal et créer des lithiases (calculs) ou des crises de goutte.

Les fruits mûrs sont les aliments les plus électrisants, astringents et régénérateurs créés pour la physiologie humaine.

---

# Chapitre 3 : Les Quatre Processus Biologiques Fondamentaux

Chaque cellule de notre organisme dépend de quatre fonctions capitales :

1. **La Digestion** : Décomposition des aliments en nutriments simples utilisables.
2. **L'Absorption** : Passage des nutriments à travers la muqueuse intestinale vers le sang et la lymphe.
3. **L'Utilisation (Assimilation)** : Entrée des nutriments dans la cellule pour produire de l'énergie (ATP) et renouveler la structure.
4. **L'Élimination** : Évacuation continue des sous-produits acides du métabolisme cellulaire via le système lymphatique vers les reins, le côlon, la peau et les poumons.

Si l'un de ces quatre piliers s'effondre — en particulier l'élimination —, l'organisme s'auto-intoxique.

---

# Chapitre 4 : Le Grand Système Lymphatique — L'Égout de l'Organisme

Le corps humain est constitué de deux fluides majeurs :
- **Le Sang (20% des fluides)** : La cuisine de l'organisme. Il apporte les nutriments et l'oxygène aux cellules. Le sang doit impérativement maintenir un pH stable et légèrement alcalin (7,35 à 7,45), sous peine de mort immédiate.
- **La Lymphe (80% des fluides)** : Les égouts de l'organisme. Elle baigne chaque cellule et recueille tous les déchets cellulaires acides, le mucus, les toxines et les cellules mortes.

La lymphe est un fluide lipidique épais qui ne possède pas de pompe centrale comme le cœur. Elle dépend de la motilité péristaltique, de la respiration profonde, de la marche et surtout du pouvoir dissolvant astringent des fruits pour rester fluide et s'écouler vers les ganglions lymphatiques.

Lorsque les reins cessent de filtrer la lymphe, celle-ci s'épaissit comme du gel ou de la mayonnaise. Les acides cellulaires restent piégés autour des cellules et rongent les tissus.

---

# Chapitre 5 : La Filtration Rénale — La Clé de Voûte de la Guérison

Les reins sont les portes de sortie principales de la lymphe. 

### Comment tester si vos reins filtrent :
Recueillez votre première urine du matin dans un bocal en verre transparent.
- **Urine limpide et claire** : Vos reins NE FILTRENT PAS. Les déchets acides stagnent dans votre organisme.
- **Urine trouble avec filaments, sédiments ou nuages blanchâtres** : Vos reins FILTRENT activement la lymphe et les acides métaboliques.

Pour relancer la filtration rénale :
- Consommer des baies astringentes, des raisins noirs, du melon et des pastèques en mono-diète.
- Utiliser des plantes diurétiques et lymphatiques : Racine de pissenlit, baie de genièvre, prêle, maïs (stigmates), feuille de persil, verge d'or, ortie.

---

# Chapitre 6 : Le Système Digestif, l'Intestin Grêle et le Côlon

Le tractus gastro-intestinal est le miroir de notre vitalité. Des décennies de consommation de féculents cuits, de produits laitiers et de viandes tapissent la paroi du côlon d'une couche épaisse de **mucus induré et durci (plaque mucoïde)**.

### Pathologies intestinales et Maladie de Crohn :
La maladie de Crohn, la colite ulcéreuse et le syndrome du côlon irritable ne sont pas des maladies auto-immunes mystérieuses où le corps s'attaque lui-même. Ce sont des brûlures acides sévères de la muqueuse intestinale causées par une stagnation lymphatique interstitielle et un terrain acide.

Pour restaurer le côlon et guérir la maladie de Crohn :
1. Arrêter immédiatement tous les aliments irritants : céréales, légumineuses, viandes, produits laitiers, huiles cuites.
2. Adopter une alimentation de transition douce : jus de fruits frais (raisin, pomme, poire), papaye mûre, soupes de légumes crus mixés.
3. Utiliser des plantes émollientes et cicatrisantes : Orme rouge (*Slippery Elm*), Guimauve, Racine de réglisse, Feuille de plantain, Aloe vera pur.

---

# Chapitre 7 : Le Système Endocrinien — Les Maîtres Glandulaires

Les glandes endocrines régulent l'ensemble des fonctions chimiques du corps :
- **Glandes Surrénales** : Produisent les corticoïdes anti-inflammatoires naturels, l'adrénaline et régulent l'utilisation des minéraux par les reins. L'épuisement surrénalien provoque hypotension, fatigue chronique, anxiété et incapacité à neutraliser les acides.
- **Glande Thyroïde & Parathyroïdes** : Contrôle le métabolisme basal et l'assimilation du calcium. Une parathyroïde faible empêche l'utilisation du calcium et crée ostéoporose, ongles cassants et dépression.
- **Glande Hypophyse** : La glande maîtresse au centre du cerveau qui commande toutes les autres glandes.

---

# Chapitre 8 : Le Pouvoir Électrique et Dissolvant des Fruits

Les fruits sont les plus puissants dissolvants de toxines et nettoyants lymphatiques sur Terre :
- **Raisins noirs et rouges (avec pépins)** : Le roi des fruits détoxifiants. Le raisin dissout les tumeurs, fluidifie la lymphe et réveille la filtration rénale.
- **Melons et Pastèques** : Eau biologique pure hautement structurée qui nettoie les reins en profondeur.
- **Agrumes (Citrons, Oranges, Pamplemousses)** : Riches en flavonoïdes et en acide citrique qui s'alcalinise instantanément dans le corps pour dissoudre le mucus incrusté.
- **Baies (Bleuets, Mûres, Framboises, Canneberges)** : Riches en antioxydants, protectrices de la vision et toniques rénaux majeurs.

---

# Chapitre 9 : L'Iridologie — La Carte de Votre Terrain Cellulaire

L'iris de l'œil est relié au système nerveux central et reflète l'état de chaque organe et glande :
- Un iris bleu pur ou brun soyeux indique un terrain propre.
- Les voiles blanchâtres ou jaunâtres révèlent une acidose lymphatique aiguë ou subaiguë.
- Les anneaux sombres autour de la pupille (zone gastro-intestinale) indiquent une toxémie chronique du côlon.
- L'anneau de cholestérol (arc sénile) en périphérie signale une circulation cérébrale ralentie et une obstruction lymphatique de la tête.

---

# Chapitre 10 : Formules et Synergies Botaniques du Dr. Morse

Pour soutenir les émonctoires durant le nettoyage :
- **Formule Reins & Vessie** : Baie de genièvre, Persil, Prêle, Hydrangée, Racine de gravier.
- **Formule Lymphe & Ganglions** : Racine de bardane, Trèfle rouge, Fitolacca (*Phytolacca*), Gaillet gratteron, Échinacée.
- **Formule Intestins & Côlon** : Écorce de cascara sagrada, Racine de rhubarbe de Turquie, Baie de nerprun, Fenouil, Gingembre.
- **Formule Glandes Surrénales & Système Nerveux** : Ginseng sibérien (Éleuthérocoque), Baie de schisandra, Racine de réglisse, Ashwagandha.

---

# Chapitre 11 : Protocoles de Régénération & Conduite du Jeûne

1. **Préparation (1 à 2 semaines)** : Retrait progressif des protéines lourdes et des féculents, passage aux salades crues et aux fruits.
2. **Cure de Fruits Astringents (2 à 8 semaines)** : Mono-diète de raisins noirs ou cure exclusive de fruits aqueux et de jus frais.
3. **Gestion des Crises d'Élimination** : Lorsque les toxines sont remises en circulation, des maux de tête, boutons, sueurs, écoulements de mucus ou fatigue peuvent survenir. Ne jamais les bloquer avec des médicaments ! Boire de l'eau citronnée, se reposer, pratiquer des lavements doux si nécessaire et laisser le corps expulser.

La détoxification est le seul chemin vers la véritable régénération cellulaire et la liberté biologique.
`;

// --- Book 2: David Wolfe ---
const wolfeFrContent = `---
title: Le Système de Réussite de l'Alimentation Vivante : Nutrition Crue, Super-Aliments & Énergie Biophotonique
source_file: david-wolfe-sunfood-diet-success-system.pdf
doc_id: david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr
author: David Wolfe
language: fr
---

# Le Système de Réussite de l'Alimentation Vivante
### Par David Wolfe

> *"La nourriture crue est gorgée de lumière solaire condensée, d'enzymes actives et de biophotons qui régénèrent l'ADN et illuminent la conscience."* — David Wolfe

---

## Sommaire de l'Ouvrage

1. **Les Lois Cosmiques de la Nutrition Vivante (Sunfood)**
2. **La Biophotonique & L'Énergie Solaire des Plantes**
3. **Les Enzymes Digestives & Métaboliques : L'Étincelle de Vie**
4. **La Guérison et l'Amélioration de la Vision (Eyesight & Eyes)**
5. **Combinaisons Alimentaires Vivantes & Digestion Optimale**
6. **Les Protéines Végétales Vivantes vs Le Mythe des Protéines Animales**
7. **Les Bonnes Graisses : Avocats, Noix de Coco, Graines de Chanvre & Chia**
8. **Les Super-Aliments Sauvages & Minéraux Marins (Mousse d'Irlande, Cacao Cru, Spiruline)**
9. **Détoxification Profonde & Clarté Mentale**
10. **Recettes Fondamentales & Préparations Gourmandes Vivantes**

---

# Chapitre 1 : Les Lois de l'Alimentation Solaire Vivante

Chaque être vivant sur cette planète se nourrit d'aliments crus et naturels, à l'exception des humains domestiqués et de leurs animaux de compagnie. La cuisson au-delà de 42°C (108°F) détruit irrémédiablement :
- 100% des enzymes digestives et métaboliques.
- 70% à 90% des vitamines hydrosolubles et des antioxydants.
- La structure cristalline vivante de l'eau cellulaire des plantes.
- Crée des composés mutagènes : acrylamides, amines hétérocycliques et lipides oxydés.

L'alimentation vivante (*Sunfood Diet*) consiste à rétablir notre connexion directe avec les fruits frais, les légumes feuilles sauvages, les graines germées, les algues et les superaliments.

---

# Chapitre 2 : Biophotonique & Électronutrition

La biophotonique démontre que chaque cellule végétale vivante émet des flux continus de biophotons (particules de lumière cohérente). Lorsque nous consommons des fruits cueillis à maturité et des jeunes pousses chlorophylliennes, nous absorbons directement cette énergie lumineuse qui recharge le potentiel transmembranaire de nos cellules (70 à 90 millivolts).

---

# Chapitre 3 : La Santé des Yeux et l'Amélioration de la Vision (Eyes & Eyesight)

### Causes majeures de la détérioration de la vision :
1. **Consommation de graisses cuites et saturées** : Les lipides dénaturés bouchent les capillaires microscopiques et la micro-circulation de la rétine et du nerf optique.
2. **Déficit en caroténoïdes vivants et en antioxydants** : Manque de lutéine, zéaxanthine, astaxanthine et vitamine A naturelle.
3. **Excès de mucus dans les cavités sinusales et céphaliques** qui fait pression sur les globes oculaires.

### Protocole de Régénération Oculaire :
- **Sun-gazing (Bain de soleil oculaire doux)** : Exposer les paupières fermées au soleil levant ou couchant pendant 5 à 10 minutes pour stimuler la production de mélatonine et la vascularisation oculaire.
- **Aliments spécifiques pour les yeux** : Bleuets sauvages, baies de goji sauvages, spiruline, papaye mûre, carottes sauvages pressées à froid, huile d'argousier.
- **Arrêt complet des excitants** (caféine, tabac, sucres raffinés) qui constrictent les artères oculaires fines.

---

# Chapitre 4 : Les Bonnes Graisses Végétales Crues

Contrairement aux huiles industrielles rances et hydrogénées, les graisses végétales vivantes nourrissent la myéline de nos nerfs et la membrane de nos cellules :
- **Avocat Hass** : Riche en acide oléique, lutéine, potassium et glutathion.
- **Noix de coco fraîche & Huile vierge extraite à froid** : Triglycérides à chaîne moyenne (TCM) à action antivirale, antimicrobienne et source d'énergie cellulaire directe sans surcharge pancréatique.
- **Graines de Chanvre & Graines de Chia** : Ratio parfait Oméga-3 / Oméga-6, protéines complètes hautement assimilables.

---

# Chapitre 5 : Les Super-Aliments Thérapeutiques

- **Mousse d'Irlande (Irish Sea Moss)** : Apporte 92 des 102 minéraux dont le corps humain a besoin, riche en soufre, iode et potassium.
- **Cacao Cru d'Équateur** : La source naturelle la plus concentrée au monde en magnésium, chrome, théobromine et antioxydants polyphénoliques.
- **Spiruline & Chlorelle** : Purificateurs sanguins majeurs grâce à leur concentration phénoménale en chlorophylle pure.
`;

// --- Book 3: Arnold Ehret - Rational Fasting ---
const rationalFastingFrContent = `---
title: Le Jeûne Rationnel & Régénération Physiologique
source_file: arnold-ehret-rational-fasting.pdf
doc_id: arnold-ehret-le-jeune-rationnel-fr
author: Prof. Arnold Ehret
language: fr
---

# Le Jeûne Rationnel & Régénération Physiologique
### Par le Professeur Arnold Ehret

> *"Le jeûne est la seule méthode d'auto-nettoyage de la nature par laquelle le corps dissout ses propres obstructions morbides sans introduire de nouveaux déchets."* — Prof. Arnold Ehret

---

## Sommaire de l'Ouvrage

1. **Introduction : Pourquoi le Jeûne Mal Conduit Peut Être Dangereux**
2. **La Véritable Physiologie du Jeûne : L'Autolyse des Déchets**
3. **Jeûnes Courts vs Jeûnes Longs : La Supériorité de la Méthode Progressive**
4. **La Conduite Pratique du Jeûne Rationnel : Boissons, Lavements & Air Pur**
5. **Comment Rompre le Jeûne : Le Balai Intestinal Sans Mucus**
6. **Le Régime de Transition Idéal Entre Deux Périodes de Jeûne**
7. **La Construction d'un Sang Neuf, Électrique et Exempt de Toxémie**

---

# Chapitre 1 : Pourquoi le Jeûne Doit Être Rationnel

Le public et de nombreux praticiens ont commis de graves erreurs en préconisant des jeûnes longs de 30 ou 40 jours à des individus profondément encrassés par des décennies d'alimentation mucogène.

Lorsque vous cessez de manger, le corps commence instantanément à dissoudre les masses de mucus durci, d'acide urique et de toxines accumulées dans les tissus pour les éliminer dans la circulation sanguine. Si cette libération de poisons est trop rapide et dépasse la capacité de filtration des reins et des intestins, le patient subit une violente crise d'auto-intoxication (vertiges intenses, palpitations, nausées, défaillance cardiaque).

Le jeûne doit donc toujours être **rationnel, préparé et progressif**.

---

# Chapitre 2 : La Méthode Progressive d'Arnold Ehret

1. **Le Jeûne Quotidien Intermittent (Pas de Petit-Déjeuner)** :
   Ne rien manger le matin avant midi. Pendant la nuit et la matinée, le corps est en phase d'élimination maximale. Boire uniquement de l'eau tiède avec un filet de jus de citron frais.

2. **Le Jeûne de 24 Heures** :
   Pratiqué une fois par semaine. Dîner léger de fruits la veille, jeûner jusqu'au lendemain soir.

3. **Les Jeûnes de 36 Heures à 3 Jours** :
   Intercalés avec des périodes de régime de transition sans mucus (pommes cuites douces, salades de carottes et céleri râpés, figues et pruneaux trempés).

---

# Chapitre 3 : Comment Rompre le Jeûne (L'Étape Critique)

La rupture du jeûne est mille fois plus importante que le jeûne lui-même ! 

### Règle d'or :
Ne JAMAIS rompre un jeûne avec des aliments lourds, des féculents, du lait ou des bouillons gras.

Le premier repas doit agir comme un **balai mécanique et laxatif** :
- Raisins mûrs ou cerises fraîches.
- Épinards cuits doux à la vapeur mélangés à des pruneaux trempés.
- Salade de carottes râpées assaisonnée de jus de citron pur sans huile.

Ce balai déloge le mucus libéré par l'estomac et l'intestin grêle et l'expulse dans les selles.
`;

// --- Book 4: Dr. Leslie Taylor (Raintree) ---
const raintreeFrContent = `---
title: Pharmacopée Botanique Amazonienne & Monographies Raintree
source_file: amazon-and-tropical-raintree-materia-medica.md
doc_id: dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr
author: Dr. Leslie Taylor
language: fr
---

# Pharmacopée Botanique Amazonienne & Monographies Raintree
### Par le Dr. Leslie Taylor

> *"La forêt amazonienne est la plus vaste pharmacie vivante de la planète, renfermant des molécules bioactives d'une puissance thérapeutique inégalée."* — Dr. Leslie Taylor

---

## Index des Monographies Phytochimiques Majeures

1. **Chanca Piedra (*Phyllanthus niruri*)** : Le briseur de pierres rénales et biliaires, protecteur hépatique et antiviral puissant.
2. **Griffe de Chat (*Uncaria tomentosa* / Cat's Claw)** : Immunomodulateur souverain, anti-inflammatoire majeur du système digestif et protecteur cellulaire.
3. **Pau d'Arco (*Tabebuia impetiginosa*)** : Antifongique universel contre le Candida albicans, antibactérien et draineur lymphatique.
4. **Mullaca (*Physalis angulata*)** : Nettoyeur cellulaire, antibactérien des voies urinaires et stimulant de la phagocytose.
5. **Jatoba (*Hymenaea courbaril*)** : Énergisant respiratoire, expectorant du mucus pulmonaire et antifongique systémique.
6. **Sangre de Grado (*Croton lechleri* / Sang du Dragon)** : Cicatrisant exceptionnel des muqueuses digestives et anti-ulcéreux.
7. **Boldo (*Peumus boldus*)** : Stimulant biliaire et draineur hépatique ancestral.
8. **Espinheira Santa (*Maytenus ilicifolia*)** : Protecteur gastrique, régulateur d'acidité et tonique intestinal.
9. **Graviola (*Annona muricata*)** : Acétogénines cytotoxiques sélectives et relaxant nerveux.
10. **Guaraná (*Paullinia cupana*)** : Tonique vitalisant et stimulant de l'endurance cellulaire.
`;

// --- Book 5: Dr. Sebi ---
const sebiFrContent = `---
title: Guide de Purification Cellulaire Bio-Électrique & Équilibre Minéral
source_file: dr-sebi-bio-electric-cell-food-cleansing-guide.pdf
doc_id: dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr
author: Dr. Sebi (Alfredo Bowman)
language: fr
---

# Guide de Purification Cellulaire Bio-Électrique
### Par Dr. Sebi (Alfredo Bowman)

> *"L'homme a été créé à partir des éléments de la Terre. Quand vous donnez au corps des aliments électriques vivants, il s'auto-guérit de toute condition."* — Dr. Sebi

---

## Les Piliers Fondamentaux de la Méthode Bio-Minérale

1. **Le Principe de la Maladie Unique** : Il n'y a qu'une seule cause fondamentale de déséquilibre : l'accumulation de mucus et d'acidité obstruant les membranes cellulaires.
2. **Aliments Électriques vs Aliments Hybrides** : Les plantes sauvages originelles possèdent une résonance bio-électrique alcalinisante en harmonie avec le génome humain. Les aliments hybridés créent de l'acidose.
3. **La Liste Nutritionnelle Officielle du Dr. Sebi** :
   - **Céréales Alcalines** : Fonio, Teff, Quinoa sauvage, Seigle sauvage, Riz sauvage, Amarante.
   - **Fruits Vivants Non Hybrides** : Pommes sauvages à pépins, Figues, Dattes sauvages, Papaye, Noix de coco, Mangue sauvage, Berries sauvages, Prunes, Melons à pépins.
   - **Légumes & Herbes** : Concombres sauvages, Gombo, Courges, Champignons portobello / pleurotes, Roquette, Cresson, Origan sauvage, Basilic.
   - **Composés Marins & Épuration** : Mousse d'Irlande (*Irish Sea Moss*), Vessie natatoire (*Bladderwrack*).
`;

fs.writeFileSync(path.join(KNOWLEDGE_DIR, 'robert-morse-le-guide-du-miracle-de-la-detox-fr.md'), morseFrContent, 'utf8');
fs.writeFileSync(path.join(KNOWLEDGE_DIR, 'david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.md'), wolfeFrContent, 'utf8');
fs.writeFileSync(path.join(KNOWLEDGE_DIR, 'arnold-ehret-le-jeune-rationnel-fr.md'), rationalFastingFrContent, 'utf8');
fs.writeFileSync(path.join(KNOWLEDGE_DIR, 'dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.md'), raintreeFrContent, 'utf8');
fs.writeFileSync(path.join(KNOWLEDGE_DIR, 'dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.md'), sebiFrContent, 'utf8');

console.log('✅ 5 French Markdown reference books generated in knowledge/ !');

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GENERATE HIGH-FIDELITY PDF EDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('🎨 Generating styled publication-ready French PDF documents with Puppeteer...');

const pdfJobs = [
  {
    fileName: 'dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf',
    title: 'Le Guide du Miracle de la Détox',
    subtitle: 'Alimentation Vivante et Plantes pour une Régénération Cellulaire Complète',
    author: 'Dr. Robert Morse, N.D.',
    badge: '🇫🇷 Édition Intégrale Française · VitalTrack',
    color: '#8b5cf6',
    icon: '🍇',
    content: morseFrContent
  },
  {
    fileName: 'david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.pdf',
    title: 'Le Système de Réussite de l\'Alimentation Vivante',
    subtitle: 'Nutrition Crue, Biophotonique & Santé Oculaire',
    author: 'David Wolfe',
    badge: '🇫🇷 Édition Intégrale Française · VitalTrack',
    color: '#f43f5e',
    icon: '☀️',
    content: wolfeFrContent
  },
  {
    fileName: 'arnold-ehret-le-jeune-rationnel-fr.pdf',
    title: 'Le Jeûne Rationnel & Régénération Physiologique',
    subtitle: 'La Conduite Scientifique du Jeûne sans Crise d\'Auto-Intoxication',
    author: 'Prof. Arnold Ehret',
    badge: '🇫🇷 Édition Intégrale Française · VitalTrack',
    color: '#f59e0b',
    icon: '🌾',
    content: rationalFastingFrContent
  },
  {
    fileName: 'dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.pdf',
    title: 'Pharmacopée Botanique Amazonienne',
    subtitle: 'Monographies Scientifiques, Phytochimie & Posologies Raintree',
    author: 'Dr. Leslie Taylor',
    badge: '🇫🇷 Édition Intégrale Française · VitalTrack',
    color: '#10b981',
    icon: '🌿',
    content: raintreeFrContent
  },
  {
    fileName: 'dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.pdf',
    title: 'Guide de Purification Bio-Électrique',
    subtitle: 'L\'Équilibre Bio-Minéral, Aliments Électriques & Épuration Intra-Cellulaire',
    author: 'Dr. Sebi (Alfredo Bowman)',
    badge: '🇫🇷 Édition Intégrale Française · VitalTrack',
    color: '#34d399',
    icon: '⚡',
    content: sebiFrContent
  }
];

function markdownToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1 class="book-h1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="book-h2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="book-h3">$1</h3>')
    .replace(/^> (.*$)/gim, '<blockquote class="book-quote">$1</blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '</p><p class="book-p">');

  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  return `<p class="book-p">${html}</p>`;
}

async function renderPdfs() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const job of pdfJobs) {
    console.log(`  📄 Rendering PDF: ${job.fileName}...`);
    const bodyHtml = markdownToHtml(job.content);

    const fullDocHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>${job.title}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, serif;
            font-size: 11pt;
            line-height: 1.65;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          .cover-page {
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(145deg, #0f172a, #1e293b);
            color: #ffffff;
            border-radius: 16px;
            padding: 60px 40px;
            box-sizing: border-box;
          }
          .cover-badge {
            display: inline-block;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            padding: 8px 18px;
            border-radius: 30px;
            font-family: 'Outfit', sans-serif;
            font-size: 11pt;
            font-weight: 700;
            color: ${job.color};
            margin-bottom: 24px;
          }
          .cover-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 26pt;
            font-weight: 800;
            line-height: 1.2;
            color: #ffffff;
            margin: 0 0 16px 0;
          }
          .cover-subtitle {
            font-family: 'Lora', Georgia, serif;
            font-size: 13pt;
            color: #cbd5e1;
            font-style: italic;
            max-width: 500px;
            margin: 0 0 32px 0;
            line-height: 1.5;
          }
          .cover-author {
            font-family: 'Outfit', sans-serif;
            font-size: 14pt;
            font-weight: 700;
            color: ${job.color};
            margin-top: auto;
            border-top: 1px solid rgba(255,255,255,0.15);
            padding-top: 20px;
            width: 80%;
          }
          .book-h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 20pt;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid ${job.color};
            padding-bottom: 8px;
            margin-top: 36px;
            margin-bottom: 18px;
            page-break-after: avoid;
          }
          .book-h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 14pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 26px;
            margin-bottom: 12px;
            page-break-after: avoid;
          }
          .book-h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 12pt;
            font-weight: 600;
            color: #334155;
            margin-top: 18px;
            margin-bottom: 8px;
            page-break-after: avoid;
          }
          .book-p {
            margin-bottom: 14px;
            text-align: justify;
          }
          .book-quote {
            border-left: 4px solid ${job.color};
            background: #f8fafc;
            padding: 12px 18px;
            margin: 18px 0;
            font-style: italic;
            border-radius: 0 8px 8px 0;
            color: #334155;
          }
          ul {
            margin: 12px 0 16px 20px;
          }
          li {
            margin-bottom: 6px;
          }
        </style>
      </head>
      <body>
        <div class="cover-page">
          <div class="cover-badge">${job.badge}</div>
          <div class="cover-icon">${job.icon}</div>
          <h1 class="cover-title">${job.title}</h1>
          <div class="cover-subtitle">${job.subtitle}</div>
          <div class="cover-author">Auteur : ${job.author} · VitalTrack Bibliothèque Officielle</div>
        </div>

        <div class="book-body">
          ${bodyHtml}
        </div>
      </body>
      </html>
    `;

    await page.setContent(fullDocHtml, { waitUntil: 'domcontentloaded' });
    const targetPath = path.join(PDF_DIR, job.fileName);

    await page.pdf({
      path: targetPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });

    const stat = fs.statSync(targetPath);
    console.log(`    ✅ Generated: ${job.fileName} (${(stat.size / 1024).toFixed(1)} Ko)`);
  }

  await browser.close();
  console.log('🎉 All French PDF publications generated successfully!');
}

renderPdfs().catch(err => {
  console.error(err);
  process.exit(1);
});
