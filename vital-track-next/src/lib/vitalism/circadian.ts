/**
 * Circadian Organ Clock & Emunctory Biology (24h Vitalist Cycle)
 */

export interface CircadianSlot {
  hourStart: number;
  hourEnd: number;
  organ: string;
  emoji: string;
  phase: string;
  focusTip: string;
}

export const CIRCADIAN_SLOTS: CircadianSlot[] = [
  { hourStart: 3, hourEnd: 5, organ: 'Poumons', emoji: '🫁', phase: 'Élimination Gazeuse', focusTip: 'Aération de la chambre, respiration profonde' },
  { hourStart: 5, hourEnd: 7, organ: 'Gros Intestin (Côlon)', emoji: '🌀', phase: 'Évacuation Principale', focusTip: 'Hydratation tiède, évacuation intestinale matinale' },
  { hourStart: 7, hourEnd: 9, organ: 'Estomac', emoji: '🍵', phase: 'Assimilation Électrique', focusTip: 'Tisane vivifiante ou fruits mûrs aqueux' },
  { hourStart: 9, hourEnd: 11, organ: 'Rate & Pancréas', emoji: '⚡', phase: 'Transformation & Énergie', focusTip: 'Activité cognitive, clarté mentale' },
  { hourStart: 11, hourEnd: 13, organ: 'Cœur & Circulation', emoji: '❤️', phase: 'Flux Sanguin & Joie', focusTip: 'Repas vivant salade alcaline, calme émotionnel' },
  { hourStart: 13, hourEnd: 15, organ: 'Intestin Grêle', emoji: '🔬', phase: 'Absorption Micronutriments', focusTip: 'Marche digestive douce, repos postprandial' },
  { hourStart: 15, hourEnd: 17, organ: 'Vessie', emoji: '💧', phase: 'Drainage Liquide', focusTip: 'Boire une eau faiblement minéralisée (< 50 mg/L)' },
  { hourStart: 17, hourEnd: 19, organ: 'Reins & Filtration', emoji: '🫘', phase: 'Filtration Acido-Basique', focusTip: 'Infusion de prêle ou verge d\'or, chaleur sur les lombaires' },
  { hourStart: 19, hourEnd: 21, organ: 'Péricarde & Système Lymphatique', emoji: '🛡️', phase: 'Protection & Immunité', focusTip: 'Dîner très léger, coupure des écrans' },
  { hourStart: 21, hourEnd: 23, organ: 'Triple Réchauffeur', emoji: '🧘', phase: 'Harmonisation Thermique', focusTip: 'Cohérence cardiaque, bain chaud, sommeil' },
  { hourStart: 23, hourEnd: 1, organ: 'Vésicule Biliaire', emoji: '🌿', phase: 'Recyclage des Sels Biliaires', focusTip: 'Sommeil profond réparateur' },
  { hourStart: 1, hourEnd: 3, organ: 'Foie & Détox Hépatique', emoji: '🧪', phase: 'Régénération Sanguine & Détox', focusTip: 'Nettoyage cellulaire nocturne' },
];

export function getActiveCircadianSlot(currentHour?: number): CircadianSlot {
  const h = currentHour !== undefined ? currentHour : new Date().getHours();
  for (const slot of CIRCADIAN_SLOTS) {
    if (slot.hourStart > slot.hourEnd) {
      if (h >= slot.hourStart || h < slot.hourEnd) return slot;
    } else {
      if (h >= slot.hourStart && h < slot.hourEnd) return slot;
    }
  }
  return CIRCADIAN_SLOTS[0];
}
