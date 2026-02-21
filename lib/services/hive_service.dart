import 'package:hive_flutter/hive_flutter.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/models/chat_message.dart';

class HiveService {
  static const String _mealBoxName = 'daily_meal';
  static const String settingsBoxName = 'settings'; // Kept as is, not in the provided snippet for change
  static const String _historyBoxName = 'history';
  static const String _favoritesBoxName = 'favorites';
  static const String _knowledgeBoxName = 'knowledge_sources';
  static const String _fastingBoxName = 'fasting_sessions';
  static const String _programBoxName = 'fasting_programs';
  static const String _breathingBoxName = 'breathing_sessions';
  static const String _chatHistoryBoxName = 'chat_history';
  static const String _aiCacheBoxName = 'ai_cache';

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

    // Fasting Adapters
    if (!Hive.isAdapterRegistered(7)) Hive.registerAdapter(FastingTypeAdapter());
    if (!Hive.isAdapterRegistered(8)) Hive.registerAdapter(FastingSessionAdapter());
    if (!Hive.isAdapterRegistered(9)) Hive.registerAdapter(FastingProgramAdapter());
    if (!Hive.isAdapterRegistered(10)) Hive.registerAdapter(FastingSessionConfigAdapter());

    // Breathing Adapters
    if (!Hive.isAdapterRegistered(11)) Hive.registerAdapter(BreathingTypeAdapter());
    if (!Hive.isAdapterRegistered(12)) Hive.registerAdapter(BreathingSessionAdapter());

    // Chat Adapters
    if (!Hive.isAdapterRegistered(13)) Hive.registerAdapter(ChatMessageAdapter());

    await Hive.openBox<Food>(_mealBoxName);
    await Hive.openBox(settingsBoxName);
    await Hive.openBox<Food>(_favoritesBoxName);
    await Hive.openBox<Food>(_historyBoxName);
    await Hive.openBox<KnowledgeSource>(_knowledgeBoxName);
    await Hive.openBox<FastingSession>(_fastingBoxName);
    await Hive.openBox<FastingProgram>(_programBoxName);
    await Hive.openBox<BreathingSession>(_breathingBoxName);
    await Hive.openBox<ChatMessage>(_chatHistoryBoxName);
    await Hive.openBox<String>(_aiCacheBoxName);
  }

  Future<void> deleteAll() async {
    await Hive.deleteBoxFromDisk(_mealBoxName);
    await Hive.deleteBoxFromDisk(settingsBoxName);
    await Hive.deleteBoxFromDisk(_historyBoxName);
    await Hive.deleteBoxFromDisk(_favoritesBoxName);
    await Hive.deleteBoxFromDisk(_knowledgeBoxName);
    await Hive.deleteBoxFromDisk(_fastingBoxName);
    await Hive.deleteBoxFromDisk(_programBoxName);
    await Hive.deleteBoxFromDisk(_breathingBoxName);
    await Hive.deleteBoxFromDisk(_chatHistoryBoxName);
    await Hive.deleteBoxFromDisk(_aiCacheBoxName);
  }

  Future<void> clearAllData() async {
    await Hive.box<Food>(_mealBoxName).clear();
    await Hive.box(settingsBoxName).clear();
    await Hive.box<Food>(_historyBoxName).clear();
    await Hive.box<Food>(_favoritesBoxName).clear();
    // Intentionally keep knowledge documents
    await Hive.box<FastingSession>(_fastingBoxName).clear();
    await Hive.box<FastingProgram>(_programBoxName).clear();
    await Hive.box<BreathingSession>(_breathingBoxName).clear();
    await Hive.box<ChatMessage>(_chatHistoryBoxName).clear();
    await Hive.box<String>(_aiCacheBoxName).clear();
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

  // ── FASTING HELPERS ─────────────────────────────────────────────────────────
  Box<FastingSession> get fastingBox => Hive.box<FastingSession>(_fastingBoxName);

  Future<void> saveFastingSession(FastingSession session) async {
    await fastingBox.put(session.id, session);
  }

  Future<void> deleteFastingSession(String id) async {
    await fastingBox.delete(id);
  }

  List<FastingSession> loadFastingSessions() {
    return fastingBox.values.toList();
  }

  // ── PROGRAM HELPERS ────────────────────────────────────────────────────────
  Box<FastingProgram> get programBox => Hive.box<FastingProgram>(_programBoxName);

  Future<void> saveFastingProgram(FastingProgram program) async {
    await programBox.put(program.id, program);
  }

  Future<void> deleteFastingProgram(String id) async {
    await programBox.delete(id);
  }

  List<FastingProgram> loadFastingPrograms() {
    return programBox.values.toList();
  }

  // ── BREATHING HELPERS ─────────────────────────────────────────────────────
  Box<BreathingSession> get breathingBox => Hive.box<BreathingSession>(_breathingBoxName);

  Future<void> saveBreathingSession(BreathingSession session) async {
    await breathingBox.put(session.id, session);
  }

  Future<void> deleteBreathingSession(String id) async {
    await breathingBox.delete(id);
  }

  List<BreathingSession> loadBreathingSessions() {
    return breathingBox.values.toList();
  }

  // ── CHAT HISTORY HELPERS ──────────────────────────────────────────────────
  Box<ChatMessage> get chatBox => Hive.box<ChatMessage>(_chatHistoryBoxName);

  Future<void> saveChatMessage(ChatMessage msg) async {
    await chatBox.put(msg.id, msg);
  }

  Future<void> deleteChatMessage(String id) async {
    await chatBox.delete(id);
  }

  Future<void> clearChatHistory() async {
    await chatBox.clear();
  }

  List<ChatMessage> loadChatHistory() {
    final list = chatBox.values.toList();
    list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return list;
  }

  // ── AI CACHE HELPERS ──────────────────────────────────────────────────────
  Box<String> get aiCacheBox => Hive.box<String>(_aiCacheBoxName);

  Future<void> cacheAiResponse(String hash, String payload) async {
    await aiCacheBox.put(hash, payload);
  }

  String? getCachedAiResponse(String hash) {
    return aiCacheBox.get(hash);
  }

  Future<void> clearAiCache() async {
    await aiCacheBox.clear();
  }
}
