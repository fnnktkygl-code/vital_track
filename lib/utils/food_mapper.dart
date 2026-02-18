import 'package:flutter/foundation.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/services/vital_rules_engine.dart';

class FoodMapper {
  static Food fromOpenFoodFacts(Map<String, dynamic> data) {
    final String name = data['product_name'] ?? 'Inconnu';
    
    // 1. Check Expert Database FIRST
    // We try to match the product name or keywords against our Vitalist DB
    // Simple logic: check if product name contains any key from our DB
    // Ideally this should be more robust (tags matching etc)
    final expertMatch = VitalRulesEngine.findInExpertDb(name);
    
    if (expertMatch != null) {
      // Return the expert food directly (or merge if needed)
       // We map it to a Food object
       return VitalRulesEngine.getExpertFood(name)!; 
    }

    // 2. Fallback to Algorithmic Analysis (OpenFoodFacts)
    final String brands = data['brands'] ?? '';
    final String id = data['code'] ?? DateTime.now().toIso8601String();
    
    // Scientific Data (PRAL estimation & Nutriscore)
    final nutriments = data['nutriments'] ?? {};
    final double proteins = (nutriments['proteins_100g'] ?? 0).toDouble();
    // OpenFoodFacts already provides values in mg per 100g
    final double phosphorus = (nutriments['phosphorus_100g'] ?? 0).toDouble();
    final double potassium = (nutriments['potassium_100g'] ?? 0).toDouble();
    final double magnesium = (nutriments['magnesium_100g'] ?? 0).toDouble();
    final double calcium = (nutriments['calcium_100g'] ?? 0).toDouble();

    // Basic PRAL formula (Remer & Manz)
    // PRAL = 0.49 * Protein(g) + 0.037 * Phosphorus(mg) - 0.021 * Potassium(mg) - 0.026 * Magnesium(mg) - 0.013 * Calcium(mg)
    double pral = 0.49 * proteins + 0.037 * phosphorus - 0.021 * potassium - 0.026 * magnesium - 0.013 * calcium;
    
    int density = 50; // default
    if (nutriments['nutrition-score-fr_100g'] != null) {
        density = 100 - (nutriments['nutrition-score-fr_100g'] as num).toInt() * 2; // Rough mapping
    }
    density = density.clamp(0, 100);

    // Vitality Data (NOVA)
    final int nova = (data['nova_group'] ?? 4) as int;
    int freshness = 0;
    switch (nova) {
      case 1: freshness = 90; break;
      case 2: freshness = 70; break;
      case 3: freshness = 40; break;
      case 4: freshness = 10; break;
    }

    // Specific Data (Vitalist analysis of ingredients)
    final ingredientsText = (data['ingredients_text'] ?? '').toLowerCase();
    
    // Mucus detection logic
    bool mucogenic = false;
    if (ingredientsText.contains('lait') || ingredientsText.contains('milk') || 
        ingredientsText.contains('blé') || ingredientsText.contains('wheat') ||
        ingredientsText.contains('sucre') || ingredientsText.contains('sugar')) {
      mucogenic = true;
    }
    
    bool hybrid = false;
    // Heuristic: If it has > 5 ingredients or is NOVA 3/4, it's likely "hybrid/modified" in the vitalist sense
    if (nova >= 3 || (data['ingredients_n'] ?? 0) > 5) {
      hybrid = true;
    } else if (name.toLowerCase().contains('carotte') || name.toLowerCase().contains('carrot')) {
       // Manual override for known hybrids in vitalist theory
       hybrid = true;
    }

    // Determine colors/labels
    final scientificColorValue = pral < 0 ? 0xFF4ade80 : 0xFFfacc15; // Green if alkaline
    final scientificLabel = pral < -1 ? "Alcalinisant" : (pral < 2 ? "Neutre" : "Acidifiant");

    final vitalityColorValue = nova == 1 ? 0xFFa3e635 : (nova == 4 ? 0xFFef4444 : 0xFFfacc15);
    final vitalityLabel = nova == 1 ? "Brut · Vivant" : "Transformé";

    final specificColorValue = (!hybrid && !mucogenic) ? 0xFF34d399 : 0xFFf97316;
    final specificLabel = (!hybrid && !mucogenic) ? "Électrique" : "Hybride/Mucogène";

    return Food(
      id: id,
      name: name,
      emoji: _inferEmoji(data),
      family: brands.isNotEmpty ? brands : "Inconnu",
      origin: data['origins'] ?? "Origine inconnue",
      approved: !hybrid && !mucogenic,
      scientific: ScientificData(
        pral: double.parse(pral.toStringAsFixed(1)),
        density: density,
        label: scientificLabel,
        colorValue: scientificColorValue,
      ),
      vitality: VitalityData(
        nova: nova,
        freshness: freshness,
        label: vitalityLabel,
        colorValue: vitalityColorValue,
      ),
      specific: SpecificData(
        mucus: mucogenic ? "Mucogène" : "Neutre/Dissolvant",
        hybrid: hybrid,
        electric: !hybrid && !mucogenic,
        label: specificLabel,
        colorValue: specificColorValue,
      ),
      tags: ["OFF Scan"],
      note: "Analyse algorithmique VitalTrack (Non vérifié par expert).",
    );
  }

