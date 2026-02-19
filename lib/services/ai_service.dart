import 'dart:convert';

import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:image_picker/image_picker.dart';
import 'package:vital_track/models/profile.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:flutter/foundation.dart';

class AIService {
  static const String _apiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );

  // ── FOOD ANALYSIS MODEL ───────────────────────────────────────────────────
  // Dedicated model for food scanning with JSON output
  static final _scanModel = GenerativeModel(
    model: 'gemini-2.0-flash',
    apiKey: _apiKey,
    systemInstruction: Content.system(_foodAnalysisPrompt),
    generationConfig: GenerationConfig(
      temperature: 0.1, // Very low — factual food classification
      responseMimeType: 'application/json',
    ),
  );

  // ── CHAT MODEL ────────────────────────────────────────────────────────────
  // Dedicated model for mascot chat with grounded RAG responses
  static final _chatModel = GenerativeModel(
    model: 'gemini-2.0-flash',
    apiKey: _apiKey,
    systemInstruction: Content.system(_chatSystemPrompt),
    generationConfig: GenerationConfig(
      temperature: 0.3, // Low — factual but conversational
    ),
  );

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
    if (_apiKey.isEmpty) {
      debugPrint("AIService Error: GEMINI_API_KEY not set.");
      return null;
    }

    try {
      final response = await _scanModel.generateContent(
        [Content.text("Analyze this food: $query")],
      );
      if (response.text == null) return null;
      String jsonText = response.text!.replaceAll("```json", "").replaceAll("```", "").trim();
      return json.decode(jsonText);
    } catch (e) {
      debugPrint("AIService Text Error: $e");
      return null;
    }
  }

  static Future<Map<String, dynamic>?> analyzeImage(XFile image) async {
    debugPrint("AIService: Analyzing image...");
    if (_apiKey.isEmpty) {
      debugPrint("AIService Error: GEMINI_API_KEY not set.");
      return null;
    }

    final bytes = await image.readAsBytes();
    try {
      final response = await _scanModel.generateContent([
        Content.multi([
          TextPart("Identify all foods/ingredients in this image."),
          DataPart('image/jpeg', bytes),
        ])
      ]);
      debugPrint("AIService: Response received");
      if (response.text == null) return null;
      String jsonText = response.text!.replaceAll("```json", "").replaceAll("```", "").trim();
      return json.decode(jsonText);
    } catch (e) {
      debugPrint("AIService Critical Error: $e");
      return null;
    }
  }

  // ── CHAT (NON-STREAMING FALLBACK) ─────────────────────────────────────────

  static Future<String?> chatWithMascot(
      String query, Profile profile, List<KnowledgeSource> contextSources) async {
    if (_apiKey.isEmpty) return "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";

    final userPrompt = _buildChatPrompt(query, profile, contextSources);

    try {
      final response = await _chatModel.generateContent(
        [Content.text(userPrompt)],
      );
      return response.text;
    } catch (e) {
      return "Coo? I couldn't reach the cloud. Try again later! 🐦";
    }
  }

  // ── CHAT (STREAMING) ──────────────────────────────────────────────────────

  static Stream<String> chatWithMascotStream(
      String query, Profile profile, List<KnowledgeSource> contextSources) async* {
    if (_apiKey.isEmpty) {
      yield "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";
      return;
    }

    final userPrompt = _buildChatPrompt(query, profile, contextSources);

    try {
      final stream = _chatModel.generateContentStream(
        [Content.text(userPrompt)],
      );
      await for (final chunk in stream) {
        if (chunk.text != null) {
          yield chunk.text!;
        }
      }
    } catch (e) {
      yield "Coo? I couldn't reach the cloud. Try again later! 🐦";
    }
  }

  // ── PROMPT BUILDER (shared by both chat methods) ──────────────────────────

  static String _buildChatPrompt(
      String query, Profile profile, List<KnowledgeSource> contextSources) {
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
}
