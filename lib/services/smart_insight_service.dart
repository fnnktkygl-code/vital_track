import 'dart:math';
import 'package:vital_track/models/food.dart';

/// Génère des insights contextuels basés sur l'état actuel de l'application.
class SmartInsightService {
  static final _rng = Random();

  /// Génère un insight contextuel
  static SmartInsight getInsight({
    required String modeId,
    required List<Food> mealItems,
    required int? mealScore,
    required bool isFasting,
    required Duration fastingElapsed,
    required int fastingStreak,
    bool isBreathing = false,
    int breathingStreak = 0,
  }) {
    final hour = DateTime.now().hour;
    final insights = <SmartInsight>[];

    // ── INSIGHTS BASÉS SUR L'HEURE ──────────────────────────────────────────
    if (hour >= 5 && hour < 8) {
      insights.addAll(_morningInsights(modeId, mealItems, isFasting));
    } else if (hour >= 8 && hour < 12) {
      insights.addAll(_midMorningInsights(modeId, mealItems, isFasting));
    } else if (hour >= 12 && hour < 14) {
      insights.addAll(_lunchInsights(modeId, mealItems));
    } else if (hour >= 14 && hour < 18) {
      insights.addAll(_afternoonInsights(modeId, mealItems, mealScore));
    } else if (hour >= 18 && hour < 21) {
      insights.addAll(_eveningInsights(modeId, mealItems, mealScore));
    } else {
      insights.addAll(_nightInsights(modeId, isFasting));
    }

    // ── INSIGHTS DE JEÛNE ───────────────────────────────────────────────────
    if (isFasting) {
      insights.addAll(_fastingInsights(modeId, fastingElapsed, fastingStreak));
    }

    // ── INSIGHTS DE RESPIRATION ────────────────────────────────────────────
    insights.addAll(_breathingInsights(modeId, hour, isFasting, breathingStreak));

    // ── INSIGHTS DE REPAS ───────────────────────────────────────────────────
    if (mealItems.isNotEmpty) {
      insights.addAll(_mealInsights(modeId, mealItems, mealScore));
    }

    // ── SAGESSE QUOTIDIENNE SPÉCIFIQUE AU PROTOCOLE ─────────────────────────
    insights.addAll(_dailyWisdom(modeId));

    if (insights.isEmpty) {
      return _fallbackInsight(modeId);
    }

    insights.sort((a, b) => b.priority.compareTo(a.priority));
    final topN = insights.length >= 3 ? 3 : insights.length;
    return insights[_rng.nextInt(topN)];
  }

  // ── MATIN (5-8h) ────────────────────────────────────────────────────────
  static List<SmartInsight> _morningInsights(String mode, List<Food> meal, bool fasting) {
    final insights = <SmartInsight>[];

    if (fasting) {
      // Non-const ici car 'source' dépend de la variable 'mode'
      insights.add(SmartInsight(
        icon: "🌅",
        title: "Jeûne matinal en cours",
        body: "Votre corps est en mode nettoyage depuis la nuit. L'eau citronnée tiède peut soutenir l'élimination sans rompre le jeûne profond.",
        source: mode == "morse" ? "Dr. Morse" : mode == "ehret" ? "Arnold Ehret" : "Dr. Sebi",
        category: InsightCategory.fasting,
        priority: 8,
      ));
    }

    if (meal.isEmpty && !fasting) {
      if (mode == "ehret") {
        insights.add(const SmartInsight(
          icon: "🍊",
          title: "Premier repas idéal",
          body: "Ehret recommande de briser le jeûne nocturne avec un mono-fruit : oranges, raisins ou pamplemousse. Jamais de céréales ou pain.",
          source: "Arnold Ehret",
          category: InsightCategory.mealSuggestion,
          priority: 9,
        ));
      } else if (mode == "morse") {
        insights.add(const SmartInsight(
          icon: "🍇",
          title: "Activation matinale",
          body: "Le matin, les fruits astringents (raisins, baies, agrumes) activent la filtration rénale après le repos nocturne. Commencez par un mono-fruit.",
          source: "Dr. Morse",
          category: InsightCategory.mealSuggestion,
          priority: 9,
        ));
      } else {
        insights.add(const SmartInsight(
          icon: "⚡",
          title: "Énergie du matin",
          body: "Dr. Sebi recommande de commencer par de l'eau de source naturelle, puis un fruit du guide : mangue, papaye, ou baies avec pépins.",
          source: "Dr. Sebi",
          category: InsightCategory.mealSuggestion,
          priority: 9,
        ));
      }
    }

    insights.add(const SmartInsight(
      icon: "💧",
      title: "Hydratation matinale",
      body: "Un verre d'eau de source au réveil réhydrate les cellules après 8h de jeûne nocturne. Ajoutez du citron pour activer le drainage lymphatique.",
      source: "Dr. Morse",
      category: InsightCategory.hydration,
      priority: 7,
    ));

    return insights;
  }

