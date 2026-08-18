import 'package:flutter_test/flutter_test.dart';
import 'package:vital_track/models/breathing_session.dart';

void main() {
  group('BreathingSession Model Unit Tests', () {
    test('Active breathing session correctly calculates state and elapsed', () {
      final start = DateTime.now().subtract(const Duration(minutes: 10));
      final session = BreathingSession(
        id: 'breath_1',
        type: BreathingType.coherence,
        startTime: start,
        rounds: 3,
        totalSeconds: 600,
        protocol: 'morse',
      );

      expect(session.isActive, isTrue);
      expect(session.elapsed.inMinutes, closeTo(10, 1));
      expect(session.rounds, equals(3));
      expect(session.totalSeconds, equals(600));
    });

    test('Wim Hof session with retention times', () {
      final start = DateTime(2026, 3, 1, 10, 0);
      final end = DateTime(2026, 3, 1, 10, 15);
      final session = BreathingSession(
        id: 'whm_1',
        type: BreathingType.whm,
        startTime: start,
        endTime: end,
        rounds: 3,
        totalSeconds: 900,
        retentionTimes: [65, 85, 110],
      );

      expect(session.isActive, isFalse);
      expect(session.elapsed.inMinutes, equals(15));
      expect(session.retentionTimes.length, equals(3));
      expect(session.retentionTimes[0], equals(65));
      expect(session.retentionTimes[2], equals(110));
    });

    test('BreathingTypeDisplay extensions return accurate strings', () {
      expect(BreathingType.whm.emoji, equals('🧊'));
      expect(BreathingType.whm.label, equals('Wim Hof'));
      expect(BreathingType.coherence.emoji, equals('💚'));
      expect(BreathingType.coherence.label, equals('Cohérence'));
      expect(BreathingType.box.emoji, equals('📦'));
      expect(BreathingType.relaxation.emoji, equals('🌙'));
    });
  });
}
