import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/theme.dart';

class BreathingScreen extends StatelessWidget {
  const BreathingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BreathingProvider>();
    final colors = context.colors;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('Respiration',
            style: TextStyle(
                color: colors.textPrimary, fontWeight: FontWeight.w800)),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        iconTheme: IconThemeData(color: colors.textPrimary),
      ),
      body: bp.isBreathing
          ? _ActiveView(bp: bp, colors: colors)
          : _SetupView(colors: colors),
    );
  }
}

// ─── SETUP VIEW ──────────────────────────────────────────────────────────────

class _SetupView extends StatefulWidget {
  final AppColors colors;
  const _SetupView({required this.colors});

  @override
  State<_SetupView> createState() => _SetupViewState();
}

class _SetupViewState extends State<_SetupView> {
  BreathingType _selectedType = BreathingType.whm;
  int _selectedRounds = 3; // WHM
  int _selectedMinutes = 5; // non-WHM

  static const _whmRounds = [3, 4, 5, 6];
  static const _timedMinutes = [
    (label: '3 min', minutes: 3),
    (label: '5 min', minutes: 5),
    (label: '10 min', minutes: 10),
    (label: '15 min', minutes: 15),
  ];

  String _getQuote(String modeId) {
    final day = DateTime.now().day;
    if (modeId == 'ehret') {
      const q = [
        '"L\'homme est un moteur à air-gaz. La respiration correcte nourrit chaque cellule." — Ehret',
        '"L\'obstruction diminue quand l\'oxygène circule. V = P − O." — Ehret',
        '"Respirez profondément en plein air — c\'est le premier remède." — Ehret',
      ];
      return q[day % q.length];
    } else if (modeId == 'morse') {
      const q = [
        '"La respiration profonde stimule le drainage lymphatique." — Dr. Morse',
        '"Les poumons sont l\'un des quatre canaux d\'élimination. Respirez !" — Morse',
        '"L\'oxygénation soutient les surrénales et la filtration rénale." — Morse',
      ];
      return q[day % q.length];
    } else {
      const q = [
        '"Le fer transporte l\'oxygène — la respiration nourrit chaque cellule." — Dr. Sebi',
        '"L\'oxygénation alcalinise le sang et soutient l\'absorption minérale." — Sebi',
        '"Le corps est électrique. L\'oxygène est l\'étincelle." — Dr. Sebi',
      ];
      return q[day % q.length];
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final modeId = context.read<ModeProvider>().currentMode.id;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        // ── Header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colors.accent.withValues(alpha: 0.15),
                colors.accentSubtle,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              const Text('🌬️', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 8),
              Text('Exercice de respiration',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                _getQuote(modeId),
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: colors.textTertiary,
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Type Selection
        Text('Type de respiration',
            style: TextStyle(
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        SizedBox(
          height: 170,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            itemCount: BreathingType.values.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (ctx, i) {
              final type = BreathingType.values[i];
              final selected = type == _selectedType;
              return Center(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedType = type),
                  child: AnimatedScale(
                    scale: selected ? 1.05 : 1.0,
                    duration: const Duration(milliseconds: 200),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 140,
                      height: 160,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 14),
                      decoration: BoxDecoration(
                        color: selected ? colors.accent : colors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: selected ? colors.accent : colors.border,
                          width: selected ? 2 : 1,
                        ),
                        boxShadow: selected
                            ? [
                                BoxShadow(
                                    color:
                                        colors.accent.withValues(alpha: 0.3),
                                    blurRadius: 14,
                                    offset: const Offset(0, 5))
                              ]
                            : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(type.emoji,
                              style: const TextStyle(fontSize: 32)),
                          const SizedBox(height: 8),
                          Text(type.label,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: selected
                                      ? colors.accentOnPrimary
                                      : colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Flexible(
                            child: Text(type.subtitle,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: selected
                                        ? colors.accentOnPrimary
                                            .withValues(alpha: 0.85)
                                        : colors.textSecondary,
                                    fontSize: 13,
                                    height: 1.3)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 20),

        // ── Description
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: colors.surfaceSubtle,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(
            _selectedType.description,
            style: TextStyle(
                color: colors.textSecondary, fontSize: 14, height: 1.5),
          ),
        ),
        const SizedBox(height: 24),

        // ── Duration / Rounds
        Text(
            _selectedType == BreathingType.whm
                ? 'Nombre de tours'
                : 'Durée',
            style: TextStyle(
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),

        if (_selectedType == BreathingType.whm)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _whmRounds.map((r) {
              final selected = r == _selectedRounds;
              return GestureDetector(
                onTap: () => setState(() => _selectedRounds = r),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? colors.accent : colors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: selected ? colors.accent : colors.border),
                  ),
                  child: Text('$r tours',
                      style: TextStyle(
                          color: selected
                              ? colors.accentOnPrimary
                              : colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 15)),
                ),
              );
            }).toList(),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _timedMinutes.map((d) {
              final selected = d.minutes == _selectedMinutes;
              return GestureDetector(
                onTap: () =>
                    setState(() => _selectedMinutes = d.minutes),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: selected ? colors.accent : colors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: selected ? colors.accent : colors.border),
                  ),
                  child: Text(d.label,
                      style: TextStyle(
                          color: selected
                              ? colors.accentOnPrimary
                              : colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 15)),
                ),
              );
            }).toList(),
          ),
        const SizedBox(height: 20),

        // ── Safety Warning (WHM only)
        if (_selectedType == BreathingType.whm) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: colors.errorMuted,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: colors.error.withValues(alpha: 0.2)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⚠️', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Ne jamais pratiquer dans l\'eau, en conduisant, ou debout. '
                    'Position assise ou allongée uniquement. '
                    'Déconseillé : épilepsie, grossesse, problèmes cardiaques.',
                    style: TextStyle(
                        color: colors.error,
                        fontSize: 13,
                        height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // ── Start Button
        SizedBox(
          height: 56,
          child: ElevatedButton(
            onPressed: () {
              final protocol =
                  context.read<ModeProvider>().currentMode.id;
              context.read<BreathingProvider>().startSession(
                    type: _selectedType,
                    rounds: _selectedRounds,
                    minutes: _selectedMinutes,
                    protocol: protocol,
                  );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.accent,
              foregroundColor: colors.accentOnPrimary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 4,
              shadowColor: colors.accent.withValues(alpha: 0.4),
            ),
            child: const Text('Commencer',
                style:
                    TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          ),
        ),

        // ── History
        if (context.read<BreathingProvider>().history.isNotEmpty) ...[
          const SizedBox(height: 36),
          Row(
            children: [
              Text('Historique',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w700)),
              const Spacer(),
              _StreakBadge(colors: colors),
            ],
          ),
          const SizedBox(height: 12),
          ...context
              .read<BreathingProvider>()
              .history
              .take(10)
              .map((s) => _HistoryTile(session: s, colors: colors)),
        ],
      ],
    );
  }
}

