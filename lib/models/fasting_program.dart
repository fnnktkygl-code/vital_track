import 'package:hive/hive.dart';
import 'package:vital_track/models/fasting_session.dart';

part 'fasting_program.g.dart';

@HiveType(typeId: 9)

class FastingProgram extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String targetObjective;
  @HiveField(3)
  DateTime startDate;
  @HiveField(4)
  DateTime? endDate;
  @HiveField(5)
  final List<FastingSessionConfig> configs;
  @HiveField(6)
  final String? protocol; // morse, ehret, sebi
  @HiveField(7)
  bool isActive;
  @HiveField(8)
  int currentConfigIndex;

  FastingProgram({
    required this.id,
    required this.name,
    required this.targetObjective,
    required this.startDate,
    this.endDate,
    required this.configs,
    this.protocol,
    this.isActive = true,
    this.currentConfigIndex = 0,
  });

  double get progress {
    if (configs.isEmpty) return 0.0;
    return (currentConfigIndex / configs.length).clamp(0.0, 1.0);
  }

  FastingSessionConfig? get currentConfig {
    if (configs.isEmpty || currentConfigIndex >= configs.length) return null;
    return configs[currentConfigIndex];
  }
}

@HiveType(typeId: 10)
class FastingSessionConfig {
  @HiveField(0)
  final FastingType type;
  @HiveField(1)
  final int durationMinutes;
  @HiveField(2)
  final int breakHours;

  const FastingSessionConfig({
    required this.type,
    required this.durationMinutes,
    required this.breakHours,
  });
}
