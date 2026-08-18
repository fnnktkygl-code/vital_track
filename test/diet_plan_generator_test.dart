import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/services/diet_plan_generator.dart';

void main() {
  group('DietPlanGenerator Unit Tests', () {
    test('generate ehret protocol with 14 days', () {
      final plan = DietPlanGenerator.generate(
        protocol: 'ehret',
        numDays: 14,
        objective: 'Transition progressive vers une alimentation sans mucus',
      );

      expect(plan.protocol, equals('ehret'));
      expect(plan.totalDays, equals(14));
      expect(plan.days.length, equals(14));

      // Check day 1 structure
      final day1 = plan.days.first;
      expect(day1.dayIndex, equals(0));
      expect(day1.meals.isNotEmpty, isTrue);
      expect(day1.phaseLabel, isNotEmpty);

      // Check all days have valid meals
      for (final day in plan.days) {
        expect(day.meals, isNotEmpty);
        for (final meal in day.meals) {
          expect(meal.slot, isNotEmpty);
          expect(meal.items, isNotEmpty);
        }
      }
    });

    test('generate sebi protocol with 7 days', () {
      final plan = DietPlanGenerator.generate(
        protocol: 'sebi',
        numDays: 7,
        objective: 'Détoxification alcaline stricte',
      );

      expect(plan.protocol, equals('sebi'));
      expect(plan.days.length, equals(7));
      expect(plan.days.first.phaseLabel, isNotEmpty);
      expect(plan.protocol.dietProtocolEmoji, equals('⚡'));
      expect(plan.protocol.dietProtocolLabel, equals('Dr. Sebi'));
    });

    test('generate morse protocol', () {
      final plan = DietPlanGenerator.generate(
        protocol: 'morse',
        numDays: 21,
        objective: 'Grand Nettoyage Lymphatique',
      );

      expect(plan.protocol, equals('morse'));
      expect(plan.days.length, equals(21));
      expect(plan.protocol.dietProtocolEmoji, equals('💧'));
      expect(plan.protocol.dietProtocolLabel, equals('Dr. Morse'));
    });

    test('generate personalized protocol', () {
      final plan = DietPlanGenerator.generate(
        protocol: 'personalized',
        numDays: 5,
        objective: 'Approche équilibrée',
      );

      expect(plan.protocol, equals('personalized'));
      expect(plan.days.length, equals(5));
      expect(plan.protocol.dietProtocolEmoji, equals('🤝'));
      expect(plan.protocol.dietProtocolLabel, equals('Personnalisé'));
    });

    test('DietDay and DietPlan progress calculations', () {
      final plan = DietPlanGenerator.generate(
        protocol: 'ehret',
        numDays: 3,
        objective: 'Test progression',
      );

      expect(plan.progress, equals(0.0));
      expect(plan.completedDays, equals(0));

      // Complete all meals of day 1
      for (final meal in plan.days.first.meals) {
        meal.done = true;
      }

      expect(plan.days.first.isComplete, isTrue);
      expect(plan.completedDays, equals(1));
      expect(plan.progress, closeTo(0.33, 0.05));
    });
  });
}
