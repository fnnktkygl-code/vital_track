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
    
    double totalScore = 0;
    for (final item in _mealItems) {
      double itemScore = item.vitality.freshness.toDouble();
      
      // Electric / Dr. Sebi alignment (+15 electric, -15 hybrid)
      if (item.specific.electric) {
        itemScore += 15;
      } else if (item.specific.hybrid) {
        itemScore -= 15;
      }
      
      // PRAL / Acid-Alkaline alignment
      if (item.scientific.pral <= -2.0) {
        itemScore += 10; // Strongly alkaline
      } else if (item.scientific.pral < 0) {
        itemScore += 5;  // Mildly alkaline
      } else if (item.scientific.pral > 2.0) {
        itemScore -= 15; // Strongly acidifying
      } else if (item.scientific.pral > 0) {
        itemScore -= 8;  // Mildly acidifying
      }
      
      // Mucus / Arnold Ehret alignment
      final mucusLower = item.specific.mucus.toLowerCase();
      if (mucusLower.contains('mucogène') || mucusLower.contains('mucus')) {
        itemScore -= 15;
      } else if (mucusLower.contains('dissolvant')) {
        itemScore += 10;
      }
      
      totalScore += itemScore.clamp(0.0, 100.0);
    }
    
    return (totalScore / _mealItems.length).round().clamp(0, 100);
  }
}
