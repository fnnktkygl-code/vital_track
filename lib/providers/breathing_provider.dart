import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/services/hive_service.dart';

/// Breathing phase for all exercise types.
enum BreathingPhase {
  idle,
  // WHM phases
  hyperventilation, // 30 deep breaths
  retention, // hold on exhale
  recovery, // 15s hold on inhale
  rest, // pause between rounds
  // Shared phases
  inhale,
  exhale,
  holdIn, // hold after inhale
  holdOut, // hold after exhale
}

class BreathingProvider extends ChangeNotifier {
  final HiveService _hive;
  BreathingSession? _activeSession;
  List<BreathingSession> _history = [];
  Timer? _ticker;

  // ── Session state ────────────────────────────────────────────────────────
  BreathingPhase _phase = BreathingPhase.idle;
  int _currentRound = 0;
  int _targetRounds = 3;
  int _targetMinutes = 5; // for non-WHM
  int _breathCount = 0; // WHM: counts 0→30
  int _phaseSeconds = 0; // seconds in current phase
  int _retentionSeconds = 0; // WHM retention timer
  final List<int> _retentionTimes = [];
  DateTime? _sessionStart;

  // ── Phase timing configs ─────────────────────────────────────────────────
  static const int whmBreathCount = 30;
  static const int whmRecoverySeconds = 15;
  static const int whmRestSeconds = 5;

  // Box: 4-4-4-4
  static const int boxInhale = 4;
  static const int boxHold = 4;
  static const int boxExhale = 4;
  static const int boxHoldOut = 4;

  // Coherence: 5.5-5.5 (we use ms internally but display seconds)
  static const double coherenceInhale = 5.5;
  static const double coherenceExhale = 5.5;

  // Relaxation: 3-6
  static const int relaxInhale = 3;
  static const int relaxExhale = 6;

  BreathingProvider(this._hive) {
    _load();
  }

  // ── PUBLIC GETTERS ──────────────────────────────────────────────────────

  BreathingSession? get activeSession => _activeSession;
  List<BreathingSession> get history => List.unmodifiable(_history);
  bool get isBreathing => _activeSession != null;

  BreathingPhase get phase => _phase;
  int get currentRound => _currentRound;
  int get targetRounds => _targetRounds;
  int get breathCount => _breathCount;
  int get phaseSeconds => _phaseSeconds;
  int get retentionSeconds => _retentionSeconds;
  List<int> get retentionTimes => List.unmodifiable(_retentionTimes);

  Duration get elapsed {
    if (_sessionStart == null) return Duration.zero;
    return DateTime.now().difference(_sessionStart!);
  }

  int get totalSessionSeconds => elapsed.inSeconds;

  String get phaseLabel {
    switch (_phase) {
      case BreathingPhase.idle:
        return '';
      case BreathingPhase.hyperventilation:
        return '🌬️ Hyperventilation';
      case BreathingPhase.retention:
        return '⏸️ Rétention';
      case BreathingPhase.recovery:
        return '🫁 Récupération';
      case BreathingPhase.rest:
        return '😌 Repos';
      case BreathingPhase.inhale:
        return '🫁 Inspire';
      case BreathingPhase.exhale:
        return '💨 Expire';
      case BreathingPhase.holdIn:
        return '⏸️ Retiens';
      case BreathingPhase.holdOut:
        return '⏸️ Retiens';
    }
  }

  String get phaseInstruction {
    switch (_phase) {
      case BreathingPhase.idle:
        return '';
      case BreathingPhase.hyperventilation:
        return 'Respire profondément — ventre puis poitrine. '
            'Expire sans forcer. $_breathCount / $whmBreathCount';
      case BreathingPhase.retention:
        return 'Poumons vides. Relâche tout. '
            'Appuie quand tu dois respirer.';
      case BreathingPhase.recovery:
        final remaining = whmRecoverySeconds - _phaseSeconds;
        return 'Grande inspiration — serre vers la tête. '
            '${remaining}s';
      case BreathingPhase.rest:
        final remaining = whmRestSeconds - _phaseSeconds;
        return 'Détends-toi avant le prochain tour. ${remaining}s';
      case BreathingPhase.inhale:
        return 'Inspire lentement par le nez...';
      case BreathingPhase.exhale:
        return 'Expire doucement par la bouche...';
      case BreathingPhase.holdIn:
        return 'Retiens ton souffle...';
      case BreathingPhase.holdOut:
        return 'Retiens poumons vides...';
    }
  }

