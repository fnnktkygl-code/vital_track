import 'dart:math';

import 'package:uuid/uuid.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/services/vital_rules_engine.dart';

/// Builds a full, editable [DietPlan] calendar from the curated vitalist
/// food database (assets/vital_ranking.json), tailored to a protocol
/// (Ehret / Sebi / Morse / Personalized), a goal, a duration and optional
/// restrictions.
///
/// This is deterministic and runs fully offline: it never calls the AI.
/// The chat mascot only collects the *parameters* (protocol, objective,
/// duration, restrictions) through conversation — the calendar itself is
/// always composed from the same expert-verified food list used
/// everywhere else in the app, so suggestions stay consistent and safe.
class DietPlanGenerator {
  DietPlanGenerator._();

  static const List<String> supportedProtocols = [
    'ehret',
    'sebi',
    'morse',
    'personalized',
  ];

  /// Generates a brand-new plan starting today.
  static DietPlan generate({
    required String protocol,
    required int numDays,
    required String objective,
    String restrictions = '',
    String source = 'wizard',
  }) {
    final proto = supportedProtocols.contains(protocol) ? protocol : 'personalized';
    final days = numDays.clamp(1, 30);
    final pools = _buildPools(restrictions);

    final start = DateTime.now();
    final startDay = DateTime(start.year, start.month, start.day);
    final list = <DietDay>[];
    for (int i = 0; i < days; i++) {
      list.add(_buildDay(
        protocol: proto,
        dayIndex: i,
        numDays: days,
        date: startDay.add(Duration(days: i)),
        pools: pools,
        seed: 0,
      ));
    }

    return DietPlan(
      id: const Uuid().v4(),
      name: _planName(proto, objective),
      protocol: proto,
      objective: objective.trim(),
      startDate: start,
      days: list,
      source: source,
      restrictions: restrictions.trim(),
    );
  }

  /// Rebuilds a single day of an existing plan with a fresh food selection
  /// (used by the "regenerate this day" action in the calendar UI).
  static DietDay regenerateDay({
    required String protocol,
    required int dayIndex,
    required int numDays,
    required DateTime date,
    String restrictions = '',
  }) {
    final pools = _buildPools(restrictions);
    final seed = DateTime.now().millisecondsSinceEpoch % 97 + 1;
    return _buildDay(
      protocol: supportedProtocols.contains(protocol) ? protocol : 'personalized',
      dayIndex: dayIndex,
      numDays: numDays,
      date: date,
      pools: pools,
      seed: seed,
    );
  }

  // ── FOOD POOLS ───────────────────────────────────────────────────────────

