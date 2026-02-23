import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/fasting_coach_knowledge.dart';

class FastingProvider extends ChangeNotifier {
  final HiveService _hive;
  FastingSession? _activeFast;
  List<FastingSession> _history = [];
  
  FastingProgram? _activeProgram;
  List<FastingProgram> _programHistory = [];
  
  Timer? _ticker;

  // ── Check-in system ────────────────────────────────────────────────────────
  final Set<int> _triggeredCheckIns = {};
  final List<String> _reportedSymptoms = [];
  CoachCheckIn? _pendingCheckIn;
  String? _lastSymptomResponse;

  FastingProvider(this._hive) {
    _load();
  }

  // ── PUBLIC GETTERS ──────────────────────────────────────────────────────────

  FastingSession? get activeFast => _activeFast;
  List<FastingSession> get history => List.unmodifiable(_history);
  bool get isFasting => _activeFast != null;

  FastingProgram? get activeProgram => _activeProgram;
  List<FastingProgram> get programHistory => List.unmodifiable(_programHistory);
  bool get hasActiveProgram => _activeProgram != null;

  Duration get elapsed => _activeFast?.elapsed ?? Duration.zero;
  Duration get remaining => _activeFast?.remaining ?? Duration.zero;
  double get progress => _activeFast?.progress ?? 0;

  // Check-in getters
  CoachCheckIn? get pendingCheckIn => _pendingCheckIn;
  List<String> get reportedSymptoms => List.unmodifiable(_reportedSymptoms);
  String? get lastSymptomResponse => _lastSymptomResponse;
  bool get hasActiveCheckIn => _pendingCheckIn != null;

  int get currentStreak {
    if (_history.isEmpty) return 0;
    int streak = 0;
    final sorted = [..._history]..sort((a, b) => b.startTime.compareTo(a.startTime));
    DateTime? prev;
    for (final s in sorted) {
      if (!s.isActive && s.endTime != null) {
        final day = DateTime(s.startTime.year, s.startTime.month, s.startTime.day);
        if (prev == null) {
          // Check if the most recent fast was today or yesterday
          final today = DateTime.now();
          final todayDay = DateTime(today.year, today.month, today.day);
          final diff = todayDay.difference(day).inDays;
          if (diff > 1) break; // Streak broken
          streak = 1;
          prev = day;
        } else {
          final diff = prev.difference(day).inDays;
          if (diff == 0) continue; // Same day
          if (diff == 1) {
            streak++;
            prev = day;
          } else {
            break; // Streak broken
          }
        }
      }
    }
    return streak;
  }

  int get longestStreak {
    if (_history.isEmpty) return 0;
    final sorted = [..._history]..sort((a, b) => a.startTime.compareTo(b.startTime));
    int longest = 0;
    int current = 0;
    DateTime? prev;
    for (final s in sorted) {
      if (!s.isActive && s.endTime != null) {
        final day = DateTime(s.startTime.year, s.startTime.month, s.startTime.day);
        if (prev == null) {
          current = 1;
          prev = day;
        } else {
          final diff = day.difference(prev).inDays;
          if (diff == 0) continue;
          if (diff == 1) {
            current++;
            prev = day;
          } else {
            current = 1;
            prev = day;
          }
        }
        if (current > longest) longest = current;
      }
    }
    return longest;
  }

  /// Get current fasting phase label based on elapsed hours
  String get phaseLabel {
    if (_activeFast == null) return '';
    final hours = elapsed.inHours;
    if (hours < 12) return '🔋 Glycogène';
    if (hours < 24) return '🔥 Cétose';
    if (hours < 48) return '♻️ Autophagie';
    return '🧬 Régénération';
  }

  String get phaseSubtitle {
    if (_activeFast == null) return '';
    final hours = elapsed.inHours;
    if (hours < 12) return 'Le corps utilise le glucose stocké';
    if (hours < 24) return 'Transition vers les graisses';
    if (hours < 48) return 'Nettoyage cellulaire profond';
    return 'Régénération des cellules souches';
  }

  /// Current phase key for knowledge base lookups
  String get phaseKey {
    if (_activeFast == null) return 'early';
    final hours = elapsed.inHours;
    if (hours < 12) return 'early';
    if (hours < 24) return 'mid';
    return 'deep';
  }

