import 'package:hive_flutter/hive_flutter.dart';

part 'breathing_session.g.dart';

@HiveType(typeId: 11)
enum BreathingType {
  @HiveField(0)
  whm,
  @HiveField(1)
  relaxation,
  @HiveField(2)
  box,
  @HiveField(3)
  coherence,
}

@HiveType(typeId: 12)
class BreathingSession extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final BreathingType type;

  @HiveField(2)
  final DateTime startTime;

  @HiveField(3)
  int rounds;

  @HiveField(4)
  int totalSeconds;

  @HiveField(5)
  List<int> retentionTimes; // WHM: seconds held per round

  @HiveField(6)
  DateTime? endTime;

  @HiveField(7)
  String moodEmoji;

  @HiveField(8)
  String notes;

  @HiveField(9)
  final String protocol;

  BreathingSession({
    required this.id,
    required this.type,
    required this.startTime,
    this.rounds = 0,
    this.totalSeconds = 0,
    List<int>? retentionTimes,
    this.endTime,
    this.moodEmoji = '',
    this.notes = '',
    this.protocol = 'morse',
  }) : retentionTimes = retentionTimes ?? [];

  bool get isActive => endTime == null;

  Duration get elapsed {
    final end = endTime ?? DateTime.now();
    return end.difference(startTime);
  }
}

// ── DISPLAY HELPERS ─────────────────────────────────────────────────────────

extension BreathingTypeDisplay on BreathingType {
  String get emoji => switch (this) {
        BreathingType.whm => '🧊',
        BreathingType.relaxation => '🌙',
        BreathingType.box => '📦',
        BreathingType.coherence => '💚',
      };

  String get label => switch (this) {
        BreathingType.whm => 'Wim Hof',
        BreathingType.relaxation => 'Relaxation',
        BreathingType.box => 'Box Breathing',
        BreathingType.coherence => 'Cohérence',
      };

  String get subtitle => switch (this) {
        BreathingType.whm => 'Hyperventilation + rétention',
        BreathingType.relaxation => 'Respiration lente 1:2',
        BreathingType.box => 'Carrée 4-4-4-4',
        BreathingType.coherence => 'Cardiaque 5.5s',
      };

  String get description => switch (this) {
        BreathingType.whm =>
          '30 respirations profondes, rétention sur expiration, récupération 15s. '
              'Active le système sympathique puis parasympathique. '
              'Libère l\'adrénaline, booste l\'immunité.',
        BreathingType.relaxation =>
          'Inspiration 3s, expiration 6s. Stimule le nerf vague, '
              'réduit le cortisol, prépare au sommeil.',
        BreathingType.box =>
          'Inspire 4s, retiens 4s, expire 4s, retiens 4s. '
              'Utilisée par les Navy SEALs pour le calme sous pression.',
        BreathingType.coherence =>
          'Inspire 5.5s, expire 5.5s. Synchronise le cœur et le cerveau. '
              'Augmente la variabilité cardiaque (HRV).',
      };
}
