import 'package:hive_flutter/hive_flutter.dart';

part 'fasting_session.g.dart';

@HiveType(typeId: 7)
enum FastingType {
  @HiveField(0)
  waterFast,
  @HiveField(1)
  juiceFast,
  @HiveField(2)
  fruitFast,
  @HiveField(3)
  grapeCure,
  @HiveField(4)
  drySunFast,
  @HiveField(5)
  intermittent,
  @HiveField(6)
  monoFruit,
}

@HiveType(typeId: 8)
class FastingSession extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final FastingType type;

  @HiveField(2)
  final DateTime startTime;

  @HiveField(3)
  final int plannedMinutes; // duration in minutes

  @HiveField(4)
  DateTime? endTime;

  @HiveField(5)
  String notes;

  @HiveField(6)
  String moodEmoji;

  @HiveField(7)
  final String protocol; // sebi / ehret / morse

  @HiveField(8)
  double? preWeight;

  @HiveField(9)
  double? postWeight;

  @HiveField(10)
  int? preEnergy; // 1-5

  @HiveField(11)
  int? postEnergy; // 1-5

  @HiveField(12)
  String? preMood;

  @HiveField(13)
  String? postMood;

  @HiveField(14)
  String? programId;

  FastingSession({
    required this.id,
    required this.type,
    required this.startTime,
    required this.plannedMinutes,
    this.endTime,
    this.notes = '',
    this.moodEmoji = '',
    this.protocol = 'morse',
    this.preWeight,
    this.postWeight,
    this.preEnergy,
    this.postEnergy,
    this.preMood,
    this.postMood,
    this.programId,
  });

  bool get isActive => endTime == null;

  Duration get elapsed {
    final end = endTime ?? DateTime.now();
    return end.difference(startTime);
  }

  Duration get planned => Duration(minutes: plannedMinutes);

  double get progress {
    if (plannedMinutes <= 0) return 0;
    return (elapsed.inSeconds / planned.inSeconds).clamp(0.0, 1.0);
  }

  Duration get remaining {
    final r = planned - elapsed;
    return r.isNegative ? Duration.zero : r;
  }

  FastingSession copyWith({
    DateTime? endTime,
    String? notes,
    String? moodEmoji,
    double? preWeight,
    double? postWeight,
    int? preEnergy,
    int? postEnergy,
    String? preMood,
    String? postMood,
    String? programId,
  }) {
    return FastingSession(
      id: id,
      type: type,
      startTime: startTime,
      plannedMinutes: plannedMinutes,
      endTime: endTime ?? this.endTime,
      notes: notes ?? this.notes,
      moodEmoji: moodEmoji ?? this.moodEmoji,
      protocol: protocol,
      preWeight: preWeight ?? this.preWeight,
      postWeight: postWeight ?? this.postWeight,
      preEnergy: preEnergy ?? this.preEnergy,
      postEnergy: postEnergy ?? this.postEnergy,
      preMood: preMood ?? this.preMood,
      postMood: postMood ?? this.postMood,
      programId: programId ?? this.programId,
    );
  }
}

// ── DISPLAY HELPERS ─────────────────────────────────────────────────────────

extension FastingTypeDisplay on FastingType {
  String get emoji => switch (this) {
        FastingType.waterFast => '💧',
        FastingType.juiceFast => '🧃',
        FastingType.fruitFast => '🍎',
        FastingType.grapeCure => '🍇',
        FastingType.drySunFast => '🌅',
        FastingType.intermittent => '⏱️',
        FastingType.monoFruit => '🍉',
      };

  String get label => switch (this) {
        FastingType.waterFast => 'Jeûne hydrique',
        FastingType.juiceFast => 'Jeûne jus',
        FastingType.fruitFast => 'Jeûne aux fruits',
        FastingType.grapeCure => 'Cure de raisin',
        FastingType.drySunFast => 'Jeûne sec diurne',
        FastingType.intermittent => 'Intermittent',
        FastingType.monoFruit => 'Mono-fruit',
      };

  String get subtitle => switch (this) {
        FastingType.waterFast => 'Eau pure uniquement',
        FastingType.juiceFast => 'Jus de fruits frais',
        FastingType.fruitFast => 'Fruits astringents',
        FastingType.grapeCure => 'Raisins noirs — Dr. Morse',
        FastingType.drySunFast => 'Ni eau ni nourriture (journée)',
        FastingType.intermittent => '16:8 ou 20:4',
        FastingType.monoFruit => 'Pastèque, melon…',
      };
}