  // ── MI-MATIN (8-12h) ─────────────────────────────────────────────────────
  static List<SmartInsight> _midMorningInsights(String mode, List<Food> meal, bool fasting) {
    final insights = <SmartInsight>[];

    if (fasting) {
      insights.add(SmartInsight(
        icon: "🧘",
        title: "Fenêtre de nettoyage",
        body: "Pendant le jeûne, le corps redirige l'énergie de la digestion vers l'élimination. Des mouvements doux ou de la respiration profonde amplifient ce processus.",
        source: mode == "ehret" ? "Arnold Ehret" : "Dr. Morse",
        category: InsightCategory.fasting,
        priority: 7,
      ));
    }

    if (meal.isEmpty && !fasting) {
      insights.add(const SmartInsight(
        icon: "🫐",
        title: "Collation vitaliste",
        body: "Les baies sont l'aliment idéal de mi-matinée : elles nourrissent le cerveau, nettoient la lymphe, et se digèrent en 30 minutes.",
        source: "Dr. Morse",
        category: InsightCategory.mealSuggestion,
        priority: 6,
      ));
    }

    return insights;
  }

  // ── MIDI (12-14h) ────────────────────────────────────────────────────────
  static List<SmartInsight> _lunchInsights(String mode, List<Food> meal) {
    final insights = <SmartInsight>[];

    if (meal.isEmpty) {
      if (mode == "ehret") {
        insights.add(const SmartInsight(
          icon: "🥗",
          title: "Repas de midi",
          body: "Midi est le moment idéal pour une grande salade verte avec jus de citron, suivie de légumes cuits si vous êtes en phase de transition.",
          source: "Arnold Ehret",
          category: InsightCategory.mealSuggestion,
          priority: 8,
        ));
      } else if (mode == "morse") {
        insights.add(const SmartInsight(
          icon: "🍈",
          title: "Repas astringent",
          body: "Le système digestif est à son pic d'efficacité. Un repas de fruits astringents (raisins, agrumes) maximise le nettoyage lymphatique.",
          source: "Dr. Morse",
          category: InsightCategory.mealSuggestion,
          priority: 8,
        ));
      } else {
        insights.add(const SmartInsight(
          icon: "🌿",
          title: "Repas électrique",
          body: "Composez votre assiette uniquement avec des aliments du guide Sebi. Quinoa + légumes-feuilles + avocat = combinaison nourrissante.",
          source: "Dr. Sebi",
          category: InsightCategory.mealSuggestion,
          priority: 8,
        ));
      }
    }

    return insights;
  }

