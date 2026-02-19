import 'package:hive_flutter/hive_flutter.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/models/food.dart';

class HiveService {
  static const String _mealBoxName = 'daily_meal';
  static const String settingsBoxName = 'settings'; // Kept as is, not in the provided snippet for change
  static const String _historyBoxName = 'history';
  static const String _favoritesBoxName = 'favorites';
  static const String _knowledgeBoxName = 'knowledge_sources';

  Future<void> init() async {
    await Hive.initFlutter();

    // Register Adapters
    if (!Hive.isAdapterRegistered(0)) Hive.registerAdapter(FoodAdapter());
    if (!Hive.isAdapterRegistered(1)) Hive.registerAdapter(ScientificDataAdapter());
    if (!Hive.isAdapterRegistered(2)) Hive.registerAdapter(VitalityDataAdapter());
    if (!Hive.isAdapterRegistered(3)) Hive.registerAdapter(SpecificDataAdapter());
    
    // RAG Adapters
    if (!Hive.isAdapterRegistered(5)) Hive.registerAdapter(KnowledgeTypeAdapter());
    if (!Hive.isAdapterRegistered(6)) Hive.registerAdapter(KnowledgeSourceAdapter());

    await Hive.openBox<Food>(_mealBoxName);
    await Hive.openBox(settingsBoxName);
    await Hive.openBox<Food>(_favoritesBoxName);
    await Hive.openBox<Food>(_historyBoxName);
    await Hive.openBox<KnowledgeSource>(_knowledgeBoxName);
  }

  Future<void> deleteAll() async {
    await Hive.deleteBoxFromDisk(_mealBoxName);
    await Hive.deleteBoxFromDisk(settingsBoxName);
    await Hive.deleteBoxFromDisk(_historyBoxName);
    await Hive.deleteBoxFromDisk(_favoritesBoxName);
    await Hive.deleteBoxFromDisk(_knowledgeBoxName);
  }

  Box<Food> get mealBox => Hive.box<Food>(_mealBoxName);
  Box get settingsBox => Hive.box(settingsBoxName);
  Box<Food> get favoritesBox => Hive.box<Food>(_favoritesBoxName);
  Box<Food> get historyBox => Hive.box<Food>(_historyBoxName);
  Box<KnowledgeSource> get knowledgeSourcesBox =>
      Hive.box<KnowledgeSource>(_knowledgeBoxName);

  // ── MEAL HELPERS ───────────────────────────────────────────────────────────
  void saveMeal(List<Food> items) {
    mealBox.clear();
    mealBox.addAll(items);
  }

  List<Food> loadMeal() {
    return mealBox.values.toList();
  }

  // ── FAVORITES HELPERS ──────────────────────────────────────────────────────
  void saveFavorites(List<Food> items) {
    favoritesBox.clear();
    favoritesBox.addAll(items);
  }

  List<Food> loadFavorites() {
    return favoritesBox.values.toList();
  }

  // ── HISTORY HELPERS ────────────────────────────────────────────────────────
  Future<void> addToHistory(Food food) async {
    final currentHistory = historyBox.values.toList();
    currentHistory.removeWhere((f) => f.name == food.name);
    currentHistory.insert(0, food);
    if (currentHistory.length > 20) currentHistory.removeLast();

    await historyBox.clear();
    await historyBox.addAll(currentHistory);
  }

  List<Food> loadHistory() {
    return historyBox.values.toList();
  }

  Future<void> saveMode(String modeId) async {
    await settingsBox.put('mode', modeId);
  }

  String? loadMode() {
    return settingsBox.get('mode');
  }

  Future<void> saveApiKey(String key) async {
    await settingsBox.put('gemini_api_key', key);
  }

  String? loadApiKey() {
    return settingsBox.get('gemini_api_key');
  }
}
