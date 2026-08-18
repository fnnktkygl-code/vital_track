import 'package:flutter/foundation.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/services/diet_plan_generator.dart';
import 'package:vital_track/services/hive_service.dart';

/// Manages the user's diet-plan calendar: generating it (from the wizard
/// or from a chat proposal), activating it, and editing it day by day.
class DietPlanProvider with ChangeNotifier {
  final HiveService _hive;
  DietPlan? _activePlan;
  List<DietPlan> _history = [];

  DietPlanProvider(this._hive) {
    _load();
  }

  DietPlan? get activePlan => _activePlan;
  List<DietPlan> get history => List.unmodifiable(_history);
  bool get hasActivePlan => _activePlan != null;
  DietDay? get todayPlan => _activePlan?.todayPlan;

  void _load() {
    final plans = _hive.loadDietPlans();
    _activePlan = null;
    _history = [];
    for (final p in plans) {
      if (p.isActive) {
        _activePlan = p;
      } else {
        _history.add(p);
      }
    }
    _history.sort((a, b) => b.startDate.compareTo(a.startDate));
  }

  /// Builds a plan preview without persisting or activating it yet — used
  /// by both the onboarding wizard and the chat "propose a plan" flow so
  /// the user can review (and the mascot can present) before committing.
  DietPlan buildPreview({
    required String protocol,
    required int numDays,
    required String objective,
    String restrictions = '',
    String source = 'wizard',
  }) {
    return DietPlanGenerator.generate(
      protocol: protocol,
      numDays: numDays,
      objective: objective,
      restrictions: restrictions,
      source: source,
    );
  }

  /// Activates a plan (from preview or from a chat proposal). Archives any
  /// currently active plan first.
  Future<void> activatePlan(DietPlan plan) async {
    if (_activePlan != null && _activePlan!.id != plan.id) {
      _activePlan!.isActive = false;
      _activePlan!.endDate = DateTime.now();
      await _hive.saveDietPlan(_activePlan!);
      _history.insert(0, _activePlan!);
    }
    plan.isActive = true;
    _activePlan = plan;
    await _hive.saveDietPlan(plan);
    notifyListeners();
  }

  Future<void> endActivePlan() async {
    if (_activePlan == null) return;
    _activePlan!.isActive = false;
    _activePlan!.endDate = DateTime.now();
    await _hive.saveDietPlan(_activePlan!);
    _history.insert(0, _activePlan!);
    _activePlan = null;
    notifyListeners();
  }

  Future<void> renameActivePlan(String name) async {
    if (_activePlan == null || name.trim().isEmpty) return;
    _activePlan!.name = name.trim();
    await _hive.saveDietPlan(_activePlan!);
    notifyListeners();
  }

  Future<void> toggleMealDone(PlannedMeal meal) async {
    meal.done = !meal.done;
    if (_activePlan != null) await _hive.saveDietPlan(_activePlan!);
    notifyListeners();
  }

  Future<void> addItemToMeal(PlannedMeal meal, String item) async {
    final clean = item.trim();
    if (clean.isEmpty) return;
    if (!meal.items.any((i) => i.toLowerCase() == clean.toLowerCase())) {
      meal.items.add(clean);
    }
    if (_activePlan != null) await _hive.saveDietPlan(_activePlan!);
    notifyListeners();
  }

  Future<void> removeItemFromMeal(PlannedMeal meal, String item) async {
    meal.items.remove(item);
    if (_activePlan != null) await _hive.saveDietPlan(_activePlan!);
    notifyListeners();
  }

  Future<void> updateDayNote(DietDay day, String note) async {
    day.dayNote = note;
    if (_activePlan != null) await _hive.saveDietPlan(_activePlan!);
    notifyListeners();
  }

  /// Re-rolls the food selection for a single day, keeping the same slots.
  Future<void> regenerateDay(DietDay day) async {
    if (_activePlan == null) return;
    final fresh = DietPlanGenerator.regenerateDay(
      protocol: _activePlan!.protocol,
      dayIndex: day.dayIndex,
      numDays: _activePlan!.totalDays,
      date: day.date,
      restrictions: _activePlan!.restrictions,
    );
    final idx = _activePlan!.days.indexWhere((d) => d.dayIndex == day.dayIndex);
    if (idx != -1) {
      _activePlan!.days[idx] = fresh;
      await _hive.saveDietPlan(_activePlan!);
      notifyListeners();
    }
  }
}
