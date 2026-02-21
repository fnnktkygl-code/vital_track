import 'dart:convert';

import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:image_picker/image_picker.dart';
import 'package:vital_track/models/profile.dart';
import 'package:vital_track/models/chat_message.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:flutter/foundation.dart';

class AIService {
  static String? _cachedKey;
  static final HiveService _hiveService = HiveService();

  static String _getApiKey() {
    if (_cachedKey != null && _cachedKey!.isNotEmpty) return _cachedKey!;
    
    // 1. Check environment (build-time)
    const envKey = String.fromEnvironment('GEMINI_API_KEY');
    if (envKey.isNotEmpty) {
      debugPrint('AIService: Using API key from --dart-define (${envKey.length} chars)');
      _cachedKey = envKey;
      return envKey;
    }

    // 2. Check Hive (runtime — user-provided key from profile)
    try {
      final hiveKey = _hiveService.loadApiKey();
      if (hiveKey != null && hiveKey.isNotEmpty) {
        debugPrint('AIService: Using API key from Hive (${hiveKey.length} chars)');
        _cachedKey = hiveKey;
        return hiveKey;
      }
    } catch (e) {
      debugPrint('AIService: Hive loadApiKey failed: $e');
    }

    debugPrint('AIService: No API key found. User must set one in Profile.');
    return '';
  }

