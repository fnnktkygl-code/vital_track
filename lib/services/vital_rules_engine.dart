import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:vital_track/models/food.dart';

class VitalRulesEngine {
  static List<dynamic> _expertDb = [];

  static Future<void> loadRules() async {
    try {
      final String jsonString = await rootBundle.loadString('assets/vital_ranking.json');
      _expertDb = json.decode(jsonString);
    } catch (e) {
       // print("Error loading vital_ranking.json: $e");
    }
  }

  static Map<String, dynamic>? findInExpertDb(String query) {
    if (_expertDb.isEmpty) return null;

    final normalizedQuery = query.toLowerCase().trim();

    // Direct match check in names array
    try {
      return _expertDb.firstWhere((item) {
        final List<dynamic> names = item['names'];
        return names.any((name) => normalizedQuery.contains(name.toString().toLowerCase()));
      });
    } catch (e) {
      return null;
    }
  }

  // Helper to convert Expert DB JSON to Food object (merging with override logic if needed later)
  static Food? getExpertFood(String query) {
    final data = findInExpertDb(query);
    if (data == null) return null;

    // Defensive validation — skip malformed entries (audit fix #16)
    final scientific = data['scientific_defaults'] as Map<String, dynamic>?;
    final vitality = data['vitality'] as Map<String, dynamic>?;
    final specific = data['specific'] as Map<String, dynamic>?;

    if (scientific == null || vitality == null || specific == null) {
      debugPrint('VitalRulesEngine: Skipping malformed entry: ${data['id']}');
      return null;
    }

    // Validate required keys exist
    if (!scientific.containsKey('pral') || !scientific.containsKey('density')) {
      debugPrint('VitalRulesEngine: Missing scientific fields in ${data['id']}');
      return null;
    }
    if (!vitality.containsKey('nova') || !vitality.containsKey('freshness') || !vitality.containsKey('label')) {
      debugPrint('VitalRulesEngine: Missing vitality fields in ${data['id']}');
      return null;
    }

    final bool isElectric = specific['electric'] == true;
    final bool isHybrid = specific['hybrid'] == true;

    return Food(
      id: data['id'],
      name: (data['names'] as List).first.toString().capitalize(), // Capitalize first letter
      emoji: data['emoji'] ?? '🍽️',
      family: data['family'] ?? 'Inconnu',
      origin: "Base Vitaliste",
      approved: isElectric,
      scientific: ScientificData(
        pral: (scientific['pral'] as num).toDouble(),
        density: (scientific['density'] as num).toInt(),
        label: scientific['pral'] < 0 ? "Alcalinisant" : "Acidifiant",
        colorValue: (scientific['pral'] as num) < 0 ? 0xFF4ade80 : 0xFFfacc15,
      ),
      vitality: VitalityData(
        nova: vitality['nova'] ?? 1,
        freshness: vitality['freshness'] ?? 0,
        label: vitality['label'] ?? 'Inconnu',
        colorValue: vitality['nova'] == 1 ? 0xFF4ade80 : 0xFFef4444,
      ),
      specific: SpecificData(
        mucus: specific['mucus'] ?? 'Inconnu',
        hybrid: isHybrid,
        electric: isElectric,
        label: specific['label'] ?? 'Inconnu',
        colorValue: isElectric ? 0xFF34d399 : (isHybrid ? 0xFFfacc15 : 0xFFef4444),
      ),
      tags: ["Expert Verified"],
      note: data['note'] ?? "Aliment vérifié dans la base de données VitalTrack.",
    );
  }
  static List<Food> searchExpertDb(String query) {
    if (query.isEmpty) return [];

    final normalizedQuery = query.toLowerCase().trim();

    // Find all items where any name matches
    final matches = _expertDb.where((item) {
      final List<dynamic> names = item['names'];
      return names.any((name) {
         final n = name.toString().toLowerCase();
         // Check both directions: "apple" contains "app" OR "app" contains "apple" (exact match preference)
         return n.contains(normalizedQuery) || normalizedQuery.contains(n);
      });
    }).toList();

    return matches.map((data) => getExpertFood((data['names'] as List).first.toString())!).toList();
  }

  /// Returns ALL foods from the expert database (for the default search list).
  static List<Food> getAllFoods() {
    return _expertDb
        .map((data) => getExpertFood((data['names'] as List).first.toString()))
        .whereType<Food>()
        .toList();
  }

  /// Returns approved ("electric"/alkaline) food names grouped by their raw
  /// DB category (e.g. "Fruits", "Légumes", "Céréales"...). Lighter than
  /// building full [Food] objects — used by the diet-plan generator to
  /// compose meals from the curated vitalist food list.
  static Map<String, List<String>> approvedNamesByCategory() {
    final Map<String, List<String>> out = {};
    for (final item in _expertDb) {
      final specific = item['specific'] as Map<String, dynamic>?;
      if (specific == null || specific['electric'] != true) continue;
      final names = item['names'] as List<dynamic>?;
      if (names == null || names.isEmpty) continue;
      final category = (item['category'] as String?) ?? 'Autres';
      out.putIfAbsent(category, () => []);
      out[category]!.add(names.first.toString().capitalize());
    }
    return out;
  }
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