  // ── APRÈS-MIDI (14-18h) ──────────────────────────────────────────────────
  static List<SmartInsight> _afternoonInsights(String mode, List<Food> meal, int? score) {
    final insights = <SmartInsight>[];

    if (score != null && score < 40) {
      insights.add(SmartInsight(
        icon: "🔄",
        title: "Rééquilibrage possible",
        body: "Votre score est bas. Ajoutez un fruit astringent (raisin, citron, baies) pour relever le potentiel vital de votre repas.",
        source: mode == "morse" ? "Dr. Morse" : "Trophologie",
        category: InsightCategory.scoreWarning,
        priority: 9,
      ));
    }

    insights.add(const SmartInsight(
      icon: "🚶",
      title: "Mouvement lymphatique",
      body: "L'après-midi est idéal pour une marche de 20-30 minutes. Le système lymphatique n'a pas de pompe — il dépend du mouvement physique.",
      source: "Dr. Morse",
      category: InsightCategory.movement,
      priority: 6,
    ));

    return insights;
  }

  // ── SOIR (18-21h) ────────────────────────────────────────────────────────
  static List<SmartInsight> _eveningInsights(String mode, List<Food> meal, int? score) {
    final insights = <SmartInsight>[];

    insights.add(SmartInsight(
      icon: "🌙",
      title: "Repas léger ce soir",
      body: mode == "ehret"
          ? "Ehret recommande le repas du soir le plus léger possible. Un fruit ou rien — laissez le corps se préparer au jeûne nocturne."
          : "Un repas léger le soir permet au corps de se concentrer sur la régénération pendant le sommeil plutôt que sur la digestion.",
      source: mode == "ehret" ? "Arnold Ehret" : "Dr. Morse",
      category: InsightCategory.mealSuggestion,
      priority: 7,
    ));

    if (meal.length >= 4) {
      insights.add(const SmartInsight(
        icon: "⚠️",
        title: "Diversité excessive",
        body: "Trop de variété dans un repas surcharge la digestion. Les 3 protocoles recommandent le mono-eating (un seul type d'aliment par repas).",
        source: "Trophologie",
        category: InsightCategory.trophology,
        priority: 8,
      ));
    }

    if (score != null && score >= 75) {
      insights.add(SmartInsight(
        icon: "🏆",
        title: "Excellent score !",
        body: "Votre repas d'aujourd'hui alcalinise et nourrit vos cellules. Continuez ainsi pour une régénération profonde.",
        source: mode == "morse" ? "Dr. Morse" : mode == "ehret" ? "Arnold Ehret" : "Dr. Sebi",
        category: InsightCategory.encouragement,
        priority: 7,
      ));
    }

    return insights;
  }

  // ── NUIT (21h-5h) ─────────────────────────────────────────────────────────
  static List<SmartInsight> _nightInsights(String mode, bool fasting) {
    return [
      const SmartInsight(
        icon: "😴",
        title: "Régénération nocturne",
        body: "Entre 22h et 2h, le corps entre en mode réparation profonde. Le foie et le système lymphatique se nettoient pendant votre sommeil.",
        source: "Dr. Morse",
        category: InsightCategory.rest,
        priority: 7,
      ),
      const SmartInsight(
        icon: "🌙",
        title: "Jeûne nocturne naturel",
        body: "Chaque nuit est un mini-jeûne. Plus vous arrêtez de manger tôt, plus le corps a de temps pour la détoxification nocturne.",
        source: "Arnold Ehret",
        category: InsightCategory.fasting,
        priority: 6,
      ),
    ];
  }

