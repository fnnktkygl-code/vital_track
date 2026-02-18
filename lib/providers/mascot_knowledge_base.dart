

/// All 9 moods matching the pigeon sprite sheet
enum MascotMood {
  talking,    // mouth slightly open · neutral info
  sad,        // teardrop · bad news
  stern,      // angry brow · strong warning
  scared,     // sweating, hands on cheeks · combo alert
  excited,    // wings spread · great news
  questioning, // ? mark · user needs guidance
  loving,     // heart · excellent food approved
  sleepy,     // night hat · end of day / low activity
  proud,      // medal · high vitality score
}

/// Reason the mascot was triggered
enum MascotTrigger {
  appLaunch,
  modeChanged,
  goodFoodAdded,
  badFoodAdded,
  trophologyWarning,
  highScore,
  lowScore,
  emptyMeal,
  scanStarted,
  scanComplete,
  searchHybrid,
  searchElectric,
  idle,
}

class MascotMessage {
  final String text;
  final MascotMood mood;
  final String? source; // "Sebi", "Ehret", "Morse"
  final bool dismissable;

  const MascotMessage({
    required this.text,
    required this.mood,
    this.source,
    this.dismissable = true,
  });
}

/// ─────────────────────────────────────────────────────────────────────────────
/// KNOWLEDGE BASE
/// ─────────────────────────────────────────────────────────────────────────────
class MascotKnowledgeBase {

  // ── DR. SEBI ────────────────────────────────────────────────────────────────
  static const List<MascotMessage> sebiTips = [
    MascotMessage(
      text: "⚡ Dr. Sebi enseignait que la maladie a UNE seule cause : l'accumulation de mucus dans le corps.",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌊 « Si un aliment n'est pas dans mon guide, il N'EST PAS recommandé. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "⚡ Les aliments électriques vibrent à une fréquence plus haute. Ils nourrissent la cellule sans l'encrasser.",
      mood: MascotMood.excited,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🚫 Sebi interdit les hybrides : brocoli, carotte, maïs, chou-fleur. Ce sont des inventions humaines sans énergie originelle.",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "💧 1 gallon d'eau de source naturelle par jour. L'eau est le premier médicament selon Sebi.",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🍋 Le citron Key Lime (avec pépins) est l'un des fruits les plus alcalinisants du protocole Sebi. Acide au goût, alcalin dans le sang.",
      mood: MascotMood.loving,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌾 Fonio, Kamut, Teff, Riz sauvage, Quinoa, Épeautre, Seigle, Amarante : les SEULS grains autorisés selon Dr. Sebi.",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🥑 L'avocat est approuvé par Sebi. Il nourrit le système nerveux et contient des acides gras électriques.",
      mood: MascotMood.loving,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "❌ Aucun produit animal, aucun lait, aucun poisson. Ce sont tous des aliments mucogènes selon Sebi.",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌵 Agave pur (de cactus) et sucre de dattes sont les seuls édulcorants autorisés selon le guide Sebi.",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🍉 Les melons avec pépins sont électriques. Les melons SANS pépins sont des hybrides rejetés par Sebi.",
      mood: MascotMood.questioning,
      source: "Dr. Sebi",
    ),
  ];

  // ── ARNOLD EHRET ────────────────────────────────────────────────────────────
  static const List<MascotMessage> ehretTips = [
    MascotMessage(
      text: "🌿 Ehret : « La vie est une tragédie de la nutrition. Presque tout ce que nous mangeons produit du mucus. »",
      mood: MascotMood.sad,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🔬 Le régime sans mucus d'Ehret repose sur un principe simple : les fruits et légumes crus forment la base de toute guérison.",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "⚗️ Ehret appelait le corps humain une « machine pneumatique » — elle fonctionne à l'air et au soleil, pas à la viande.",
      mood: MascotMood.excited,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🧹 « Chaque maladie, sans exception, est une crise de nettoyage. » — Arnold Ehret. Les symptômes sont de la guérison.",
      mood: MascotMood.questioning,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🍎 Ehret classait les fruits comme les aliments les plus proches du soleil. Une transition par les fruits est sa base de protocole.",
      mood: MascotMood.loving,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "⚠️ Ehret avertit : en phase de transition, la détox peut sembler une aggravation. Persévérez, c'est de la guérison.",
      mood: MascotMood.scared,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🌾 Ehret tolérait les céréales complètes en phase de transition uniquement. Pas à long terme. L'amidon est du « colle » digestive.",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "☀️ Le jeûne rationnel selon Ehret : commencer doucement, augmenter progressivement. Jamais brutal pour un débutant.",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "💨 « L'air et les fruits sont la nourriture de la vie. » Ehret pratiquait des périodes de respiration profonde en forêt.",
      mood: MascotMood.proud,
      source: "Arnold Ehret",
    ),
  ];