  /// Progress 0..1 within the current phase (for animation).
  double get phaseProgress {
    if (_activeSession == null) return 0;
    final type = _activeSession!.type;

    switch (type) {
      case BreathingType.whm:
        switch (_phase) {
          case BreathingPhase.hyperventilation:
            return _breathCount / whmBreathCount;
          case BreathingPhase.recovery:
            return _phaseSeconds / whmRecoverySeconds;
          case BreathingPhase.rest:
            return _phaseSeconds / whmRestSeconds;
          default:
            return 0;
        }

      case BreathingType.box:
        const total = boxInhale + boxHold + boxExhale + boxHoldOut;
        int elapsed = 0;
        if (_phase == BreathingPhase.inhale) elapsed = _phaseSeconds;
        if (_phase == BreathingPhase.holdIn) elapsed = boxInhale + _phaseSeconds;
        if (_phase == BreathingPhase.exhale) elapsed = boxInhale + boxHold + _phaseSeconds;
        if (_phase == BreathingPhase.holdOut) elapsed = boxInhale + boxHold + boxExhale + _phaseSeconds;
        return elapsed / total;

      case BreathingType.coherence:
        const total = coherenceInhale + coherenceExhale;
        double elapsed = 0;
        if (_phase == BreathingPhase.inhale) elapsed = _phaseSeconds.toDouble();
        if (_phase == BreathingPhase.exhale) elapsed = coherenceInhale + _phaseSeconds;
        return elapsed / total;

      case BreathingType.relaxation:
        const total = relaxInhale + relaxExhale;
        int elapsed = 0;
        if (_phase == BreathingPhase.inhale) elapsed = _phaseSeconds;
        if (_phase == BreathingPhase.exhale) elapsed = relaxInhale + _phaseSeconds;
        return elapsed / total;
    }
  }

  /// Overall session progress 0..1.
  double get sessionProgress {
    if (_activeSession == null) return 0;
    final type = _activeSession!.type;
    if (type == BreathingType.whm) {
      return _currentRound / _targetRounds;
    }
    final target = _targetMinutes * 60;
    if (target <= 0) return 0;
    return (totalSessionSeconds / target).clamp(0.0, 1.0);
  }

  /// Breathing animation value: 0=contracted, 1=expanded.
  /// Used to drive the breathing circle size.
  double get breathAnimation {
    if (_activeSession == null) return 0.5;
    switch (_phase) {
      case BreathingPhase.inhale:
      case BreathingPhase.hyperventilation:
        // Expand during inhale
        return (_breathCount.isEven) ? 1.0 : 0.2;
      case BreathingPhase.exhale:
        return 0.2;
      case BreathingPhase.holdIn:
      case BreathingPhase.recovery:
        return 1.0;
      case BreathingPhase.holdOut:
      case BreathingPhase.retention:
        return 0.2;
      case BreathingPhase.rest:
      case BreathingPhase.idle:
        return 0.5;
    }
  }

  int get currentStreak {
    if (_history.isEmpty) return 0;
    int streak = 0;
    final sorted = [..._history]..sort((a, b) => b.startTime.compareTo(a.startTime));
    DateTime? prev;
    for (final s in sorted) {
      if (!s.isActive && s.endTime != null) {
        final day = DateTime(s.startTime.year, s.startTime.month, s.startTime.day);
        if (prev == null) {
          final today = DateTime.now();
          final todayDay = DateTime(today.year, today.month, today.day);
          final diff = todayDay.difference(day).inDays;
          if (diff > 1) break;
          streak = 1;
          prev = day;
        } else {
          final diff = prev.difference(day).inDays;
          if (diff == 0) continue;
          if (diff == 1) {
            streak++;
            prev = day;
          } else {
            break;
          }
        }
      }
    }
    return streak;
  }