  // ── JEÛNE ───────────────────────────────────────────────────────────────
  static List<SmartInsight> _fastingInsights(String mode, Duration elapsed, int streak) {
    final insights = <SmartInsight>[];
    final hours = elapsed.inHours;

    if (hours >= 12 && hours < 16) {
      insights.add(const SmartInsight(
        icon: "🔥",
        title: "Transition cétose",
        body: "Après 12h, le corps épuise le glycogène et commence à brûler les graisses. C'est le début du nettoyage métabolique profond.",
        source: "Arnold Ehret",
        category: InsightCategory.fasting,
        priority: 9,
      ));
    } else if (hours >= 16 && hours < 24) {
      insights.add(const SmartInsight(
        icon: "♻️",
        title: "Autophagie activée",
        body: "Après 16h, l'autophagie cellulaire s'intensifie. Le corps recycle les protéines endommagées et les cellules défectueuses.",
        source: "Dr. Morse",
        category: InsightCategory.fasting,
        priority: 10,
      ));
    } else if (hours >= 24 && hours < 48) {
      insights.add(const SmartInsight(
        icon: "🧬",
        title: "Nettoyage profond",
        body: "24h+ de jeûne : la régénération cellulaire s'accélère. Buvez de l'eau de source. Reposez-vous si nécessaire — c'est normal.",
        source: "Dr. Morse",
        category: InsightCategory.fasting,
        priority: 10,
      ));
    } else if (hours >= 48) {
      insights.add(const SmartInsight(
        icon: "✨",
        title: "Régénération avancée",
        body: "48h+ : le système immunitaire se régénère. Les cellules souches sont stimulées. Écoutez votre corps attentivement.",
        source: "Dr. Morse",
        category: InsightCategory.fasting,
        priority: 10,
      ));
    }

    if (hours < 12) {
      insights.add(const SmartInsight(
        icon: "🔋",
        title: "Phase glycogène",
        body: "Les premières 12h, le corps utilise le glucose stocké. Restez hydraté et actif — la marche aide le processus d'élimination.",
        source: "Arnold Ehret",
        category: InsightCategory.fasting,
        priority: 7,
      ));
    }

    if (streak >= 3) {
      // Non-const à cause de l'interpolation de $streak
      insights.add(SmartInsight(
        icon: "🔥",
        title: "Série de $streak jours !",
        body: "Votre régularité dans le jeûne renforce chaque cycle de nettoyage. Ehret recommandait des jeûnes courts et répétés pour un maximum d'efficacité.",
        source: "Arnold Ehret",
        category: InsightCategory.encouragement,
        priority: 8,
      ));
    }

    return insights;
  }

  // ── REPAS ───────────────────────────────────────────────────────────────
  static List<SmartInsight> _mealInsights(String mode, List<Food> items, int? score) {
    final insights = <SmartInsight>[];

    final hasFruit = items.any((f) => f.family.toLowerCase().contains('fruit'));
    final hasVeg = items.any((f) => f.family.toLowerCase().contains('légume'));
    final hasBad = items.any((f) => !f.approved);
    final allApproved = items.every((f) => f.approved);

    if (hasFruit && hasVeg) {
      insights.add(const SmartInsight(
        icon: "⚗️",
        title: "Combinaison fruit + légume",
        body: "Ehret et Morse déconseillent de mélanger fruits et légumes au même repas. Les fruits fermentent au-dessus des légumes en digestion.",
        source: "Arnold Ehret",
        category: InsightCategory.trophology,
        priority: 9,
      ));
    }

    if (hasBad) {
      insights.add(SmartInsight(
        icon: "🔄",
        title: "Aliments à surveiller",
        body: mode == "sebi"
            ? "Certains aliments ne figurent pas dans le guide Sebi. Remplacez-les par des alternatives électriques approuvées."
            : mode == "ehret"
            ? "Des aliments mucogènes sont présents. En phase de transition, réduisez progressivement."
            : "Votre repas contient des aliments acidifiants. Ajoutez des fruits astringents pour compenser.",
        source: mode == "sebi" ? "Dr. Sebi" : mode == "ehret" ? "Arnold Ehret" : "Dr. Morse",
        category: InsightCategory.scoreWarning,
        priority: 8,
      ));
    }

    if (allApproved && items.length >= 2) {
      insights.add(SmartInsight(
        icon: "🌟",
        title: "Repas 100% approuvé",
        body: "Tous vos aliments sont validés par le protocole actif. Votre terrain s'alcalinise et vos cellules se régénèrent.",
        source: mode == "sebi" ? "Dr. Sebi" : mode == "ehret" ? "Arnold Ehret" : "Dr. Morse",
        category: InsightCategory.encouragement,
        priority: 7,
      ));
    }

    return insights;
  }

