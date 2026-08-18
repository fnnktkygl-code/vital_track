# ARCHITECTURE DU RÉSERVOIR UNIVERSEL DE DONNÉES ALIMENTAIRES ET BOTANIQUES MONDIALES
*Conception Systémique pour l'Agrégation Nutritionnelle, Phytochimique et Vitaliste dans VitalTrack*

---

## 1. Vue d'Ensemble & Problématique Fondamentale

La construction d'une encyclopédie universelle des aliments et des plantes médicinales exige de surmonter la dichotomie structurelle des données alimentaires mondiales :

```
                               ┌───────────────────────────────────────────────────────────┐
                               │       L'UNIVERS ALIMENTAIRE & BOTANIQUE MONDIAL           │
                               └─────────────────────────────┬─────────────────────────────┘
                                                             │
                   ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                   ▼                                                                                   ▼
┌──────────────────────────────────────────────────┐                                ┌──────────────────────────────────────────────────┐
│      1. ALIMENTS BRUTS, SAUVAGES & BOTANIQUE     │                                │      2. PRODUITS TRANSFORMÉS DE MARQUE COMMERCE  │
│          (Sciences de la Nutrition / RAG)        │                                │           (Codes-Barres / Grande Distribution)   │
├──────────────────────────────────────────────────┤                                ├──────────────────────────────────────────────────┤
│ • Composition biochimique fondamentale           │                                │ • Codes-barres GTIN / EAN-13 / UPC               │
│ • Minéralogramme complet (K, Mg, Ca, P, Na, Fe)  │                                │ • Listes d'ingrédients & additifs (E-numbers)    │
│ • Profils phytochimiques & métabolites secondair.│                                │ • Classification NOVA (degrés de transformation) │
│ • Indices PRAL, ORAC, Vitamine C native          │                                │ • Données déclaratives industrielles (Nutri-Score)│
│ • Sources : USDA, FCEN, CIQUAL, FAO, Raintree    │                                │ • Sources : Open Food Facts, GS1 GDSN, APIs EAN  │
└──────────────────────────┬───────────────────────┘                                └──────────────────────────┬───────────────────────┘
                           │                                                                                   │
                           └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                                     │
                                                                     ▼
                                       ┌───────────────────────────────────────────────────────────┐
                                       │        SCHÉMA CANONIQUE UNIFIÉ (VITALTRACK LAKE)          │
                                       │     Canonical Food & Botanical Knowledge Entity           │
                                       └───────────────────────────────────────────────────────────┘
```

---

## 2. Cartographie des Grandes Bases de Données Officielles Mondiales

### 2.1 Aliments Génériques et Bruts (Sciences & Santé Publique)

