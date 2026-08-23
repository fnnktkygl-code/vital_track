/**
 * PRAL (Potential Renal Acid Load) Calculation Engine
 * Reference: Remer T, Manz F. Potential renal acid load of foods and its influence on urine pH.
 * Formula: PRAL = 0.49 * Protein(g) + 0.037 * P(mg) - 0.021 * K(mg) - 0.026 * Mg(mg) - 0.013 * Ca(mg)
 */

export interface MineralBreakdown {
  proteinGrams: number;
  phosphorusMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  calciumMg: number;
}

export function calculatePRAL(minerals: MineralBreakdown): number {
  const { proteinGrams, phosphorusMg, potassiumMg, magnesiumMg, calciumMg } = minerals;
  
  const acidComponent = (0.49 * proteinGrams) + (0.037 * phosphorusMg);
  const baseComponent = (0.021 * potassiumMg) + (0.026 * magnesiumMg) + (0.013 * calciumMg);
  
  const score = acidComponent - baseComponent;
  return Math.round(score * 10) / 10;
}

export function getPralCategory(pral: number): {
  category: 'ultra-alkalizing' | 'alkalizing' | 'neutral' | 'acidifying' | 'ultra-acidifying';
  label: string;
  color: string;
} {
  if (pral <= -10) {
    return { category: 'ultra-alkalizing', label: 'Hautement Alcalinisant', color: '#10B981' };
  } else if (pral < -0.5) {
    return { category: 'alkalizing', label: 'Alcalinisant', color: '#34D399' };
  } else if (pral >= -0.5 && pral <= 0.5) {
    return { category: 'neutral', label: 'Neutre', color: '#94A3B8' };
  } else if (pral <= 10) {
    return { category: 'acidifying', label: 'Acidifiant', color: '#F59E0B' };
  } else {
    return { category: 'ultra-acidifying', label: 'Hautement Acidifiant', color: '#EF4444' };
  }
}
