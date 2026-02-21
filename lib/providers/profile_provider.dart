import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:vital_track/models/profile.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/hive_service.dart';

class ProfileProvider with ChangeNotifier {
  final HiveService _hiveService = HiveService();
  static const String _boxName = 'profileBox';
  static const String _key = 'userProfile';
  late Box _box;

  Profile _profile = const Profile();
  Profile get profile => _profile;

  String get geminiApiKey => _hiveService.loadApiKey() ?? '';

  bool _isInitialized = false;

  ProfileProvider() {
    _init();
  }

  Future<void> _init() async {
    _box = await Hive.openBox(_boxName);
    final data = _box.get(_key);
    if (data != null) {
      final jsonMap = jsonDecode(jsonEncode(data));
      _profile = Profile.fromJson(jsonMap);
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> updateProfile({
    String? name,
    List<String>? goals,
    List<String>? restrictions,
    Map<String, dynamic>? vitalMetrics,
    bool? notifyDailyTip,
    bool? notifyMealReminder,
    bool? notifyFoodWarning,
    bool? notifyHydration,
    String? notifyFrequency,
  }) async {
    _profile = _profile.copyWith(
      name: name,
      goals: goals,
      restrictions: restrictions,
      vitalMetrics: vitalMetrics,
      notifyDailyTip: notifyDailyTip,
      notifyMealReminder: notifyMealReminder,
      notifyFoodWarning: notifyFoodWarning,
      notifyHydration: notifyHydration,
      notifyFrequency: notifyFrequency,
    );
    notifyListeners();
    await _save();
  }

  Future<void> _save() async {
    if (!_isInitialized) return;
    await _box.put(_key, _profile.toJson());
  }

  // ── Toggle helpers ─────────────────────────────────────────────────────────

  Future<void> toggleGoal(String goal) async {
    final current = List<String>.from(_profile.goals);
    if (current.contains(goal)) {
      current.remove(goal);
    } else {
      current.add(goal);
    }
    await updateProfile(goals: current);
  }

  Future<void> toggleRestriction(String restriction) async {
    final current = List<String>.from(_profile.restrictions);
    if (current.contains(restriction)) {
      current.remove(restriction);
    } else {
      current.add(restriction);
    }
    await updateProfile(restrictions: current);
  }

  Future<void> toggleNotifyDailyTip() async {
    await updateProfile(notifyDailyTip: !_profile.notifyDailyTip);
  }

  Future<void> toggleNotifyMealReminder() async {
    await updateProfile(notifyMealReminder: !_profile.notifyMealReminder);
  }

  Future<void> toggleNotifyFoodWarning() async {
    await updateProfile(notifyFoodWarning: !_profile.notifyFoodWarning);
  }

  Future<void> toggleNotifyHydration() async {
    await updateProfile(notifyHydration: !_profile.notifyHydration);
  }

  Future<void> setNotifyFrequency(String freq) async {
    await updateProfile(notifyFrequency: freq);
  }

  // ── Fasting profile helpers ────────────────────────────────────────────────

  Future<void> updateFastingProfile({
    List<String>? fastingGoals,
    double? weightKg,
    int? age,
    String? bodyType,
    String? fastingExperience,
    bool? notifyFastingCoach,
  }) async {
    _profile = _profile.copyWith(
      fastingGoals: fastingGoals,
      weightKg: weightKg,
      age: age,
      bodyType: bodyType,
      fastingExperience: fastingExperience,
      notifyFastingCoach: notifyFastingCoach,
    );
    notifyListeners();
    await _save();
  }

  Future<void> toggleFastingGoal(String goal) async {
    final current = List<String>.from(_profile.fastingGoals);
    if (current.contains(goal)) {
      current.remove(goal);
    } else {
      current.add(goal);
    }
    await updateFastingProfile(fastingGoals: current);
  }

  Future<void> toggleNotifyFastingCoach() async {
    await updateFastingProfile(notifyFastingCoach: !_profile.notifyFastingCoach);
  }

  Future<void> updateApiKey(String key) async {
    await _hiveService.saveApiKey(key);
    AIService.resetKeyCache();
    notifyListeners();
  }

  Future<void> resetAllData() async {
    await _hiveService.clearAllData();
    _profile = const Profile();
    AIService.resetKeyCache();
    notifyListeners();
  }
}