  // ── DR. ROBERT MORSE ────────────────────────────────────────────────────────
  static const List<MascotMessage> morseTips = [
    MascotMessage(
      text: "💧 Dr. Morse : tout commence par le système lymphatique. Les reins filtrent le sang — si tes reins dorment, tu accumules des acides.",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🍇 Morse prescrit les raisins (avec pépins), les melons, et les baies pour activer la filtration rénale et lymphatique.",
      mood: MascotMood.loving,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🌊 « La lymphe est l'océan intérieur de ton corps. » Un repas astringent aide à drainer les déchets cellulaires.",
      mood: MascotMood.excited,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🚨 Morse classe les protéines animales comme les pires acidifiants. Elles bouchent les tubules rénaux sur le long terme.",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🍉 Le melon d'eau (avec pépins) est le meilleur diurétique naturel selon Morse. À manger seul, jamais avec autre chose.",
      mood: MascotMood.proud,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🔄 Morse explique que la détox par les fruits crée des « crises de guérison » : douleurs temporaires = toxines qui sortent.",
      mood: MascotMood.scared,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🌿 Les herbes astringentes (framboise, fenouil, pissenlit) activent le mouvement lymphatique selon le protocole Morse.",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "💡 Morse : si tu urines trouble ou coloré après avoir mangé des fruits, c'est la lymphe qui filtre. C'est BON signe.",
      mood: MascotMood.questioning,
      source: "Dr. Morse",
    ),
  ];

  // ── TROPHOLOGY (Combinaisons alimentaires) ───────────────────────────────────
  static const List<MascotMessage> trophologyTips = [
    MascotMessage(
      text: "⚗️ Trophologie : ne jamais mélanger amidon + fruit acide. Fermentation intestinale garantie !",
      mood: MascotMood.scared,
      source: "Trophologie",
    ),
    MascotMessage(
      text: "🍉 Règle d'or : le melon se mange SEUL. Ni avant, ni après un repas. C'est unanime chez Sebi, Ehret et Morse.",
      mood: MascotMood.stern,
      source: "Trophologie",
    ),
    MascotMessage(
      text: "🥗 Les légumes verts + avocats + citron = combinaison parfaite selon les trois protocoles.",
      mood: MascotMood.loving,
      source: "Trophologie",
    ),
    MascotMessage(
      text: "⚠️ Protéine + amidon = putréfaction digestive selon Ehret. Exemple : viande + riz = combo à éviter absolument.",
      mood: MascotMood.scared,
      source: "Trophologie",
    ),
  ];

  // ── FOOD REACTION MESSAGES ───────────────────────────────────────────────────
  static MascotMessage reactionGoodFood(String foodName, String modeId) {
    final modeLabel = modeId == "sebi"
        ? "Dr. Sebi"
        : modeId == "ehret"
        ? "Arnold Ehret"
        : "Dr. Morse";
    return MascotMessage(
      text: "✅ $foodName est approuvé selon $modeLabel ! Tu nourris ton terrain électrique 🌱",
      mood: MascotMood.loving,
      source: modeLabel,
    );
  }

