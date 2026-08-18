import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/services/hive_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    final tempDir = Directory.systemTemp.createTempSync();
    await HiveService().init(customPath: tempDir.path);
  });

  final electricCucumber = Food(
    id: 'f1',
    name: 'Concombre',
    emoji: '🥒',
    family: 'Cucurbitacée',
    origin: 'Naturel',
    approved: true,
    scientific: const ScientificData(
      pral: -4.0, // Highly alkalizing
      density: 85,
      label: 'Alcalin',
      colorValue: 0xFF4ade80,
    ),
    vitality: const VitalityData(
      nova: 1,
      freshness: 95,
      label: 'Vivant',
      colorValue: 0xFFa3e635,
    ),
    specific: const SpecificData(
      mucus: 'Non-mucogène',
      hybrid: false,
      electric: true,
      label: 'Électrique',
      colorValue: 0xFF34d399,
    ),
    tags: const ['Hydratant'],
    note: '',
  );

  final acidStarch = Food(
    id: 'f2',
    name: 'Pomme de terre cuite',
    emoji: '🥔',
    family: 'Solanacée',
    origin: 'Cuit',
    approved: false,
    scientific: const ScientificData(
      pral: -1.0,
      density: 60,
      label: 'Neutre',
      colorValue: 0xFFfacc15,
    ),
    vitality: const VitalityData(
      nova: 3,
      freshness: 40,
      label: 'Cuit',
      colorValue: 0xFFef4444,
    ),
    specific: const SpecificData(
      mucus: 'Mucogène modéré',
      hybrid: true,
      electric: false,
      label: 'Amidon',
      colorValue: 0xFFf97316,
    ),
    tags: const ['Féculent', 'Amidon'],
    note: '',
  );

  final lemon = Food(
    id: 'f3',
    name: 'Citron pressé',
    emoji: '🍋',
    family: 'Agrume',
    origin: 'Naturel',
    approved: true,
    scientific: const ScientificData(
      pral: -2.5,
      density: 80,
      label: 'Alcalinisant',
      colorValue: 0xFF4ade80,
    ),
    vitality: const VitalityData(
      nova: 1,
      freshness: 90,
      label: 'Brut',
      colorValue: 0xFFa3e635,
    ),
    specific: const SpecificData(
      mucus: 'Dissolvant',
      hybrid: false,
      electric: true,
      label: 'Acide doux',
      colorValue: 0xFF34d399,
    ),
    tags: const ['Acide', 'Cru'],
    note: '',
  );

  final melon = Food(
    id: 'f4',
    name: 'Melon Cantaloup',
    emoji: '🍈',
    family: 'Cucurbitacée',
    origin: 'Naturel',
    approved: true,
    scientific: const ScientificData(
      pral: -3.0,
      density: 90,
      label: 'Alcalin',
      colorValue: 0xFF4ade80,
    ),
    vitality: const VitalityData(
      nova: 1,
      freshness: 95,
      label: 'Brut',
      colorValue: 0xFFa3e635,
    ),
    specific: const SpecificData(
      mucus: 'Dissolvant',
      hybrid: false,
      electric: true,
      label: 'Électrique',
      colorValue: 0xFF34d399,
    ),
    tags: ['Fruit rapide', 'Cru'],
    note: '',
  );

  group('MealProvider Unit Tests', () {
    late MealProvider mealProvider;

    setUp(() {
      mealProvider = MealProvider();
      mealProvider.clearMeal();
    });

    test('Initial meal is empty and mealScore is null', () {
      expect(mealProvider.mealItems.isEmpty, isTrue);
      expect(mealProvider.mealScore, isNull);
    });

    test('Adding foods updates mealItems and computes high Vitalist score for electric food', () {
      mealProvider.addFood(electricCucumber);
      expect(mealProvider.mealItems.length, equals(1));
      expect(mealProvider.mealScore, isNotNull);
      expect(mealProvider.mealScore!, equals(100));
    });

    test('Adding mucus/processed foods lowers overall meal score', () {
      mealProvider.addFood(acidStarch);
      expect(mealProvider.mealItems.length, equals(1));
      expect(mealProvider.mealScore!, lessThan(30));
    });

    test('checkCombos detects Starch + Acid trophology conflict', () {
      mealProvider.addFood(acidStarch);
      final conflict = mealProvider.checkCombos(lemon);
      expect(conflict, isNotNull);
      expect(conflict!['reason'], equals('Amidon + Acide'));
    });

    test('checkCombos detects Melon compatibility conflict', () {
      mealProvider.addFood(electricCucumber);
      final conflict = mealProvider.checkCombos(melon);
      expect(conflict, isNotNull);
      expect(conflict!['reason'], equals('Melon doit être seul'));
    });

    test('removeFood and clearMeal function correctly', () {
      mealProvider.addFood(electricCucumber);
      mealProvider.addFood(lemon);
      expect(mealProvider.mealItems.length, equals(2));

      mealProvider.removeFood(lemon);
      expect(mealProvider.mealItems.length, equals(1));
      expect(mealProvider.mealItems.first.name, equals('Concombre'));

      mealProvider.clearMeal();
      expect(mealProvider.mealItems.isEmpty, isTrue);
      expect(mealProvider.mealScore, isNull);
    });
  });
}