  /// Protocol-aware phase insight based on current fast
  String get phaseInsight {
    if (_activeFast == null) return '';
    final hours = elapsed.inHours;
    final proto = _activeFast!.protocol;

    if (hours < 6) {
      if (proto == 'ehret') return 'Ehret : la digestion du dernier repas s\'achève. Le nettoyage commence.';
      if (proto == 'morse') return 'Morse : le système lymphatique commence à se désencombrer sans nouvel apport acide.';
      if (proto == 'sebi') return 'Sebi : le corps redirige l\'énergie de la digestion vers l\'élimination du mucus.';
      return 'Vitaliste : ensemble, Sebi, Ehret et Morse s\'accordent — laisse le corps se concentrer sur le nettoyage.';
    } else if (hours < 12) {
      if (proto == 'ehret') return 'Ehret : V = P − O. L\'obstruction diminue, la vitalité monte progressivement.';
      if (proto == 'morse') return 'Morse : les surrénales commencent à stimuler la filtration rénale. Reste hydraté.';
      if (proto == 'sebi') return 'Sebi : les dépôts de mucus se ramollissent. L\'eau de source aide à les évacuer.';
      return 'Vitaliste : phase de transition — ton corps commence à brûler ses réserves et à nettoyer la lymphe.';
    } else if (hours < 24) {
      if (proto == 'ehret') return 'Ehret : le corps brûle les réserves graisseuses chargées de mucus. Nettoyage métabolique.';
      if (proto == 'morse') return 'Morse : la cétose aide à dissoudre les acides stockés dans les tissus interstitiels.';
      if (proto == 'sebi') return 'Sebi : les tissus profonds libèrent les minéraux inorganiques. Le nettoyage s\'intensifie.';
      return 'Vitaliste : cétose active — la lymphe se filtre, les acides se dissolvent, les 102 minéraux se rééquilibrent.';
    } else if (hours < 48) {
      if (proto == 'ehret') return 'Ehret : l\'autophagie recycle les protéines endommagées. Le « médecin intérieur » opère.';
      if (proto == 'morse') return 'Morse : nettoyage lymphatique profond. Les reins devraient filtrer — vérifie ton urine.';
      if (proto == 'sebi') return 'Sebi : les cellules se débarrassent des dépôts de calcium inorganique et de mucus ancien.';
      return 'Vitaliste : autophagie + nettoyage lymphatique profond. Le corps travaille en synergie totale.';
    } else {
      if (proto == 'ehret') return 'Ehret : « Le jeûne avancé apporte une clarté mentale extraordinaire. » Tu régénères en profondeur.';
      if (proto == 'morse') return 'Morse : régénération des cellules souches. Le système immunitaire se reconstruit. Écoute ton corps.';
      if (proto == 'sebi') return 'Sebi : nettoyage intracellulaire profond. Les 102 minéraux se rééquilibrent naturellement.';
      return 'Vitaliste : tu entres dans la phase de régénération profonde. Sebi, Ehret et Morse sont unanimes — reste à l\'écoute de ton corps.';
    }
  }