  static MascotMessage reactionBadFood(String foodName, String modeId) {
    final warnings = {
      "sebi": "❌ $foodName n'est PAS dans le guide Sebi. Hybride ou mucogène — ton terrain s'encrase.",
      "ehret": "⚠️ $foodName produit du mucus selon Ehret. En transition, à éviter ou réduire.",
      "morse": "🚨 $foodName acidifie la lymphe selon Morse. Ton système de filtration sera ralenti.",
    };
    return MascotMessage(
      text: warnings[modeId] ?? "⚠️ $foodName est problématique selon ce protocole.",
      mood: MascotMood.stern,
    );
  }

  static MascotMessage reactionTrophologyWarning(String combo) {
    return MascotMessage(
      text: "💥 Combinaison risquée : $combo. Fermentation et putréfaction digestive selon les 3 protocoles !",
      mood: MascotMood.scared,
      source: "Trophologie",
    );
  }

  static MascotMessage reactionHighScore(int score) {
    return MascotMessage(
      text: "🏆 Score $score% — Terrain d'exception ! Tes cellules rayonnent d'énergie électrique ⚡",
      mood: MascotMood.proud,
    );
  }

  static MascotMessage reactionLowScore(int score) {
    return MascotMessage(
      text: "😔 Score $score%... Ce repas acidifie ton terrain. Ajoute un fruit électrique pour rééquilibrer.",
      mood: MascotMood.sad,
    );
  }

  // ── MODE WELCOME MESSAGES ────────────────────────────────────────────────────
  static MascotMessage modeWelcome(String modeId) {
    const messages = {
      "sebi": MascotMessage(
        text: "⚡ Protocole Dr. Sebi activé ! Seuls les aliments de son guide nutritionnel sont autorisés. Tolérance zéro hybrides.",
        mood: MascotMood.excited,
        source: "Dr. Sebi",
      ),
      "ehret": MascotMessage(
        text: "🌿 Protocole Ehret activé. On réduit progressivement le mucus. Commence par plus de fruits et moins de céréales.",
        mood: MascotMood.talking,
        source: "Arnold Ehret",
      ),
      "morse": MascotMessage(
        text: "💧 Protocole Morse activé ! On active le drainage lymphatique. Pense astringence : baies, raisins, melons.",
        mood: MascotMood.excited,
        source: "Dr. Morse",
      ),
    };
    return messages[modeId] ??
        const MascotMessage(
            text: "Nouveau protocole activé !", mood: MascotMood.talking);
  }

  // ── IDLE / TIME-BASED MESSAGES ────────────────────────────────────────────────
  static MascotMessage idleMessage(String modeId) {
    final hour = DateTime.now().hour;

    if (hour < 7) {
      return const MascotMessage(
        text: "🌙 C'est l'heure du jeûne nocturne. Ton foie travaille entre 1h et 3h du matin. Ne mange pas !",
        mood: MascotMood.sleepy,
        source: "Dr. Morse",
      );
    } else if (hour < 10) {
      return const MascotMessage(
        text: "☀️ Le matin, commence par de l'eau de source puis un fruit frais. Brise le jeûne en douceur.",
        mood: MascotMood.loving,
        source: "Arnold Ehret",
      );
    } else if (hour < 14) {
      return const MascotMessage(
        text: "🌞 Midi est l'heure idéale pour les fruits ou un repas léger. La digestion est au maximum.",
        mood: MascotMood.excited,
      );
    } else if (hour < 19) {
      return const MascotMessage(
        text: "🌅 L'après-midi, un repas plus consistant est ok. Légumes + grains approuvés si tu les combines bien.",
        mood: MascotMood.talking,
      );
    } else {
      return const MascotMessage(
        text: "🌙 Le soir, garde les repas légers. Un fruit ou une tisane selon Sebi. Laisse le corps se régénérer.",
        mood: MascotMood.sleepy,
        source: "Dr. Sebi",
      );
    }
  }

  /// Get tips list for the current active mode
  static List<MascotMessage> tipsForMode(String modeId) {
    switch (modeId) {
      case "sebi":
        return sebiTips;
      case "ehret":
        return ehretTips;
      case "morse":
        return morseTips;
      default:
        return [...sebiTips, ...ehretTips, ...morseTips];
    }
  }
}