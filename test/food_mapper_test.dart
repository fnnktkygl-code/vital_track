import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/services/vital_rules_engine.dart';
import 'package:vital_track/utils/food_mapper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    VitalRulesEngine.loadRulesFromJson(jsonEncode([
      {
        "id": "apple",
        "names": ["pomme", "apple"],
        "emoji": "🍎",
        "family": "Rosaceae",
        "category": "Fruits",
        "vitality": {
          "nova": 1,
          "freshness": 90,
          "label": "Brut"
        },
        "specific": {
          "mucus": "Dissolvant",
          "hybrid": false,
          "electric": true,
          "label": "Électrique"
        },
        "scientific_defaults": {
          "pral": -2.2,
          "density": 80
        }
      }
    ]));
  });

  group('FoodMapper Unit Tests', () {
    test('fromOpenFoodFacts returns expert food if present in database', () {
      final offData = {
        'product_name': 'Pomme Golden Bio',
        'code': '123456789',
        'brands': 'BioVerger',
      };

      final food = FoodMapper.fromOpenFoodFacts(offData);
      expect(food.name, equals('Pomme'));
      expect(food.specific.electric, isTrue);
      expect(food.scientific.pral, equals(-2.2));
    });

    test('fromOpenFoodFacts performs algorithmic estimation with proper mineral units', () {
      final offData = {
        'product_name': 'Amandes entières non grillées',
        'code': '987654321',
        'nova_group': 1,
        'nutriments': {
          'proteins_100g': 21.0,
          'phosphorus_100g': 480.0, // in mg
          'potassium_100g': 0.730,  // in grams -> should be normalized to 730mg
          'magnesium_100g': 270.0,  // in mg
          'calcium_100g': 260.0,    // in mg
          'nutrition-score-fr_100g': 1,
        },
        'ingredients_text': 'Amandes 100%',
        'categories_tags': ['en:plant-based-foods', 'en:nuts']
      };

      final food = FoodMapper.fromOpenFoodFacts(offData);
      expect(food.name, equals('Amandes entières non grillées'));
      expect(food.vitality.nova, equals(1));
      expect(food.vitality.freshness, equals(90));
      // PRAL formula: 0.49*21 + 0.037*480 - 0.021*730 - 0.026*270 - 0.013*260
      // 10.29 + 17.76 - 15.33 - 7.02 - 3.38 = 2.32
      expect(food.scientific.pral, closeTo(2.32, 0.1));
    });

    test('fromAIJson parses Gemini JSON response correctly', () {
      final aiJson = {
        "name": "Papaye Sauvage",
        "emoji": "🍈",
        "family": "Caricaceae",
        "origin": "Naturel",
        "scientific": {"pral": -3.5, "density": 85},
        "vitality": {"nova": 1, "freshness": 95},
        "specific": {
          "mucus": "Dissolvant",
          "hybrid": false,
          "electric": true,
          "label": "Électrique Sebi"
        },
        "note": "Fruit nettoyant riche en papaïne."
      };

      final food = FoodMapper.fromAIJson(aiJson);
      expect(food, isNotNull);
      expect(food!.name, equals('Papaye Sauvage'));
      expect(food.emoji, equals('🍈'));
      expect(food.approved, isTrue);
      expect(food.scientific.pral, equals(-3.5));
      expect(food.vitality.freshness, equals(95));
      expect(food.specific.electric, isTrue);
    });

    test('fromAIJson handles invalid/empty JSON safely without crashing', () {
      final food = FoodMapper.fromAIJson({});
      expect(food, isNotNull);
      expect(food!.name, equals("Aliment inconnu"));
    });

    test('fromAIJsonList parses list of foods', () {
      final jsonMap = {
        "items": [
          {
            "name": "Figues fraîches",
            "emoji": "🫐",
            "scientific": {"pral": -4.0, "density": 90},
            "vitality": {"nova": 1, "freshness": 90},
            "specific": {"mucus": "Dissolvant", "electric": true}
          },
          {
            "name": "Datte Medjool",
            "emoji": "🌴",
            "scientific": {"pral": -6.0, "density": 85},
            "vitality": {"nova": 1, "freshness": 80},
            "specific": {"mucus": "Neutre", "electric": true}
          }
        ]
      };

      final foods = FoodMapper.fromAIJsonList(jsonMap);
      expect(foods.length, equals(2));
      expect(foods[0].name, equals('Figues fraîches'));
      expect(foods[1].name, equals('Datte Medjool'));
    });

    test('fromNameFallback creates safe, tagged unverified food', () {
      final fallback = FoodMapper.fromNameFallback('Jus d’herbe d’orge');
      expect(fallback.name, equals('Jus d’herbe d’orge'));
      expect(fallback.tags.contains('Non vérifié'), isTrue);
      expect(fallback.tags.contains('Suggestion IA'), isTrue);
    });
  });
}