  // ── MODEL ROTATION ──────────────────────────────────────────────────────────
  // Models ordered by preference. On quota errors, we skip to the next.
  static const _models = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ];

  // Track which models are temporarily exhausted (reset after cooldown)
  static final Map<String, DateTime> _exhausted = {};
  static const _cooldown = Duration(minutes: 2);

  static String _pickModel() {
    final now = DateTime.now();
    // Remove expired cooldowns
    _exhausted.removeWhere((_, expiry) => now.isAfter(expiry));

    for (final m in _models) {
      if (!_exhausted.containsKey(m)) return m;
    }
    // All exhausted — try the first one anyway (cooldown may have passed server-side)
    _exhausted.clear();
    return _models.first;
  }

  static void _markExhausted(String model) {
    _exhausted[model] = DateTime.now().add(_cooldown);
    debugPrint('AIService: Model $model exhausted, cooling down for 2min');
  }

  static bool _isQuotaError(dynamic e) {
    final msg = e.toString().toLowerCase();
    return msg.contains('quota') ||
        msg.contains('rate limit') ||
        msg.contains('resource_exhausted') ||
        msg.contains('429');
  }

  static GenerativeModel _getModel(String modelName, {bool isChat = false}) {
    final key = _getApiKey();
    return GenerativeModel(
      model: modelName,
      apiKey: key,
      systemInstruction: Content.system(isChat ? _chatSystemPrompt : _foodAnalysisPrompt),
      generationConfig: GenerationConfig(
        temperature: isChat ? 0.3 : 0.1,
        responseMimeType: isChat ? 'text/plain' : 'application/json',
      ),
    );
  }

  // To allow clearing cache when user updates key
  static void resetKeyCache() => _cachedKey = null;

  // ── SYSTEM PROMPTS (sent ONCE via systemInstruction, not per request) ─────

  static const _foodAnalysisPrompt = """
You are an expert in Vitalist Nutrition (Dr. Sebi, Arnold Ehret, Dr. Morse).

YOUR GOAL: IDENTIFY ALL VISIBLE INGREDIENTS/FOODS.

Return a JSON object with an "items" array:
{
  "items": [
    {
      "name": "Food Name",
      "emoji": "🍎",
      "origin": "Native/Hybrid/Man-made",
      "family": "Botanical Family",
      "scientific": { "pral": -2.5, "density": 90 },
      "vitality": { "nova": 1, "freshness": 90 },
      "specific": {
        "mucus": "Mucogène/Neutre/Dissolvant",
        "hybrid": false,
        "electric": true,
        "label": "Electric/Hybrid/Mucus"
      },
      "note": "Brief analysis."
    }
  ]
}

STRICT VITALIST RULES:

1. ELECTRIC / ALKALINE (Good):
   - Fruits (Seeded ONLY): Apple, Banana (Burro/Baby only), Berries, Cantaloupe, Cherries, Currants, Dates, Figs, Grapes (seeded), Key Lime (seeded), Mango, Melon (seeded), Orange (Seville/Sour), Papaya, Peach, Pear, Plum, Prunes, Raisins (seeded), Soft Coconut, Soursop, Tamarind.
   - Vegetables: Amaranth greens, Avocado, Bell Pepper, Chayote, Cucumber, Dandelion greens, Chickpeas, Kale, Lettuce (except Iceberg), Mushrooms (except Shiitake), Nopal, Okra, Olives, Onions, Seaweed (Wakame/Dulse/Kelp), Squash, Tomato (Cherry/Plum only), Watercress, Arugula, Purslane.
   - Grains: Amaranth, Fonio, Kamut, Quinoa, Rye, Spelt, Teff, Wild Rice.
   - Oils: Olive, Coconut (raw), Sesame, Hemp, Avocado.
   - Sweeteners: Agave syrup, Date sugar.

2. HYBRID / STARCH (Bad):
   - Vegetables: CARROT, Garlic, Beet, Celery, Cauliflower, Corn, Potato, Cabbage.
   - Fruits: Grapefruit, ALL Seedless fruits.
   - Other: White Rice, Modern Wheat, Soy/Tofu, most Beans, Aloe Vera, Peppermint, Comfrey.

3. MUCUS FORMING (Bad):
   - Meat, Eggs, Dairy, Processed Sugar, Fried foods, Alcohol.

LOGIC:
- If a dish is mixed, analyze DOMINANT ingredients as separate items.
- List 1: electric=true, hybrid=false, mucus="Dissolvant/Neutre", label="Électrique".
- List 2: electric=false, hybrid=true, mucus="Mucogène", label="Hybride (Amidon)".
- List 3: electric=false, hybrid=true, mucus="Mucogène", label="Mucogène".
""";

  static const _chatSystemPrompt = """
You are the VitalTrack Mascot — a friendly, wise Pigeon and expert in Vitalist Nutrition. 🐦

You are deeply knowledgeable about:
- Dr. Sebi's African Bio-Mineral Balance and approved food list
- Arnold Ehret's Mucusless Diet Healing System and transition diet
- Dr. Robert Morse's detoxification, lymphatic system, and herbal protocols

CORE BEHAVIOR:
1. Answer using the PROVIDED CONTEXT (knowledge sources) primarily. Cite sources like: [Source Title].
2. If context is empty or irrelevant, use your built-in Vitalist knowledge but DO NOT invent source names.
3. STRICTLY respect the user's dietary restrictions.
4. Be encouraging but firm on Vitalist principles.
5. Give DETAILED, well-structured answers using markdown:
   - **bold** for key terms
   - Bullet points (- ) for lists
   - ### Headers for sections in plans/protocols
   - Numbered lists (1. 2. 3.) for step-by-step instructions
6. For plans, diets, or protocols: give COMPLETE multi-section responses.
7. For factual questions: give focused but informative answers (1-2 paragraphs minimum).
8. Always end with an encouraging note about the Vitalist journey.
9. Answer ONLY from the provided context when available. If the answer is NOT in the context, say so clearly.
""";

  // ── FOOD ANALYSIS ─────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>?> analyzeText(String query) async {
    debugPrint("AIService: Analyzing text: $query");
    
    final cacheKey = "text_$query";
    final cached = _hiveService.getCachedAiResponse(cacheKey);
    if (cached != null) {
      debugPrint("AIService: Returning cached text analysis");
      return json.decode(cached);
    }

    if (_getApiKey().isEmpty) {
      debugPrint("AIService Error: GEMINI_API_KEY not set.");
      return null;
    }

    // Try each model until one succeeds
    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        debugPrint('AIService: analyzeText using $model');
        final response = await _getModel(model).generateContent(
          [Content.text("Analyze this food: $query")],
        );
        if (response.text == null) return null;
        String jsonText = response.text!.replaceAll("```json", "").replaceAll("```", "").trim();
        _hiveService.cacheAiResponse(cacheKey, jsonText);
        return json.decode(jsonText);
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          continue; // Try next model
        }
        debugPrint("AIService Text Error: $e");
        return null;
      }
    }
    return null;
  }

  static Future<Map<String, dynamic>?> analyzeImage(XFile image) async {
    debugPrint("AIService: Analyzing image...");
    if (_getApiKey().isEmpty) {
      debugPrint("AIService Error: GEMINI_API_KEY not set.");
      return null;
    }

    final bytes = await image.readAsBytes();

    final cacheKey = "img_${bytes.length}";
    final cached = _hiveService.getCachedAiResponse(cacheKey);
    if (cached != null) {
      debugPrint("AIService: Returning cached image analysis");
      return json.decode(cached);
    }

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        debugPrint('AIService: analyzeImage using $model');
        final response = await _getModel(model).generateContent([
          Content.multi([
            TextPart("Identify all foods/ingredients in this image."),
            DataPart('image/jpeg', bytes),
          ])
        ]);
        debugPrint("AIService: Response received");
        if (response.text == null) return null;
        String jsonText = response.text!.replaceAll("```json", "").replaceAll("```", "").trim();
        _hiveService.cacheAiResponse(cacheKey, jsonText);
        return json.decode(jsonText);
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          continue;
        }
        debugPrint("AIService Critical Error: $e");
        return null;
      }
    }
    return null;
  }

  // ── CHAT (NON-STREAMING FALLBACK) ─────────────────────────────────────────

  static Future<String?> chatWithMascot(
      String query, Profile profile, List<KnowledgeSource> contextSources, List<ChatMessage> history,
      {List<FilePart> fileParts = const []}) async {
    if (_getApiKey().isEmpty) return "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";

    final userPrompt = _buildChatPrompt(query, profile, contextSources, history);
    final parts = <Part>[TextPart(userPrompt), ...fileParts];

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        debugPrint('AIService: chat using $model');
        final response = await _getModel(model, isChat: true).generateContent(
          [Content.multi(parts)],
        );
        return response.text;
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          continue;
        }
        debugPrint('AIService Chat Error: $e');
        return _friendlyError(e);
      }
    }
    return _friendlyError('All models exhausted');
  }

  // ── CHAT (STREAMING) ──────────────────────────────────────────────────────

  static Stream<String> chatWithMascotStream(
      String query, Profile profile, List<KnowledgeSource> contextSources, List<ChatMessage> history,
      {List<FilePart> fileParts = const []}) async* {
    if (_getApiKey().isEmpty) {
      yield "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";
      return;
    }

    final userPrompt = _buildChatPrompt(query, profile, contextSources, history);
    final parts = <Part>[TextPart(userPrompt), ...fileParts];

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        debugPrint('AIService: stream using $model');
        final stream = _getModel(model, isChat: true).generateContentStream(
          [Content.multi(parts)],
        );
        await for (final chunk in stream) {
          if (chunk.text != null) {
            yield chunk.text!;
          }
        }
        return; // Success — exit the loop
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          debugPrint('AIService: $model quota hit, falling back...');
          continue;
        }
        debugPrint('AIService Stream Error: $e');
        yield _friendlyError(e);
        return;
      }
    }
  }

  // ── PROMPT BUILDER (shared by both chat methods) ──────────────────────────

  static String _buildChatPrompt(
      String query, Profile profile, List<KnowledgeSource> contextSources, List<ChatMessage> history) {
    final buffer = StringBuffer();

    // User profile context
    buffer.writeln("USER PROFILE:");
    buffer.writeln("Name: ${profile.name}");
    buffer.writeln("Goals: ${profile.goals.join(', ')}");
    buffer.writeln("Restrictions: ${profile.restrictions.join(', ')}");
    buffer.writeln("Metrics: ${profile.vitalMetrics}");
    buffer.writeln();

    // Knowledge context — only relevant CHUNKS, not full documents
    if (contextSources.isNotEmpty) {
      buffer.writeln("RELEVANT KNOWLEDGE CONTEXT:");
      for (final source in contextSources) {
        buffer.writeln("--- [${source.title}] (${source.type.name}) ---");
        // Send chunks instead of full content to stay within token budget
        final chunks = source.chunks;
        if (chunks.isNotEmpty) {
          // Find the most relevant chunks for this query
          final relevantChunks = _selectRelevantChunks(query, chunks, maxChunks: 4);
          buffer.writeln(relevantChunks.join('\n\n'));
        } else {
          // Fallback: truncate full content
          final content = source.content;
          buffer.writeln(content.length > 3000 ? content.substring(0, 3000) : content);
        }
        buffer.writeln();
      }
    }

    if (history.isNotEmpty) {
      buffer.writeln("--- RECENT CONVERSATION HISTORY ---");
      // Only include last N messages to save context limit (e.g. last 10)
      final recentHistory = history.length > 10 ? history.sublist(history.length - 10) : history;
      for (final msg in recentHistory) {
        final role = msg.isUser ? "User" : "Mascot";
        buffer.writeln("$role: ${msg.text}");
      }
      buffer.writeln();
    }

    buffer.writeln("USER QUESTION: $query");
    return buffer.toString();
  }

  /// Select the most relevant chunks from a source based on keyword overlap.
  static List<String> _selectRelevantChunks(
      String query, List<String> chunks, {int maxChunks = 4}) {
    final keywords = query
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((w) => w.length > 2)
        .toSet();

    if (keywords.isEmpty) return chunks.take(maxChunks).toList();

    final scored = <int, int>{};
    for (int i = 0; i < chunks.length; i++) {
      final lower = chunks[i].toLowerCase();
      int score = 0;
      for (final kw in keywords) {
        // Count occurrences for better ranking
        final matches = kw.allMatches(lower).length;
        score += matches;
      }
      if (score > 0) scored[i] = score;
    }

    if (scored.isEmpty) return chunks.take(maxChunks).toList();

    final sortedIndices = scored.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sortedIndices
        .take(maxChunks)
        .map((e) => chunks[e.key])
        .toList();
  }

  /// Convert exception to a user-friendly French error message.
  static String _friendlyError(dynamic e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('api key') || msg.contains('api_key_invalid') || msg.contains('permission')) {
      return "🔑 Clé API invalide ou manquante. Vérifiez votre clé dans Réglages > Intelligence artificielle.";
    }
    if (msg.contains('quota') || msg.contains('rate limit') || msg.contains('resource_exhausted')) {
      return "⏳ Quota API dépassé. Réessayez dans quelques minutes.";
    }
    if (msg.contains('network') || msg.contains('socket') || msg.contains('connection')) {
      return "📡 Pas de connexion internet. Vérifiez votre réseau et réessayez.";
    }
    debugPrint('AIService unknown error: $e');
    return "Impossible de contacter l'assistant. Vérifiez votre clé API et votre connexion. 🐦";
  }
}
