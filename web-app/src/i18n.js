// ═══════════════════════════════════════════════════════════════════════════════
// VITALTRACK CENTRALIZED INTERNATIONALIZATION & TAXONOMY ENGINE (i18n / l10n)
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'vitaltrack_lang';

export const SUPPORTED_LANGS = ['fr', 'fr-CA', 'en', 'es'];

export const LANG_CONFIG = {
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  'fr-CA': { code: 'fr-CA', name: 'Français (Canada)', flag: '🍁', short: 'FR-CA' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸', short: 'ES' }
};

let currentLang = localStorage.getItem(STORAGE_KEY) || 'fr';
if (!SUPPORTED_LANGS.includes(currentLang) || currentLang === 'fr-CA') {
  currentLang = 'fr';
  localStorage.setItem(STORAGE_KEY, 'fr');
}

const listeners = new Set();

// ═══════ CENTRALIZED TAXONOMIES ═══════
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
      es: { name: 'Hígado y Vesícula', action: 'Desintoxicación metabólica y flujo biliar' }
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
      fr: { name: 'Cure de Raisins', desc: '3 jours de raisins noirs (Dr. Morse)' },
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

// ═══════ UI DICTIONARIES ═══════
export const TRANSLATIONS = {
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      fasting: 'Jeûne',
      materiaMedica: 'Pharmacopée',
      scanner: 'Scanner Vital',
      breathing: 'Respiration',
      chat: 'Coach IA',
      calendar: 'Calendrier',
      resources: 'Ressources',
      settings: 'Paramètres'
    },
    bnav: {
      dashboard: 'Accueil',
      scan: 'Scan',
      chat: 'Chat',
      calendar: 'Plan',
      fasting: 'Jeûne',
      more: 'Plus'
    },
    header: {
      title: 'VitalTrack — Santé Cellulaire & Vitalisme',
      searchPlaceholder: 'Chercher un aliment, une plante...',
      langToggleTitle: 'Changer de langue',
      themeToggleTitle: 'Basculer le mode sombre/clair'
    },
    dashboard: {
      greeting: 'Bonjour',
      scoreTitle: 'Score de Vitalité Biologique',
      scoreSub: 'Équilibre PRAL, hydratation et motilité péristaltique',
      circadianTitle: 'Horloge Circadienne & Rythme Biologique',
      eliminationPhase: 'Phase d\'Élimination (4h-12h)',
      eliminationDesc: 'Drainage lymphatique, filtration rénale. Favoriser l\'eau citronnée et les fruits mûrs.',
      appropriationPhase: 'Phase d\'Appropriation (12h-20h)',
      appropriationDesc: 'Fenêtre nutritionnelle active. Priorité aux aliments vivants, salades crues et jus frais.',
      assimilationPhase: 'Phase d\'Assimilation (20h-4h)',
      assimilationDesc: 'Reconstruction cellulaire et repos digestif. Jeûne nocturne régénérateur.',
      waterCardTitle: 'Hydratation Cellulaire & Eau Vivante',
      waterAdd250: '+250 ml',
      waterAdd500: '+500 ml',
      dailyQuoteTitle: 'Pensée Vitaliste du Jour'
    },
    fasting: {
      pageTitle: 'Jeûne & Physiologie Cellulaire',
      pageSubtitle: 'Protocoles ancestraux, minuteur cellulaire et sagesse d\'Arnold Ehret & Dr. Morse',
      programsTitle: 'Programmes de Jeûne',
      programsSub: 'Sélectionnez un protocole validé pour préremplir le minuteur',
      timerTitle: 'Minuteur Vital',
      timerReady: 'PRÊT',
      timerActive: 'EN COURS',
      timerCompleted: 'TERMINÉ',
      timerGoal: 'Objectif',
      typeLabel: 'Type de protocole',
      durationLabel: 'Durée (heures)',
      startBtn: 'Démarrer le jeûne',
      stopBtn: 'Terminer le jeûne',
      safetyWarning: 'Attention : Les jeûnes de plus de 24h nécessitent une préparation préalable et un suivi adapté.',
      masterclassTitle: 'Masterclass : Rational Fasting',
      masterclassSub: 'La méthode scientifique d\'Arnold Ehret pour éliminer le mucus sans crise d\'auto-intoxication',
      expertsTitle: 'Conseils & Sagesse des Maîtres',
      expertsSub: 'Directives d\'Arnold Ehret, Dr. Robert Morse, Dr. Sebi et Wim Hof',
      historyTitle: 'Historique & Statistiques',
      totalSessions: 'Sessions totales',
      cumulatedHours: 'Heures cumulées',
      longestFast: 'Plus long',
      completionRate: 'Taux de complétion',
      noHistory: 'Aucune session de jeûne enregistrée pour le moment.'
    },
    materia: {
      pageTitle: 'Pharmacopée Raintree & Plantes Amazoniennes',
      pageSubtitle: 'Monographies botaniques, phytochimie et indications cliniques du Dr. Leslie Taylor',
      searchPlaceholder: 'Rechercher une plante, symptôme, organe (ex: calculs, reins, foie, candida)...',
      allCategory: 'Toutes les plantes',
      kidneysCategory: 'Reins & Lithiases',
      liverCategory: 'Foie & Détox',
      gutCategory: 'Intestin & Muqueuses',
      immunityCategory: 'Immunité & Antiviral',
      lungsCategory: 'Poumons & Mucus',
      vitalToneCategory: 'Vitalité & Énergie',
      viewMonograph: 'Consulter la fiche & posologie',
      expandMonograph: '📜 Dérouler la monographie scientifique & études Raintree (Dr. Leslie Taylor)',
      collapseMonograph: '🔼 Replier la monographie',
      quickBenefits: 'Bénéfices & Cibles Cliniques Prioritaires',
      posologyTitle: 'Posologie & Préparation Usuelle (Dr. Leslie Taylor)',
      contraindicationsTitle: 'Précautions & Contre-indications',
      vitalistNoteTitle: 'Note Vitaliste & Drainage Émonctoriel',
      synergiesTitle: 'Synergies Botaniques Recommandées',
      askAIBtn: 'Poser une question au Coach IA sur cette plante'
    },
    scanner: {
      pageTitle: 'Scanner Visuel & Analyse d\'Assiette IA',
      pageSubtitle: 'Prenez en photo votre repas pour identifier les ingrédients, le PRAL et la charge mucogène',
      uploadBtn: 'Prendre ou Téléverser une Photo',
      dropHint: 'Glissez une photo de repas ici ou cliquez pour choisir',
      detectiveBadge: 'Vital le Détective Nutritionnel ausculte votre plat',
      loadingTitle: 'Analyse biochimique & vitaliste en cours...',
      loadingSub: 'Identification des composés, calcul du PRAL rénal et évaluation de la charge colloïdale...',
      resultsTitle: 'Dossier d\'Analyse Vitaliste',
      addToMealsBtn: 'Ajouter ce repas au Journal'
    },
    search: {
      pageTitle: 'Recherche d\'Aliments & Base Vitaliste',
      pageSubtitle: 'Base scientifique universelle — Dr. Sebi, Arnold Ehret, Dr. Robert Morse',
      placeholder: 'Chercher un aliment (ex: mangue, fonio, avocat, bleuet)...',
      filterAll: 'Tous',
      filterElectric: '⚡ Électriques',
      filterHybrid: '🔀 Hybrides',
      filterAlkaline: '🌿 Alcalinisants',
      filterMucus: '⛔ Mucogènes',
      filterFavorites: '❤️ Favoris',
      aiBannerTitle: 'Votre aliment ou plat n\'est pas dans la liste ?',
      aiBannerSub: 'Analyser avec l\'IA VitalTrack (classification complète, PRAL & NOVA)',
      aiSearchBtn: 'Analyser IA',
      noResults: 'Aucun résultat trouvé dans la base locale.'
    },
    meals: {
      pageTitle: 'Journal Nutritionnel & Calendrier',
      addMeal: 'Ajouter un Repas',
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
      snack: 'Collation',
      dailyBalance: 'Bilan Acido-Basique Quotidien',
      alkalineRatio: 'Ratio Alcalinisant',
      noMeals: 'Aucun aliment consigné pour cette journée.'
    },
    chat: {
      welcomeTitle: 'Roucouuu ! 🌿',
      welcomeSub: 'Je suis Vital, ton coach vitaliste IA. Pose-moi une question sur la nutrition, le jeûne, les plantes ou la santé naturelle.',
      inputPlaceholder: 'Pose une question, explore un sujet santé, un repas, un protocole...',
      thinkingStatus: 'Vital inspecte la mémoire & analyse...',
      autoModel: 'Rotateur Auto',
      sendBtn: 'Envoyer'
    },
    settings: {
      title: '⚙️ Protocoles & Paramètres',
      subtitle: 'Personnalisez votre approche vitaliste et votre bio-profil',
      profileTitle: 'Bio-Profil & Contexte IA',
      profileSub: 'Utilisé par le Coach pour calibrer vos cures et tisanes',
      mascotTitle: 'Mascotte Vitale « Vital »',
      mascotActive: '🌟 Compagnon Actif',
      mascotActiveDesc: 'Conseils circadiens, nudges après repas, paliers de jeûne',
      mascotZen: '🌿 Compagnon Zen',
      mascotZenDesc: 'Présence calme, aucun pop-up spontané, réactif au clic',
      mascotQuiet: '🔇 Discret',
      mascotQuietDesc: 'Désactive tous les nudges flottants',
      screenshotTitle: 'Protection Anti-Capture d\'Écran',
      screenshotDesc: 'Masque automatiquement les données de santé lors des captures d\'écran (Désactivé par défaut)',
      screenshotToast: '📸 Capture d\'écran — Vous pouvez activer ou désactiver la protection anti-capture à tout moment dans Paramètres.',
      saveSuccess: 'Profil enregistré avec succès !'
    },
    mascot: {
      idle: "« Prêt à explorer la vitalité naturelle et drainer les acides ! »",
      walk: "« En route pour stimuler la lymphe et activer la motilité péristaltique ! 🚶 »",
      laugh: "« Hahaha ! La joie et la respiration profonde alcalinisent le terrain ! 😄 »",
      coo: "« Roucouuu ! Écoute le chant de tes cellules régénérées. 🐦 »",
      think: "« J'analyse les flavonoïdes, le PRAL et la charge en mucus... 🧐 »",
      celebrate: "« Félicitations pour tes victoires vitalistes ! 🎉 »",
      sleep: "« Réparation cellulaire et autolyse des déchets... Bonne nuit ! 😴 »",
      audioBtn: "Roucouler",
      audioOn: "Sons Aviaires : Activés",
      audioOff: "Sons Aviaires : Désactivés"
    },
    auth: {
      signInWithGoogle: 'Se connecter avec Google',
      signOut: 'Se déconnecter',
      guestBadge: 'Invité (Local)',
      accountTitle: 'Espace Privé & Sécurisé',
      welcomeBack: 'Bienvenue {name} !',
      enterEmailPrompt: 'Connectez-vous avec votre adresse Google (@gmail.com) :',
      loginSuccess: 'Connecté avec succès : {name}',
      loggedOut: 'Déconnexion effectuée.'
    },
    rgpd: {
      title: 'Espace Privé, Sécurité & Droit à l\'Oubli (RGPD)',
      description: 'Conformément au Règlement Général sur la Protection des Données (RGPD), votre espace de santé est strictement privé et hermétique. Vous disposez d\'un contrôle total : portabilité (export), réinitialisation et suppression définitive immédiate (droit à l\'oubli).',
      exportBtn: '📦 Exporter mes données (Portabilité RGPD - Art. 20)',
      resetBtn: '🔄 Réinitialiser mes historiques de santé',
      deleteAccountBtn: '⚠️ Supprimer définitivement mon compte & mes données (Droit à l\'oubli)',
      confirmResetTitle: 'Réinitialiser vos données de santé ?',
      confirmResetText: 'Cette action supprimera tous vos historiques de repas, de jeûne, de respiration et de poids. Votre compte reste conservé.',
      confirmDeleteTitle: 'Exercer votre Droit à l\'Oubli (Suppression Totale) ?',
      confirmDeleteText: 'Cette action est IRRÉVERSIBLE. L\'intégralité de vos données, profil, historiques, conversations et compte sera définitivement effacée du système.'
    },
    common: {
      close: 'Fermer',
      back: 'Retour',
      apply: 'Appliquer',
      save: 'Enregistrer',
      search: 'Rechercher',
      cancel: 'Annuler',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      langName: 'Français'
    }
  },

  'fr-CA': {
    nav: {
      dashboard: 'Tableau de bord',
      fasting: 'Jeûne',
      materiaMedica: 'Pharmacopée',
      scanner: 'Scanner Vital',
      breathing: 'Respiration',
      chat: 'Coach IA',
      calendar: 'Calendrier',
      resources: 'Ressources',
      settings: 'Paramètres'
    },
    bnav: {
      dashboard: 'Accueil',
      scan: 'Scan',
      chat: 'Chat',
      calendar: 'Plan',
      fasting: 'Jeûne',
      more: 'Plus'
    },
    header: {
      title: 'VitalTrack — Santé Cellulaire & Flore Boréale 🍁',
      searchPlaceholder: 'Chercher un aliment, une plante boréale...',
      langToggleTitle: 'Changer de langue',
      themeToggleTitle: 'Basculer le mode sombre/clair'
    },
    dashboard: {
      greeting: 'Bonjour',
      scoreTitle: 'Score de Vitalité Biologique',
      scoreSub: 'Équilibre PRAL, hydratation boréale et élimination lymphatique',
      circadianTitle: 'Horloge Circadienne & Rythme Boréal',
      eliminationPhase: 'Phase d\'Élimination (4h-12h)',
      eliminationDesc: 'Drainage lymphatique et rénal. Privilégier l\'eau citronnée, la sève d\'érable pure et les bleuets sauvages.',
      appropriationPhase: 'Phase d\'Appropriation (12h-20h)',
      appropriationDesc: 'Fenêtre nutritionnelle active (dîner & souper). Priorité aux aliments vivants, pousses fraîches et légumes racines.',
      assimilationPhase: 'Phase d\'Assimilation (20h-4h)',
      assimilationDesc: 'Régénération tissulaire et repos digestif complet. Jeûne nocturne.',
      waterCardTitle: 'Hydratation Cellulaire & Eau Vivante',
      waterAdd250: '+250 ml',
      waterAdd500: '+500 ml',
      dailyQuoteTitle: 'Sagesse Vitaliste du Jour'
    },
    fasting: {
      pageTitle: 'Jeûne & Physiologie Cellulaire',
      pageSubtitle: 'Protocoles ancestraux, minuteur cellulaire et sagesse d\'Arnold Ehret & Dr. Morse',
      programsTitle: 'Protocoles de Jeûne',
      programsSub: 'Sélectionnez un protocole boréal ou vitaliste validé',
      timerTitle: 'Minuteur Vital',
      timerReady: 'PRÊT',
      timerActive: 'EN COURS',
      timerCompleted: 'TERMINÉ',
      timerGoal: 'Objectif',
      typeLabel: 'Type de protocole',
      durationLabel: 'Durée (heures)',
      startBtn: 'Démarrer le jeûne',
      stopBtn: 'Terminer le jeûne',
      safetyWarning: 'Attention : Les jeûnes prolongés de plus de 24h nécessitent une préparation adéquate en climat froid.',
      masterclassTitle: 'Masterclass : Rational Fasting',
      masterclassSub: 'La méthode scientifique d\'Arnold Ehret adaptée à la transition sans mucus',
      expertsTitle: 'Conseils des Maîtres & Herboristerie',
      expertsSub: 'Directives d\'Arnold Ehret, Dr. Robert Morse, Dr. Sebi et Wim Hof',
      historyTitle: 'Historique & Statistiques',
      totalSessions: 'Sessions totales',
      cumulatedHours: 'Heures cumulées',
      longestFast: 'Plus long',
      completionRate: 'Taux de complétion',
      noHistory: 'Aucune session de jeûne enregistrée pour le moment.'
    },
    materia: {
      pageTitle: 'Pharmacopée Raintree & Plantes Boréales',
      pageSubtitle: 'Monographies botaniques, phytochimie et indications du Dr. Leslie Taylor & herboristerie nordique',
      searchPlaceholder: 'Rechercher une plante, symptôme, organe (ex: reins, chaga, foie, candida)...',
      allCategory: 'Toutes les plantes',
      kidneysCategory: 'Reins & Lithiases',
      liverCategory: 'Foie & Détox',
      gutCategory: 'Intestin & Muqueuses',
      immunityCategory: 'Immunité & Antiviral',
      lungsCategory: 'Poumons & Voies resp.',
      vitalToneCategory: 'Vitalité & Énergie',
      viewMonograph: 'Consulter la monographie & posologie',
      expandMonograph: '📜 Dérouler la monographie scientifique & études Raintree (Dr. Leslie Taylor)',
      collapseMonograph: '🔼 Replier la monographie',
      quickBenefits: 'Bénéfices Thérapeutiques & Cibles Prioritaires',
      posologyTitle: 'Posologie & Préparation Usuelle (Dr. Leslie Taylor)',
      contraindicationsTitle: 'Précautions & Contre-indications',
      vitalistNoteTitle: 'Note Vitaliste & Drainage Émonctoriel',
      synergiesTitle: 'Synergies Botaniques Recommandées',
      askAIBtn: 'Poser une question au Coach IA sur cette plante'
    },
    scanner: {
      pageTitle: 'Scanner Visuel & Analyse de Plat IA',
      pageSubtitle: 'Prenez en photo votre plat pour identifier les ingrédients, le PRAL et la charge mucogène',
      uploadBtn: 'Prendre ou Téléverser une Photo',
      dropHint: 'Glissez une photo de repas ici ou cliquez pour choisir',
      detectiveBadge: 'Vital le Détective Nutritionnel ausculte votre plat',
      loadingTitle: 'Analyse biochimique & vitaliste en cours...',
      loadingSub: 'Identification des ingrédients boréaux, calcul du PRAL et charge colloïdale...',
      resultsTitle: 'Rapport d\'Analyse Vitaliste',
      addToMealsBtn: 'Ajouter ce plat au Journal'
    },
    search: {
      pageTitle: 'Recherche d\'Aliments & Base Vitaliste',
      pageSubtitle: 'Base scientifique universelle — Dr. Sebi, Arnold Ehret, Dr. Robert Morse & Flore Boréale',
      placeholder: 'Chercher un aliment (ex: bleuets sauvages, courge musquée, fonio)...',
      filterAll: 'Tous',
      filterElectric: '⚡ Électriques',
      filterHybrid: '🔀 Hybrides',
      filterAlkaline: '🌿 Alcalinisants',
      filterMucus: '⛔ Mucogènes',
      filterFavorites: '❤️ Favoris',
      aiBannerTitle: 'Votre aliment ou plat n\'est pas dans la liste ?',
      aiBannerSub: 'Analyser avec l\'IA VitalTrack (classification complète, PRAL & NOVA)',
      aiSearchBtn: 'Analyser IA',
      noResults: 'Aucun aliment répertorié dans la base locale.'
    },
    meals: {
      pageTitle: 'Journal Alimentaire & Calendrier',
      addMeal: 'Ajouter un Repas',
      breakfast: 'Déjeuner (Matin)',
      lunch: 'Dîner (Midi)',
      dinner: 'Souper (Soir)',
      snack: 'Collation',
      dailyBalance: 'Bilan Acido-Basique Quotidien',
      alkalineRatio: 'Ratio Alcalinisant',
      noMeals: 'Aucun aliment consigné pour cette journée.'
    },
    chat: {
      welcomeTitle: 'Roucouuu ! 🌿',
      welcomeSub: 'Je suis Vital, ton coach vitaliste IA. Pose-moi une question sur la nutrition, le jeûne, les plantes boréales ou la santé naturelle.',
      inputPlaceholder: 'Pose une question, explore un sujet santé, un repas, un protocole...',
      thinkingStatus: 'Vital inspecte la mémoire & analyse...',
      autoModel: 'Rotateur Auto',
      sendBtn: 'Envoyer'
    },
    settings: {
      title: '⚙️ Protocoles & Paramètres',
      subtitle: 'Personnalisez votre approche vitaliste et votre bio-profil',
      profileTitle: 'Bio-Profil & Contexte IA',
      profileSub: 'Utilisé par le Coach pour calibrer vos cures et tisanes',
      mascotTitle: 'Mascotte Vitale « Vital »',
      mascotActive: '🌟 Compagnon Actif',
      mascotActiveDesc: 'Conseils circadiens, nudges après repas, paliers de jeûne',
      mascotZen: '🌿 Compagnon Zen',
      mascotZenDesc: 'Présence calme, aucun pop-up spontané, réactif au clic',
      mascotQuiet: '🔇 Discret',
      mascotQuietDesc: 'Désactive tous les nudges flottants',
      screenshotTitle: 'Protection Anti-Capture d\'Écran',
      screenshotDesc: 'Masque automatiquement les données de santé lors des captures d\'écran (Désactivé par défaut)',
      screenshotToast: '📸 Capture d\'écran — Vous pouvez activer ou désactiver la protection anti-capture à tout moment dans Paramètres.',
      saveSuccess: 'Profil enregistré avec succès !'
    },
    mascot: {
      idle: "« Prêt à explorer la vitalité naturelle et drainer les acides ! »",
      walk: "« En route pour stimuler la lymphe et activer la motilité péristaltique ! 🚶 »",
      laugh: "« Hahaha ! La joie et la respiration profonde alcalinisent le terrain ! 😄 »",
      coo: "« Roucouuu ! Écoute le chant de tes cellules régénérées. 🐦 »",
      think: "« J'analyse les flavonoïdes, le PRAL et la charge en mucus... 🧐 »",
      celebrate: "« Félicitations pour tes victoires vitalistes ! 🎉 »",
      sleep: "« Réparation cellulaire et autolyse des déchets... Bonne nuit ! 😴 »",
      audioBtn: "Roucouler",
      audioOn: "Sons Aviaires : Activés",
      audioOff: "Sons Aviaires : Désactivés"
    },
    auth: {
      signInWithGoogle: 'Se connecter avec Google',
      signOut: 'Se déconnecter',
      guestBadge: 'Invité (Local)',
      accountTitle: 'Espace Privé & Sécurisé',
      welcomeBack: 'Bienvenue {name} !',
      enterEmailPrompt: 'Connectez-vous avec votre adresse Google (@gmail.com) :',
      loginSuccess: 'Connecté avec succès : {name}',
      loggedOut: 'Déconnexion effectuée.'
    },
    rgpd: {
      title: 'Espace Privé, Sécurité & Droit à l\'Oubli (RGPD / Loi 25)',
      description: 'Conformément aux normes RGPD et de protection des renseignements personnels (Loi 25), vos données sont strictement étanches. Vous pouvez exporter, réinitialiser ou supprimer définitivement vos données en tout temps.',
      exportBtn: '📦 Exporter mes données (Portabilité)',
      resetBtn: '🔄 Réinitialiser mes historiques de santé',
      deleteAccountBtn: '⚠️ Supprimer définitivement mon compte & mes données (Droit à l\'oubli)',
      confirmResetTitle: 'Réinitialiser vos données de santé ?',
      confirmResetText: 'Cette action effacera vos repas, jeûnes, mesures et conversations. Votre profil restera accessible.',
      confirmDeleteTitle: 'Suppression Définitive du Compte & Droit à l\'Oubli',
      confirmDeleteText: 'Cette action est IRRÉVERSIBLE. Toutes vos données seront définitivement et immédiatement supprimées.'
    },
    common: {
      close: 'Fermer',
      back: 'Retour',
      apply: 'Appliquer',
      save: 'Enregistrer',
      search: 'Rechercher',
      cancel: 'Annuler',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      langName: 'Français (Canada) 🍁'
    }
  },

  en: {
    nav: {
      dashboard: 'Dashboard',
      fasting: 'Fasting',
      materiaMedica: 'Pharmacopoeia',
      scanner: 'Vital Scanner',
      breathing: 'Breathing',
      chat: 'AI Coach',
      calendar: 'Calendar',
      resources: 'Resources',
      settings: 'Settings'
    },
    bnav: {
      dashboard: 'Home',
      scan: 'Scan',
      chat: 'Chat',
      calendar: 'Plan',
      fasting: 'Fast',
      more: 'More'
    },
    header: {
      title: 'VitalTrack — Cellular Health & Vitalism',
      searchPlaceholder: 'Search foods, botanicals...',
      langToggleTitle: 'Switch Language',
      themeToggleTitle: 'Toggle Dark/Light Mode'
    },
    dashboard: {
      greeting: 'Welcome',
      scoreTitle: 'Biological Vitality Score',
      scoreSub: 'PRAL balance, cellular hydration, and peristaltic motility',
      circadianTitle: 'Circadian Clock & Biological Rhythm',
      eliminationPhase: 'Elimination Phase (4 AM - 12 PM)',
      eliminationDesc: 'Lymphatic drainage and kidney filtration. Prioritize lemon water and ripe astringent fruits.',
      appropriationPhase: 'Appropriation Phase (12 PM - 8 PM)',
      appropriationDesc: 'Active nutrition window. Prioritize living foods, raw leafy greens, and fresh cold-pressed juices.',
      assimilationPhase: 'Assimilation Phase (8 PM - 4 AM)',
      assimilationDesc: 'Cellular reconstruction and digestive rest. Regenerative nocturnal fasting.',
      waterCardTitle: 'Cellular Hydration & Structured Water',
      waterAdd250: '+250 ml',
      waterAdd500: '+500 ml',
      dailyQuoteTitle: 'Daily Vitalist Wisdom'
    },
    fasting: {
      pageTitle: 'Fasting & Cellular Physiology',
      pageSubtitle: 'Ancestral protocols, cellular timer, and wisdom from Arnold Ehret & Dr. Morse',
      programsTitle: 'Fasting Protocols',
      programsSub: 'Select a validated protocol to automatically preset the timer',
      timerTitle: 'Vitality Fasting Timer',
      timerReady: 'READY',
      timerActive: 'ACTIVE',
      timerCompleted: 'COMPLETED',
      timerGoal: 'Goal',
      typeLabel: 'Protocol type',
      durationLabel: 'Duration (hours)',
      startBtn: 'Start Fasting',
      stopBtn: 'End Fasting Session',
      safetyWarning: 'Caution: Extended fasts over 24h require thorough transition and adapted supervision.',
      masterclassTitle: 'Masterclass: Rational Fasting',
      masterclassSub: 'Arnold Ehret\'s scientific method to eliminate mucus without auto-intoxication crises',
      expertsTitle: 'Wisdom & Expert Guidelines',
      expertsSub: 'Directives from Arnold Ehret, Dr. Robert Morse, Dr. Sebi, and Wim Hof',
      historyTitle: 'History & Analytics',
      totalSessions: 'Total Sessions',
      cumulatedHours: 'Total Hours',
      longestFast: 'Longest Fast',
      completionRate: 'Completion Rate',
      noHistory: 'No recorded fasting sessions yet.'
    },
    materia: {
      pageTitle: 'Raintree Pharmacopoeia & Amazonian Herbs',
      pageSubtitle: 'Botanical monographs, phytochemistry, and clinical targets from Dr. Leslie Taylor',
      searchPlaceholder: 'Search by plant name, symptom, target organ (e.g. stones, kidneys, liver, candida)...',
      allCategory: 'All Botanicals',
      kidneysCategory: 'Kidneys & Lithiasis',
      liverCategory: 'Liver & Gallbladder',
      gutCategory: 'Gut & Mucosa',
      immunityCategory: 'Immunity & Antiviral',
      lungsCategory: 'Lungs & Mucus',
      vitalToneCategory: 'Vital Tone & Energy',
      viewMonograph: 'View Plant Profile & Posology',
      expandMonograph: '📜 Unfold Full Scientific Monograph & Raintree Studies (Dr. Leslie Taylor)',
      collapseMonograph: '🔼 Collapse Monograph',
      quickBenefits: 'Primary Clinical Benefits & Vital Targets',
      posologyTitle: 'Recommended Posology & Preparation (Dr. Leslie Taylor)',
      contraindicationsTitle: 'Precautions & Contraindications',
      vitalistNoteTitle: 'Vitalist Note & Emunctory Drainage',
      synergiesTitle: 'Recommended Botanical Synergies',
      askAIBtn: 'Ask AI Coach about this botanical'
    },
    scanner: {
      pageTitle: 'Visual AI Scanner & Meal Analysis',
      pageSubtitle: 'Snap a photo of your plate to identify ingredients, PRAL acid load, and mucus classification',
      uploadBtn: 'Take or Upload a Photo',
      dropHint: 'Drag a meal photo here or click to browse',
      detectiveBadge: 'Vital the Nutritional Detective is examining your dish',
      loadingTitle: 'Biochemical & vitalist analysis in progress...',
      loadingSub: 'Identifying compounds, calculating renal PRAL load, and assessing colloidal mucus burden...',
      resultsTitle: 'Vitalist Analysis Report',
      addToMealsBtn: 'Add this meal to Food Log'
    },
    search: {
      pageTitle: 'Food Search & Vitalist Database',
      pageSubtitle: 'Universal scientific database — Dr. Sebi, Arnold Ehret, Dr. Robert Morse',
      placeholder: 'Search any food (e.g. mango, fonio, avocado, wild blueberry)...',
      filterAll: 'All',
      filterElectric: '⚡ Electric',
      filterHybrid: '🔀 Hybrid',
      filterAlkaline: '🌿 Alkaline',
      filterMucus: '⛔ Mucus-forming',
      filterFavorites: '❤️ Favorites',
      aiBannerTitle: 'Can\'t find your food or dish in the list?',
      aiBannerSub: 'Analyze with VitalTrack AI (full classification, PRAL & NOVA scoring)',
      aiSearchBtn: 'Analyze with AI',
      noResults: 'No foods found in the local database.'
    },
    meals: {
      pageTitle: 'Nutrition Log & Calendar',
      addMeal: 'Log a Meal',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      dailyBalance: 'Daily Acid-Alkaline Balance',
      alkalineRatio: 'Alkaline Ratio',
      noMeals: 'No meals logged for this day yet.'
    },
    chat: {
      welcomeTitle: 'Coo-coo! 🌿',
      welcomeSub: 'I am Vital, your AI Vitalist Coach. Ask me anything about nutrition, fasting, botanicals, or natural healing.',
      inputPlaceholder: 'Ask a question, explore health topics, meals, protocols...',
      thinkingStatus: 'Vital is inspecting memories & analyzing...',
      autoModel: 'Auto Rotator',
      sendBtn: 'Send'
    },
    settings: {
      title: '⚙️ Protocols & Settings',
      subtitle: 'Customize your vitalist protocol and personalized bio-profile',
      profileTitle: 'Bio-Profile & AI Context',
      profileSub: 'Used by the AI Coach to tailor your herbal cleanses and protocols',
      mascotTitle: 'Vital Mascot Companion',
      mascotActive: '🌟 Active Companion',
      mascotActiveDesc: 'Circadian advice, post-meal nudges, fasting milestone celebrations',
      mascotZen: '🌿 Zen Companion',
      mascotZenDesc: 'Calm presence, no spontaneous popups, reactive on click',
      mascotQuiet: '🔇 Quiet',
      mascotQuietDesc: 'Disables all floating toast nudges',
      screenshotTitle: 'Anti-Screenshot Protection',
      screenshotDesc: 'Masks health records during screenshots (Disabled by default)',
      screenshotToast: '📸 Screenshot detected — Note: You can enable or disable anti-screenshot protection at any time in Settings.',
      saveSuccess: 'Profile saved successfully!'
    },
    mascot: {
      idle: "« Ready to explore natural vitality and drain cellular acids! »",
      walk: "« Moving to stimulate lymphatic flow and peristaltic motility! 🚶 »",
      laugh: "« Hahaha! Joy and deep breathing alkalize the biological terrain! 😄 »",
      coo: "« Coo-coo! Listen to the song of your regenerating cells. 🐦 »",
      think: "« Analyzing flavonoids, PRAL balance, and mucoid load... 🧐 »",
      celebrate: "« Congratulations on your vitalist breakthroughs! 🎉 »",
      sleep: "« Cellular repair and waste autolysis in progress... Good night! 😴 »",
      audioBtn: "Coo Sound",
      audioOn: "Avian Sounds: Enabled",
      audioOff: "Avian Sounds: Muted"
    },
    auth: {
      signInWithGoogle: 'Sign in with Google',
      signOut: 'Sign Out',
      guestBadge: 'Guest (Local)',
      accountTitle: 'Private & Secure Workspace',
      welcomeBack: 'Welcome back, {name}!',
      enterEmailPrompt: 'Sign in with your Google account (@gmail.com):',
      loginSuccess: 'Successfully signed in: {name}',
      loggedOut: 'Signed out successfully.'
    },
    rgpd: {
      title: 'Privacy, Data Protection & Right to be Forgotten (GDPR)',
      description: 'In full compliance with General Data Protection Regulation (GDPR), your health space is strictly isolated and private. You have complete control: data portability (export), health reset, and permanent account & data erasure (right to be forgotten).',
      exportBtn: '📦 Export All My Data (GDPR Portability - Art. 20)',
      resetBtn: '🔄 Reset Health & Fasting History',
      deleteAccountBtn: '⚠️ Permanently Delete Account & All Data (Right to be Forgotten)',
      confirmResetTitle: 'Reset Health Records?',
      confirmResetText: 'This will erase all meal logs, fasts, breathing sessions, and weight records. Your account remains active.',
      confirmDeleteTitle: 'Exercise Right to be Forgotten (Permanent Deletion)?',
      confirmDeleteText: 'This action is IRREVERSIBLE. All your profile data, history, conversations, and account will be permanently purged from the system.'
    },
    common: {
      close: 'Close',
      back: 'Back',
      apply: 'Apply',
      save: 'Save',
      search: 'Search',
      cancel: 'Cancel',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      langName: 'English'
    }
  },

  es: {
    nav: {
      dashboard: 'Panel Principal',
      fasting: 'Ayuno',
      materiaMedica: 'Farmacopea',
      scanner: 'Escáner Vital',
      breathing: 'Respiración',
      chat: 'Coach IA',
      calendar: 'Calendario',
      resources: 'Recursos',
      settings: 'Ajustes'
    },
    bnav: {
      dashboard: 'Inicio',
      scan: 'Scan',
      chat: 'Chat',
      calendar: 'Plan',
      fasting: 'Ayuno',
      more: 'Más'
    },
    header: {
      title: 'VitalTrack — Salud Celular y Vitalismo',
      searchPlaceholder: 'Buscar alimentos, plantas medicinales...',
      langToggleTitle: 'Cambiar idioma',
      themeToggleTitle: 'Alternar modo oscuro/claro'
    },
    dashboard: {
      greeting: 'Hola',
      scoreTitle: 'Puntuación de Vitalidad Biológica',
      scoreSub: 'Equilibrio PRAL, hidratación celular y motilidad peristáltica',
      circadianTitle: 'Reloj Circadiano y Ritmo Biológico',
      eliminationPhase: 'Fase de Eliminación (4h-12h)',
      eliminationDesc: 'Drenaje linfático y filtración renal. Priorizar agua con limón y frutas maduras astringentes.',
      appropriationPhase: 'Fase de Apropiación (12h-20h)',
      appropriationDesc: 'Ventana de alimentación activa. Prioridad a alimentos vivos, ensaladas crudas y jugos frescos.',
      assimilationPhase: 'Fase de Asimilación (20h-4h)',
      assimilationDesc: 'Reconstrucción celular y reposo digestivo. Ayuno nocturno regenerador.',
      waterCardTitle: 'Hidratación Celular y Agua Estructurada',
      waterAdd250: '+250 ml',
      waterAdd500: '+500 ml',
      dailyQuoteTitle: 'Sabiduría Vitalista del Día'
    },
    fasting: {
      pageTitle: 'Ayuno y Fisiología Celular',
      pageSubtitle: 'Protocolos ancestrales, temporizador celular y sabiduría de Arnold Ehret y Dr. Morse',
      programsTitle: 'Protocolos de Ayuno',
      programsSub: 'Selecciona un protocolo validado para preconfigurar el temporizador',
      timerTitle: 'Temporizador Vital',
      timerReady: 'LISTO',
      timerActive: 'ACTIVO',
      timerCompleted: 'COMPLETADO',
      timerGoal: 'Objetivo',
      typeLabel: 'Tipo de protocolo',
      durationLabel: 'Duración (horas)',
      startBtn: 'Iniciar ayuno',
      stopBtn: 'Finalizar ayuno',
      safetyWarning: 'Atención: Los ayunos de más de 24h requieren preparación previa y supervisión adecuada.',
      masterclassTitle: 'Masterclass: Ayuno Racional (Rational Fasting)',
      masterclassSub: 'El método científico de Arnold Ehret para eliminar el moco sin crisis de autointoxicación',
      expertsTitle: 'Sabiduría de los Maestros y Guías',
      expertsSub: 'Directivas de Arnold Ehret, Dr. Robert Morse, Dr. Sebi y Wim Hof',
      historyTitle: 'Historial y Estadísticas',
      totalSessions: 'Sesiones totales',
      cumulatedHours: 'Horas acumuladas',
      longestFast: 'Más largo',
      completionRate: 'Tasa de finalización',
      noHistory: 'No hay sesiones de ayuno registradas aún.'
    },
    materia: {
      pageTitle: 'Farmacopea Raintree y Plantas Amazónicas',
      pageSubtitle: 'Monografías botánicas, fitoquímica e indicaciones clínicas de la Dra. Leslie Taylor',
      searchPlaceholder: 'Buscar planta, síntoma, órgano (ej: cálculos, riñones, hígado, cándida)...',
      allCategory: 'Todas las plantas',
      kidneysCategory: 'Riñones y Litiasis',
      liverCategory: 'Hígado y Vesícula',
      gutCategory: 'Intestino y Mucosas',
      immunityCategory: 'Inmunidad y Antiviral',
      lungsCategory: 'Pulmones y Vías resp.',
      vitalToneCategory: 'Vitalidad y Energía',
      viewMonograph: 'Ver perfil y posología',
      expandMonograph: '📜 Desplegar monografía científica y estudios Raintree (Dra. Leslie Taylor)',
      collapseMonograph: '🔼 Plegar monografía',
      quickBenefits: 'Beneficios Clínicos y Órganos Diana',
      posologyTitle: 'Posología y Preparación Tradicional (Dra. Leslie Taylor)',
      contraindicationsTitle: 'Precauciones y Contraindicaciones',
      vitalistNoteTitle: 'Nota Vitalista y Drenaje Emuntorial',
      synergiesTitle: 'Sinergias Botánicas Recomendadas',
      askAIBtn: 'Preguntar al Coach IA sobre esta planta'
    },
    scanner: {
      pageTitle: 'Escáner Visual y Análisis de Plato con IA',
      pageSubtitle: 'Fotografía tu plato para identificar ingredientes, carga ácida PRAL y nivel de moco',
      uploadBtn: 'Tomar o Subir Foto',
      dropHint: 'Arrastra una foto aquí o haz clic para seleccionar',
      detectiveBadge: 'Vital el Detective Nutricional está examinando tu plato',
      loadingTitle: 'Análisis bioquímico y vitalista en curso...',
      loadingSub: 'Identificando compuestos, calculando carga PRAL y evaluando moco coloidal...',
      resultsTitle: 'Informe de Análisis Vitalista',
      addToMealsBtn: 'Añadir este plato al Diario'
    },
    search: {
      pageTitle: 'Búsqueda de Alimentos y Base Vitalista',
      pageSubtitle: 'Base científica universal — Dr. Sebi, Arnold Ehret, Dr. Robert Morse',
      placeholder: 'Buscar un alimento (ej: mango, aguacate, fonio, arándano)...',
      filterAll: 'Todos',
      filterElectric: '⚡ Eléctricos',
      filterHybrid: '🔀 Híbridos',
      filterAlkaline: '🌿 Alcalinizantes',
      filterMucus: '⛔ Mucógenos',
      filterFavorites: '❤️ Favoritos',
      aiBannerTitle: '¿Tu alimento o plato no está en la lista?',
      aiBannerSub: 'Analizar con la IA VitalTrack (clasificación completa, PRAL y NOVA)',
      aiSearchBtn: 'Analizar con IA',
      noResults: 'No se encontraron alimentos en la base local.'
    },
    meals: {
      pageTitle: 'Diario Nutricional y Calendario',
      addMeal: 'Registrar Comida',
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      dinner: 'Cena',
      snack: 'Merienda',
      dailyBalance: 'Balance Ácido-Base Diario',
      alkalineRatio: 'Proporción Alcalinizante',
      noMeals: 'No hay alimentos registrados para este día.'
    },
    chat: {
      welcomeTitle: '¡Rucuuu! 🌿',
      welcomeSub: 'Soy Vital, tu coach vitalista con IA. Pregúntame sobre nutrición, ayuno, plantas medicinales o regeneración natural.',
      inputPlaceholder: 'Haz una pregunta, explora temas de salud, comidas, protocolos...',
      thinkingStatus: 'Vital está inspeccionando la memoria y analizando...',
      autoModel: 'Rotador Automático',
      sendBtn: 'Enviar'
    },
    settings: {
      title: '⚙️ Protocolos y Ajustes',
      subtitle: 'Personaliza tu protocolo vitalista y tu bio-perfil',
      profileTitle: 'Bio-Perfil y Contexto IA',
      profileSub: 'Utilizado por el Coach para calibrar tus curas y tisanas',
      mascotTitle: 'Compañero Mascota Vital',
      mascotActive: '🌟 Compañero Activo',
      mascotActiveDesc: 'Consejos circadianos, avisos tras comidas, celebraciones de ayuno',
      mascotZen: '🌿 Compañero Zen',
      mascotZenDesc: 'Presencia serena, sin ventanas emergentes espontáneas, reactivo al clic',
      mascotQuiet: '🔇 Discreto',
      mascotQuietDesc: 'Desactiva todos los avisos flotantes',
      saveSuccess: '¡Perfil guardado con éxito!'
    },
    mascot: {
      idle: "« ¡Listo para explorar la vitalidad natural y drenar los ácidos! »",
      walk: "« ¡En marcha para estimular la linfa y activar el peristaltismo! 🚶 »",
      laugh: "« ¡Jajaja! ¡La alegría y la respiración profunda alcalinizan el organismo! 😄 »",
      coo: "« ¡Rucuuu! Escucha el canto de tus células regeneradas. 🐦 »",
      think: "« Analizando flavonoides, equilibrio PRAL y carga de moco... 🧐 »",
      celebrate: "« ¡Felicitaciones por tus logros vitalistas! 🎉 »",
      sleep: "« Reparación celular y autólisis de desechos en curso... ¡Buenas noches! 😴 »",
      audioBtn: "Arrullo",
      audioOn: "Sonidos de Aves: Activados",
      audioOff: "Sonidos de Aves: Silenciados"
    },
    auth: {
      signInWithGoogle: 'Iniciar sesión con Google',
      signOut: 'Cerrar sesión',
      guestBadge: 'Invitado (Local)',
      accountTitle: 'Espacio Privado y Seguro',
      welcomeBack: '¡Bienvenido {name}!',
      enterEmailPrompt: 'Inicia sesión con tu cuenta de Google (@gmail.com):',
      loginSuccess: 'Sesión iniciada con éxito: {name}',
      loggedOut: 'Sesión cerrada correctamente.'
    },
    rgpd: {
      title: 'Privacidad, Seguridad y Derecho al Olvido (RGPD)',
      description: 'En estricto cumplimiento del RGPD, tu espacio de salud es confidencial e intransferible. Tienes control total: portabilidad (exportar), reinicio y eliminación definitiva de cuenta y datos (derecho al olvido).',
      exportBtn: '📦 Exportar mis datos (Portabilidad RGPD - Art. 20)',
      resetBtn: '🔄 Reiniciar registros de salud y ayuno',
      deleteAccountBtn: '⚠️ Eliminar definitivamente mi cuenta y todos mis datos (Derecho al olvido)',
      confirmResetTitle: '¿Reiniciar registros de salud?',
      confirmResetText: 'Esta acción borrará tus comidas, ayunos, respiraciones y pesos. Tu cuenta permanecerá activa.',
      confirmDeleteTitle: '¿Ejercer Derecho al Olvido (Eliminación Total)?',
      confirmDeleteText: 'Esta acción es IRREVERSIBLE. Todo tu perfil, historial, conversaciones y cuenta serán eliminados permanentemente.'
    },
    common: {
      close: 'Cerrar',
      back: 'Volver',
      apply: 'Aplicar',
      save: 'Guardar',
      search: 'Buscar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      success: 'Éxito',
      error: 'Error',
      langName: 'Español'
    }
  }
};

