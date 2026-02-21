import 'package:vital_track/ui/widgets/circadian_clock_card.dart';

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
  final List<String> quickReplies; // optional symptom/mood chips
  final void Function(String)? onReply; // callback when a chip is tapped

  const MascotMessage({
    required this.text,
    required this.mood,
    this.source,
    this.dismissable = true,
    this.quickReplies = const [],
    this.onReply,
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
    MascotMessage(
      text: "🧬 Sebi : la maladie commence dans la cellule. Les composés minéraux — fer, calcium, potassium — nettoient au niveau intracellulaire.",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌊 « Le corps humain est composé de minéraux. Nourris-le de minéraux et il se guérit lui-même. » — Dr. Sebi",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🔥 Le Bio Ferro de Sebi contenait du fer naturel issu de plantes. Le fer synthétique constipe et ne nourrit pas la cellule.",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🏷️ « S'il y a une étiquette sur l'emballage, ne le mangez pas. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧬 « Il n'y a qu'une seule maladie : l'affaiblissement de la membrane muqueuse. » — Dr. Sebi",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧱 « L'amidon est un produit chimique. C'est un liant qui cause l'inflammation. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "⚡ « Un aliment hybride est un aliment mort. Il n'a aucune charge électrique. » — Dr. Sebi",
      mood: MascotMood.sad,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "✨ « Le fer est l'étincelle de la vie. Sans lui, le corps ne peut pas fonctionner. » — Dr. Sebi",
      mood: MascotMood.excited,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌊 « La mousse de mer (Sea Moss) est l'aliment le plus complet de la planète. » — Dr. Sebi",
      mood: MascotMood.loving,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "💧 « L'eau est le premier médicament. Mais ce doit être une eau VIVANTE. » — Dr. Sebi",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧪 « Le corps connaît la différence entre un minéral issu d'une plante et un minéral d'un laboratoire. » — Dr. Sebi",
      mood: MascotMood.questioning,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧹 « Quand vous arrêtez d'introduire des déchets, le corps peut enfin les évacuer. » — Dr. Sebi",
      mood: MascotMood.excited,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌍 « Nos ancêtres n'avaient pas besoin de biochimie car la nature fournissait la nourriture parfaite. » — Dr. Sebi",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🙅 « La nature n'a pas créé les carottes. Ce sont des hybrides. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🥛 « J'ai arrêté le lait il y a 42 ans, et je peux encore tomber sur mes genoux à 80 ans ! » — Dr. Sebi",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧬 « Sans affinité chimique avec ton corps, l'aliment est rejeté. Ce rejet, c'est la maladie. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    // ── NEW: quotes from dr_sebi.txt ──
    MascotMessage(
      text: "🧬 « L'Équilibre Bio-Minéral Africain nettoie et nourrit au niveau cellulaire. » — Dr. Sebi",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🚫 « Aucun produit animal n'a jamais été conçu pour la consommation humaine. » — Dr. Sebi",
      mood: MascotMood.stern,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "✨ « Chaque maladie que j'ai traitée a commencé par une carence en fer. » — Dr. Sebi",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌿 « Que ta nourriture soit ton médicament — mais seulement si elle est naturelle. » — Dr. Sebi",
      mood: MascotMood.loving,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🌍 « Dieu ne fait pas de poisons. Quand nous étions en Afrique, pas besoin de biochimie. » — Dr. Sebi",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🍽️ « Il faut manger les aliments natifs de là d'où viennent nos ancêtres. » — Dr. Sebi",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "📋 « Non seulement j'ai prouvé scientifiquement, mais j'avais les fiches diagnostiques. » — Dr. Sebi",
      mood: MascotMood.proud,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "⚡ « Quand tu manges un aliment sans affinité chimique avec ton corps — ce rejet, c'est la maladie. » — Dr. Sebi",
      mood: MascotMood.questioning,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "🧪 « Le phosphate de fer nourrit le sang. Le fer synthétique l'empoisonne. La source fait toute la différence. » — Dr. Sebi",
      mood: MascotMood.stern,
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
    MascotMessage(
      text: "📐 V = P − O. Vitalité = Puissance − Obstruction. Manger moins peut donner PLUS d'énergie. C'est la clé d'Ehret.",
      mood: MascotMood.excited,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "👅 Ehret : jeûne 24h puis examine ta langue. Enduit blanc = mucus qui sort. C'est le miroir de ta santé interne.",
      mood: MascotMood.questioning,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🫁 Ehret voyait le corps comme une machine à air, pas à protéines. L'oxygène et les fruits sont les vrais carburants.",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🧹 Ehret a prouvé que l'humain moyen porte 2-5 kg de matière non éliminée dans les intestins. Le nettoyage est essentiel.",
      mood: MascotMood.scared,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "⚡ « L'homme sain ne se fatigue pas — il est mouvement perpétuel. » La fatigue vient de l'obstruction, pas du manque de nourriture.",
      mood: MascotMood.proud,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🍽️ Mono-eating : un seul type d'aliment par repas est l'idéal. Oranges seules, ou raisins seuls — digestion parfaite.",
      mood: MascotMood.loving,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🕸️ « Toute maladie est causée par l'obstruction des vaisseaux capillaires par le mucus. » — Arnold Ehret",
      mood: MascotMood.sad,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🍇 « Le régime de fruits est le régime du paradis — c'est le seul pour l'être humain. » — Arnold Ehret",
      mood: MascotMood.loving,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🔑 « Le jeûne est la clé de la cuisine de la Nature. » — Arnold Ehret",
      mood: MascotMood.excited,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🚫 « La question n'est pas ce qu'il faut manger, mais ce qu'il ne faut PAS manger. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🧪 « La théorie des protéines est la doctrine la plus dangereuse jamais enseignée. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "✨ « Un corps propre vit avec une quantité infime de nourriture. » — Arnold Ehret",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🚑 « Plus de gens ont été lésés par une mauvaise reprise alimentaire que par le jeûne lui-même. » — Arnold Ehret",
      mood: MascotMood.scared,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🔭 « Tout ce qui n'est pas simple et facile à comprendre ne peut être la vérité. » — Arnold Ehret",
      mood: MascotMood.questioning,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🧹 « Mon système n'est pas un remède — c'est une régénération, un grand ménage intérieur. » — Arnold Ehret",
      mood: MascotMood.excited,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🛑 « Plus l'homme accumule de déchets, plus il doit manger pour stopper l'élimination. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "☀️ « L'air et le soleil sont les plus grands alliés du corps. » — Arnold Ehret",
      mood: MascotMood.loving,
      source: "Arnold Ehret",
    ),
    // ── NEW: quotes from arnold_ehret.txt ──
    MascotMessage(
      text: "🤒 « Ce que l'humain moyen appelle \\\"santé\\\" est en réalité un état de maladie latente. » — Arnold Ehret",
      mood: MascotMood.questioning,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🍽️ « 99,99% de toutes les maladies trouvent leur cause dans l'alimentation. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🔄 « Chaque maladie est un effort du corps pour éliminer les déchets, le mucus et les toxines. » — Arnold Ehret",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🏥 « Ce n'est pas la maladie qu'il faut guérir, c'est le CORPS — il doit être nettoyé. » — Arnold Ehret",
      mood: MascotMood.proud,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "⚡ « La vitalité ne dépend pas directement de la nourriture. V = P − O. » — Arnold Ehret",
      mood: MascotMood.excited,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "💀 « Les jeûneurs qui sont morts n'ont pas succombé au manque de nourriture, mais étouffés dans leurs propres déchets. » — Arnold Ehret",
      mood: MascotMood.scared,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🌿 « La nature ne fournit pas d'aliment qui doive être préparé par l'homme pour être mangé. » — Arnold Ehret",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🌅 « Mange ton chemin vers le Paradis — physiquement. » — Arnold Ehret",
      mood: MascotMood.loving,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🌄 « Le pire de toutes les habitudes alimentaires est le petit-déjeuner copieux. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "👅 « La langue est le miroir de tout le système membranaire. » — Arnold Ehret",
      mood: MascotMood.questioning,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "🚫 « On ne peut pas guérir sans arrêter de manger les aliments qui produisent la maladie. » — Arnold Ehret",
      mood: MascotMood.stern,
      source: "Arnold Ehret",
    ),
  ];

  // ── CIRCADIAN RHYTHM INTEGRATION ────────────────────────────────────────────
  
  static MascotMessage? circadianTipForMode(String modeId, CircadianPhase phase, DateTime now) {
    final timeStr = "${now.hour}h${now.minute.toString().padLeft(2, '0')}";
    
    if (modeId == 'morse') {
      switch (phase) {
        case CircadianPhase.elimination:
          return MascotMessage(
            text: "☀️ Il est $timeStr, le cycle d'élimination bat son plein. Mangez des fruits juteux, particulièrement des agrumes ou du raisin, pour rincer la lymphe. — Dr. Morse",
            mood: MascotMood.talking,
            source: "Dr. Morse",
          );
        case CircadianPhase.appropriation:
          return MascotMessage(
            text: "🍽️ $timeStr : Cycle d'appropriation. C'est le moment idéal pour vos salades ou fruits plus denses si vous avez faim. L'énergie est au sommet. — Dr. Morse",
            mood: MascotMood.talking,
            source: "Dr. Morse",
          );
        case CircadianPhase.assimilation:
          return MascotMessage(
            text: "🌙 Il est déjà $timeStr. Laissez vos intestins se reposer. L'énergie nerveuse est utilisée pour reconstruire les cellules. — Dr. Morse",
            mood: MascotMood.sleepy,
            source: "Dr. Morse",
          );
      }
    } else if (modeId == 'ehret') {
      switch (phase) {
        case CircadianPhase.elimination:
          return MascotMessage(
            text: "☀️ $timeStr : La matinée est dédiée à l'élimination des mucosités. Ne stoppez pas cette élimination par un repas lourd. Privilégiez l'eau ou les fruits. — Arnold Ehret",
            mood: MascotMood.talking,
            source: "Arnold Ehret",
          );
        case CircadianPhase.appropriation:
          return MascotMessage(
            text: "🍽️ $timeStr : Pendant la journée, consommez des aliments non-mucogènes. Plus l'aliment produit peu de déchets, plus grande sera votre vitalité (V = P - O). — Arnold Ehret",
            mood: MascotMood.proud,
            source: "Arnold Ehret",
          );
        case CircadianPhase.assimilation:
          return MascotMessage(
            text: "🌙 $timeStr : Le corps a besoin d'assimiler sans être surchargé par l'obstruction. Un repas léger permet une meilleure nuit de nettoyage interne. — Arnold Ehret",
            mood: MascotMood.sleepy,
            source: "Arnold Ehret",
          );
      }
    } else {
      // Sebi
      switch (phase) {
        case CircadianPhase.elimination:
          return MascotMessage(
            text: "☀️ Il est $timeStr. Nettoyez les cellules au niveau intracellulaire. L'eau de source, la mousse de mer et les fruits électriques sont rois le matin. — Dr. Sebi",
            mood: MascotMood.excited,
            source: "Dr. Sebi",
          );
        case CircadianPhase.appropriation:
          return MascotMessage(
            text: "🍽️ $timeStr, l'heure de manger. Assurez-vous que vos aliments sont alcalins. L'aliment doit avoir la même charge électrique que votre corps. — Dr. Sebi",
            mood: MascotMood.talking,
            source: "Dr. Sebi",
          );
        case CircadianPhase.assimilation:
          return MascotMessage(
            text: "🌙 $timeStr : Le corps se régénère la nuit. Vos organes, alimentés par les minéraux électriques, reconstruisent la muqueuse. Laissez-les travailler. — Dr. Sebi",
            mood: MascotMood.sleepy,
            source: "Dr. Sebi",
          );
      }
    }
  }

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
    MascotMessage(
      text: "🫘 Morse : 90% des malades chroniques ont des surrénales faibles. Sans surrénales, pas de filtration rénale. C'est la clé.",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🔬 Iridologie : l'iris est une carte du corps. Les marques révèlent les faiblesses héréditaires de chaque organe.",
      mood: MascotMood.questioning,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧬 « Le cancer n'est pas une maladie — c'est un mécanisme de survie des cellules noyées dans l'acide. » — Dr. Morse",
      mood: MascotMood.sad,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🌿 Trèfle rouge, gaillet gratteron, violette bleue : le trio lymphatique de Morse. Ils brisent la stagnation profonde.",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "💧 « L'urine claire n'est PAS un signe de bonne hydratation — c'est un signe que tes reins ne filtrent pas. » — Morse",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧘 « J'ai vu des gens manger parfaitement et ne pas guérir — parce qu'ils portent la colère dans chaque cellule. » — Morse",
      mood: MascotMood.sad,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🏋️ Le rebounding (mini-trampoline) est le MEILLEUR exercice lymphatique selon Morse. 10 minutes par jour changent tout.",
      mood: MascotMood.excited,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🫐 Les baies sont la nourriture suprême du cerveau selon Morse. Myrtilles, mûres, framboises régénèrent les neurones.",
      mood: MascotMood.loving,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧪 « Il y a deux côtés à la chimie : le côté acide qui détruit, et le côté alcalin qui guérit. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🚽 « Le système lymphatique est ton système d'égouts. S'il déborde, tu nages dans tes propres déchets ! » — Dr. Morse",
      mood: MascotMood.sad,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🍔 « On n'attrape pas de maladies. On les crée en mangeant et en buvant. » — Dr. Morse",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🏗️ « Les fruits sont tes nettoyeurs, les légumes sont tes bâtisseurs. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🏥 « La nature a mis une pharmacie dans chaque fruit. L'homme l'ignore et bâtit des labos. » — Dr. Morse",
      mood: MascotMood.proud,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "📡 « Le système endocrinien contrôle toute la chimie du corps. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🔋 « Sans surrénales fortes, pas de filtration. Sans filtration, pas de guérison. » — Dr. Morse",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "⚙️ « Répare les glandes et tu répareras la personne. » — Dr. Morse",
      mood: MascotMood.proud,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧠 « Le cerveau est le tissu le plus sensible aux acides. Nourris-le de baies et d'herbes. » — Dr. Morse",
      mood: MascotMood.loving,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🔬 « La médecine regarde le sang. Je regarde la lymphe. C'est là qu'est le vrai problème. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    // ── NEW: quotes from dr_morse.txt ──
    MascotMessage(
      text: "🌱 « La détoxification n'est pas un traitement. C'est un mode de vie. » — Dr. Morse",
      mood: MascotMood.proud,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "✨ « Dans la santé, il n'y a pas de maladie. » — Dr. Morse",
      mood: MascotMood.excited,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🌿 « Les herbes et les fruits sont les outils de la régénération ; la chimie en est la clé. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "💧 « Fais filtrer tes reins ! C'est comme ça que tu sais que ta lymphe bouge. » — Dr. Morse",
      mood: MascotMood.excited,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "⏳ « Il t'a fallu 20, 30, 40 ans pour tomber malade. Donne-toi du temps pour guérir. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🚨 « Si tu n'élimines pas, tu accumules. Point final. » — Dr. Morse",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🍽️ « Tu peux manger la meilleure nourriture du monde — si tes intestins sont bouchés, tu te meurs de faim. » — Dr. Morse",
      mood: MascotMood.scared,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🌿 « Les herbes bougent la lymphe. Les fruits nettoient la lymphe. Le mouvement draine la lymphe. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧹 « Nettoyez le terrain et les parasites s'en vont d'eux-mêmes. » — Dr. Morse",
      mood: MascotMood.proud,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🏠 « Nettoie l'intestin et tu nettoies la fondation. » — Dr. Morse",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "❤️ « L'aubépine et le cayenne peuvent faire plus pour le cœur que n'importe quel médicament. » — Dr. Morse",
      mood: MascotMood.loving,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🚪 « Les reins sont la porte de sortie. S'ils sont fermés, rien ne sort. » — Dr. Morse",
      mood: MascotMood.stern,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🎉 « Si tu traverses une crise de guérison, félicitations — ton corps est enfin assez fort pour faire le ménage. » — Dr. Morse",
      mood: MascotMood.excited,
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
    MascotMessage(
      text: "🍌 Ne mélange jamais fruits acides (agrumes) et fruits sucrés (bananes, dattes). La fermentation est garantie.",
      mood: MascotMood.stern,
      source: "Trophologie",
    ),
    MascotMessage(
      text: "⏰ Jamais de fruit APRÈS un repas cuit. Le fruit fermente au-dessus de la nourriture en digestion lente. Toujours avant !",
      mood: MascotMood.scared,
      source: "Trophologie",
    ),
    MascotMessage(
      text: "🥑 Les graisses (avocat, noix) ralentissent la digestion. Ne les mélange jamais avec des fruits — c'est une règle unanime.",
      mood: MascotMood.stern,
      source: "Trophologie",
    ),
  ];

  // ── BREATHING TIPS ─────────────────────────────────────────────────────────
  static const List<MascotMessage> breathingTips = [
    MascotMessage(
      text: "🌬️ La méthode Wim Hof : 30 respirations profondes, rétention, récupération. "
          "Ça libère l'adrénaline et booste l'immunité naturellement.",
      mood: MascotMood.excited,
      source: "Wim Hof",
    ),
    MascotMessage(
      text: "🫁 Ehret enseignait que l'homme est un « moteur à air-gaz ». "
          "La respiration correcte nourrit chaque cellule sans mucus.",
      mood: MascotMood.talking,
      source: "Arnold Ehret",
    ),
    MascotMessage(
      text: "💨 Morse : « Les poumons sont l'un des quatre canaux d'élimination. » "
          "Respirez profondément pour stimuler le drainage lymphatique.",
      mood: MascotMood.talking,
      source: "Dr. Morse",
    ),
    MascotMessage(
      text: "🧊 L'étude de Radboud (2014) a prouvé que la respiration WHM permet "
          "de contrôler la réponse immunitaire : 56% moins de symptômes inflammatoires.",
      mood: MascotMood.proud,
      source: "Wim Hof",
    ),
    MascotMessage(
      text: "💚 Cohérence cardiaque : 5.5s inspire, 5.5s expire. "
          "Synchronise cœur et cerveau — améliore la variabilité cardiaque (HRV).",
      mood: MascotMood.loving,
      source: "Cohérence",
    ),
    MascotMessage(
      text: "🌙 La respiration lente 1:2 avant le sommeil stimule le nerf vague. "
          "3 secondes d'inspiration, 6 secondes d'expiration — c'est tout.",
      mood: MascotMood.sleepy,
      source: "Relaxation",
    ),
    MascotMessage(
      text: "⚡ Sebi : le fer transporte l'oxygène. La respiration profonde optimise "
          "l'absorption du fer des plantes et l'oxygénation cellulaire.",
      mood: MascotMood.talking,
      source: "Dr. Sebi",
    ),
    MascotMessage(
      text: "📦 Box Breathing (4-4-4-4) : utilisé par les Navy SEALs. "
          "Inspire 4s, retiens 4s, expire 4s, retiens 4s. Calme immédiat sous pression.",
      mood: MascotMood.proud,
      source: "Box Breathing",
    ),
    MascotMessage(
      text: "⚠️ WHM : ne jamais pratiquer dans l'eau ou en conduisant. "
          "Position assise ou allongée uniquement. La perte de conscience est possible.",
      mood: MascotMood.stern,
      source: "Wim Hof",
    ),
  ];

  // ── FASTING TIPS PER PROTOCOL ────────────────────────────────────────────────
  static List<MascotMessage> fastingTipsForProtocol(String protocol) {
    switch (protocol) {
      case "morse":
        return const [
          MascotMessage(
            text: "🍇 Morse : « Le jeûne aux fruits est le plus puissant nettoyant lymphatique. Les raisins sont le roi. »",
            mood: MascotMood.excited,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "💧 Pendant le jeûne, tes reins doivent filtrer. Vérifie ton urine — trouble = la lymphe bouge. C'est le but !",
            mood: MascotMood.questioning,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "🌿 Morse recommande les herbes rénales pendant le jeûne : ortie, prêle, busserole. Elles ouvrent la porte de sortie.",
            mood: MascotMood.talking,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "🔥 Crise de guérison pendant le jeûne ? Normal ! C'est ton corps qui mobilise les acides stockés depuis des années.",
            mood: MascotMood.scared,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "🏋️ Rebounding léger pendant le jeûne active la pompe lymphatique sans épuiser les surrénales. 5 min suffisent.",
            mood: MascotMood.proud,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "⏳ « Il t'a fallu des décennies pour encrasser ton corps. Le jeûne accélère le nettoyage — sois patient. » — Morse",
            mood: MascotMood.talking,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "🧬 Morse : le jeûne répare les glandes endocrines — thyroïde, surrénales, pituitaire. C'est la clé de la régénération.",
            mood: MascotMood.excited,
            source: "Dr. Morse",
          ),
          MascotMessage(
            text: "🍉 La pastèque est l'aliment idéal de reprise après un jeûne selon Morse. Hydratante, astringente, facile à digérer.",
            mood: MascotMood.loving,
            source: "Dr. Morse",
          ),
        ];
      case "ehret":
        return const [
          MascotMessage(
            text: "🔑 « Le jeûne est la clé de la cuisine de la Nature. » — Ehret. Ton corps se nettoie en profondeur.",
            mood: MascotMood.excited,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "📐 V = P − O. Pendant le jeûne, l'obstruction (O) diminue et ta vitalité (V) augmente mécaniquement !",
            mood: MascotMood.proud,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "👅 Examine ta langue pendant le jeûne. L'enduit blanc ou jaune = le mucus accumulé qui remonte. Signe de nettoyage !",
            mood: MascotMood.questioning,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "⚠️ Ehret : ne romps JAMAIS un jeûne avec un repas lourd. Fruits aqueux d'abord, puis salade légère. Progressivement.",
            mood: MascotMood.stern,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "🌄 « Le pire des habitudes est le petit-déjeuner copieux. » — Ehret. Prolonge ton jeûne nocturne naturellement.",
            mood: MascotMood.talking,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "💀 « Les jeûneurs décédés n'ont pas manqué de nourriture — ils ont étouffé dans leurs propres déchets. » — Ehret. Vas-y progressivement.",
            mood: MascotMood.scared,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "🌿 Phase de transition Ehret : alterne jeûne court et repas de fruits. Chaque cycle décolle une couche de mucus.",
            mood: MascotMood.talking,
            source: "Arnold Ehret",
          ),
          MascotMessage(
            text: "☀️ Ehret jeûnait en marchant en plein air. L'oxygène et le soleil accélèrent l'élimination pendant le jeûne.",
            mood: MascotMood.loving,
            source: "Arnold Ehret",
          ),
        ];
      case "sebi":
        return const [
          MascotMessage(
            text: "⚡ Sebi : pendant le jeûne, le corps redirige l'énergie digestive vers la guérison cellulaire. Chaque heure compte.",
            mood: MascotMood.excited,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "🧹 Le jeûne accélère l'élimination du mucus. Sebi : « Arrêtez d'introduire les déchets et le corps s'auto-nettoie. »",
            mood: MascotMood.proud,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "💧 Pendant le jeûne Sebi, bois 1 gallon d'eau de source par jour. L'eau vivante transporte les minéraux et évacue les toxines.",
            mood: MascotMood.talking,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "✨ Le fer est essentiel pendant le jeûne. L'eau de source riche en minéraux maintient l'oxygénation cellulaire.",
            mood: MascotMood.talking,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "🌿 Romps le jeûne avec un jus alcalin : concombre + gingembre + key lime. Douceur pour les membranes muqueuses.",
            mood: MascotMood.loving,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "🧬 Sebi : le jeûne permet aux composés minéraux de pénétrer plus profondément dans la cellule. L'absorption est maximale.",
            mood: MascotMood.excited,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "🌊 « Le corps humain se guérit lui-même quand on arrête de l'empoisonner. » — Sebi. Le jeûne est la première étape.",
            mood: MascotMood.proud,
            source: "Dr. Sebi",
          ),
          MascotMessage(
            text: "🌵 Tisanes alcalines pendant le jeûne : burdock, sarsaparilla, blessed thistle. Elles nourrissent sans rompre le jeûne.",
            mood: MascotMood.talking,
            source: "Dr. Sebi",
          ),
        ];
      default:
        return const [];
    }
  }

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
    final dayMinute = DateTime.now().minute;
    // Use minute for variety within the same hour
    final variant = dayMinute % 2;

    if (hour < 7) {
      return variant == 0
          ? const MascotMessage(
              text: "🌙 Jeûne nocturne actif. Ton foie et ton système lymphatique se nettoient entre 1h et 3h du matin. Ne mange rien !",
              mood: MascotMood.sleepy,
              source: "Dr. Morse",
            )
          : const MascotMessage(
              text: "😴 Le sommeil est ta meilleure médecine. Pendant le repos, ton corps redirige toute l'énergie vers la régénération cellulaire.",
              mood: MascotMood.sleepy,
              source: "Arnold Ehret",
            );
    } else if (hour < 10) {
      if (modeId == "morse") {
        return const MascotMessage(
          text: "🍋 Matin Morse : eau citronnée tiède pour activer le drainage lymphatique, puis un fruit astringent (raisins, baies, agrumes).",
          mood: MascotMood.loving,
          source: "Dr. Morse",
        );
      } else if (modeId == "ehret") {
        return const MascotMessage(
          text: "🍊 Matin Ehret : brise le jeûne avec un mono-fruit. Oranges ou pamplemousses sont les meilleurs solvants du mucus matinal.",
          mood: MascotMood.loving,
          source: "Arnold Ehret",
        );
      }
      return const MascotMessage(
        text: "⚡ Matin Sebi : eau de source naturelle au réveil, puis un fruit du guide — mangue, papaye, ou baies avec pépins.",
        mood: MascotMood.loving,
        source: "Dr. Sebi",
      );
    } else if (hour < 14) {
      return variant == 0
          ? const MascotMessage(
              text: "🌞 Midi : ton système digestif est à son pic. C'est le moment idéal pour ton repas principal — fruits ou salade + légumes.",
              mood: MascotMood.excited,
            )
          : const MascotMessage(
              text: "💧 Pense à t'hydrater ! L'eau de source aide les reins à filtrer les déchets lymphatiques mobilisés ce matin.",
              mood: MascotMood.talking,
              source: "Dr. Morse",
            );
    } else if (hour < 19) {
      return variant == 0
          ? const MascotMessage(
              text: "🚶 L'après-midi est idéal pour bouger. 20 min de marche ou de rebounding activent la circulation lymphatique.",
              mood: MascotMood.talking,
              source: "Dr. Morse",
            )
          : const MascotMessage(
              text: "🌅 Si tu manges cet après-midi, combine bien. Pas de fruit après un repas cuit — fermentation garantie.",
              mood: MascotMood.questioning,
              source: "Trophologie",
            );
    } else {
      return variant == 0
          ? const MascotMessage(
              text: "🌙 Le soir, garde ton repas très léger. Un fruit ou rien. Plus tôt tu arrêtes de manger, plus longue sera ta régénération nocturne.",
              mood: MascotMood.sleepy,
              source: "Arnold Ehret",
            )
          : const MascotMessage(
              text: "🫖 Soirée : une tisane (camomille, tilleul, passiflore) apaise le système nerveux et prépare le corps au nettoyage nocturne.",
              mood: MascotMood.sleepy,
              source: "Dr. Morse",
            );
    }
  }

  /// Get tips list for the current active mode
  static List<MascotMessage> tipsForMode(String modeId) {
    switch (modeId) {
      case "sebi":
        return [...sebiTips, ...breathingTips];
      case "ehret":
        return [...ehretTips, ...breathingTips];
      case "morse":
        return [...morseTips, ...breathingTips];
      default:
        return [...sebiTips, ...ehretTips, ...morseTips, ...breathingTips];
    }
  }
}