// ─── ACTIVE VIEW ─────────────────────────────────────────────────────────────

class _ActiveView extends StatefulWidget {
  final BreathingProvider bp;
  final AppColors colors;
  const _ActiveView({required this.bp, required this.colors});

  @override
  State<_ActiveView> createState() => _ActiveViewState();
}

class _ActiveViewState extends State<_ActiveView>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _scaleAnim;
  String _selectedMood = '';

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _scaleAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(_ActiveView old) {
    super.didUpdateWidget(old);
    _updateAnimation();
  }

  void _updateAnimation() {
    final phase = widget.bp.phase;
    // Expand on inhale/hyperventilation, contract on exhale/retention
    if (phase == BreathingPhase.inhale ||
        phase == BreathingPhase.hyperventilation ||
        phase == BreathingPhase.recovery ||
        phase == BreathingPhase.holdIn) {
      if (!_animCtrl.isAnimating || _animCtrl.status == AnimationStatus.reverse) {
        _animCtrl.forward();
      }
    } else if (phase == BreathingPhase.exhale ||
        phase == BreathingPhase.retention ||
        phase == BreathingPhase.holdOut) {
      if (!_animCtrl.isAnimating || _animCtrl.status == AnimationStatus.forward) {
        _animCtrl.reverse();
      }
    } else {
      // idle / rest
      _animCtrl.animateTo(0.5);
    }
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  String _fmtElapsed(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds.remainder(60);
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  static const _moods = ['😊', '😌', '😤', '🥱', '💪'];

  @override
  Widget build(BuildContext context) {
    final bp = widget.bp;
    final colors = widget.colors;
    final session = bp.activeSession!;
    final isWhm = session.type == BreathingType.whm;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        const SizedBox(height: 16),

        // ── Animated Breathing Circle
        Center(
          child: AnimatedBuilder(
            animation: _scaleAnim,
            builder: (context, child) {
              return SizedBox(
                width: 240,
                height: 240,
                child: CustomPaint(
                  painter: _BreathingCirclePainter(
                    progress: bp.sessionProgress,
                    breathScale: _scaleAnim.value,
                    accentColor: colors.accent,
                    bgColor: colors.surfaceSubtle,
                    phase: bp.phase,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          bp.phaseLabel,
                          style: TextStyle(
                              color: colors.accent,
                              fontSize: 16,
                              fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        if (bp.phase == BreathingPhase.retention)
                          Text(
                            '${bp.retentionSeconds}s',
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                                fontFeatures: const [
                                  FontFeature.tabularFigures()
                                ]),
                          )
                        else
                          Text(
                            _fmtElapsed(bp.elapsed),
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                fontFeatures: const [
                                  FontFeature.tabularFigures()
                                ]),
                          ),
                        const SizedBox(height: 4),
                        if (isWhm)
                          Text(
                            'Tour ${bp.currentRound + 1} / ${bp.targetRounds}',
                            style: TextStyle(
                                color: colors.textTertiary, fontSize: 13),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),

        // ── Phase Instruction Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.accent.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border:
                Border.all(color: colors.accent.withValues(alpha: 0.18)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(bp.phaseInstruction,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 15,
                      height: 1.5)),
              if (isWhm &&
                  bp.phase == BreathingPhase.hyperventilation) ...[
                const SizedBox(height: 12),
                // Progress bar for breath count
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: bp.breathCount / BreathingProvider.whmBreathCount,
                    backgroundColor: colors.surfaceSubtle,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(colors.accent),
                    minHeight: 6,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── WHM Tap Actions
        if (isWhm && bp.phase == BreathingPhase.hyperventilation)
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: bp.tapBreath,
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.accent,
                foregroundColor: colors.accentOnPrimary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: Text(
                  'Respire ${bp.breathCount} / ${BreathingProvider.whmBreathCount}',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),

        if (isWhm && bp.phase == BreathingPhase.retention)
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: bp.endRetention,
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.accent,
                foregroundColor: colors.accentOnPrimary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Je dois respirer',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),

        const SizedBox(height: 16),

        // ── Retention times display (WHM)
        if (isWhm && bp.retentionTimes.isNotEmpty) ...[
          Text('Rétentions',
              style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: bp.retentionTimes.asMap().entries.map((e) {
              return Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: colors.accentMuted,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('T${e.key + 1}: ${e.value}s',
                    style: TextStyle(
                        color: colors.accent,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ],

        // ── Type badge
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: colors.surfaceSubtle,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                  '${session.type.emoji}  ${session.type.label}',
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // ── Mood
        Text('Comment tu te sens ?',
            style: TextStyle(
                color: colors.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: _moods.map((emoji) {
            final selected = _selectedMood == emoji;
            return GestureDetector(
              onTap: () => setState(() => _selectedMood = emoji),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: selected
                      ? colors.accent.withValues(alpha: 0.15)
                      : colors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: selected ? colors.accent : colors.borderSubtle,
                    width: selected ? 2 : 1,
                  ),
                ),
                child: Center(
                    child:
                        Text(emoji, style: const TextStyle(fontSize: 22))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // ── End / Cancel
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => bp.cancelSession(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.error,
                  side: BorderSide(
                      color: colors.error.withValues(alpha: 0.5)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Annuler',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  bp.endSession(moodEmoji: _selectedMood);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 3,
                ),
                child: const Text('Terminer ✓',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── BREATHING CIRCLE PAINTER ────────────────────────────────────────────────

class _BreathingCirclePainter extends CustomPainter {
  final double progress;
  final double breathScale;
  final Color accentColor;
  final Color bgColor;
  final BreathingPhase phase;

  _BreathingCirclePainter({
    required this.progress,
    required this.breathScale,
    required this.accentColor,
    required this.bgColor,
    required this.phase,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = (size.shortestSide - 20) / 2;

    // Outer progress ring
    final ringPaint = Paint()
      ..color = bgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, maxRadius, ringPaint);

    final progressPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: maxRadius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );

    // Inner breathing circle
    final innerRadius = (maxRadius - 16) * breathScale;
    final innerPaint = Paint()
      ..color = accentColor.withValues(alpha: 0.12)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, innerRadius, innerPaint);

    // Glow ring
    final glowPaint = Paint()
      ..color = accentColor.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12;
    canvas.drawCircle(center, innerRadius, glowPaint);
  }

  @override
  bool shouldRepaint(_BreathingCirclePainter old) =>
      old.progress != progress ||
      old.breathScale != breathScale ||
      old.phase != phase;
}

// ─── STREAK BADGE ────────────────────────────────────────────────────────────

class _StreakBadge extends StatelessWidget {
  final AppColors colors;
  const _StreakBadge({required this.colors});

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BreathingProvider>();
    if (bp.currentStreak == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: colors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔥', style: TextStyle(fontSize: 14)),
          const SizedBox(width: 4),
          Text('${bp.currentStreak} jours',
              style: TextStyle(
                  color: colors.accent,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

// ─── HISTORY TILE ────────────────────────────────────────────────────────────

class _HistoryTile extends StatelessWidget {
  final BreathingSession session;
  final AppColors colors;
  const _HistoryTile({required this.session, required this.colors});

  @override
  Widget build(BuildContext context) {
    final dur = session.elapsed;
    final m = dur.inMinutes;
    final date = session.startTime;
    final dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

    final retentionInfo = session.type == BreathingType.whm &&
            session.retentionTimes.isNotEmpty
        ? ' · moy ${session.retentionTimes.reduce((a, b) => a + b) ~/ session.retentionTimes.length}s'
        : '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: colors.borderSubtle),
        ),
        child: Row(
          children: [
            Text(session.type.emoji,
                style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(session.type.label,
                      style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                  Text(
                      '${m}min · $dateStr · ${session.rounds} tours$retentionInfo',
                      style: TextStyle(
                          color: colors.textTertiary, fontSize: 12)),
                ],
              ),
            ),
            if (session.moodEmoji.isNotEmpty)
              Text(session.moodEmoji,
                  style: const TextStyle(fontSize: 18)),
          ],
        ),
      ),
    );
  }
}
