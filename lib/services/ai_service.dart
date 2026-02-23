import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:vital_track/models/chat_message.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/models/profile.dart';
import 'package:vital_track/services/hive_service.dart';

class VertexInlineData {
  final String mimeType;
  final String base64Data;

  VertexInlineData({required this.mimeType, required this.base64Data});

  Map<String, dynamic> toJson() => {
        'inlineData': {
          'mimeType': mimeType,
          'data': base64Data,
        }
      };
}

class AIService {
  static String? _cachedKey;
  static final HiveService _hiveService = HiveService();

  static const String _projectId = 'neon-polymer-487913-j6';
  static const String _location = 'us-central1';

  static String _getApiKey() {
    if (_cachedKey != null && _cachedKey!.isNotEmpty) return _cachedKey!;

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

  static String _proxyBaseUrl() {
    const envUrl = String.fromEnvironment('AI_PROXY_BASE_URL', defaultValue: '');
    return envUrl.trim();
  }

  static bool _useProxy() => _proxyBaseUrl().isNotEmpty;

  static Uri _proxyUri(String path) {
    final base = _proxyBaseUrl().replaceAll(RegExp(r'/$'), '');
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$normalizedPath');
  }

  static bool _hasPrivacyConsent() {
    try {
      return _hiveService.settingsBox
              .get('privacy_consent_accepted', defaultValue: false) ==
          true;
    } catch (_) {
      return false;
    }
  }

  static const _models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ];

  static final Map<String, DateTime> _exhausted = {};
  static const _cooldown = Duration(minutes: 2);

