import 'package:flutter/material.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/providers/mascot_provider.dart';

class MealProvider with ChangeNotifier {
  final List<Food> _mealItems = [];
  final HiveService _hiveService = HiveService();
  MascotProvider? _mascotProvider;

  List<Food> get mealItems => List.unmodifiable(_mealItems);

  MealProvider() {
    _loadMeal();
  }

  /// Inject mascot provider after construction (to avoid circular dependency)
  void setMascotProvider(MascotProvider mascot) {
    _mascotProvider = mascot;
  }

  void _loadMeal() {
    final savedMeal = _hiveService.loadMeal();
    if (savedMeal.isNotEmpty) {
      _mealItems.addAll(savedMeal);
      notifyListeners();
    }
  }

  void addFood(Food food) {
    _mealItems.add(food);
    _hiveService.saveMeal(_mealItems);
    notifyListeners();

    // Trigger mascot reaction
    if (food.approved) {
      _mascotProvider?.onGoodFoodAdded(food);
    } else {
      _mascotProvider?.onBadFoodAdded(food);
    }

    // Score-based reaction after adding
    final score = mealScore;
    if (score != null) {
      if (score >= 75) {
        _mascotProvider?.onHighScore(score);
      } else if (score < 35) {
        _mascotProvider?.onLowScore(score);
      }
    }
  }

  void removeFood(Food food) {
    _mealItems.remove(food);
    _hiveService.saveMeal(_mealItems);
    notifyListeners();
  }

  void clearMeal() {
    _mealItems.clear();
    _hiveService.saveMeal([]);
    notifyListeners();
  }

  Map<String, String>? checkCombos(Food newFood) {
    if (_mealItems.isEmpty) return null;

    bool isStarch(Food f) =>
        f.tags.contains('Féculent') || f.family.contains('Céréale');
    bool isAcid(Food f) =>
        f.tags.contains('Acide') || f.name.toLowerCase().contains('citron');
    bool isMelon(Food f) =>
        f.name.toLowerCase().contains('melon') ||
            f.name.toLowerCase().contains('pastèque');

    // Check against ALL existing items, not just the last one
    for (final existing in _mealItems) {
      if ((isStarch(existing) && isAcid(newFood)) ||
          (isStarch(newFood) && isAcid(existing))) {
        _mascotProvider?.onTrophologyWarning(
            "${existing.name} + ${newFood.name} (Amidon + Acide)");
        return {
          'a': existing.name,
          'b': newFood.name,
          'reason': "Amidon + Acide"
        };
      }

      if ((isMelon(existing) && !isMelon(newFood)) ||
          (!isMelon(existing) && isMelon(newFood))) {
        _mascotProvider?.onTrophologyWarning("Melon doit être seul");
        return {
          'a': existing.name,
          'b': newFood.name,
          'reason': "Melon doit être seul"
        };
      }
    }

    return null;
  }

  int? get mealScore {
    if (_mealItems.isEmpty) return null;
    final totalFreshness =
    _mealItems.fold(0, (sum, item) => sum + item.vitality.freshness);
    return (totalFreshness / _mealItems.length).round();
  }
}