  /// Get contextual break-fast recommendations
  String get breakFastRecommendation {
    if (_activeFast == null) return '';
    final proto = _activeFast!.protocol;
    final type = _activeFast!.type;

    switch (type) {
      case FastingType.waterFast:
        if (proto == 'ehret') return 'Ehret : brise avec un demi-orange ou quelques raisins. Attends 1h, puis un peu plus de fruit.';
        if (proto == 'morse') return 'Morse : raisins noirs avec pépins ou pastèque. Petite quantité d\'abord, puis augmente.';
        if (proto == 'sebi') return 'Sebi : papaye, melon avec pépins, ou raisins. Petite portion, puis augmente sur 24h.';
        return 'Vitaliste : papaye, melon, ou raisins noirs. Commence par une petite portion. L\'eau de source prépare la transition.';
      case FastingType.grapeCure:
        return 'Après une cure de raisin, reintroduis d\'autres fruits lentement : agrumes, baies, puis légumes-feuilles.';
      case FastingType.intermittent:
        if (proto == 'ehret') return 'Ehret : un mono-fruit est idéal. Oranges, raisins, ou pamplemousse.';
        if (proto == 'morse') return 'Morse : un fruit astringent pour activer la filtration — baies, raisins, ou agrumes.';
        if (proto == 'sebi') return 'Sebi : un fruit du guide nutritionnel. Mangue, papaye, ou baies avec pépins.';
        return 'Vitaliste : un fruit astringent et électrique — mangue, baies, ou raisins. Mangez lentement et consciemment.';
      case FastingType.monoFruit:
        return 'Après le mono-fruit, diversifie vers d\'autres fruits approuvés, puis ajoute des légumes-feuilles.';
      case FastingType.juiceFast:
        return 'Brise avec un fruit entier (pas de jus). Mastique lentement. Les fibres aident la transition.';
      case FastingType.fruitFast:
        return 'Tu mangeais déjà des fruits. Réintroduis les légumes-feuilles progressivement sur 2-3 jours.';
      case FastingType.drySunFast:
        return 'Commence par de petites gorgées d\'eau de source. Après 30 min, un fruit juteux (pastèque, melon).';
    }
  }

  /// Get hydration tip based on fast type
  String get hydrationTip {
    if (_activeFast == null) return '';
    final type = _activeFast!.type;
    if (type == FastingType.drySunFast) {
      return 'Jeûne sec : pas d\'eau. Le corps puise dans ses réserves intracellulaires. Écoute ton corps attentivement.';
    }
    final hours = elapsed.inHours;
    if (hours < 12) return 'Bois 2-3 verres d\'eau de source par heure. L\'hydratation soutient l\'élimination.';
    if (hours < 24) return 'L\'hydratation est cruciale en cétose. L\'eau aide à évacuer les corps cétoniques.';
    return 'En jeûne prolongé, bois quand tu as soif. L\'eau de source avec un peu de citron aide les reins.';
  }

  // ── CHECK-IN SYSTEM ────────────────────────────────────────────────────────

  /// Report a symptom/mood from a check-in quick reply
  void reportSymptom(String symptom) {
    _reportedSymptoms.add(symptom);
    _lastSymptomResponse = symptom;
    _pendingCheckIn = null;
    notifyListeners();
  }

  /// Dismiss the current check-in without answering
  void dismissCheckIn() {
    if (_pendingCheckIn != null) {
      _triggeredCheckIns.add(_pendingCheckIn!.hourMark);
      _pendingCheckIn = null;
      notifyListeners();
    }
  }

  /// Clear the last symptom response (after mascot has shown advice)
  void clearSymptomResponse() {
    _lastSymptomResponse = null;
    notifyListeners();
  }

  /// Get symptom advice for the last reported symptom (for external consumers)
  CoachAdvice? getAdviceForLastSymptom({String? bodyType}) {
    if (_lastSymptomResponse == null || _activeFast == null) return null;
    return FastingCoachKnowledge.adviceForSymptom(
      _lastSymptomResponse!,
      _activeFast!.protocol,
      bodyType: bodyType,
    );
  }

  /// Check if a new check-in should be triggered
  void _evaluateCheckIns() {
    if (_activeFast == null || _pendingCheckIn != null) return;

    final hours = elapsed.inHours;
    final protocol = _activeFast!.protocol;
    final checkIns = FastingCoachKnowledge.checkInsForProtocol(protocol);

    for (final ci in checkIns) {
      if (hours >= ci.hourMark && !_triggeredCheckIns.contains(ci.hourMark)) {
        _triggeredCheckIns.add(ci.hourMark);
        _pendingCheckIn = ci;
        break; // Show one at a time
      }
    }
  }

  // ── ACTIONS ─────────────────────────────────────────────────────────────────

  Future<void> startFast({
    required FastingType type,
    required int plannedMinutes,
    String protocol = 'morse',
    String? programId,
  }) async {
    final session = FastingSession(
      id: const Uuid().v4(),
      type: type,
      startTime: DateTime.now(),
      plannedMinutes: plannedMinutes,
      protocol: protocol,
      programId: programId ?? _activeProgram?.id,
    );
    _activeFast = session;
    _triggeredCheckIns.clear();
    _reportedSymptoms.clear();
    _pendingCheckIn = null;
    _lastSymptomResponse = null;
    await _hive.saveFastingSession(session);
    _startTicker();
    notifyListeners();
  }

