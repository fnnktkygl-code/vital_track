// ── Fasting Coach Knowledge Base ─────────────────────────────────────────────
// Protocol-aware coaching content for Dr. Morse, Ehret, and Dr. Sebi.
// Provides check-ins, symptom advice, goal motivation, and Q&A.

/// A check-in prompt shown at a specific hour milestone.
class CoachCheckIn {
  final int hourMark;
  final String question;
  final String insight;
  final String emoji;
  final List<String> quickReplies; // symptom / mood chips

  const CoachCheckIn({
    required this.hourMark,
    required this.question,
    required this.insight,
    required this.emoji,
    this.quickReplies = const [],
  });
}

/// Advice for a reported symptom.
class CoachAdvice {
  final String symptom;
  final String emoji;
  final String quote;
  final String explanation;
  final String actionTip;

  const CoachAdvice({
    required this.symptom,
    required this.emoji,
    required this.quote,
    required this.explanation,
    required this.actionTip,
  });
}

/// Convenience type for Q&A items.
class CoachQA {
  final String question;
  final String answer;
  final String emoji;

  const CoachQA({
    required this.question,
    required this.answer,
    required this.emoji,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────

class FastingCoachKnowledge {
  FastingCoachKnowledge._();

  // ── Quick-reply chips (symptoms & moods) ───────────────────────────────────

  static const quickRepliesEarly = ['Bien 😊', 'Faim 😋', 'Fatigue 😴', 'Anxieux 😰'];
  static const quickRepliesMid = ['Bien 😊', 'Mal de tête 🤕', 'Fatigue 😴', 'Nausée 🤢', 'Froid 🥶'];
  static const quickRepliesDeep = ['Clarté 🧠', 'Euphorique 🌟', 'Fatigue 😴', 'Vertige 😵', 'Calme 🧘'];

  // ── PHASE CHECK-INS ────────────────────────────────────────────────────────

  static List<CoachCheckIn> checkInsForProtocol(String protocol) {
    switch (protocol) {
      case 'morse':
        return _checkInsMorse;
      case 'ehret':
        return _checkInsEhret;
      default:
        return _checkInsSebi;
    }
  }

  static const _checkInsMorse = [
    CoachCheckIn(
      hourMark: 2,
      question: 'Comment te sens-tu ? Le jeûne vient de commencer.',
      insight: 'Morse : Les premières heures sont la transition. Le système lymphatique commence à se désencombrer.',
      emoji: '💧',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 6,
      question: 'Tu es à 6h ! As-tu bu suffisamment d\'eau ?',
      insight: 'Morse : L\'hydratation est la clé de la filtration rénale. Eau de source ou eau distillée.',
      emoji: '🚰',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 12,
      question: '🔥 Tu entres en cétose ! Comment ça va ?',
      insight: 'Morse : La cétose aide à dissoudre les acides stockés dans les tissus interstitiels. Les surrénales s\'activent.',
      emoji: '🔥',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 18,
      question: '18h de jeûne ! Bravo. Des inconforts ?',
      insight: 'Morse : Si tu as mal à la tête, c\'est normal — le corps élimine des toxines. Repos et hydratation.',
      emoji: '💪',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 24,
      question: '🎉 24h ! L\'autophagie s\'active. Comment te sens-tu ?',
      insight: 'Morse : Nettoyage lymphatique profond. Vérifie ton urine — la filtration devrait être visible.',
      emoji: '♻️',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 36,
      question: '36h de jeûne. Tu es un guerrier. Ton corps ?',
      insight: 'Morse : Les cellules se régénèrent. Les surrénales et les reins travaillent à plein régime.',
      emoji: '🧬',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 48,
      question: '48h ! Régénération cellulaire profonde. Écoute ton corps.',
      insight: 'Morse : Les cellules souches s\'activent. Le système immunitaire se reconstruit. Tu es en territoire sacré.',
      emoji: '🌟',
      quickReplies: quickRepliesDeep,
    ),
  ];

  static const _checkInsEhret = [
    CoachCheckIn(
      hourMark: 2,
      question: 'Début du jeûne ! Comment te sens-tu ?',
      insight: 'Ehret : La digestion du dernier repas s\'achève. Le nettoyage interne commence doucement.',
      emoji: '🌿',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 6,
      question: '6h ! L\'obstruction diminue. Tout va bien ?',
      insight: 'Ehret : V = P − O. Moins d\'obstruction signifie plus de vitalité. Tu progresses.',
      emoji: '⚡',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 12,
      question: '🔥 Cétose ! Ton corps brûle les réserves. Des sensations ?',
      insight: 'Ehret : Le corps brûle les graisses chargées de mucus. Nettoyage métabolique en cours.',
      emoji: '🔥',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 18,
      question: '18h ! Le médecin intérieur opère. Comment ça va ?',
      insight: 'Ehret : Les inconforts sont des signes de nettoyage. Le mucus ancien se dissout.',
      emoji: '🩺',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 24,
      question: '♻️ 24h ! Autophagie active. Ton état ?',
      insight: 'Ehret : L\'autophagie recycle les protéines endommagées. Le jeûne rationnel porte ses fruits.',
      emoji: '♻️',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 36,
      question: '36h ! Clarté mentale extraordinaire ?',
      insight: 'Ehret : Le jeûne avancé apporte une clarté mentale que tu ne trouveras jamais dans la nourriture.',
      emoji: '🧠',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 48,
      question: '48h ! Régénération profonde. Comment te sens-tu ?',
      insight: 'Ehret : L\'homme sain ne se fatigue pas — il est mouvement perpétuel. Tu régénères en profondeur.',
      emoji: '🌟',
      quickReplies: quickRepliesDeep,
    ),
  ];

  static const _checkInsSebi = [
    CoachCheckIn(
      hourMark: 2,
      question: 'Ton jeûne commence. Comment te sens-tu ?',
      insight: 'Sebi : Le corps redirige l\'énergie de la digestion vers l\'élimination du mucus.',
      emoji: '🍃',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 6,
      question: '6h passées ! Les dépôts de mucus se ramollissent.',
      insight: 'Sebi : L\'eau de source aide à évacuer le mucus. Bois régulièrement.',
      emoji: '💧',
      quickReplies: quickRepliesEarly,
    ),
    CoachCheckIn(
      hourMark: 12,
      question: '🔥 Cétose ! Les tissus profonds se nettoient.',
      insight: 'Sebi : Les tissus libèrent les minéraux inorganiques. Le nettoyage s\'intensifie.',
      emoji: '🔥',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 18,
      question: '18h ! Ton corps travaille dur. Des inconforts ?',
      insight: 'Sebi : Les dépôts de calcium inorganique et de mucus ancien se libèrent. C\'est bon signe.',
      emoji: '⚗️',
      quickReplies: quickRepliesMid,
    ),
    CoachCheckIn(
      hourMark: 24,
      question: '♻️ 24h ! Autophagie activée. Comment ça va ?',
      insight: 'Sebi : Les cellules se débarrassent du mucus ancien. Les 102 minéraux se rééquilibrent.',
      emoji: '♻️',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 36,
      question: '36h de jeûne ! Nettoyage intracellulaire profond.',
      insight: 'Sebi : Le corps est fait de minéraux. Sans mucus, ils fonctionnent naturellement.',
      emoji: '🧬',
      quickReplies: quickRepliesDeep,
    ),
    CoachCheckIn(
      hourMark: 48,
      question: '48h ! Régénération cellulaire activée.',
      insight: 'Sebi : L\'étincelle de la vie (le fer) se rééquilibre. Le corps se guérit quand on cesse de l\'encombrer.',
      emoji: '🌟',
      quickReplies: quickRepliesDeep,
    ),
  ];

  // ── SYMPTOM ADVICE ─────────────────────────────────────────────────────────

  static CoachAdvice adviceForSymptom(String symptom, String protocol, {String? bodyType}) {
    final key = _normalizeSymptom(symptom);
    final map = _symptomAdvice[protocol] ?? _symptomAdvice['morse']!;
    var advice = map[key];
    if (advice == null) {
      return CoachAdvice(
        symptom: symptom,
        emoji: '🤔',
        quote: 'Écoute ton corps attentivement.',
        explanation: 'Chaque symptôme est un message. Note-le et observe son évolution.',
        actionTip: 'Repose-toi et reste bien hydraté.',
      );
    }

    // Adapt for body type
    if (bodyType == 'ectomorph' && (key == 'fatigue' || key == 'vertige')) {
      advice = CoachAdvice(
        symptom: advice.symptom,
        emoji: advice.emoji,
        quote: advice.quote,
        explanation: '${advice.explanation} En tant qu\'ectomorphe, tes réserves sont plus limitées.',
        actionTip: '${advice.actionTip} Envisage de raccourcir le jeûne si ça persiste.',
      );
    }

    return advice;
  }

  static String _normalizeSymptom(String raw) {
    final lower = raw.toLowerCase();
    if (lower.contains('bien') || lower.contains('😊')) return 'bien';
    if (lower.contains('faim') || lower.contains('😋')) return 'faim';
    if (lower.contains('fatigue') || lower.contains('😴')) return 'fatigue';
    if (lower.contains('tête') || lower.contains('🤕')) return 'mal_de_tete';
    if (lower.contains('nausée') || lower.contains('🤢')) return 'nausee';
    if (lower.contains('froid') || lower.contains('🥶')) return 'froid';
    if (lower.contains('clarté') || lower.contains('🧠')) return 'clarte';
    if (lower.contains('euphor') || lower.contains('🌟')) return 'euphorie';
    if (lower.contains('vertige') || lower.contains('😵')) return 'vertige';
    if (lower.contains('calme') || lower.contains('🧘')) return 'calme';
    if (lower.contains('anxieu') || lower.contains('😰')) return 'anxieux';
    return 'inconnu';
  }

  static final Map<String, Map<String, CoachAdvice>> _symptomAdvice = {
    'morse': {
      'bien': const CoachAdvice(
        symptom: 'Bien', emoji: '😊',
        quote: 'Morse : Ton corps est en harmonie avec le processus de nettoyage.',
        explanation: 'La filtration lymphatique progresse sans résistance. Excellent signe.',
        actionTip: 'Continue ainsi ! Maintiens ton hydratation.',
      ),
      'faim': const CoachAdvice(
        symptom: 'Faim', emoji: '😋',
        quote: 'Morse : La faim est un signal du mental, pas du corps.',
        explanation: 'Les premières heures de faim sont psychologiques. Le corps a des réserves suffisantes.',
        actionTip: 'Bois de l\'eau tiède avec un peu de citron. La faim passera en 20-30 min.',
      ),
      'fatigue': const CoachAdvice(
        symptom: 'Fatigue', emoji: '😴',
        quote: 'Morse : La fatigue pendant le jeûne est un signe que les surrénales travaillent.',
        explanation: 'Ton corps redirige son énergie vers le nettoyage. C\'est temporaire.',
        actionTip: 'Repose-toi. Évite l\'exercice intense. Un rebounder léger peut aider la lymphe.',
      ),
      'mal_de_tete': const CoachAdvice(
        symptom: 'Mal de tête', emoji: '🤕',
        quote: 'Morse : Les maux de tête sont des toxines qui se libèrent du cerveau et de la lymphe.',
        explanation: 'Le système lymphatique draine les déchets accumulés. La tête est souvent le premier signe.',
        actionTip: 'Bois de l\'eau de source. Applique une compresse froide sur le front. Repose-toi.',
      ),
      'nausee': const CoachAdvice(
        symptom: 'Nausée', emoji: '🤢',
        quote: 'Morse : La nausée indique que le foie libère de la bile chargée de toxines.',
        explanation: 'C\'est un excellent signe de détoxification. Le corps évacue ce qui l\'encombrait.',
        actionTip: 'Petites gorgées d\'eau tiède avec citron. Respire profondément. Si ça persiste, envisage de briser.',
      ),
      'froid': const CoachAdvice(
        symptom: 'Froid', emoji: '🥶',
        quote: 'Morse : Le froid est dû à la vasoconstriction — le sang va vers les organes internes pour nettoyer.',
        explanation: 'Le métabolisme ralentit pour économiser de l\'énergie et la concentrer sur la guérison.',
        actionTip: 'Couvre-toi bien. Marche légèrement pour stimuler la circulation.',
      ),
      'clarte': const CoachAdvice(
        symptom: 'Clarté', emoji: '🧠',
        quote: 'Morse : La clarté mentale est le signe que le cerveau se nettoie de la congestion lymphatique.',
        explanation: 'Les corps cétoniques nourrissent le cerveau efficacement. Tu en récoltes les bénéfices.',
        actionTip: 'Profite de cette clarté ! Médite, journal, ou simplement observe cette lucidité.',
      ),
      'euphorie': const CoachAdvice(
        symptom: 'Euphorie', emoji: '🌟',
        quote: 'Morse : L\'euphorie est la vitalité naturelle qui émerge quand les obstructions se dissolvent.',
        explanation: 'Ton système endocrinien produit des endorphines. Le corps célèbre son nettoyage.',
        actionTip: 'Savoure ce moment ! C\'est la preuve que le jeûne fonctionne.',
      ),
      'vertige': const CoachAdvice(
        symptom: 'Vertige', emoji: '😵',
        quote: 'Morse : Le vertige peut indiquer une déshydratation ou une chute de pression.',
        explanation: 'Les électrolytes changent pendant le jeûne. Le corps s\'adapte.',
        actionTip: 'Assieds-toi immédiatement. Bois de l\'eau lentement. Si ça persiste, brise le jeûne.',
      ),
      'calme': const CoachAdvice(
        symptom: 'Calme', emoji: '🧘',
        quote: 'Morse : Le calme profond est le signe que le système nerveux se rééquilibre.',
        explanation: 'Sans digestion, le système parasympathique domine. Paix intérieure naturelle.',
        actionTip: 'Médite ou fais des exercices de respiration pour amplifier cet état.',
      ),
      'anxieux': const CoachAdvice(
        symptom: 'Anxieux', emoji: '😰',
        quote: 'Morse : L\'anxiété peut être liée aux surrénales fatiguées qui se réveillent.',
        explanation: 'Le jeûne stimule les surrénales. Si elles sont affaiblies, l\'anxiété peut apparaître.',
        actionTip: 'Respire profondément. Marche dans la nature. L\'anxiété passera à mesure que les surrénales se renforcent.',
      ),
    },
    'ehret': {
      'bien': const CoachAdvice(
        symptom: 'Bien', emoji: '😊',
        quote: 'Ehret : Le bien-être signifie que l\'obstruction diminue — V = P − O.',
        explanation: 'Moins l\'obstruction est grande, plus la vitalité est élevée.',
        actionTip: 'Continue ! Ton corps se libère du mucus progressivement.',
      ),
      'faim': const CoachAdvice(
        symptom: 'Faim', emoji: '😋',
        quote: 'Ehret : La vraie faim est rare. Ce que tu ressens est l\'habitude.',
        explanation: 'Le corps est programmé par les horaires de repas. Ça s\'estompe.',
        actionTip: 'Distrait-toi avec une promenade ou de la lecture. La faim passera.',
      ),
      'fatigue': const CoachAdvice(
        symptom: 'Fatigue', emoji: '😴',
        quote: 'Ehret : La fatigue est le mucus qui se dissout dans le sang avant d\'être éliminé.',
        explanation: 'C\'est une crise de nettoyage. Le corps utilise son énergie pour évacuer les déchets.',
        actionTip: 'Repose-toi. Le jeûne rationnel demande de la patience.',
      ),
      'mal_de_tete': const CoachAdvice(
        symptom: 'Mal de tête', emoji: '🤕',
        quote: 'Ehret : Le mal de tête est le mucus qui se libère du cerveau.',
        explanation: 'Les dépôts de mucus accumulés pendant des années se dissolvent. C\'est inconfortable mais nécessaire.',
        actionTip: 'Eau tiède. Repos. Un lavement peut accélérer l\'élimination et soulager.',
      ),
      'nausee': const CoachAdvice(
        symptom: 'Nausée', emoji: '🤢',
        quote: 'Ehret : La nausée signifie que le mucus dissous entre dans le sang pour être évacué.',
        explanation: 'Le sang se charge temporairement de déchets. Le foie et les reins travaillent pour les filtrer.',
        actionTip: 'Petites gorgées d\'eau avec citron. Brise avec un demi-orange si c\'est trop intense.',
      ),
      'froid': const CoachAdvice(
        symptom: 'Froid', emoji: '🥶',
        quote: 'Ehret : Le froid est un signe que le métabolisme se recentre sur le nettoyage interne.',
        explanation: 'L\'énergie est redirigée. Le corps privilégie la guérison au confort thermique.',
        actionTip: 'Habille-toi chaudement. Un bain chaud peut aider.',
      ),
      'clarte': const CoachAdvice(
        symptom: 'Clarté', emoji: '🧠',
        quote: 'Ehret : Le jeûne avancé apporte une clarté mentale extraordinaire.',
        explanation: 'Le cerveau fonctionne mieux aux corps cétoniques qu\'au glucose. Tu le ressens.',
        actionTip: 'Profite-en pour réfléchir, écrire, ou méditer.',
      ),
      'euphorie': const CoachAdvice(
        symptom: 'Euphorie', emoji: '🌟',
        quote: 'Ehret : L\'homme sain ne se fatigue pas — il est mouvement perpétuel.',
        explanation: 'Tu expérimentes un aperçu de la vitalité sans obstruction.',
        actionTip: 'Bouge ! Marche, danse, respire profondément. C\'est la vie qui s\'exprime.',
      ),
      'vertige': const CoachAdvice(
        symptom: 'Vertige', emoji: '😵',
        quote: 'Ehret : Le vertige indique une élimination trop rapide. Ralentis le processus.',
        explanation: 'Le corps libère plus de toxines qu\'il ne peut en évacuer.',
        actionTip: 'Assieds-toi. Bois de l\'eau. Envisage de briser doucement avec un fruit.',
      ),
      'calme': const CoachAdvice(
        symptom: 'Calme', emoji: '🧘',
        quote: 'Ehret : La Nature guérit, pas le médecin. Tu es sur le bon chemin.',
        explanation: 'Le calme profond est le signe que le corps se guérit naturellement.',
        actionTip: 'Reste dans cet état. Méditation et nature amplifient les bienfaits.',
      ),
      'anxieux': const CoachAdvice(
        symptom: 'Anxieux', emoji: '😰',
        quote: 'Ehret : L\'anxiété peut venir du mucus dissous qui irrite le système nerveux.',
        explanation: 'Les toxines en circulation peuvent temporairement perturber le système nerveux.',
        actionTip: 'Respiration profonde. Si l\'anxiété est forte, un lavement ou briser doucement.',
      ),
    },
    'sebi': {
      'bien': const CoachAdvice(
        symptom: 'Bien', emoji: '😊',
        quote: 'Sebi : Le corps est fait de minéraux. Quand le mucus part, les minéraux travaillent.',
        explanation: 'Les 102 minéraux essentiels se rééquilibrent naturellement pendant le jeûne.',
        actionTip: 'Excellent ! Continue et maintiens ton hydratation avec de l\'eau de source.',
      ),
      'faim': const CoachAdvice(
        symptom: 'Faim', emoji: '😋',
        quote: 'Sebi : La faim disparaît quand tu arrêtes de mettre des ordures dedans.',
        explanation: 'Le corps cherche par habitude. Les réserves sont suffisantes pour des jours.',
        actionTip: 'Eau de source. Si vraiment difficile, un thé d\'ortie ou de pissenlit.',
      ),
      'fatigue': const CoachAdvice(
        symptom: 'Fatigue', emoji: '😴',
        quote: 'Sebi : La fatigue est le mucus qui se détache. C\'est bon signe.',
        explanation: 'L\'énergie est redirigée vers l\'élimination de la compromission de la muqueuse.',
        actionTip: 'Repose-toi. Le corps fait un travail profond.',
      ),
      'mal_de_tete': const CoachAdvice(
        symptom: 'Mal de tête', emoji: '🤕',
        quote: 'Sebi : Le mal de tête vient des dépôts de calcium inorganique qui se dissolvent.',
        explanation: 'Le calcium inorganique accumulé se libère dans le sang pour être évacué.',
        actionTip: 'Eau de source abondante. Repos. Le fer bio-disponible aide — bois du thé de burdock.',
      ),
      'nausee': const CoachAdvice(
        symptom: 'Nausée', emoji: '🤢',
        quote: 'Sebi : La nausée est le signe que le corps expulse le mucus accumulé.',
        explanation: 'Le foie et la vésicule biliaire se purgent. C\'est un nettoyage en profondeur.',
        actionTip: 'Petites gorgées d\'eau tiède. Repose-toi. Si trop intense, brise avec de la papaye.',
      ),
      'froid': const CoachAdvice(
        symptom: 'Froid', emoji: '🥶',
        quote: 'Sebi : Le fer est l\'étincelle de la vie. Le froid peut indiquer un manque de fer bio.',
        explanation: 'Le fer bio-disponible est essentiel pour la circulation et la chaleur corporelle.',
        actionTip: 'Couvre-toi. Après le jeûne, consomme des aliments riches en fer bio (sarsaparilla, burdock).',
      ),
      'clarte': const CoachAdvice(
        symptom: 'Clarté', emoji: '🧠',
        quote: 'Sebi : Quand le mucus part du cerveau, la pensée devient cristalline.',
        explanation: 'Le mucus encombre le cerveau autant que le corps. Le jeûne le libère.',
        actionTip: 'Médite et profite de cette clarté. Elle est un aperçu de ta santé naturelle.',
      ),
      'euphorie': const CoachAdvice(
        symptom: 'Euphorie', emoji: '🌟',
        quote: 'Sebi : C\'est la vie qui s\'exprime quand tu cesses de l\'encombrer.',
        explanation: 'Le corps libéré de mucus vibre à sa fréquence naturelle. Pure vitalité.',
        actionTip: 'Savoure ! C\'est la preuve que le protocole fonctionne.',
      ),
      'vertige': const CoachAdvice(
        symptom: 'Vertige', emoji: '😵',
        quote: 'Sebi : Le vertige peut signifier un nettoyage rapide ou une carence en minéraux.',
        explanation: 'Le corps libère beaucoup de toxines d\'un coup. Les électrolytes changent.',
        actionTip: 'Assieds-toi. Bois de l\'eau de source lentement. Si ça persiste, brise le jeûne.',
      ),
      'calme': const CoachAdvice(
        symptom: 'Calme', emoji: '🧘',
        quote: 'Sebi : L\'eau est le premier médicament. Quand le corps est propre, l\'esprit l\'est aussi.',
        explanation: 'Le système nerveux fonctionne mieux sans mucus. La paix intérieure est naturelle.',
        actionTip: 'Profite de ce calme pour réfléchir à tes objectifs de santé.',
      ),
      'anxieux': const CoachAdvice(
        symptom: 'Anxieux', emoji: '😰',
        quote: 'Sebi : L\'anxiété vient souvent d\'un système nerveux encombré de mucus.',
        explanation: 'Le nettoyage peut temporairement amplifier l\'anxiété avant de la résoudre.',
        actionTip: 'Respire. Marche pieds nus dans l\'herbe. Le contact avec la terre aide.',
      ),
    },
  };

  // ── GOAL MOTIVATION ────────────────────────────────────────────────────────

  static String motivationForGoal(String goal, String protocol, int elapsedHours) {
    final key = '${goal}_${_hourBucket(elapsedHours)}';
    final map = _goalMotivation[protocol] ?? _goalMotivation['morse']!;
    return map[key] ?? map['${goal}_early'] ?? 'Continue, tu fais un travail formidable ! 💪';
  }

  static String _hourBucket(int hours) {
    if (hours < 12) return 'early';
    if (hours < 24) return 'mid';
    return 'deep';
  }

  static final Map<String, Map<String, String>> _goalMotivation = {
    'morse': {
      'detox_early': '💧 Morse : Le drainage lymphatique commence. Chaque heure compte pour la détox.',
      'detox_mid': '🔥 Morse : La cétose dissout les acides stockés. Tes reins filtrent activement.',
      'detox_deep': '♻️ Morse : Nettoyage profond des tissus interstitiels. Vérifie tes urines — la filtration devrait être visible.',
      'weight_loss_early': '⚖️ Morse : Le corps épuise le glycogène. La combustion des graisses arrive bientôt.',
      'weight_loss_mid': '⚖️ Morse : Tu brûles des graisses ! Les acides stockés dans le tissu adipeux se libèrent.',
      'weight_loss_deep': '⚖️ Morse : Perte de poids significative en cours. Le corps reconfigure son métabolisme.',
      'clarity_early': '🧠 Morse : Le cerveau commence à se désencombrer de la congestion lymphatique.',
      'clarity_mid': '🧠 Morse : Les corps cétoniques nourrissent le cerveau. La clarté arrive.',
      'clarity_deep': '🧠 Morse : Clarté mentale maximale. Le cerveau fonctionne de manière optimale.',
      'autophagy_early': '♻️ Morse : L\'autophagie se prépare. Encore quelques heures avant l\'activation.',
      'autophagy_mid': '♻️ Morse : Tu approches de l\'autophagie. Le corps commence à recycler les cellules endommagées.',
      'autophagy_deep': '♻️ Morse : Autophagie active ! Les cellules se renouvellent. Régénération en cours.',
      'spiritual_early': '🙏 Morse : Le jeûne est un acte sacré. Médite et connecte-toi à ton intention.',
      'spiritual_mid': '🙏 Morse : Ton esprit s\'éclaircit. Le jeûne crée l\'espace pour la connexion intérieure.',
      'spiritual_deep': '🙏 Morse : Tu es en territoire sacré. L\'esprit et le corps se réalignent.',
      'discipline_early': '💪 Morse : La discipline forge la volonté. Chaque minute compte.',
      'discipline_mid': '💪 Morse : Tu dépasses tes limites perçues. La vraie force est mentale.',
      'discipline_deep': '💪 Morse : Discipline de fer. Tu prouves à ton corps qui commande.',
    },
    'ehret': {
      'detox_early': '🌿 Ehret : L\'obstruction commence à diminuer. Le nettoyage est en marche.',
      'detox_mid': '🔥 Ehret : Le mucus brûle dans les graisses. V = P − O — la vitalité monte.',
      'detox_deep': '♻️ Ehret : Nettoyage profond. Le médecin intérieur opère à plein régime.',
      'weight_loss_early': '⚖️ Ehret : Le corps consomme le glycogène. Les réserves graisseuses sont la prochaine cible.',
      'weight_loss_mid': '⚖️ Ehret : Les graisses chargées de mucus brûlent. Double nettoyage en cours.',
      'weight_loss_deep': '⚖️ Ehret : Perte significative. Le corps se débarrasse du poids inutile.',
      'clarity_early': '🧠 Ehret : Le cerveau commence à se libérer du mucus. Patience.',
      'clarity_mid': '🧠 Ehret : La clarté mentale s\'installe. Le jeûne rationnel porte ses fruits.',
      'clarity_deep': '🧠 Ehret : Clarté extraordinaire. L\'esprit est libre de toute obstruction.',
      'autophagy_early': '♻️ Ehret : Le recyclage cellulaire se prépare. Continue.',
      'autophagy_mid': '♻️ Ehret : L\'autophagie s\'approche. Les protéines endommagées seront bientôt recyclées.',
      'autophagy_deep': '♻️ Ehret : Autophagie active ! Le corps se reconstruit de l\'intérieur.',
      'spiritual_early': '🙏 Ehret : Le jeûne est la clé de la cuisine de Dieu.',
      'spiritual_mid': '🙏 Ehret : L\'esprit se clarifie quand le mucus se dissout.',
      'spiritual_deep': '🙏 Ehret : Tu accèdes à un état de conscience que seul le jeûne peut offrir.',
      'discipline_early': '💪 Ehret : Le jeûne rationnel demande de la patience. Tu progresses.',
      'discipline_mid': '💪 Ehret : Ta discipline porte ses fruits. Le corps te remercie.',
      'discipline_deep': '💪 Ehret : Maîtrise impressionnante. La Nature te récompense.',
    },
    'sebi': {
      'detox_early': '🍃 Sebi : Le corps redirige l\'énergie vers l\'élimination du mucus.',
      'detox_mid': '🔥 Sebi : Les dépôts de mucus se dissolvent. Nettoyage en profondeur.',
      'detox_deep': '♻️ Sebi : Nettoyage intracellulaire actif. Les 102 minéraux se rééquilibrent.',
      'weight_loss_early': '⚖️ Sebi : Le corps commence à puiser dans ses réserves.',
      'weight_loss_mid': '⚖️ Sebi : Les graisses chargées de mucus brûlent. Libération en cours.',
      'weight_loss_deep': '⚖️ Sebi : Le corps retrouve son poids naturel, sans mucus ni acidité.',
      'clarity_early': '🧠 Sebi : Le mucus quitte le cerveau. La pensée s\'éclaircit.',
      'clarity_mid': '🧠 Sebi : La clarté arrive. Le cerveau se libère de l\'encombrement.',
      'clarity_deep': '🧠 Sebi : Pensée cristalline. Le cerveau fonctionne sans obstruction.',
      'autophagy_early': '♻️ Sebi : Les cellules se préparent au nettoyage profond.',
      'autophagy_mid': '♻️ Sebi : L\'autophagie approche. Les cellules recyclent le vieux mucus.',
      'autophagy_deep': '♻️ Sebi : Autophagie active ! Le corps se régénère au niveau cellulaire.',
      'spiritual_early': '🙏 Sebi : Le jeûne purifie le corps et l\'esprit.',
      'spiritual_mid': '🙏 Sebi : L\'esprit se libère quand le corps se nettoie.',
      'spiritual_deep': '🙏 Sebi : Connexion profonde avec ta nature. Le mucus ne voile plus ta conscience.',
      'discipline_early': '💪 Sebi : La discipline est le chemin vers la guérison.',
      'discipline_mid': '💪 Sebi : Tu prouves ta force intérieure. Le corps obéit à l\'esprit.',
      'discipline_deep': '💪 Sebi : Maîtrise totale. Le fer est l\'étincelle — tu l\'allumes.',
    },
  };

  // ── COMMON Q&A ─────────────────────────────────────────────────────────────

  static List<CoachQA> qaForProtocol(String protocol) {
    switch (protocol) {
      case 'morse':
        return _qaMorse;
      case 'ehret':
        return _qaEhret;
      default:
        return _qaSebi;
    }
  }

  static const _qaMorse = [
    CoachQA(
      question: 'Est-ce que je peux boire du café pendant le jeûne ?',
      answer: 'Morse : Non. Le café est un stimulant des surrénales et acide. Il sabote la filtration rénale. Eau, citron, ou tisane uniquement.',
      emoji: '☕',
    ),
    CoachQA(
      question: 'Dois-je prendre des compléments ?',
      answer: 'Morse : Les herbes (teintures, capsules) sont acceptables et aident la filtration. Pas de compléments synthétiques.',
      emoji: '💊',
    ),
    CoachQA(
      question: 'Est-ce que le jeûne est sûr si je suis débutant ?',
      answer: 'Morse : Commence par un jeûne intermittent 16:8. Augmente progressivement. Écoute ton corps et vérifie tes urines.',
      emoji: '🔰',
    ),
    CoachQA(
      question: 'Quand devrais-je briser le jeûne ?',
      answer: 'Morse : Brise quand ton corps le demande — vertige persistant, faiblesse extrême, ou si tu as atteint ton objectif.',
      emoji: '🍇',
    ),
    CoachQA(
      question: 'Le jeûne peut-il aider mes problèmes de peau ?',
      answer: 'Morse : Absolutement. La peau est le 3ème rein. Le jeûne aide le système lymphatique à drainer les toxines cutanées.',
      emoji: '✨',
    ),
    CoachQA(
      question: 'Puis-je faire du sport pendant le jeûne ?',
      answer: 'Morse : Léger uniquement. Le rebounder est idéal pour la lymphe. Évite le cardio intense qui fatigue les surrénales.',
      emoji: '🏃',
    ),
  ];

  static const _qaEhret = [
    CoachQA(
      question: 'Est-ce que je peux boire du café pendant le jeûne ?',
      answer: 'Ehret : Le café crée du mucus et stimule artificiellement. Eau, tisane, ou bouillon de légumes léger.',
      emoji: '☕',
    ),
    CoachQA(
      question: 'Comment gérer la crise de nettoyage ?',
      answer: 'Ehret : C\'est normal ! Le mucus dissous entre dans le sang. Ralentis le processus si c\'est trop intense — brise avec un fruit.',
      emoji: '🌊',
    ),
    CoachQA(
      question: 'Combien de jeûnes par semaine ?',
      answer: 'Ehret : Le jeûne rationnel est progressif. Un 16:8 quotidien est un excellent début. Augmente vers 24h une fois par semaine.',
      emoji: '📅',
    ),
    CoachQA(
      question: 'Quand devrais-je briser le jeûne ?',
      answer: 'Ehret : Quand les symptômes sont trop intenses ou que ton objectif est atteint. Brise toujours avec un fruit — demi-orange idéalement.',
      emoji: '🍊',
    ),
    CoachQA(
      question: 'Le lavement aide-t-il pendant le jeûne ?',
      answer: 'Ehret : Oui ! Le lavement accélère l\'évacuation du mucus dissous et réduit les crises de nettoyage.',
      emoji: '💧',
    ),
    CoachQA(
      question: 'Puis-je faire du sport pendant le jeûne ?',
      answer: 'Ehret : Marche, exercices de respiration, et étirements. Évite le sport intense qui génère de l\'acide lactique.',
      emoji: '🏃',
    ),
  ];

  static const _qaSebi = [
    CoachQA(
      question: 'Est-ce que je peux boire du café pendant le jeûne ?',
      answer: 'Sebi : Non. Le café n\'est pas sur le guide nutritionnel. Il est acide et encombre le corps de mucus.',
      emoji: '☕',
    ),
    CoachQA(
      question: 'Quelle eau dois-je boire ?',
      answer: 'Sebi : L\'eau de source naturelle. L\'eau du robinet contient du fluor et du chlore — des poisons pour le corps.',
      emoji: '💧',
    ),
    CoachQA(
      question: 'Combien de temps puis-je jeûner ?',
      answer: 'Sebi : Commence par 24h si tu es expérimenté. Débutants : 16h. Le corps te dira quand arrêter — écoute-le.',
      emoji: '⏱️',
    ),
    CoachQA(
      question: 'Quand devrais-je briser le jeûne ?',
      answer: 'Sebi : Avec un fruit du guide nutritionnel — papaye, mangue, ou seeded grapes. Petite quantité d\'abord.',
      emoji: '🍈',
    ),
    CoachQA(
      question: 'Le jeûne aide-t-il contre le mucus ?',
      answer: 'Sebi : Le jeûne est l\'outil n°1 contre le mucus. Il n\'y a qu\'une seule maladie — la compromission de la muqueuse. Le jeûne la résout.',
      emoji: '🧬',
    ),
    CoachQA(
      question: 'Puis-je faire du sport pendant le jeûne ?',
      answer: 'Sebi : Léger. Marche, yoga, tai chi. Ton corps a besoin d\'énergie pour nettoyer, pas pour le sport.',
      emoji: '🏃',
    ),
  ];
}
