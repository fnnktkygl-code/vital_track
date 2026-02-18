import 'package:hive_flutter/hive_flutter.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/models/food.dart';

class HiveService {
  static const String mealBoxName = 'daily_meal';
  static const String settingsBoxName = 'settings';
  static const String historyBoxName = 'scan_history';

  Future<void> init() async {
    await Hive.initFlutter();

    // Register Adapters
    Hive.registerAdapter(FoodAdapter());
    Hive.registerAdapter(ScientificDataAdapter());
    Hive.registerAdapter(VitalityDataAdapter());
    Hive.registerAdapter(SpecificDataAdapter());
    
    // RAG Adapters
    Hive.registerAdapter(KnowledgeTypeAdapter());
    Hive.registerAdapter(KnowledgeSourceAdapter());

    await Hive.openBox<Food>(mealBoxName);
    await Hive.openBox(settingsBoxName);
    await Hive.openBox<Food>(historyBoxName);
    await Hive.openBox<KnowledgeSource>('knowledge_sources'); 
  }

  Future<void> deleteAll() async {
    await Hive.deleteBoxFromDisk(mealBoxName);
    await Hive.deleteBoxFromDisk(settingsBoxName);
    await Hive.deleteBoxFromDisk(historyBoxName);
  }

  Box<Food> get mealBox => Hive.box<Food>(mealBoxName);
  Box get settingsBox => Hive.box(settingsBoxName);
  Box<Food> get historyBox => Hive.box<Food>(historyBoxName);
  Box<KnowledgeSource> get knowledgeSourcesBox => Hive.box<KnowledgeSource>('knowledge_sources');

  Future<void> saveMeal(List<Food> meal) async {
    await mealBox.clear();
    await mealBox.addAll(meal);
  }

  List<Food> loadMeal() {
    return mealBox.values.toList();
  }

  Future<void> saveMode(String modeId) async {
    await settingsBox.put('mode', modeId);
  }

  String? loadMode() {
    return settingsBox.get('mode');
  }

  Future<void> addToHistory(Food food) async {
    final currentHistory = historyBox.values.toList();

    currentHistory.removeWhere((f) => f.id == food.id);
    currentHistory.insert(0, food);

    if (currentHistory.length > 50) {
      currentHistory.removeLast();
    }

    await historyBox.clear();
    await historyBox.addAll(currentHistory);
  }

  List<Food> loadHistory() {
    return historyBox.values.toList();
  }
}