  int get totalMinutesThisWeek {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final start = DateTime(weekStart.year, weekStart.month, weekStart.day);
    int total = 0;
    for (final s in _history) {
      if (s.startTime.isAfter(start) && s.endTime != null) {
        total += s.totalSeconds;
      }
    }
    return total ~/ 60;
  }

  int get averageRetention {
    final allRetentions = _history
        .where((s) => s.type == BreathingType.whm && s.retentionTimes.isNotEmpty)
        .expand((s) => s.retentionTimes)
        .toList();
    if (allRetentions.isEmpty) return 0;
    return allRetentions.reduce((a, b) => a + b) ~/ allRetentions.length;
  }

  // ── ACTIONS ─────────────────────────────────────────────────────────────

  Future<void> startSession({
    required BreathingType type,
    int rounds = 3,
    int minutes = 5,
    String protocol = 'morse',
  }) async {
    _targetRounds = rounds;
    _targetMinutes = minutes;
    _currentRound = 0;
    _breathCount = 0;
    _phaseSeconds = 0;
    _retentionSeconds = 0;
    _retentionTimes.clear();
    _sessionStart = DateTime.now();

    final session = BreathingSession(
      id: const Uuid().v4(),
      type: type,
      startTime: _sessionStart!,
      protocol: protocol,
    );
    _activeSession = session;

    // Start first phase
    if (type == BreathingType.whm) {
      _phase = BreathingPhase.hyperventilation;
      _breathCount = 0;
    } else if (type == BreathingType.box) {
      _phase = BreathingPhase.inhale;
    } else if (type == BreathingType.coherence) {
      _phase = BreathingPhase.inhale;
    } else {
      _phase = BreathingPhase.inhale;
    }

    await _hive.saveBreathingSession(session);
    _startTicker();
    notifyListeners();
  }

  /// WHM: user taps when they must breathe (end of retention).
  void endRetention() {
    if (_phase != BreathingPhase.retention) return;
    _retentionTimes.add(_retentionSeconds);
    _activeSession?.retentionTimes = List.from(_retentionTimes);
    _phase = BreathingPhase.recovery;
    _phaseSeconds = 0;
    notifyListeners();
  }

  /// WHM: advance one breath count during hyperventilation.
  void tapBreath() {
    if (_phase != BreathingPhase.hyperventilation) return;
    _breathCount++;
    if (_breathCount >= whmBreathCount) {
      // Move to retention
      _phase = BreathingPhase.retention;
      _phaseSeconds = 0;
      _retentionSeconds = 0;
    }
    notifyListeners();
  }

  Future<void> endSession({String notes = '', String moodEmoji = ''}) async {
    if (_activeSession == null) return;
    _activeSession!.endTime = DateTime.now();
    _activeSession!.notes = notes;
    _activeSession!.moodEmoji = moodEmoji;
    _activeSession!.rounds = _currentRound;
    _activeSession!.totalSeconds = totalSessionSeconds;
    _activeSession!.retentionTimes = List.from(_retentionTimes);
    await _hive.saveBreathingSession(_activeSession!);
    _history.insert(0, _activeSession!);
    _activeSession = null;
    _phase = BreathingPhase.idle;
    _stopTicker();
    notifyListeners();
  }

  Future<void> cancelSession() async {
    if (_activeSession == null) return;
    await _hive.deleteBreathingSession(_activeSession!.id);
    _activeSession = null;
    _phase = BreathingPhase.idle;
    _stopTicker();
    notifyListeners();
  }

  // ── INTERNAL ────────────────────────────────────────────────────────────

