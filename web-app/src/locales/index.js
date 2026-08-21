// ═══════════════════════════════════════════════════════════════════════════════
// VITALTRACK CENTRAL LOCALES EXPORT & TAXONOMY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

import fr from './fr.js';
import en from './en.js';
import es from './es.js';
import frCA from './fr-CA.js';

export const SUPPORTED_LANGS = ['fr', 'fr-CA', 'en', 'es'];

export const LANG_CONFIG = {
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  'fr-CA': { code: 'fr-CA', name: 'Français (Québec)', flag: '⚜️', short: 'FR-CA' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸', short: 'ES' }
};

export const TRANSLATIONS = {
  fr,
  'fr-CA': frCA,
  en,
  es
};

export const TAXONOMY = {
  biochemicalStatus: {
    ELECTRIC: {
      id: 'ELECTRIC',
      fr: { name: 'Électrique', badge: '⚡ Électrique', desc: 'Sauvage, non hybridé, alcalinisant, haute vitalité biophotonique' },
      'fr-CA': { name: 'Électrique', badge: '⚡ Électrique', desc: 'Sauvage, non hybridé, alcalinisant, haute vitalité biophotonique' },
      en: { name: 'Electric', badge: '⚡ Electric', desc: 'Wild, non-hybrid, highly alkalizing, rich in biophotons' },
      es: { name: 'Eléctrico', badge: '⚡ Eléctrico', desc: 'Silvestre, no hibridado, alcalinizante, alta vitalidad biofotónica' }
    },
    LIVING: {
      id: 'LIVING',
      fr: { name: 'Vivant & Cru', badge: '🌱 Vivant', desc: 'Cru, frais, riche en eau vivante et enzymes digestives' },
      'fr-CA': { name: 'Vivant & Cru', badge: '🌱 Vivant', desc: 'Cru, frais, riche en eau structurée et enzymes actives' },
      en: { name: 'Living & Raw', badge: '🌱 Living', desc: 'Raw, fresh, rich in structured water and living enzymes' },
      es: { name: 'Vivo y Crudo', badge: '🌱 Vivo', desc: 'Crudo, fresco, rico en agua estructurada y enzimas vivas' }
    },
    TRANSITION: {
      id: 'TRANSITION',
      fr: { name: 'Transition douce', badge: '🌿 Transition', desc: 'Faible en mucus, cuit doux à la vapeur, digestion légère' },
      'fr-CA': { name: 'Transition douce', badge: '🌿 Transition', desc: 'Faible en mucus, cuit doux à la vapeur, digestion légère' },
      en: { name: 'Mild Transition', badge: '🌿 Transition', desc: 'Low-mucus, gently steamed, easy on the digestive tract' },
      es: { name: 'Transición suave', badge: '🌿 Transición', desc: 'Bajo en moco, cocido suave al vapor, digestión ligera' }
    },
    MUCOID: {
      id: 'MUCOID',
      fr: { name: 'Mucogène / Acidifiant', badge: '⚠️ Mucogène', desc: 'Formateur de mucus intestinal, engorge la lymphe et les reins' },
      'fr-CA': { name: 'Mucogène / Acidifiant', badge: '⚠️ Mucogène', desc: 'Formateur de mucus intestinal, engorge la lymphe et les reins' },
      en: { name: 'Mucoid / Acidifying', badge: '⚠️ Mucoid', desc: 'Mucus-forming, clogs lymphatic channels and kidneys' },
      es: { name: 'Mucógeno / Acidificante', badge: '⚠️ Mucógeno', desc: 'Generador de moco intestinal, congestiona la linfa y los riñones' }
    },
    TOXIC: {
      id: 'TOXIC',
      fr: { name: 'Ultra-transformé / Dénaturé', badge: '⛔ Dénaturé', desc: 'Additifs, huiles hydrogénées, raffinage industriel agressif' },
      'fr-CA': { name: 'Ultra-transformé / Dénaturé', badge: '⛔ Dénaturé', desc: 'Additifs, gras trans, raffinage industriel agressif' },
      en: { name: 'Ultra-processed / Toxic', badge: '⛔ Toxic', desc: 'Additives, trans fats, aggressive industrial refining' },
      es: { name: 'Ultraprocesado / Desnaturalizado', badge: '⛔ Desnaturalizado', desc: 'Aditivos, grasas trans, refinamiento industrial agresivo' }
    }
  },

  emunctories: {
    KIDNEYS: {
      id: 'KIDNEYS',
      fr: { name: 'Reins & Vessie', action: 'Filtration acide & élimination des urates' },
      'fr-CA': { name: 'Reins & Vessie', action: 'Filtration acide & élimination des urates' },
      en: { name: 'Kidneys & Bladder', action: 'Acid filtration & urate elimination' },
      es: { name: 'Riñones y Vejiga', action: 'Filtración ácida y eliminación de uratos' }
    },
    LIVER: {
      id: 'LIVER',
      fr: { name: 'Foie & Vésicule', action: 'Détoxification métabolique & sels biliaires' },
      'fr-CA': { name: 'Foie & Vésicule', action: 'Détoxification métabolique & sels biliaires' },
      en: { name: 'Liver & Gallbladder', action: 'Metabolic detox & bile salts flow' },
      es: { name: 'Hígado y Vesícula', action: 'Desintoxicación métabolica y flujo biliar' }
    },
    LYMPH: {
      id: 'LYMPH',
      fr: { name: 'Système Lymphatique', action: 'Drainage interstitiel & assainissement cellulaire' },
      'fr-CA': { name: 'Système Lymphatique', action: 'Drainage interstitiel & assainissement cellulaire' },
      en: { name: 'Lymphatic System', action: 'Interstitial drainage & cellular cleansing' },
      es: { name: 'Sistema Linfático', action: 'Drenaje intersticial y purificación celular' }
    },
    BOWELS: {
      id: 'BOWELS',
      fr: { name: 'Intestins & Côlon', action: 'Péristaltisme, expulsion des déchets incrustés' },
      'fr-CA': { name: 'Intestins & Côlon', action: 'Péristaltisme, expulsion des déchets incrustés' },
      en: { name: 'Intestines & Colon', action: 'Peristalsis, mucoid plaque expulsion' },
      es: { name: 'Intestinos y Colon', action: 'Peristaltismo, expulsión de placa mucoide' }
    },
    SKIN_LUNGS: {
      id: 'SKIN_LUNGS',
      fr: { name: 'Peau & Poumons', action: 'Transpiration, expectoration & élimination volatile' },
      'fr-CA': { name: 'Peau & Poumons', action: 'Transpiration, expectoration & élimination volatile' },
      en: { name: 'Skin & Lungs', action: 'Sweat, expectoration & volatile gas release' },
      es: { name: 'Piel y Pulmones', action: 'Transpiración, expectoración y eliminación volátil' }
    }
  },

  fastingProtocols: {
    intermittent: {
      fr: { name: 'Intermittent 16:8', desc: '16h de jeûne quotidien / 8h de repas' },
      'fr-CA': { name: 'Intermittent 16:8', desc: '16h de jeûne quotidien / 8h de repas' },
      en: { name: 'Intermittent 16:8', desc: '16h daily fasting / 8h eating window' },
      es: { name: 'Intermitente 16:8', desc: '16h de ayuno diario / 8h de ventana de comida' }
    },
    warrior: {
      fr: { name: 'Warrior 20:4', desc: '20h de jeûne / 4h de repas le soir' },
      'fr-CA': { name: 'Guerrier 20:4', desc: '20h de jeûne / 4h de repas au souper' },
      en: { name: 'Warrior 20:4', desc: '20h fasting / 4h evening meal window' },
      es: { name: 'Guerrero 20:4', desc: '20h de ayuno / 4h de comida por la noche' }
    },
    waterFast: {
      fr: { name: 'Hydrique 24h', desc: 'Eau de source pure avec ou sans citron' },
      'fr-CA': { name: 'Hydrique 24h', desc: 'Eau de source pure avec ou sans citron' },
      en: { name: '24h Water Fast', desc: 'Pure spring water with or without lemon' },
      es: { name: 'Hídrico 24h', desc: 'Agua de manantial pura con o sin limón' }
    },
    juiceFast: {
      fr: { name: 'Cure de Jus 3j', desc: 'Jus de légumes verts et fruits à l\'extracteur' },
      'fr-CA': { name: 'Cure de Jus 3j', desc: 'Jus de légumes verts et fruits pressés à froid' },
      en: { name: '3-Day Juice Cleanse', desc: 'Cold-pressed green and fruit juices' },
      es: { name: 'Cura de Jugos 3d', desc: 'Jugos verdes y de frutas prensados en frío' }
    },
    fruitFast: {
      fr: { name: 'Jeûne aux Fruits 48h', desc: 'Mono-diète ou fruits aqueux astringents' },
      'fr-CA': { name: 'Jeûne aux Fruits 48h (Bleuets/Agrumes)', desc: 'Mono-diète ou petits fruits boréaux aqueux' },
      en: { name: '48h Fruit Feast', desc: 'Mono-fruit or astringent aqueous fruits' },
      es: { name: 'Ayuno de Frutas 48h', desc: 'Monodieta o frutas acuosas astringentes' }
    },
    grapeCure: {
      fr: { name: 'Cure de Raisins', desc: '3 jours de raisins noirs bio (Dr. Morse)' },
      'fr-CA': { name: 'Cure de Raisins', desc: '3 jours de raisins noirs bio (Dr. Morse)' },
      en: { name: 'Grape Cure', desc: '3 days of organic black seeded grapes (Dr. Morse)' },
      es: { name: 'Cura de Uvas', desc: '3 días de uvas negras orgánicas con semillas' }
    },
    drySunFast: {
      fr: { name: 'Jeûne Sec 16h', desc: 'Abstention complète eau & nourriture au repos' },
      'fr-CA': { name: 'Jeûne Sec 16h', desc: 'Abstention complète eau & nourriture au repos' },
      en: { name: '16h Dry Fast', desc: 'Zero water or food during rest period' },
      es: { name: 'Ayuno Seco 16h', desc: 'Abstención completa de agua y alimento en reposo' }
    }
  }
};