  static List<Food> fromAIJsonList(Map<String, dynamic> json) {
    try {
      final List<dynamic> items = json['items'] ?? [];
      // Backward compatibility: if "items" is missing but "name" exists, treat as single item
      if (items.isEmpty && json.containsKey('name')) {
        final single = fromAIJson(json);
        return single != null ? [single] : [];
      }
      
      return items
          .map((item) => fromAIJson(item as Map<String, dynamic>))
          .whereType<Food>()
          .toList();
    } catch (e) {
      debugPrint("Error parsing AI JSON List: $e");
      return [];
    }
  }

  static Food? fromAIJson(Map<String, dynamic> json) {
    try {
      final scientific = json['scientific'] ?? {};
      final vitality = json['vitality'] ?? {};
      final specific = json['specific'] ?? {};

      return Food(
        id: DateTime.now().toIso8601String() + (json['name'] ?? ''), // Unique-ish ID
        name: json['name'] ?? "Aliment inconnu",
        emoji: json['emoji'] ?? "🍽️",
        family: json['family'] ?? "Inconnu",
        origin: json['origin'] ?? "Inconnu",
        approved: specific['electric'] == true,
        scientific: ScientificData(
          pral: (scientific['pral'] ?? 0).toDouble(),
          density: (scientific['density'] ?? 50).toInt(),
          label: (scientific['pral'] ?? 0) < 0 ? "Alcalinisant" : "Acidifiant",
          colorValue: (scientific['pral'] ?? 0) < 0 ? 0xFF4ade80 : 0xFFfacc15,
        ),
        vitality: VitalityData(
          nova: (vitality['nova'] ?? 4).toInt(),
          freshness: (vitality['freshness'] ?? 0).toInt(),
          label: (vitality['nova'] ?? 4) == 1 ? "Brut · Vivant" : "Transformé",
          colorValue: (vitality['nova'] ?? 4) == 1 ? 0xFFa3e635 : 0xFFef4444,
        ),
        specific: SpecificData(
          mucus: specific['mucus'] ?? "Neutre",
          hybrid: specific['hybrid'] ?? false,
          electric: specific['electric'] ?? false,
          label: specific['label'] ?? "Inconnu",
          colorValue: (specific['electric'] == true) ? 0xFF34d399 : 0xFFf97316,
        ),
        tags: ["AI Analyzed"],
        note: json['note'] ?? "Analyse générée par IA (Gemini).",
      );
    } catch (e) {
       // print("Error parsing AI JSON: $e");
      return null;
    }
  }

  static String _inferEmoji(Map<String, dynamic> data) {
    final categories = (data['categories_tags'] ?? []).join(' ').toLowerCase();
    if (categories.contains('beverage')) return "🥤";
    if (categories.contains('fruit')) return "🍎";
    if (categories.contains('vegetable')) return "🥦";
    if (categories.contains('snack')) return "🍪";
    if (categories.contains('cereal')) return "🥣";
    return "📦";
  }
}