1. **USDA FoodData Central (États-Unis)** :
   - *URL* : `https://fdc.nal.usda.gov/`
   - *Composantes* : Foundation Foods (analyses de laboratoire ultra-précises), SR Legacy (Standard Reference, 8 700+ aliments), FNDDS (études d'enquêtes alimentaires).
   - *Force* : Teneurs complètes en acides aminés soufrés (Cys, Met), minéraux exacts, acides gras fractionnés, standard international de référence.

2. **Fichier Canadien sur les Éléments Nutritifs (FCEN / CNF - Santé Canada)** :
   - *URL* : `https://food-nutrition.canada.ca/cnf-fce/`
   - *Aliments* : ~5 800 aliments consommés au Canada, incluant les gibiers boréaux, baies sauvages, produits d'érable et aliments autochtones.
   - *Force* : Bilingue FR/EN, calibré pour les spécificités d'approvisionnement et d'enrichissement réglementaire canadiens.

3. **Table CIQUAL (ANSES - France & Union Européenne)** :
   - *URL* : `https://ciqual.anses.fr/`
   - *Aliments* : ~3 200 aliments représentatifs de la consommation française et méditerranéenne.
   - *Force* : Précision sur les fibres alimentaires, polyphénols, profils lipidiques et sucres simples.

4. **FAO / INFOODS (Organisation des Nations Unies pour l'Alimentation et l'Agriculture)** :
   - *URL* : `https://www.fao.org/infoods/`
   - *Bases régionales* :
     - **WAFOODS** : Table de composition des aliments d'Afrique de l'Ouest (baobab, moringa, fonio, ditakh, néré).
     - **LATINFOODS** : Tables régionales d'Amérique Latine (fruits amazoniens, tubercules andins).
     - **ASEANFOODS** : Tables d'Asie du Sud-Est.
   - *Force* : Échantillonnage in situ des plantes de cueillette, espèces orphelines et aliments ancestraux non hybridés.

5. **Raintree Tropical Plant Database (Dr. Leslie Taylor)** :
   - *URL* : `https://www.rain-tree.com/`
   - *Contenu* : 100+ monographies phytochimiques et pharmacologiques de plantes amazoniennes (Chanca Piedra, Griffe de Chat, Pau d'Arco, Camu-Camu, Jatoba, Espinheira Santa, etc.).
   - *Force* : Constituants actifs, usages traditionnels indigènes, études cliniques PubMed indexées, posologies réelles.

---

### 2.2 Produits Transformés & Commerciaux (Codes-Barres et Marques)

1. **Open Food Facts (Base Mondiale Ouverte)** :
   - *URL* : `https://world.openfoodfacts.org/`
   - *Volume* : Plus de 3 millions de produits avec codes-barres GTIN/EAN dans 150 pays.
   - *Données clés* : Nom de marque, ingrédients, allergènes, additifs, groupe NOVA (1 à 4), Eco-Score, Nutri-Score.
   - *Accès* : API REST & JSON dump quotidien compressé (~8 Go).

2. **GS1 Global Data Synchronization Network (GDSN)** :
   - Le standard industriel officiel reliant les industriels et distributeurs pour l'échange de données produits certifiées.

---

## 3. Schéma Canonique Unifié VitalTrack (*Unified Food & Botanical Entity*)

Pour fusionner ces univers sans perte d'information, chaque aliment ou plante est instancié selon le format canonique suivant :

```json
{
  "id": "food_botanical_myrciaria_dubia_01",
  "canonical_name": "Camu-Camu",
  "latin_name": "Myrciaria dubia",
  "family": "Myrtaceae",
  "origin_region": "neotropical_amazon",
  "categories": ["wild_fruit", "superfood", "medicinal_plant"],
  "identifiers": {
    "usda_fdc_id": null,
    "cnf_id": null,
    "ciqual_id": null,
    "raintree_id": "camu-camu",
    "barcodes": []
  },
  "proximate_per_100g": {
    "water_g": 94.1,
    "energy_kcal": 17.0,
    "protein_g": 0.4,
    "lipids_g": 0.2,
    "carbohydrates_g": 4.7,
    "fiber_g": 0.6
  },
  "electrolytes_minerals_mg_100g": {
    "potassium_k": 71.0,
    "magnesium_mg": 12.4,
    "calcium_ca": 15.7,
    "phosphorus_p": 8.4,
    "sodium_na": 4.0,
    "iron_fe": 0.53
  },
  "vitalist_metrics": {
    "pral_score": -1.24,
    "pral_category": "highly_alkalizing",
    "orac_value": 120000,
    "native_vitamin_c_mg": 2400.0,
    "mucus_forming_score": 0,
    "mucus_category": "solvent_astringent",
    "water_structure_phase": "exclusion_zone_rich"
  },
  "phytochemical_profile": {
    "dominant_compounds": [
      "cyanidin-3-glucoside",
      "ellagitannins",
      "quercetin",
      "ferulic_acid"
    ],
    "organ_tropisms": ["immune_system", "kidney_filtration", "collagen_synthesis", "capillary_endothelium"],
    "target_emonctories": ["kidneys", "lymph"]
  },
  "botanical_preparations": [
    {
      "type": "fresh_pulp",
      "dosage": "50g to 100g daily in smoothies"
    },
    {
      "type": "freeze_dried_raw_powder",
      "dosage": "2g to 5g (1/2 to 1 tsp) daily",
      "native_vit_c_delivered_mg": 300
    }
  ],
  "safety_and_precautions": {
    "contraindications": ["None reported at standard doses"],
    "drug_interactions": ["None documented; observe with high dose vitamin C restrictions"],
    "pregnancy_safe": true
  }
}
```

---

## 4. Pipeline d'Ingestion, de Normalisation et de Résolution d'Entités

```
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│  Open Food Facts Dumps  │   │  USDA / FCEN / CIQUAL   │   │  Raintree & Botanicals  │
│  (Barcodes & Branded)   │   │  (Analyses Laboratoire) │   │  (Phytochimie & RAG)    │
└────────────┬────────────┘   └────────────┬────────────┘   └────────────┬────────────┘
             │                             │                             │
             └──────────────────────┬──────┴─────────────────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │    NORMALISATION & SYNTAXE  │
                     │  - Nettoyage des unités     │
                     │  - Conversion mg/100g       │
                     │  - Calcul algorithmique PRAL│
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │    INDEXATION & VECTOR RAG  │
                     │  - BM25 Chunks Lexicaux     │
                     │  - Embeddings Sémantiques   │
                     │  - Lookup rapide Barcode/ID │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │  API VITALTRACK PRODUCTION  │
                     │  - /api/analyze-text        │
                     │  - /api/chat (SSE Stream)   │
                     │  - Moteur de Recommandation │
                     └─────────────────────────────┘
```

---

## 5. Utilisation dans le Moteur Intelligent VitalTrack

Grâce à cette architecture :
1. **Scannage Code-Barres** : Identifie instantanément les additifs, calcule la charge acide PRAL exacte et avertit l'utilisateur des composants ultra-transformés (amidons modifiés, caséines dénaturées).
2. **Conseil Thérapeutique & Herboristerie Raintree** : Le conseiller IA recommande les plantes amazoniennes ou sauvages adaptées à chaque déséquilibre (ex: *Chanca Piedra* pour le drainage des concrétions urinaires, *Pau d'Arco* pour l'assainissement fongique, *Detarium* ou *Camu-Camu* pour le rechargement en antioxydants natifs).
3. **Journal de Bord & Actions Immédiates** : L'utilisateur peut ajouter directement une décoction ou un repas vitaliste à son journal quotidien en un clic via les cartes interactives `actionMeal`.
