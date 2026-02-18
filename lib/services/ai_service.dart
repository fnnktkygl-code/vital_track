import 'dart:convert';

import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:image_picker/image_picker.dart';
import 'package:vital_track/models/profile.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:flutter/foundation.dart';

class AIService {
  // Pass via: flutter run --dart-define=GEMINI_API_KEY=your_key_here
  static const String _apiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );

  static final _model = GenerativeModel(
    model: 'gemini-2.0-flash', // Latest stable fast model
    apiKey: _apiKey,
  );

  static const _systemPrompt = """
  You are an expert in Vitalist Nutrition (Dr. Sebi, Arnold Ehret).
  
  YOUR GOAL: IDENTIFY ALL VISIBLE INGREDIENTS/FOODS.
  
  Analyze the input (text or image) and return a JSON object with an "items" array:
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
  
  STRICT VITALIST RULES (Dr. Sebi / Arnold Ehret):
  
  1. ELECTRIC / ALKALINE (Good):
     - Fruits (Seeded ONLY): Apple, Banana (Burro/Baby only), Berries, Cantaloupe, Cherries, Currants, Dates, Figs, Grapes (seeded), Key Lime (seeded), Mango, Melon (seeded), Orange (Seville/Sour), Papaya, Peach, Pear, Plum, Prunes, Raisins (seeded), Soft Coconut, Soursop, Tamarind.
     - Vegetables: Amaranth greens, Avocado, Bell Pepper, Chayote, Cucumber, Dandelion greens, Chickpeas, Kale, Lettuce (except Iceberg), Mushrooms (except Shiitake), Nopal, Okra, Olives, Onions, Seaweed (Wakame/Dulse/Kelp), Squash, Tomato (Cherry/Plum only), Watercress, Arugula, Purslane.
     - Grains: Amaranth, Fonio, Kamut, Quinoa, Rye, Spelt, Teff, Wild Rice.
     - Oils: Olive, Coconut (raw), Sesame, Hemp, Avocado.
     - Sweeteners: Agave syrup, Date sugar.
  
  2. HYBRID / STARCH (Bad - ⚠ Warning):
     - Vegetables: CARROT, Garlic, Beet, Celery, Cauliflower, Corn, Potato, Cabbage.
     - Fruits: Grapefruit, ALL Seedless fruits (Watermelon/Grapes without seeds).
     - Other: White Rice, Modern Wheat, Soy/Tofu, most Beans, Aloe Vera, Peppermint, Comfrey.
     - Concept: Starch is a binder and causes mucus. Hybrids are acidic.
  
  3. MUCUS FORMING (Bad - ❌ Avoid):
     - Meat, Eggs, Dairy, Processed Sugar, Fried foods, Alcohol.
  
  LOGIC:
  - If a dish is mixed (e.g. Salad), analyze the DOMINANT ingredients as separate items if possible, or the dish as a whole.
  - If food is in list 1: electric=true, hybrid=false, mucus="Dissolvant/Neutre". Label="Électrique".
  - If food is in list 2: electric=false, hybrid=true, mucus="Mucogène". Label="Hybride (Amidon)".
  - If food is in list 3: electric=false, hybrid=true, mucus="Mucogène". Label="Mucogène".
  """;

  static Future<Map<String, dynamic>?> analyzeText(String query) async {
    debugPrint("AIService: Analyzing text: $query");
    if (_apiKey.isEmpty) {
      debugPrint("AIService Error: GEMINI_API_KEY not set. Pass via --dart-define=GEMINI_API_KEY=...");
      return null;
    }

    final content = [Content.text("$_systemPrompt\n\nAnalyze this food: $query")];
    try {
      final response = await _model.generateContent(content);
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
      debugPrint("AIService Error: GEMINI_API_KEY not set. Pass via --dart-define=GEMINI_API_KEY=...");
      return null;
    }

    final bytes = await image.readAsBytes();
    final content = [
      Content.multi([
        TextPart(_systemPrompt),
        DataPart('image/jpeg', bytes),
      ])
    ];

    try {
      final response = await _model.generateContent(content);
      debugPrint("AIService: Response received");
      if (response.text == null) {
        debugPrint("AIService Error: Response text is null");
        return null;
      }
      // Sanitize JSON if needed (sometimes markdown blocks are included)
      String jsonText = response.text!.replaceAll("```json", "").replaceAll("```", "").trim();
      return json.decode(jsonText);
    } catch (e) {
       debugPrint("AIService Critical Error: $e");
      return null;
    }
  }

  static Future<String?> chatWithMascot(
      String query, Profile profile, List<KnowledgeSource> contextSources) async {
    if (_apiKey.isEmpty) return "Erreur : clé API manquante. Configurez GEMINI_API_KEY.";

    // 1. Build Context String with Citations
    final contextBuffer = StringBuffer();
    for (var source in contextSources) {
      contextBuffer.writeln("SOURCE ID: ${source.id}");
      contextBuffer.writeln("TITLE: ${source.title} (${source.type.name})");
      contextBuffer.writeln("CONTENT:\n${source.content}\n"); // Use full content or relevant chunks
      contextBuffer.writeln("---");
    }
    final contextStr = contextBuffer.toString();

    // 2. Build Profile String
    final profileStr = """
    User: ${profile.name}
    Goals: ${profile.goals.join(", ")}
    Restrictions: ${profile.restrictions.join(", ")}
    Metrics: ${profile.vitalMetrics}
    """;

    // 3. Construct System Prompt
    final prompt = """
    You are the VitalTrack Mascot (a friendly, wise Pigeon).
    
    USER PROFILE:
    $profileStr

    AVAILABLE KNOWLEDGE SOURCES:
    $contextStr

    INSTRUCTIONS:
    1. Answer the user's question using the PROVIDED KNOWLEDGE SOURCES primarily.
    2. If the answer is found in the sources, cite them like this: [Title].
    3. If the Knowledge Base is empty or irrelevant, use general Vitalist principles (Dr. Sebi, Arnold Ehret) but DO NOT invent sources.
    4. STRICTLY respect the User's Restrictions (e.g., if "No Starch", warn about starch).
    5. Be encouraging but firm on the principles.
    6. Use emoji 🐦 occasionally.
    7. Keep answers concise (max 3-4 sentences unless asked for a list).

    USER QUESTION:
    $query
    """;

    final content = [Content.text(prompt)];

    try {
      final response = await _model.generateContent(content);
      return response.text;
    } catch (e) {
       // print("Chat Error: $e");
      return "Coo? I couldn't reach the cloud. Try again later! 🐦";
    }
  }
}
