import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/utils/food_mapper.dart';

class VitalRulesEngine {
  static List<dynamic> _expertDb = [];

  static Future<void> loadRules() async {
    try {
      final String jsonString = await rootBundle.loadString('assets/vital_ranking.json');
      loadRulesFromJson(jsonString);
    } catch (e) {
       // print("Error loading vital_ranking.json: $e");
    }
  }

  /// Load rules directly from a JSON string (used for tests or dynamic updates)
  static void loadRulesFromJson(String jsonString) {
    try {
      final decoded = json.decode(jsonString);
      if (decoded is List) {
        _expertDb = decoded;
      } else if (decoded is Map && decoded['foods'] is List) {
        _expertDb = decoded['foods'] as List<dynamic>;
      } else if (decoded is Map && decoded['data'] is List) {
        _expertDb = decoded['data'] as List<dynamic>;
      } else {
        _expertDb = [];
      }
    } catch (e) {
      debugPrint("VitalRulesEngine: JSON decode error: $e");
    }
  }

  static Map<String, dynamic>? findInExpertDb(String query) {
    if (_expertDb.isEmpty) return null;

    final normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.isEmpty) return null;

    // 1. Exact match check in names array
    for (final item in _expertDb) {
      final List<dynamic>? names = item['names'] as List<dynamic>?;
      if (names == null) continue;
      if (names.any((name) => name.toString().toLowerCase().trim() == normalizedQuery)) {
        return item as Map<String, dynamic>;
      }
    }

    // 2. Substring match
    for (final item in _expertDb) {
      final List<dynamic>? names = item['names'] as List<dynamic>?;
      if (names == null) continue;
      if (names.any((name) {
        final n = name.toString().toLowerCase().trim();
        return n.contains(normalizedQuery) || (normalizedQuery.length >= 3 && normalizedQuery.contains(n));
      })) {
        return item as Map<String, dynamic>;
      }
    }

    return null;
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
      final List<dynamic>? names = item['names'] as List<dynamic>?;
      if (names == null) return false;
      return names.any((name) {
         final n = name.toString().toLowerCase().trim();
         return n.contains(normalizedQuery) || (normalizedQuery.length >= 3 && normalizedQuery.contains(n));
      });
    }).toList();

    return matches
        .map((data) {
          final names = data['names'] as List<dynamic>?;
          if (names == null || names.isEmpty) return null;
          return getExpertFood(names.first.toString());
        })
        .whereType<Food>()
        .toList();
  }

  /// Extracts structured foods from a dish description or compound text.
  /// Guarantees that at least 1 classified Food item is returned so the user is never blocked.
  static List<Food> extractFoodsFromQuery(String query) {
    final clean = query.trim();
    if (clean.isEmpty) return [];

    // 1. Direct expert lookup
    final direct = getExpertFood(clean);
    if (direct != null) return [direct];

    // 2. Search whole query in DB
    final search = searchExpertDb(clean);
    if (search.isNotEmpty) return search;

    // 3. Tokenize by separators and stop words
    final parts = clean
        .split(RegExp(r'[,+&/]|\bet\b|\bavec\b|\baux\b|\bau\b|\bde\b|\bd\x27|\bd\u2019', caseSensitive: false))
        .map((p) => p.trim())
        .where((p) => p.length >= 2)
        .toList();

    final List<Food> found = [];
    final Set<String> seenIds = {};

    for (final part in parts) {
      final item = getExpertFood(part) ?? searchExpertDb(part).firstOrNull;
      if (item != null && seenIds.add(item.id)) {
        found.add(item);
      }
    }

    if (found.isNotEmpty) return found;

    // 4. Fallback to heuristic Food creation per token or whole query
    if (parts.length > 1) {
      for (final part in parts) {
        final fallback = FoodMapper.fromNameFallback(part.capitalize());
        if (seenIds.add(fallback.id)) {
          found.add(fallback);
        }
      }
    }

    if (found.isEmpty) {
      found.add(FoodMapper.fromNameFallback(clean.capitalize()));
    }

    return found;
  }

  /// Returns ALL foods from the expert database (for the default search list).
  static List<Food> getAllFoods() {
    return _expertDb
        .map((data) {
          final names = data['names'] as List<dynamic>?;
          if (names == null || names.isEmpty) return null;
          return getExpertFood(names.first.toString());
        })
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
    if (isEmpty) return this;
    return "${this[0].toUpperCase()}${substring(1).toLowerCase()}";
  }
}
