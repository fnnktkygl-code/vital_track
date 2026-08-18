import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/models/fasting_session.dart';

void main() {
  group('FastingSession Model Unit Tests', () {
    test('Calculates active status, elapsed, planned, and remaining time correctly', () {
      final startTime = DateTime.now().subtract(const Duration(hours: 12));
      final session = FastingSession(
        id: 'fast_1',
        type: FastingType.waterFast,
        startTime: startTime,
        plannedMinutes: 24 * 60, // 24 hours
        protocol: 'morse',
      );

      expect(session.isActive, isTrue);
      expect(session.elapsed.inHours, closeTo(12, 1));
      expect(session.planned.inMinutes, equals(1440));
      expect(session.remaining.inHours, closeTo(12, 1));
      expect(session.progress, closeTo(0.5, 0.05));
    });

    test('Completed fast with endTime computes final duration', () {
      final startTime = DateTime(2026, 3, 1, 8, 0);
      final endTime = DateTime(2026, 3, 1, 20, 0); // 12 hours
      final session = FastingSession(
        id: 'fast_2',
        type: FastingType.juiceFast,
        startTime: startTime,
        plannedMinutes: 12 * 60,
        endTime: endTime,
      );

      expect(session.isActive, isFalse);
      expect(session.elapsed.inHours, equals(12));
      expect(session.progress, equals(1.0));
      expect(session.remaining, equals(Duration.zero));
    });

    test('copyWith properly copies updated fields', () {
      final session = FastingSession(
        id: 'fast_3',
        type: FastingType.intermittent,
        startTime: DateTime.now(),
        plannedMinutes: 16 * 60,
      );

      final updated = session.copyWith(
        notes: 'Très bonne énergie',
        postWeight: 68.5,
        postEnergy: 4,
        moodEmoji: '⚡',
      );

      expect(updated.notes, equals('Très bonne énergie'));
      expect(updated.postWeight, equals(68.5));
      expect(updated.postEnergy, equals(4));
      expect(updated.moodEmoji, equals('⚡'));
      expect(updated.id, equals(session.id));
      expect(updated.type, equals(session.type));
    });

    test('FastingTypeDisplay extensions return correct labels and emojis', () {
      expect(FastingType.waterFast.emoji, equals('💧'));
      expect(FastingType.waterFast.label, equals('Jeûne hydrique'));
      expect(FastingType.juiceFast.emoji, equals('🧃'));
      expect(FastingType.grapeCure.emoji, equals('🍇'));
      expect(FastingType.drySunFast.emoji, equals('🌅'));
      expect(FastingType.intermittent.emoji, equals('⏱️'));
    });
  });
}
