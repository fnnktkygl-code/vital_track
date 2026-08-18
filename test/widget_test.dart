import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';
import 'package:vital_track/ui/widgets/animated_pigeon.dart';
import 'package:vital_track/ui/widgets/pulse_ring.dart';

void main() {
  group('VitalTrack Widget Tests', () {
    testWidgets('StaticPigeonPortrait renders properly for all mascot moods', (WidgetTester tester) async {
      for (final mood in MascotMood.values) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Center(
                child: StaticPigeonPortrait(
                  mood: mood,
                  size: 48,
                ),
              ),
            ),
          ),
        );

        expect(find.byType(StaticPigeonPortrait), findsOneWidget);
        expect(find.byType(CustomPaint), findsWidgets);
      }
    });

    testWidgets('PulseRing renders and animates with custom size and color', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: PulseRing(
                color: Colors.green,
                size: 80,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(PulseRing), findsOneWidget);
      expect(
        find.descendant(
          of: find.byType(PulseRing),
          matching: find.byType(Stack),
        ),
        findsOneWidget,
      );

      // Advance animation frames
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byType(PulseRing), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
      expect(find.byType(PulseRing), findsOneWidget);
    });
  });
}
