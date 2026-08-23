/**
 * Fasting Physiology & Autophagy Calculator
 * 7 Biochemical & Cellular Stages
 */

export interface FastingStage {
  id: number;
  name: string;
  minHours: number;
  maxHours: number;
  emoji: string;
  description: string;
  biologicalProcesses: string[];
}

export const FASTING_STAGES: FastingStage[] = [
  {
    id: 1,
    name: 'Digestion & Stockage Glycogène',
    minHours: 0,
    maxHours: 4,
    emoji: '🍽️',
    description: 'Assimilation des nutriments et sécrétion d\'insuline.',
    biologicalProcesses: ['Hausse de la glycémie', 'Stockage du glucose hépatique', 'Repos des émonctoires en pause'],
  },
  {
    id: 2,
    name: 'Baisse de l\'Insuline & Transition Métabolique',
    minHours: 4,
    maxHours: 12,
    emoji: '📉',
    description: 'Stabilisation de l\'insuline et début de vidange du glycogène.',
    biologicalProcesses: ['Chute de l\'insuline circulante', 'Début de la lipolyse basale', 'Nettoyage des muqueuses digestives'],
  },
  {
    id: 3,
    name: 'Activation de la Lipolyse & Cétogenèse Initiale',
    minHours: 12,
    maxHours: 16,
    emoji: '🔥',
    description: 'Le corps commence à puiser dans les réserves de graisses profondes.',
    biologicalProcesses: ['Production de corps cétoniques (bêta-hydroxybutyrate)', 'Clarté mentale', 'Ménagement rénal'],
  },
  {
    id: 4,
    name: 'Déclenchement de l\'Autophagie Cellulaire',
    minHours: 16,
    maxHours: 24,
    emoji: '🧬',
    description: 'Nettoyage des protéines défectueuses et des mitochondries usées.',
    biologicalProcesses: ['Recyclage des déchets cellulaires (mTOR inhibé, AMPK activé)', 'Baisse des marqueurs inflammatoires', 'Soulagement lymphatique'],
  },
  {
    id: 5,
    name: 'Autophagie Profonde & Pic de l\'Hormone de Croissance',
    minHours: 24,
    maxHours: 48,
    emoji: '⚡',
    description: 'Régénération musculaire préservée et détoxification cellulaire intensive.',
    biologicalProcesses: ['Pic d\'hormone de croissance (+300% à +500%)', 'Apoptose des cellules sénescentes', 'Filtration rénale accrue'],
  },
  {
    id: 6,
    name: 'Régénération Immunitaire & Cellules Souches',
    minHours: 48,
    maxHours: 72,
    emoji: '🛡️',
    description: 'Renouvellement des globules blancs et activation des cellules souches hématopoïétiques.',
    biologicalProcesses: ['Destruction des vieux leucocytes', 'Prolifération des cellules souches', 'Restauration épithéliale'],
  },
  {
    id: 7,
    name: 'Régénération Profonde & Rajeunissement Tissulaire',
    minHours: 72,
    maxHours: 999,
    emoji: '✨',
    description: 'Élimination profonde des toxines incrustées et réinitialisation immunitaire complète.',
    biologicalProcesses: ['Sensibilité maximale à l\'insuline', 'Autophagie cérébrale et neuronale', 'Nettoyage interstitiel'],
  },
];

export function getCurrentFastingStage(elapsedHours: number): FastingStage {
  for (const stage of FASTING_STAGES) {
    if (elapsedHours >= stage.minHours && elapsedHours < stage.maxHours) {
      return stage;
    }
  }
  return FASTING_STAGES[FASTING_STAGES.length - 1];
}
