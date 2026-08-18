import 'package:hive/hive.dart';

part 'diet_plan.g.dart';

/// A single planned meal within a day (e.g. "Petit-déjeuner").
@HiveType(typeId: 16)
class PlannedMeal extends HiveObject {
  @HiveField(0)
  String slot; // 'Réveil' | 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner'

  @HiveField(1)
  List<String> items; // food names, e.g. ["Papaye", "Raisins noirs"]

  @HiveField(2)
  String note;

  @HiveField(3)
  bool done;

  PlannedMeal({
    required this.slot,
    required this.items,
    this.note = '',
    this.done = false,
  });

  PlannedMeal copy() => PlannedMeal(
        slot: slot,
        items: [...items],
        note: note,
        done: done,
      );
}

/// A single day within a [DietPlan] calendar.
@HiveType(typeId: 15)
class DietDay extends HiveObject {
  @HiveField(0)
  final int dayIndex; // 0-based

  @HiveField(1)
  final DateTime date;

  @HiveField(2)
  String phaseLabel; // "Élimination douce", "Détoxification"...

  @HiveField(3)
  List<PlannedMeal> meals;

  @HiveField(4)
  String dayNote;

  DietDay({
    required this.dayIndex,
    required this.date,
    required this.phaseLabel,
    required this.meals,
    this.dayNote = '',
  });

  bool get isComplete => meals.isNotEmpty && meals.every((m) => m.done);
  int get doneCount => meals.where((m) => m.done).length;

  bool get isToday {
    final n = DateTime.now();
    return date.year == n.year && date.month == n.month && date.day == n.day;
  }

  bool get isPast {
    final n = DateTime.now();
    final today = DateTime(n.year, n.month, n.day);
    final d = DateTime(date.year, date.month, date.day);
    return d.isBefore(today);
  }
}

/// A full diet plan: a calendar of [DietDay] entries generated from a
/// protocol (Ehret / Sebi / Morse / Personalized) and the user's goals.
/// Can originate from the onboarding wizard or from a chat conversation
/// with the mascot.
@HiveType(typeId: 14)
class DietPlan extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  final String protocol; // 'ehret' | 'sebi' | 'morse' | 'personalized'

  @HiveField(3)
  final String objective;

  @HiveField(4)
  final DateTime startDate;

  @HiveField(5)
  List<DietDay> days;

  @HiveField(6)
  bool isActive;

  @HiveField(7)
  DateTime? endDate;

  @HiveField(8)
  final String source; // 'wizard' | 'chat' | 'manual'

  @HiveField(9)
  final String restrictions;

  DietPlan({
    required this.id,
    required this.name,
    required this.protocol,
    required this.objective,
    required this.startDate,
    required this.days,
    this.isActive = true,
    this.endDate,
    this.source = 'wizard',
    this.restrictions = '',
  });

  int get totalDays => days.length;
  int get completedDays => days.where((d) => d.isComplete).length;
  double get progress =>
      days.isEmpty ? 0.0 : (completedDays / days.length).clamp(0.0, 1.0);

  DietDay? dayForDate(DateTime date) {
    final target = DateTime(date.year, date.month, date.day);
    for (final d in days) {
      final dd = DateTime(d.date.year, d.date.month, d.date.day);
      if (dd == target) return d;
    }
    return null;
  }

  DietDay? get todayPlan => dayForDate(DateTime.now());
}

extension DietProtocolDisplay on String {
  String get dietProtocolLabel => switch (this) {
        'sebi' => 'Dr. Sebi',
        'ehret' => 'Arnold Ehret',
        'morse' => 'Dr. Morse',
        'personalized' => 'Personnalisé',
        _ => 'Vitaliste',
      };

  String get dietProtocolEmoji => switch (this) {
        'sebi' => '⚡',
        'ehret' => '🌿',
        'morse' => '💧',
        'personalized' => '🤝',
        _ => '🌱',
      };

  String get dietProtocolTagline => switch (this) {
        'sebi' => 'Guide nutritionnel alcalin strict',
        'ehret' => 'Transition progressive sans mucus',
        'morse' => 'Fruits, détox & drainage lymphatique',
        'personalized' => 'Un mélange des trois écoles, à ton rythme',
        _ => 'Approche vitaliste intégrée',
      };
}
