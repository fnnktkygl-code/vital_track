import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/services/vital_rules_engine.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final sampleRulesJson = jsonEncode([
    {
      "id": "cucumber",
      "names": ["concombre", "cucumber"],
      "emoji": "🥒",
      "family": "Cucurbitacée",
      "category": "Légumes",
      "vitality": {
        "nova": 1,
        "freshness": 95,
        "label": "Brut · Vivant"
      },
      "specific": {
        "mucus": "Non-mucogène",
        "hybrid": false,
        "electric": true,
        "label": "Électrique"
      },
      "scientific_defaults": {
        "pral": -4.0,
        "density": 85
      }
    },
    {
      "id": "cheese",
      "names": ["fromage", "cheese"],
      "emoji": "🧀",
      "family": "Produit Laitier",
      "category": "Animaux",
      "vitality": {
        "nova": 3,
        "freshness": 20,
        "label": "Transformé"
      },
      "specific": {
        "mucus": "Hautement Mucogène",
        "hybrid": true,
        "electric": false,
        "label": "Déconseillé"
      },
      "scientific_defaults": {
        "pral": 18.0,
        "density": 30
      }
    }
  ]);

  group('VitalRulesEngine Unit Tests', () {
    setUp(() {
      VitalRulesEngine.loadRulesFromJson(sampleRulesJson);
    });

    test('loadRulesFromJson correctly populates expert foods', () {
      final allFoods = VitalRulesEngine.getAllFoods();
      expect(allFoods.length, equals(2));
      expect(allFoods.any((f) => f.name == 'Concombre'), isTrue);
      expect(allFoods.any((f) => f.name == 'Fromage'), isTrue);
    });

    test('getExpertFood retrieves food by exact match (case insensitive)', () {
      final cucumber = VitalRulesEngine.getExpertFood('concombre');
      expect(cucumber, isNotNull);
      expect(cucumber!.name, equals('Concombre'));
      expect(cucumber.specific.electric, isTrue);
      expect(cucumber.scientific.pral, equals(-4.0));
      expect(cucumber.vitality.nova, equals(1));

      final upperCase = VitalRulesEngine.getExpertFood('CONCOMBRE');
      expect(upperCase, isNotNull);
      expect(upperCase!.name, equals('Concombre'));
    });

    test('findInExpertDb matches substrings correctly', () {
      final match = VitalRulesEngine.findInExpertDb('Salade de concombre bio');
      expect(match, isNotNull);
      expect((match!['names'] as List).contains('concombre'), isTrue);

      final nonMatch = VitalRulesEngine.findInExpertDb('Inconnu total xyz');
      expect(nonMatch, isNull);
    });

    test('searchExpertDb filters correctly', () {
      final results = VitalRulesEngine.searchExpertDb('from');
      expect(results.length, equals(1));
      expect(results.first.name, equals('Fromage'));
      expect(results.first.specific.electric, isFalse);
    });

    test('searchExpertDb with empty query returns empty list', () {
      final empty = VitalRulesEngine.searchExpertDb('');
      expect(empty.isEmpty, isTrue);
    });

    test('capitalize extension handles normal, empty, and single char strings safely', () {
      expect('vital'.capitalize(), equals('Vital'));
      expect(''.capitalize(), equals(''));
      expect('a'.capitalize(), equals('A'));
      expect('ALREADY'.capitalize(), equals('Already'));
    });

    test('loadRulesFromJson with malformed json degrades gracefully without crashing', () {
      VitalRulesEngine.loadRulesFromJson('invalid json string {}');
      expect(VitalRulesEngine.getAllFoods(), isNotNull);
    });
  });
}