  // ── SAGESSE ─────────────────────────────────────────────────────────────
  static List<SmartInsight> _dailyWisdom(String mode) {
    final dayOfYear = DateTime.now().difference(DateTime(DateTime.now().year)).inDays;

    if (mode == "sebi") {
      return [_sebiWisdom[dayOfYear % _sebiWisdom.length]];
    } else if (mode == "ehret") {
      return [_ehretWisdom[dayOfYear % _ehretWisdom.length]];
    } else {
      return [_morseWisdom[dayOfYear % _morseWisdom.length]];
    }
  }

  static SmartInsight _fallbackInsight(String mode) {
    return SmartInsight(
      icon: "🌱",
      title: "Votre chemin vitaliste",
      body: "Chaque repas est une opportunité de nourrir vos cellules. Choisissez des aliments vivants, électriques, et naturels.",
      source: mode == "sebi" ? "Dr. Sebi" : mode == "ehret" ? "Arnold Ehret" : "Dr. Morse",
      category: InsightCategory.general,
      priority: 3,
    );
  }

  // ── BASES DE DONNÉES DE SAGESSE ──────────────────────────────────────────

  static const List<SmartInsight> _sebiWisdom = [
    SmartInsight(icon: "⚡", title: "Charge électrique", body: "Les aliments électriques vibrent à une fréquence capable de nourrir et recharger chaque cellule.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🌊", title: "Nettoyage intracellulaire", body: "La maladie commence à l'intérieur de la cellule. Les composés minéraux nettoient au niveau cellulaire.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "💧", title: "L'eau — premier médicament", body: "Un gallon d'eau de source par jour. L'eau est le premier véhicule d'élimination des toxines.", source: "Dr. Sebi", category: InsightCategory.hydration, priority: 5),
    SmartInsight(icon: "🚫", title: "Zéro hybride", body: "Brocoli, carotte, ail, maïs — tous hybrides selon Sebi. Ils manquent de charge électrique.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🌾", title: "Grains approuvés", body: "Fonio, Kamut, Teff, Quinoa : les seuls grains autorisés. Tous les autres produisent du mucus.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🍋", title: "Key Lime", body: "Le citron Key Lime avec pépins est l'un des alcalinisants les plus puissants du protocole Sebi.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🌵", title: "Édulcorants", body: "Seul le sirop d'agave pur et le sucre de dattes sont autorisés.", source: "Dr. Sebi", category: InsightCategory.education, priority: 5),
  ];

  static const List<SmartInsight> _ehretWisdom = [
    SmartInsight(icon: "📐", title: "V = P - O", body: "Vitalité = Puissance − Obstruction. Plus le corps est propre, plus l'énergie est disponible.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🫁", title: "Machine pneumatique", body: "Le corps humain est une machine à air. L'oxygène et les fruits sont les vrais carburants.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "👅", title: "Le miroir de la langue", body: "Un enduit blanc/jaune = le mucus s'élimine. Une langue claire = système propre.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🔄", title: "Transition progressive", body: "Ne sautez jamais au régime de fruits directement. La transition graduelle est ESSENTIELLE.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🍽️", title: "Mono-eating", body: "Un seul type d'aliment par repas est l'idéal selon Ehret.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🧹", title: "Mucus = maladie", body: "Chaque maladie est causée par l'accumulation de mucus. Éliminez le mucus et la maladie disparaît.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "⚡", title: "Énergie paradoxale", body: "La fatigue ne vient PAS du manque de nourriture, mais de l'excès d'obstruction.", source: "Arnold Ehret", category: InsightCategory.education, priority: 5),
  ];

  static const List<SmartInsight> _morseWisdom = [
    SmartInsight(icon: "💧", title: "Le système lymphatique", body: "La lymphe est l'égout du corps. Si elle stagne, chaque cellule baigne dans ses déchets.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🫘", title: "Surrénales — la clé", body: "Sans surrénales fortes, les reins ne filtrent pas, et la lymphe s'accumule.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🔬", title: "Iridologie", body: "L'iris est une carte du corps révélant les faiblesses héréditaires et la toxicité acquise.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🍇", title: "Raisins — roi des fruits", body: "Les raisins noirs avec pépins sont le nettoyant lymphatique le plus puissant.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🧪", title: "Acide vs Alcalin", body: "Il y a deux côtés de la chimie : le côté acide qui détruit, et le côté alcalin qui guérit.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🌿", title: "Herbes = pharmacie", body: "Dieu a mis une pharmacie dans chaque fruit et herbe.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
    SmartInsight(icon: "🧘", title: "Émotions et guérison", body: "La peur acidifie le corps autant que la mauvaise nourriture.", source: "Dr. Morse", category: InsightCategory.education, priority: 5),
  ];

  // ── BREATHING INSIGHTS ──────────────────────────────────────────────────
  static List<SmartInsight> _breathingInsights(String mode, int hour, bool isFasting, int streak) {
    final insights = <SmartInsight>[];

    // Morning: suggest WHM
    if (hour >= 5 && hour < 10) {
      if (mode == 'ehret') {
        insights.add(const SmartInsight(
          icon: '🌬️', title: 'Moteur à air-gaz',
          body: 'Ehret enseignait que la respiration correcte nourrit chaque cellule. '
              'Commencez la journée par 3 tours de WHM pour booster la vitalité.',
          source: 'Arnold Ehret', category: InsightCategory.breathing, priority: 6,
        ));
      } else if (mode == 'morse') {
        insights.add(const SmartInsight(
          icon: '🌬️', title: 'Drainage lymphatique matinal',
          body: 'La respiration profonde stimule la circulation lymphatique. '
              'Essayez le Wim Hof ce matin pour activer la filtration.',
          source: 'Dr. Morse', category: InsightCategory.breathing, priority: 6,
        ));
      } else {
        insights.add(const SmartInsight(
          icon: '🌬️', title: 'Oxygénation cellulaire',
          body: 'Le fer transporte l\'oxygène — la respiration profonde optimise '
              'l\'absorption minérale. Essayez une session de respiration.',
          source: 'Dr. Sebi', category: InsightCategory.breathing, priority: 6,
        ));
      }
    }

    // Evening: suggest relaxation
    if (hour >= 20) {
      insights.add(SmartInsight(
        icon: '🌙', title: 'Relaxation avant sommeil',
        body: 'La respiration lente 1:2 stimule le nerf vague et réduit le cortisol. '
            '5 minutes suffisent pour préparer un sommeil réparateur.',
        source: mode == 'morse' ? 'Dr. Morse' : mode == 'ehret' ? 'Arnold Ehret' : 'Dr. Sebi',
        category: InsightCategory.breathing, priority: 7,
      ));
    }

    // During fasting: breathing amplifies benefits
    if (isFasting) {
      insights.add(SmartInsight(
        icon: '🫁', title: 'Respiration + jeûne',
        body: 'La respiration Wim Hof amplifie les bénéfices du jeûne : '
            'libération d\'adrénaline, suppression de l\'inflammation, '
            'et clarté mentale accrue.',
        source: mode == 'morse' ? 'Dr. Morse' : mode == 'ehret' ? 'Arnold Ehret' : 'Dr. Sebi',
        category: InsightCategory.breathing, priority: 7,
      ));
    }

    // Streak encouragement
    if (streak >= 3) {
      insights.add(SmartInsight(
        icon: '🔥', title: '$streak jours de respiration',
        body: 'Votre pratique régulière renforce le nerf vague, '
            'améliore la variabilité cardiaque et construit la résilience.',
        source: 'Wim Hof Method',
        category: InsightCategory.encouragement, priority: 8,
      ));
    }

    return insights;
  }
}

enum InsightCategory {
  mealSuggestion,
  fasting,
  hydration,
  movement,
  trophology,
  scoreWarning,
  encouragement,
  education,
  rest,
  breathing,
  general,
}

class SmartInsight {
  final String icon;
  final String title;
  final String body;
  final String source;
  final InsightCategory category;
  final int priority;

  const SmartInsight({
    required this.icon,
    required this.title,
    required this.body,
    required this.source,
    required this.category,
    required this.priority,
  });
}