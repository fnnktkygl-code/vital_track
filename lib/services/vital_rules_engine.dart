import 'dart:convert';
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

    final scientific = data['scientific_defaults'];
    final vitality = data['vitality'];
    final specific = data['specific'];

    return Food(
      id: data['id'],
      name: (data['names'] as List).first.toString().capitalize(), // Capitalize first letter
      emoji: data['emoji'],
      family: data['family'],
      origin: "Base Vitaliste",
      approved: specific['electric'] == true,
      scientific: ScientificData(
        pral: (scientific['pral'] as num).toDouble(),
        density: (scientific['density'] as num).toInt(),
        label: scientific['pral'] < 0 ? "Alcalinisant" : "Acidifiant",
        colorValue: (scientific['pral'] as num) < 0 ? 0xFF4ade80 : 0xFFfacc15,
      ),
      vitality: VitalityData(
        nova: vitality['nova'],
        freshness: vitality['freshness'],
        label: vitality['label'],
        colorValue: vitality['nova'] == 1 ? 0xFF4ade80 : 0xFFef4444,
      ),
      specific: SpecificData(
        mucus: specific['mucus'],
        hybrid: specific['hybrid'],
        electric: specific['electric'],
        label: specific['label'],
        colorValue: specific['electric'] ? 0xFF34d399 : (specific['hybrid'] ? 0xFFfacc15 : 0xFFef4444),
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
}

extension StringExtension on String {
  String capitalize() {
    return "${this[0].toUpperCase()}${substring(1)}";
  }
}