  Future<void> endFast({String notes = '', String moodEmoji = ''}) async {
    if (_activeFast == null) return;
    _activeFast!.endTime = DateTime.now();
    _activeFast!.notes = notes;
    _activeFast!.moodEmoji = moodEmoji;
    
    final wasPartOfProgram = _activeFast!.programId != null;
    
    await _hive.saveFastingSession(_activeFast!);
    _history.insert(0, _activeFast!);
    _activeFast = null;
    _pendingCheckIn = null;
    _lastSymptomResponse = null;
    _stopTicker();
    
    if (wasPartOfProgram) {
      await nextProgramSession();
    }
    
    notifyListeners();
  }

  Future<void> cancelFast() async {
    if (_activeFast == null) return;
    await _hive.deleteFastingSession(_activeFast!.id);
    _activeFast = null;
    _pendingCheckIn = null;
    _lastSymptomResponse = null;
    _stopTicker();
    notifyListeners();
  }

  Future<void> updateNotes(String notes) async {
    if (_activeFast == null) return;
    _activeFast!.notes = notes;
    await _hive.saveFastingSession(_activeFast!);
    notifyListeners();
  }

  Future<void> updateMood(String emoji) async {
    if (_activeFast == null) return;
    _activeFast!.moodEmoji = emoji;
    await _hive.saveFastingSession(_activeFast!);
    notifyListeners();
  }

  // ── PRE/POST METRICS ────────────────────────────────────────────────────────

  Future<void> updatePreMetrics({
    double? weight,
    int? energy,
    String? mood,
  }) async {
    if (_activeFast == null) return;
    _activeFast = _activeFast!.copyWith(
      preWeight: weight,
      preEnergy: energy,
      preMood: mood,
    );
    await _hive.saveFastingSession(_activeFast!);
    notifyListeners();
  }

  Future<void> updatePostMetrics({
    double? weight,
    int? energy,
    String? mood,
  }) async {
    if (_activeFast == null) return;
    _activeFast = _activeFast!.copyWith(
      postWeight: weight,
      postEnergy: energy,
      postMood: mood,
    );
    await _hive.saveFastingSession(_activeFast!);
    notifyListeners();
  }

  // ── PROGRAM ACTIONS ─────────────────────────────────────────────────────────

  Future<void> startProgram(FastingProgram program) async {
    _activeProgram = program;
    await _hive.saveFastingProgram(program);
    notifyListeners();
  }

  Future<void> endActiveProgram() async {
    if (_activeProgram == null) return;
    _activeProgram!.isActive = false;
    _activeProgram!.endDate = DateTime.now();
    await _hive.saveFastingProgram(_activeProgram!);
    _programHistory.insert(0, _activeProgram!);
    _activeProgram = null;
    notifyListeners();
  }

  Future<void> nextProgramSession() async {
    if (_activeProgram == null) return;
    _activeProgram!.currentConfigIndex++;
    if (_activeProgram!.currentConfigIndex >= _activeProgram!.configs.length) {
      await endActiveProgram();
    } else {
      await _hive.saveFastingProgram(_activeProgram!);
      notifyListeners();
    }
  }

  // ── INTERNAL ────────────────────────────────────────────────────────────────

  void _load() {
    final sessions = _hive.loadFastingSessions();
    _activeFast = null;
    _history = [];
    for (final s in sessions) {
      if (s.isActive) {
        _activeFast = s;
      } else {
        _history.add(s);
      }
    }
    _history.sort((a, b) => b.startTime.compareTo(a.startTime));

    final programs = _hive.loadFastingPrograms();
    _activeProgram = null;
    _programHistory = [];
    for (final p in programs) {
      if (p.isActive) {
        _activeProgram = p;
      } else {
        _programHistory.add(p);
      }
    }
    _programHistory.sort((a, b) => b.startDate.compareTo(a.startDate));

    if (_activeFast != null) _startTicker();
  }

  void _startTicker() {
    _stopTicker();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      _evaluateCheckIns();
      notifyListeners();
    });
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