// ═══════ HELPER FUNCTIONS ═══════
export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang.startsWith('fr') ? 'fr' : lang;
  listeners.forEach(fn => {
    try { fn(lang); } catch (e) { console.error(e); }
  });
  updateDOMTranslations();
}

export function toggleLanguage() {
  const order = ['fr', 'en', 'es', 'fr-CA'];
  const nextIdx = (order.indexOf(currentLang) + 1) % order.length;
  const next = order[nextIdx];
  setLanguage(next);
  return next;
}

export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function t(keyPath, params = {}, fallback = '') {
  const parts = keyPath.split('.');
  let current = TRANSLATIONS[currentLang];
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback: try fr-CA -> fr -> en -> fallback
      let fb = TRANSLATIONS.fr;
      for (const p of parts) {
        if (fb && typeof fb === 'object' && p in fb) fb = fb[p];
        else { fb = null; break; }
      }
      current = fb !== null ? fb : (fallback || keyPath);
      break;
    }
  }

  if (typeof current !== 'string') return fallback || keyPath;

  let result = current;
  for (const [paramKey, paramVal] of Object.entries(params)) {
    result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
  }
  return result;
}

export function getTaxonomyStatus(statusKey) {
  const item = TAXONOMY.biochemicalStatus[statusKey];
  if (!item) return null;
  return item[currentLang] || item.fr;
}

export function getTaxonomyEmunctory(emunctoryKey) {
  const item = TAXONOMY.emunctories[emunctoryKey];
  if (!item) return null;
  return item[currentLang] || item.fr;
}

export function updateDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.innerHTML = translated;
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('placeholder', translated);
      }
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('title', translated);
      }
    }
  });

  // Update all language selector buttons across the DOM uniformly
  const cfg = LANG_CONFIG[currentLang] || LANG_CONFIG.fr;
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.innerHTML = `${cfg.flag} <span style="font-weight:700;">${cfg.short}</span>`;
    btn.setAttribute('title', `${cfg.name} (Changer de langue)`);
  });

  const langSelect = document.getElementById('globalLangSelect');
  if (langSelect && langSelect.value !== currentLang) {
    langSelect.value = currentLang;
  }
}

// Global exposure for non-module handlers
if (typeof window !== 'undefined') {
  window.vitalTrackI18n = {
    SUPPORTED_LANGS,
    LANG_CONFIG,
    getLanguage,
    setLanguage,
    toggleLanguage,
    onLanguageChange,
    updateDOMTranslations,
    t,
    TAXONOMY
  };
  window.t = t;
  window.setLanguage = setLanguage;
}