  static String _pickModel() {
    final now = DateTime.now();
    _exhausted.removeWhere((_, expiry) => now.isAfter(expiry));

    for (final m in _models) {
      if (!_exhausted.containsKey(m)) return m;
    }
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

  static Uri _buildVertexEndpoint(String modelId, String method) {
    final key = _getApiKey();
    return Uri.parse(
        'https://$_location-aiplatform.googleapis.com/v1/projects/$_projectId/locations/$_location/publishers/google/models/$modelId:$method?key=$key');
  }

  static Map<String, dynamic> _buildVertexPayload(
      {required List<Map<String, dynamic>> contents,
      required bool isChat,
      required String systemPrompt}) {
    return {
      'contents': contents,
      'systemInstruction': {
        'role': 'system',
        'parts': [
          {'text': systemPrompt}
        ]
      },
      'generationConfig': {
        'temperature': isChat ? 0.3 : 0.1,
        'responseMimeType': isChat ? 'text/plain' : 'application/json',
      }
    };
  }

  static void resetKeyCache() => _cachedKey = null;

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

  static Future<Map<String, dynamic>?> analyzeText(String query) async {
    debugPrint("AIService: Analyzing text: $query");

    if (!_hasPrivacyConsent()) return null;

    if (_useProxy()) {
      return _analyzeTextViaProxy(query);
    }

    final cacheKey = "text_$query";
    final cached = _hiveService.getCachedAiResponse(cacheKey);
    if (cached != null) {
      return json.decode(cached);
    }

    if (_getApiKey().isEmpty) return null;

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        final uri = _buildVertexEndpoint(model, 'generateContent');
        final payload = _buildVertexPayload(
          contents: [
            {
              'role': 'user',
              'parts': [
                {'text': "Analyze this food: $query"}
              ]
            }
          ],
          isChat: false,
          systemPrompt: _foodAnalysisPrompt,
        );

        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: json.encode(payload),
        );

        if (response.statusCode >= 200 && response.statusCode < 300) {
          final data = json.decode(response.body);
          final candidates = data['candidates'] as List?;
          if (candidates != null && candidates.isNotEmpty) {
            final text = candidates.first['content']['parts'][0]['text'] as String?;
            if (text != null) {
              String jsonText = text.replaceAll("```json", "").replaceAll("```", "").trim();
              _hiveService.cacheAiResponse(cacheKey, jsonText);
              return json.decode(jsonText);
            }
          }
        } else {
          throw Exception('HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          continue;
        }
        debugPrint("AIService Text Error: $e");
        return null;
      }
    }
    return null;
  }

  static Future<Map<String, dynamic>?> analyzeImage(XFile image) async {
    debugPrint("AIService: Analyzing image...");
    if (!_hasPrivacyConsent()) return null;

    if (_useProxy()) {
      return _analyzeImageViaProxy(image);
    }

    if (_getApiKey().isEmpty) return null;

    final bytes = await image.readAsBytes();
    final cacheKey = "img_${bytes.length}";
    final cached = _hiveService.getCachedAiResponse(cacheKey);
    if (cached != null) {
      return json.decode(cached);
    }

    final mimeType = image.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    final base64Image = base64Encode(bytes);

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        final uri = _buildVertexEndpoint(model, 'generateContent');
        final payload = _buildVertexPayload(
          contents: [
            {
              'role': 'user',
              'parts': [
                {'text': "Identify all foods/ingredients in this image."},
                {
                  'inlineData': {
                    'mimeType': mimeType,
                    'data': base64Image,
                  }
                }
              ]
            }
          ],
          isChat: false,
          systemPrompt: _foodAnalysisPrompt,
        );

        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: json.encode(payload),
        );

        if (response.statusCode >= 200 && response.statusCode < 300) {
          final data = json.decode(response.body);
          final candidates = data['candidates'] as List?;
          if (candidates != null && candidates.isNotEmpty) {
            final text = candidates.first['content']['parts'][0]['text'] as String?;
            if (text != null) {
              String jsonText = text.replaceAll("```json", "").replaceAll("```", "").trim();
              _hiveService.cacheAiResponse(cacheKey, jsonText);
              return json.decode(jsonText);
            }
          }
        } else {
          throw Exception('HTTP ${response.statusCode}: ${response.body}');
        }
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

  static Future<String?> chatWithMascot(String query, Profile profile, List<KnowledgeSource> contextSources,
      List<ChatMessage> history,
      {List<VertexInlineData> fileParts = const []}) async {
    if (!_hasPrivacyConsent()) {
      return "Confidentialité : acceptez d'abord la politique de confidentialité dans l'application.";
    }
    if (_useProxy()) {
      return _chatViaProxy(query, profile, contextSources, history);
    }
    if (_getApiKey().isEmpty) return "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";

    final userPrompt = _buildChatPrompt(query, profile, contextSources, history);
    final parts = <Map<String, dynamic>>[
      {'text': userPrompt}
    ];

    for (var f in fileParts) {
      parts.add(f.toJson());
    }

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        final uri = _buildVertexEndpoint(model, 'generateContent');
        final payload = _buildVertexPayload(
          contents: [
            {
              'role': 'user',
              'parts': parts,
            }
          ],
          isChat: true,
          systemPrompt: _chatSystemPrompt,
        );

        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: json.encode(payload),
        );

        if (response.statusCode >= 200 && response.statusCode < 300) {
          final data = json.decode(response.body);
          final candidates = data['candidates'] as List?;
          if (candidates != null && candidates.isNotEmpty) {
            return candidates.first['content']['parts'][0]['text'] as String?;
          }
        } else {
          throw Exception('HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        if (_isQuotaError(e) && attempt < _models.length - 1) {
          _markExhausted(model);
          continue;
        }
        return _friendlyError(e);
      }
    }
    return _friendlyError('All models exhausted');
  }

  static Stream<String> chatWithMascotStream(String query, Profile profile, List<KnowledgeSource> contextSources,
      List<ChatMessage> history,
      {List<VertexInlineData> fileParts = const []}) async* {
    if (!_hasPrivacyConsent()) {
      yield "Confidentialité : acceptez d'abord la politique de confidentialité dans l'application.";
      return;
    }

    if (_useProxy()) {
      yield* _chatStreamViaProxy(query, profile, contextSources, history, fileParts: fileParts);
      return;
    }

    if (_getApiKey().isEmpty) {
      yield "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";
      return;
    }

    final userPrompt = _buildChatPrompt(query, profile, contextSources, history);
    final parts = <Map<String, dynamic>>[
      {'text': userPrompt}
    ];

    for (var f in fileParts) {
      parts.add(f.toJson());
    }

    for (int attempt = 0; attempt < _models.length; attempt++) {
      final model = _pickModel();
      try {
        final uri = _buildVertexEndpoint(model, 'streamGenerateContent?alt=sse');
        final payload = _buildVertexPayload(
          contents: [
            {
              'role': 'user',
              'parts': parts,
            }
          ],
          isChat: true,
          systemPrompt: _chatSystemPrompt,
        );

        final request = http.Request('POST', uri);
        request.headers['Content-Type'] = 'application/json';
        request.body = json.encode(payload);

        final response = await http.Client().send(request);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            await for (var chunk in response.stream.transform(utf8.decoder)) {
              if (chunk.startsWith('data: ')) {
                final jsonStr = chunk.substring(6).trim();
                if (jsonStr.isNotEmpty) {
                  final data = json.decode(jsonStr);
                  final candidates = data['candidates'] as List?;
                  if (candidates != null && candidates.isNotEmpty) {
                    final parts = candidates.first['content']?['parts'] as List?;
                    if (parts != null && parts.isNotEmpty) {
                      final text = parts[0]['text'] as String?;
                      if (text != null && text.isNotEmpty) {
                        yield text;
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Stream exception handled locally here if any
          }
          return;
        } else {
          String body = await response.stream.bytesToString();
          throw Exception('HTTP ${response.statusCode}: $body');
        }
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

  static String _buildChatPrompt(
      String query, Profile profile, List<KnowledgeSource> contextSources, List<ChatMessage> history) {
    final buffer = StringBuffer();

    buffer.writeln("USER PROFILE:");
    buffer.writeln("Name: ${profile.name}");
    buffer.writeln("Goals: ${profile.goals.join(', ')}");
    buffer.writeln("Restrictions: ${profile.restrictions.join(', ')}");
    buffer.writeln("Metrics: ${profile.vitalMetrics}");
    buffer.writeln();

    if (contextSources.isNotEmpty) {
      buffer.writeln("RELEVANT KNOWLEDGE CONTEXT:");
      for (final source in contextSources) {
        buffer.writeln("--- [${source.title}] (${source.type.name}) ---");
        final chunks = source.chunks;
        if (chunks.isNotEmpty) {
          final relevantChunks = _selectRelevantChunks(query, chunks, maxChunks: 4);
          buffer.writeln(relevantChunks.join('\n\n'));
        } else {
          final content = source.content;
          buffer.writeln(content.length > 3000 ? content.substring(0, 3000) : content);
        }
        buffer.writeln();
      }
    }

    if (history.isNotEmpty) {
      buffer.writeln("--- RECENT CONVERSATION HISTORY ---");
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

  static Future<Map<String, dynamic>?> _analyzeTextViaProxy(String query) async {
    try {
      final response = await http
          .post(
            _proxyUri('/v1/analyze-text'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'query': query}),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        debugPrint('AIService proxy analyzeText HTTP \${response.statusCode}: \${response.body}');
        return null;
      }

      final decoded = json.decode(response.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded['data'] is Map<String, dynamic>) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded;
      }
      return null;
    } catch (e) {
      debugPrint('AIService proxy analyzeText error: \$e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> _analyzeImageViaProxy(XFile image) async {
    try {
      final bytes = await image.readAsBytes();
      final mimeType = image.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      final request = http.MultipartRequest('POST', _proxyUri('/v1/analyze-image'));
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: image.name,
        ),
      );
      request.fields['mimeType'] = mimeType;

      final streamed = await request.send().timeout(const Duration(seconds: 40));
      final response = await http.Response.fromStream(streamed);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        debugPrint('AIService proxy analyzeImage HTTP ${response.statusCode}: ${response.body}');
        return null;
      }

      final decoded = json.decode(response.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded['data'] is Map<String, dynamic>) {
          return decoded['data'] as Map<String, dynamic>;
        }
        return decoded;
      }
      return null;
    } catch (e) {
      debugPrint('AIService proxy analyzeImage error: $e');
      return null;
    }
  }

  static Future<String?> _chatViaProxy(
    String query,
    Profile profile,
    List<KnowledgeSource> contextSources,
    List<ChatMessage> history,
  ) async {
    try {
      final compactContext = contextSources.take(3).map((source) {
        final chunks = source.chunks.take(2).map((c) {
          final trimmed = c.trim();
          return trimmed.length > 400 ? trimmed.substring(0, 400) : trimmed;
        }).toList();
        return {
          'title': source.title,
          'type': source.type.name,
          'chunks': chunks,
        };
      }).toList();

      final compactHistory = history
          .take(history.length > 6 ? 6 : history.length)
          .map((m) => {
                'isUser': m.isUser,
                'text': m.text,
              })
          .toList();

      final payload = {
        'query': query,
        'profile': {
          'name': profile.name,
          'goals': profile.goals,
          'restrictions': profile.restrictions,
          'bodyType': profile.bodyType,
          'fastingExperience': profile.fastingExperience,
        },
        'context': compactContext,
        'history': compactHistory,
      };

      final response = await http
          .post(
            _proxyUri('/v1/chat'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode(payload),
          )
          .timeout(const Duration(seconds: 40));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        debugPrint('AIService proxy chat HTTP ${response.statusCode}: ${response.body}');
        return null;
      }

      final decoded = json.decode(response.body);
      if (decoded is Map<String, dynamic>) {
        final text = decoded['text'] ?? decoded['reply'] ?? decoded['message'];
        if (text is String && text.trim().isNotEmpty) return text;
      }
      return null;
    } catch (e) {
      debugPrint('AIService proxy chat error: $e');
      return null;
    }
  }
  
  static Stream<String> _chatStreamViaProxy(
    String query,
    Profile profile,
    List<KnowledgeSource> contextSources,
    List<ChatMessage> history,
    {List<VertexInlineData> fileParts = const []}
  ) async* {
    try {
      final compactContext = contextSources.take(3).map((source) {
        final chunks = source.chunks.take(2).map((c) {
          final trimmed = c.trim();
          return trimmed.length > 400 ? trimmed.substring(0, 400) : trimmed;
        }).toList();
        return {
          'title': source.title,
          'type': source.type.name,
          'chunks': chunks,
        };
      }).toList();

      final compactHistory = history
          .take(history.length > 6 ? 6 : history.length)
          .map((m) => {
                'isUser': m.isUser,
                'text': m.text,
              })
          .toList();

      final payload = {
        'query': query,
        'profile': {
          'name': profile.name,
          'goals': profile.goals,
          'restrictions': profile.restrictions,
          'bodyType': profile.bodyType,
          'fastingExperience': profile.fastingExperience,
        },
        'context': compactContext,
        'history': compactHistory,
        'fileParts': fileParts.map((f) => f.toJson()).toList(),
      };

      final request = http.Request('POST', _proxyUri('/v1/chat?stream=true'));
      request.headers['Content-Type'] = 'application/json';
      request.headers['Accept'] = 'text/event-stream';
      request.body = json.encode(payload);

      final response = await http.Client().send(request);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        try {
          await for (var chunk in response.stream.transform(utf8.decoder)) {
            final lines = chunk.split('\\n');
            for (final line in lines) {
              if (line.startsWith('data: ')) {
                final jsonStr = line.substring(6).trim();
                if (jsonStr.isNotEmpty) {
                  final data = json.decode(jsonStr);
                  if (data['error'] != null) {
                    yield data['error'];
                  } else if (data['text'] != null) {
                    yield data['text'];
                  }
                }
              }
            }
          }
        } catch (e) {
           debugPrint("Substream parsing error: $e");
        }
      } else {
        String body = await response.stream.bytesToString();
        debugPrint('AIService proxy stream HTTP ${response.statusCode}: $body');
        yield "Erreur proxy HTTP ${response.statusCode}";
      }
    } catch (e) {
      debugPrint('AIService proxy stream error: $e');
      yield "Erreur de connexion au Proxy IA.";
    }
  }

  static List<String> _selectRelevantChunks(String query, List<String> chunks, {int maxChunks = 4}) {
    final keywords = query.toLowerCase().split(RegExp(r'\s+')).where((w) => w.length > 2).toSet();
    if (keywords.isEmpty) return chunks.take(maxChunks).toList();

    final scored = <int, int>{};
    for (int i = 0; i < chunks.length; i++) {
      final lower = chunks[i].toLowerCase();
      int score = 0;
      for (final kw in keywords) {
        score += kw.allMatches(lower).length;
      }
      if (score > 0) scored[i] = score;
    }

    if (scored.isEmpty) return chunks.take(maxChunks).toList();

    final sortedIndices = scored.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return sortedIndices.take(maxChunks).map((e) => chunks[e.key]).toList();
  }

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
    debugPrint('AIService unknown error: \$e');
    return "Impossible de contacter l'assistant. Vérifiez votre clé API et votre connexion. 🐦";
  }
}
