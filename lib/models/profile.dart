
class Profile {
  final String name;
  final List<String> goals;
  final List<String> restrictions;
  final Map<String, dynamic> vitalMetrics;

  // Notification preferences
  final bool notifyDailyTip;
  final bool notifyMealReminder;
  final bool notifyFoodWarning;
  final bool notifyHydration;
  final String notifyFrequency; // "low" | "medium" | "high"

  // ── Fasting profile ────────────────────────────────────────────────────────
  final List<String> fastingGoals;     // detox, weight_loss, clarity, autophagy, spiritual, discipline
  final double? weightKg;
  final int? age;
  final String bodyType;               // "" | "ectomorph" | "mesomorph" | "endomorph"
  final String fastingExperience;      // "" | "beginner" | "intermediate" | "advanced"
  final bool notifyFastingCoach;       // proactive fasting check-ins

  const Profile({
    this.name = "Vitalist",
    this.goals = const [],
    this.restrictions = const [],
    this.vitalMetrics = const {},
    this.notifyDailyTip = true,
    this.notifyMealReminder = true,
    this.notifyFoodWarning = true,
    this.notifyHydration = false,
    this.notifyFrequency = "medium",
    this.fastingGoals = const [],
    this.weightKg,
    this.age,
    this.bodyType = "",
    this.fastingExperience = "",
    this.notifyFastingCoach = true,
  });

  Profile copyWith({
    String? name,
    List<String>? goals,
    List<String>? restrictions,
    Map<String, dynamic>? vitalMetrics,
    bool? notifyDailyTip,
    bool? notifyMealReminder,
    bool? notifyFoodWarning,
    bool? notifyHydration,
    String? notifyFrequency,
    List<String>? fastingGoals,
    double? weightKg,
    int? age,
    String? bodyType,
    String? fastingExperience,
    bool? notifyFastingCoach,
  }) {
    return Profile(
      name: name ?? this.name,
      goals: goals ?? this.goals,
      restrictions: restrictions ?? this.restrictions,
      vitalMetrics: vitalMetrics ?? this.vitalMetrics,
      notifyDailyTip: notifyDailyTip ?? this.notifyDailyTip,
      notifyMealReminder: notifyMealReminder ?? this.notifyMealReminder,
      notifyFoodWarning: notifyFoodWarning ?? this.notifyFoodWarning,
      notifyHydration: notifyHydration ?? this.notifyHydration,
      notifyFrequency: notifyFrequency ?? this.notifyFrequency,
      fastingGoals: fastingGoals ?? this.fastingGoals,
      weightKg: weightKg ?? this.weightKg,
      age: age ?? this.age,
      bodyType: bodyType ?? this.bodyType,
      fastingExperience: fastingExperience ?? this.fastingExperience,
      notifyFastingCoach: notifyFastingCoach ?? this.notifyFastingCoach,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'goals': goals,
      'restrictions': restrictions,
      'vitalMetrics': vitalMetrics,
      'notifyDailyTip': notifyDailyTip,
      'notifyMealReminder': notifyMealReminder,
      'notifyFoodWarning': notifyFoodWarning,
      'notifyHydration': notifyHydration,
      'notifyFrequency': notifyFrequency,
      'fastingGoals': fastingGoals,
      'weightKg': weightKg,
      'age': age,
      'bodyType': bodyType,
      'fastingExperience': fastingExperience,
      'notifyFastingCoach': notifyFastingCoach,
    };
  }

  factory Profile.fromJson(Map<String, dynamic> map) {
    return Profile(
      name: map['name'] ?? "Vitalist",
      goals: List<String>.from(map['goals'] ?? []),
      restrictions: List<String>.from(map['restrictions'] ?? []),
      vitalMetrics: Map<String, dynamic>.from(map['vitalMetrics'] ?? {}),
      notifyDailyTip: map['notifyDailyTip'] ?? true,
      notifyMealReminder: map['notifyMealReminder'] ?? true,
      notifyFoodWarning: map['notifyFoodWarning'] ?? true,
      notifyHydration: map['notifyHydration'] ?? false,
      notifyFrequency: map['notifyFrequency'] ?? "medium",
      fastingGoals: List<String>.from(map['fastingGoals'] ?? []),
      weightKg: (map['weightKg'] as num?)?.toDouble(),
      age: map['age'] as int?,
      bodyType: map['bodyType'] ?? "",
      fastingExperience: map['fastingExperience'] ?? "",
      notifyFastingCoach: map['notifyFastingCoach'] ?? true,
    );
  }
}
