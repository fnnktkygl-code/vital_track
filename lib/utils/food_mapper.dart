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
      final expertFood = VitalRulesEngine.getExpertFood(name);
      if (expertFood != null) return expertFood;
    }

    // 2. Fallback to Algorithmic Analysis (OpenFoodFacts)
    final String brands = data['brands'] ?? '';
    final String id = data['code'] ?? DateTime.now().toIso8601String();
    
    // Scientific Data (PRAL estimation & Nutriscore)
    final nutriments = data['nutriments'] ?? {};
    final double proteins = (nutriments['proteins_100g'] ?? 0).toDouble();

    // Helper to normalize mineral units (handling cases where OFF stores grams instead of mg)
    double normalizeToMg(dynamic val) {
      if (val == null) return 0.0;
      final num v = val is num ? val : (double.tryParse(val.toString()) ?? 0.0);
      final d = v.toDouble();
      if (d > 0 && d < 2.0) {
        return d * 1000.0;
      }
      return d;
    }

    final double phosphorus = normalizeToMg(nutriments['phosphorus_100g']);
    final double potassium = normalizeToMg(nutriments['potassium_100g']);
    final double magnesium = normalizeToMg(nutriments['magnesium_100g']);
    final double calcium = normalizeToMg(nutriments['calcium_100g']);

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

  static List<Food> fromAIJsonList(dynamic json) {
    try {
      if (json == null) return [];
      
      if (json is List) {
        return json
            .whereType<Map<String, dynamic>>()
            .map((item) => fromAIJson(item))
            .whereType<Food>()
            .toList();
      }

      if (json is! Map<String, dynamic>) return [];

      // Check nested data wrapper if any
      final map = json.containsKey('data') && json['data'] is Map<String, dynamic>
          ? json['data'] as Map<String, dynamic>
          : json;

      final dynamic rawList = map['items'] ??
          map['foods'] ??
          map['results'] ??
          map['data'];

      if (rawList is List && rawList.isNotEmpty) {
        return rawList
            .whereType<Map<String, dynamic>>()
            .map((item) => fromAIJson(item))
            .whereType<Food>()
            .toList();
      }

      // Single item fallback
      if (map.containsKey('name') || map.containsKey('names') || map.containsKey('id')) {
        final single = fromAIJson(map);
        return single != null ? [single] : [];
      }

      return [];
    } catch (e) {
      debugPrint("Error parsing AI JSON List: $e");
      return [];
    }
  }

  static Food? fromAIJson(Map<String, dynamic> json) {
    try {
      final scientific = (json['scientific'] as Map<String, dynamic>?) ??
          (json['scientific_defaults'] as Map<String, dynamic>?) ??
          {};
      final vitality = (json['vitality'] as Map<String, dynamic>?) ?? {};
      final specific = (json['specific'] as Map<String, dynamic>?) ?? {};

      String name = (json['name'] as String?)?.trim() ?? '';
      if (name.isEmpty && json['names'] is List && (json['names'] as List).isNotEmpty) {
        name = (json['names'] as List).first.toString().trim();
      }
      if (name.isEmpty) name = "Aliment inconnu";

      final bool isElectric = specific['electric'] == true ||
          json['electric'] == true ||
          json['approved'] == true;
      final bool isHybrid = specific['hybrid'] == true || json['hybrid'] == true;
      final String mucus = (specific['mucus'] as String?) ??
          (json['mucus'] as String?) ??
          (isElectric ? "Dissolvant" : (isHybrid ? "Mucogène" : "Neutre"));

      final double pral = ((scientific['pral'] ?? json['pral'] ?? (isElectric ? -3.0 : (isHybrid ? 2.5 : 0.0))) as num).toDouble();
      final int density = ((scientific['density'] ?? json['density'] ?? (isElectric ? 85 : 45)) as num).toInt();

      final int nova = ((vitality['nova'] ?? json['nova'] ?? 1) as num).toInt();
      final int freshness = ((vitality['freshness'] ?? json['freshness'] ?? 90) as num).toInt();

      String emoji = (json['emoji'] as String?) ?? '🍽️';
      if (emoji == '🍽️' || emoji.isEmpty) {
        emoji = _inferEmojiFromName(name);
      }

      return Food(
        id: (json['id'] as String?) ?? '${DateTime.now().millisecondsSinceEpoch}_$name',
        name: name,
        emoji: emoji,
        family: (json['family'] as String?) ?? (isElectric ? "Vitaliste" : "Alimentation"),
        origin: (json['origin'] as String?) ?? (isElectric ? "Dr. Sebi Electric" : "Standard"),
        approved: isElectric,
        scientific: ScientificData(
          pral: double.parse(pral.toStringAsFixed(1)),
          density: density,
          label: pral < 0 ? "Alcalinisant" : "Acidifiant",
          colorValue: pral < 0 ? 0xFF4ade80 : 0xFFfacc15,
        ),
        vitality: VitalityData(
          nova: nova,
          freshness: freshness,
          label: nova <= 1 ? "Brut · Vivant" : "Transformé",
          colorValue: nova <= 1 ? 0xFFa3e635 : 0xFFef4444,
        ),
        specific: SpecificData(
          mucus: mucus,
          hybrid: isHybrid,
          electric: isElectric,
          label: isElectric ? "Électrique" : (isHybrid ? "Hybride" : "Standard"),
          colorValue: isElectric ? 0xFF34d399 : (isHybrid ? 0xFFfacc15 : 0xFFf97316),
        ),
        tags: (json['tags'] is List)
            ? (json['tags'] as List).map((e) => e.toString()).toList()
            : ["AI Analyzed"],
        note: (json['note'] as String?) ?? "Analyse nutritionnelle vitaliste.",
      );
    } catch (e) {
      debugPrint("Error parsing AI JSON: $e");
      return null;
    }
  }

  /// Lightweight fallback used when a food name has no exact match in the expert database.
  /// Evaluates vitalist heuristics to assign appropriate ratings.
  static Food fromNameFallback(String name, {String note = ''}) {
    final lower = name.toLowerCase();
    
    // Heuristic vitalist evaluation
    final bool isElectric = _isElectricHeuristic(lower);
    final bool isHybrid = !isElectric && _isHybridHeuristic(lower);
    final bool isMucus = !isElectric && !isHybrid && _isMucusHeuristic(lower);

    final double pral = isElectric ? -3.5 : (isHybrid ? 2.0 : (isMucus ? 6.0 : -0.5));
    final int density = isElectric ? 85 : (isHybrid ? 50 : 35);
    final int nova = (isMucus || lower.contains('frit') || lower.contains('sucre')) ? 3 : 1;

    return Food(
      id: 'sugg_${DateTime.now().millisecondsSinceEpoch}_$name',
      name: name,
      emoji: _inferEmojiFromName(name),
      family: isElectric ? 'Vitaliste' : (isHybrid ? 'Hybride' : 'Général'),
      origin: isElectric ? 'Dr. Sebi Approved' : 'Général',
      approved: isElectric,
      scientific: ScientificData(
        pral: pral,
        density: density,
        label: pral < 0 ? 'Alcalinisant' : 'Acidifiant',
        colorValue: pral < 0 ? 0xFF4ade80 : 0xFFfacc15,
      ),
      vitality: VitalityData(
        nova: nova,
        freshness: nova == 1 ? 85 : 40,
        label: nova == 1 ? 'Brut · Vivant' : 'Transformé',
        colorValue: nova == 1 ? 0xFF4ade80 : 0xFFef4444,
      ),
      specific: SpecificData(
        mucus: isElectric ? 'Dissolvant' : (isMucus ? 'Mucogène' : (isHybrid ? 'Mucogène' : 'Neutre')),
        hybrid: isHybrid,
        electric: isElectric,
        label: isElectric ? 'Électrique' : (isHybrid ? 'Hybride' : 'Neutre'),
        colorValue: isElectric ? 0xFF34d399 : (isHybrid ? 0xFFfacc15 : 0xFFf97316),
      ),
      tags: ['Non vérifié', 'Suggestion IA', if (isElectric) 'Électrique', if (isHybrid) 'Hybride', if (pral < 0) 'Alcalinisant'],
      note: note.isNotEmpty
          ? note
          : (isElectric
              ? "Aliment vivant & alcalinisant conforme aux principes vitalistes."
              : (isHybrid
                  ? "Aliment hybridé ou riche en amidon, consommer avec modération."
                  : "Aliment analysé selon les règles de nutrition naturelle.")),
    );
  }

  static bool _isElectricHeuristic(String lower) {
    const electricKeywords = [
      'avocat', 'concombre', 'mangue', 'papaye', 'melon', 'pasteque', 'pastèque',
      'datte', 'figue', 'pomme', 'poire', 'cerise', 'prune', 'raisin', 'citron vert',
      'kale', 'chou frise', 'chou frisé', 'amarante', 'fonio', 'quinoa', 'kamut',
      'teff', 'courgette', 'graine de lin', 'chia', 'sésame', 'sesame', 'olive',
      'laitue romaine', 'roquette', 'cresson', 'mache', 'mâche', 'gingembre'
    ];
    return electricKeywords.any((k) => lower.contains(k));
  }

  static bool _isHybridHeuristic(String lower) {
    const hybridKeywords = [
      'carotte', 'mais', 'maïs', 'pomme de terre', 'riz blanc', 'ble', 'blé',
      'soja', 'tofu', 'seitan', 'haricot', 'lentille', 'pois', 'aubergine', 'pamplemousse'
    ];
    return hybridKeywords.any((k) => lower.contains(k));
  }

  static bool _isMucusHeuristic(String lower) {
    const mucusKeywords = [
      'viande', 'poulet', 'boeuf', 'porc', 'fromage', 'lait', 'creme', 'crème',
      'beurre', 'oeuf', 'œuf', 'pain', 'gateau', 'gâteau', 'biscuit', 'pizza', 'friture'
    ];
    return mucusKeywords.any((k) => lower.contains(k));
  }

  static String _inferEmojiFromName(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('avocat')) return '🥑';
    if (lower.contains('concombre')) return '🥒';
    if (lower.contains('mangue')) return '🥭';
    if (lower.contains('papaye')) return '🍈';
    if (lower.contains('pomme')) return '🍎';
    if (lower.contains('banane')) return '🍌';
    if (lower.contains('melon') || lower.contains('pasteque') || lower.contains('pastèque')) return '🍉';
    if (lower.contains('raisin')) return '🍇';
    if (lower.contains('citron')) return '🍋';
    if (lower.contains('orange')) return '🍊';
    if (lower.contains('salade') || lower.contains('laitue') || lower.contains('kale') || lower.contains('roquette')) return '🥗';
    if (lower.contains('riz') || lower.contains('quinoa') || lower.contains('cereale') || lower.contains('céréale')) return '🍚';
    if (lower.contains('jus')) return '🥤';
    if (lower.contains('soupe') || lower.contains('bouillon')) return '🥣';
    if (lower.contains('pain')) return '🍞';
    return '🍽️';
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