  void _load() {
    final all = _hive.loadBreathingSessions();
    _activeSession = null;
    _history = [];
    for (final s in all) {
      if (s.isActive) {
        // Don't resume breathing sessions — they're real-time
        s.endTime = s.startTime;
        _hive.saveBreathingSession(s);
        _history.add(s);
      } else {
        _history.add(s);
      }
    }
    _history.sort((a, b) => b.startTime.compareTo(a.startTime));
  }

  void _tick() {
    if (_activeSession == null) return;
    _phaseSeconds++;

    final type = _activeSession!.type;

    switch (type) {
      case BreathingType.whm:
        _tickWhm();
        break;
      case BreathingType.box:
        _tickBox();
        break;
      case BreathingType.coherence:
        _tickCoherence();
        break;
      case BreathingType.relaxation:
        _tickRelaxation();
        break;
    }

    // Check if non-WHM session time is up
    if (type != BreathingType.whm) {
      if (totalSessionSeconds >= _targetMinutes * 60) {
        endSession();
        return;
      }
    }

    notifyListeners();
  }

  void _tickWhm() {
    switch (_phase) {
      case BreathingPhase.hyperventilation:
        // Auto-advance breaths every ~2s if user doesn't tap
        if (_phaseSeconds % 2 == 0 && _breathCount < whmBreathCount) {
          _breathCount++;
          if (_breathCount >= whmBreathCount) {
            _phase = BreathingPhase.retention;
            _phaseSeconds = 0;
            _retentionSeconds = 0;
          }
        }
        break;
      case BreathingPhase.retention:
        _retentionSeconds = _phaseSeconds;
        break;
      case BreathingPhase.recovery:
        if (_phaseSeconds >= whmRecoverySeconds) {
          _currentRound++;
          if (_currentRound >= _targetRounds) {
            endSession();
            return;
          }
          _phase = BreathingPhase.rest;
          _phaseSeconds = 0;
        }
        break;
      case BreathingPhase.rest:
        if (_phaseSeconds >= whmRestSeconds) {
          _phase = BreathingPhase.hyperventilation;
          _breathCount = 0;
          _phaseSeconds = 0;
        }
        break;
      default:
        break;
    }
  }

  void _tickBox() {
    if (_phase == BreathingPhase.inhale && _phaseSeconds >= boxInhale) {
      _phase = BreathingPhase.holdIn;
      _phaseSeconds = 0;
    } else if (_phase == BreathingPhase.holdIn && _phaseSeconds >= boxHold) {
      _phase = BreathingPhase.exhale;
      _phaseSeconds = 0;
    } else if (_phase == BreathingPhase.exhale && _phaseSeconds >= boxExhale) {
      _phase = BreathingPhase.holdOut;
      _phaseSeconds = 0;
    } else if (_phase == BreathingPhase.holdOut && _phaseSeconds >= boxHoldOut) {
      _phase = BreathingPhase.inhale;
      _phaseSeconds = 0;
      _currentRound++;
    }
  }

  void _tickCoherence() {
    if (_phase == BreathingPhase.inhale && _phaseSeconds >= coherenceInhale.round()) {
      _phase = BreathingPhase.exhale;
      _phaseSeconds = 0;
    } else if (_phase == BreathingPhase.exhale && _phaseSeconds >= coherenceExhale.round()) {
      _phase = BreathingPhase.inhale;
      _phaseSeconds = 0;
      _currentRound++;
    }
  }

  void _tickRelaxation() {
    if (_phase == BreathingPhase.inhale && _phaseSeconds >= relaxInhale) {
      _phase = BreathingPhase.exhale;
      _phaseSeconds = 0;
    } else if (_phase == BreathingPhase.exhale && _phaseSeconds >= relaxExhale) {
      _phase = BreathingPhase.inhale;
      _phaseSeconds = 0;
      _currentRound++;
    }
  }

  void _startTicker() {
    _stopTicker();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _stopTicker() {
    _ticker?.cancel();
    _ticker = null;
  }

  @override
  void dispose() {
    _stopTicker();
    super.dispose();
  }
}