  static Map<String, List<String>> _buildPools(String restrictions) {
    final byCategory = VitalRulesEngine.approvedNamesByCategory();
    final restrictedWords = restrictions
        .toLowerCase()
        .split(RegExp(r'[,;/\n]'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    List<String> clean(List<String>? list, List<String> fallback) {
      final source = (list == null || list.isEmpty) ? fallback : list;
      final filtered = source
          .where((n) => !restrictedWords.any((r) => n.toLowerCase().contains(r)))
          .toSet()
          .toList();
      return filtered.isEmpty ? fallback : filtered;
    }

    return {
      'fruits': clean(byCategory['Fruits'], const ['Papaye', 'Mangue', 'Raisins noirs', 'Pastèque']),
      'veggies': clean(byCategory['Légumes'], const ['Kale', 'Concombre', 'Avocat', 'Roquette']),
      'grains': clean(byCategory['Céréales'], const ['Quinoa', 'Amarante', 'Sarrasin']),
      'herbs': clean(byCategory['Herbes & Thés'], const ['Tisane de gingembre', 'Tisane de menthe']),
      'oils': clean(byCategory['Huiles'], const ["Huile d'olive", 'Huile de sésame']),
      'nuts': clean(byCategory['Noix & Graines'], const ['Graines de courge', 'Graines de tournesol']),
      'spices': clean(byCategory['Épices & Assaisonnements'], const ['Gingembre frais', 'Origan']),
    };
  }

  // ── DAY BUILDING ─────────────────────────────────────────────────────────

  static DietDay _buildDay({
    required String protocol,
    required int dayIndex,
    required int numDays,
    required DateTime date,
    required Map<String, List<String>> pools,
    required int seed,
  }) {
    final fruits = pools['fruits']!;
    final veggies = pools['veggies']!;
    final grains = pools['grains']!;
    final herbs = pools['herbs']!;
    final nuts = pools['nuts']!;

    String pick(List<String> l, [int offset = 0]) =>
        l[(dayIndex + seed + offset) % l.length];

    List<String> pickN(List<String> l, int n, [int offset = 0]) {
      final out = <String>{};
      for (int k = 0; out.length < n && k < n + l.length; k++) {
        out.add(l[(dayIndex + seed + offset + k) % l.length]);
      }
      return out.toList();
    }

    final phase = _phaseLabel(protocol, dayIndex, numDays);
    final earlyRatio = numDays <= 1 ? 1.0 : dayIndex / (numDays - 1);

    List<PlannedMeal> meals;
    switch (protocol) {
      case 'ehret':
        meals = [
          PlannedMeal(
            slot: 'Réveil',
            items: const ['Eau tiède citronnée'],
            note: "Draine la lymphe avant le premier repas — l'estomac vide.",
          ),
          PlannedMeal(
            slot: 'Petit-déjeuner',
            items: pickN(fruits, earlyRatio < 0.3 ? 1 : 2),
            note: 'Mono-fruit de préférence. Mâche lentement, jusqu\'à satiété légère.',
          ),
          PlannedMeal(
            slot: 'Déjeuner',
            items: [
              ...pickN(veggies, 2),
              if (earlyRatio > 0.4) pick(grains, 1),
            ],
            note: 'Salade crue en base, + un féculent sans mucus si bien toléré.',
          ),
          PlannedMeal(
            slot: 'Dîner',
            items: pickN(veggies, 2, 3),
            note: 'Repas léger. Arrête de manger au moins 3h avant le coucher.',
          ),
        ];
        break;

      case 'sebi':
        meals = [
          PlannedMeal(
            slot: 'Réveil',
            items: [pick(herbs)],
            note: 'Tisane du guide nutritionnel Dr. Sebi.',
          ),
          PlannedMeal(
            slot: 'Petit-déjeuner',
            items: pickN(fruits, 2),
            note: 'Uniquement des fruits de la liste approuvée (pas de pastèque hybride ni d\'agrumes doux).',
          ),
          PlannedMeal(
            slot: 'Déjeuner',
            items: [...pickN(veggies, 2, 1), pick(grains)],
            note: 'Céréale sans gluten (liste approuvée) + légumes-feuilles.',
          ),
          PlannedMeal(
            slot: 'Collation',
            items: [pick(nuts)],
            note: 'Petite poignée — pas de cacahuètes ni de noix de cajou.',
          ),
          PlannedMeal(
            slot: 'Dîner',
            items: pickN(veggies, 2, 2),
            note: 'Légumes vapeur + huile approuvée (olive, sésame, chanvre).',
          ),
        ];
        break;

      case 'morse':
        meals = [
          PlannedMeal(
            slot: 'Réveil',
            items: const ['Eau de source'],
            note: 'Hydrate le système lymphatique avant tout.',
          ),
          PlannedMeal(
            slot: 'Petit-déjeuner',
            items: pickN(fruits, 2),
            note: 'Fruits astringents — jusqu\'à midi uniquement, jamais après.',
          ),
          PlannedMeal(
            slot: 'Déjeuner',
            items: pickN(veggies, 3),
            note: 'La grande salade crue du jour — le repas le plus important pour Morse.',
          ),
          PlannedMeal(
            slot: 'Collation',
            items: [pick(fruits, 2)],
            note: 'Un fruit si besoin, jamais juste avant le dîner.',
          ),
          PlannedMeal(
            slot: 'Dîner',
            items: pickN(veggies, 2, 1),
            note: 'Léger, vapeur si besoin de chaud.',
          ),
        ];
        break;

      default: // personalized / vitalist blend
        meals = [
          PlannedMeal(
            slot: 'Réveil',
            items: const ['Eau tiède citronnée'],
            note: '',
          ),
          PlannedMeal(
            slot: 'Petit-déjeuner',
            items: pickN(fruits, 2),
            note: 'Le point commun des trois écoles : fruits frais et mûrs.',
          ),
          PlannedMeal(
            slot: 'Déjeuner',
            items: [...pickN(veggies, 2), pick(grains)],
            note: '',
          ),
          PlannedMeal(
            slot: 'Collation',
            items: [pick(nuts)],
            note: '',
          ),
          PlannedMeal(
            slot: 'Dîner',
            items: pickN(veggies, 2, 2),
            note: '',
          ),
        ];
    }

    return DietDay(
      dayIndex: dayIndex,
      date: date,
      phaseLabel: phase,
      meals: meals,
    );
  }

  static String _phaseLabel(String protocol, int dayIndex, int numDays) {
    final ratio = numDays <= 1 ? 1.0 : dayIndex / (numDays - 1);
    switch (protocol) {
      case 'ehret':
        if (ratio < 0.34) return 'Élimination douce';
        if (ratio < 0.7) return 'Transition mucusless';
        return 'Régénération';
      case 'sebi':
        if (ratio < 0.34) return 'Nettoyage alcalin';
        if (ratio < 0.7) return 'Reconstruction minérale';
        return 'Équilibre bio-minéral';
      case 'morse':
        if (ratio < 0.34) return 'Activation lymphatique';
        if (ratio < 0.7) return 'Détoxification';
        return 'Régénération cellulaire';
      default:
        if (ratio < 0.34) return 'Mise en route';
        if (ratio < 0.7) return 'Approfondissement';
        return 'Ancrage';
    }
  }

  static String _planName(String protocol, String objective) {
    final label = switch (protocol) {
      'ehret' => 'Transition Ehret',
      'sebi' => 'Guide Dr. Sebi',
      'morse' => 'Détox Dr. Morse',
      _ => 'Plan Vitaliste',
    };
    final o = objective.trim();
    return o.isEmpty ? label : '$label — $o';
  }
}

/// Small helper kept local to avoid pulling `dart:math` into call sites
/// that only need a single random pick (used for future variety features).
int randomSeed() => Random().nextInt(1000);
