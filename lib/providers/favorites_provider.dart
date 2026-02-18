import 'package:flutter/material.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/services/hive_service.dart';

class FavoritesProvider with ChangeNotifier {
  final List<Food> _favorites = [];
  final HiveService _hiveService = HiveService();

  List<Food> get favorites => List.unmodifiable(_favorites);

  FavoritesProvider() {
    _loadFavorites();
  }

  void _loadFavorites() {
    final saved = _hiveService.loadFavorites();
    if (saved.isNotEmpty) {
      _favorites.addAll(saved);
      notifyListeners();
    }
  }

  bool isFavorite(Food food) {
    return _favorites.any((f) => f.id == food.id);
  }

  void toggleFavorite(Food food) {
    final index = _favorites.indexWhere((f) => f.id == food.id);
    if (index >= 0) {
      _favorites.removeAt(index);
    } else {
      _favorites.add(food);
    }
    _hiveService.saveFavorites(_favorites);
    notifyListeners();
  }
}
