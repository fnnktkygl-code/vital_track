
class Profile {
  final String name;
  final List<String> goals;
  final List<String> restrictions;
  final Map<String, dynamic> vitalMetrics;

  const Profile({
    this.name = "Vitalist",
    this.goals = const [],
    this.restrictions = const [],
    this.vitalMetrics = const {},
  });

  Profile copyWith({
    String? name,
    List<String>? goals,
    List<String>? restrictions,
    Map<String, dynamic>? vitalMetrics,
  }) {
    return Profile(
      name: name ?? this.name,
      goals: goals ?? this.goals,
      restrictions: restrictions ?? this.restrictions,
      vitalMetrics: vitalMetrics ?? this.vitalMetrics,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'goals': goals,
      'restrictions': restrictions,
      'vitalMetrics': vitalMetrics,
    };
  }

  factory Profile.fromJson(Map<String, dynamic> map) {
    return Profile(
      name: map['name'] ?? "Vitalist",
      goals: List<String>.from(map['goals'] ?? []),
      restrictions: List<String>.from(map['restrictions'] ?? []),
      vitalMetrics: Map<String, dynamic>.from(map['vitalMetrics'] ?? {}),
    );
  }
}
