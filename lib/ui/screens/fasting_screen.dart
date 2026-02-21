import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Importations indispensables pour résoudre les erreurs "Undefined class"
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/services/fasting_coach_knowledge.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/screens/fasting_analytics_view.dart';

class FastingScreen extends StatefulWidget {
  const FastingScreen({super.key});

  @override
  State<FastingScreen> createState() => _FastingScreenState();
}

class _FastingScreenState extends State<FastingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<MascotProvider>().setContext("fasting");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final colors = context.colors;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('Jeûne',
            style: TextStyle(
                color: colors.textPrimary, fontWeight: FontWeight.w800)),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        iconTheme: IconThemeData(color: colors.textPrimary),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: fp.isFasting
            ? _ActiveFastView(
                key: const ValueKey('active'),
                fp: fp,
                colors: colors,
                onShowMetricLog: _showMetricLogSheet,
                onCompletion: _showCompletionSheet,
                onShowQA: _showCoachQA,
                onCancel: _showCancelDialog,
              )
            : _SetupView(
                key: const ValueKey('setup'),
                colors: colors,
                onShowMetricLog: _showMetricLogSheet,
              ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context, FastingProvider fp, AppColors colors) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.sheetBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Annuler le jeûne ?',
            style: TextStyle(color: colors.textPrimary)),
        content: Text('Cette session ne sera pas enregistrée.',
            style: TextStyle(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Retour', style: TextStyle(color: colors.textTertiary)),
          ),
          TextButton(
            onPressed: () {
              fp.cancelFast();
              Navigator.pop(ctx);
            },
            child: Text('Annuler le jeûne',
                style: TextStyle(
                    color: colors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showCompletionSheet(BuildContext context, AppColors colors) {
    final fp = context.read<FastingProvider>();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: colors.sheetBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🎉', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              Text('Jeûne terminé !',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text('Bravo pour ton engagement. Ton corps te remercie. 🌿',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 14,
                      height: 1.5)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _completionStat(colors, '🔥', '${fp.currentStreak}', 'Série actuelle'),
                  const SizedBox(width: 24),
                  _completionStat(colors, '🏆', '${fp.longestStreak}', 'Record'),
                  const SizedBox(width: 24),
                  _completionStat(colors, '📊', '${fp.history.length}', 'Total'),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.accent,
                    foregroundColor: colors.accentOnPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Continuer', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              SizedBox(height: MediaQuery.of(ctx).padding.bottom + 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _completionStat(AppColors colors, String emoji, String value, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 22, fontWeight: FontWeight.w800)),
        Text(label, style: TextStyle(color: colors.textTertiary, fontSize: 11)),
      ],
    );
  }

  void _showMetricLogSheet(BuildContext context, AppColors colors, String title, String buttonLabel, void Function(double?, int?, String) onConfirm) {
    double? tempWeight;
    int tempEnergy = 3;
    String tempMood = '😊';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => Container(
          padding: EdgeInsets.fromLTRB(28, 28, 28, MediaQuery.of(ctx).viewInsets.bottom + 42),
          decoration: BoxDecoration(
            color: colors.sheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 24, fontWeight: FontWeight.w600)),
                const SizedBox(height: 32),

                // Weight
                Text('Ton poids actuel', style: TextStyle(color: colors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 12),
                TextField(
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: TextStyle(color: colors.textPrimary, fontSize: 18),
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                    hintText: 'Poids en kg (optionnel)',
                    hintStyle: TextStyle(color: colors.textTertiary, fontSize: 16, fontWeight: FontWeight.w400),
                    prefixIcon: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Icon(Icons.assignment_ind_outlined, color: colors.accent, size: 28),
                    ),
                    filled: true, 
                    fillColor: colors.surfaceMuted.withValues(alpha: 0.5),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colors.borderSubtle)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: colors.accent, width: 2)),
                  ),
                  onChanged: (v) => tempWeight = double.tryParse(v),
                ),
                const SizedBox(height: 32),

                // Energy
                Text('Énergie', style: TextStyle(color: colors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(5, (i) {
                    final val = i + 1;
                    final selected = tempEnergy == val;
                    final labels = ['Épuisé', 'Faible', 'Moyen', 'En forme', 'Top !'];
                    return GestureDetector(
                      onTap: () => setState(() => tempEnergy = val),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(selected ? Icons.flash_on_rounded : Icons.flash_off_rounded, 
                               color: selected ? colors.accent : colors.textTertiary.withValues(alpha: 0.5), 
                               size: 32),
                          const SizedBox(height: 8),
                          Text(labels[i], style: TextStyle(fontSize: 10, color: selected ? colors.textPrimary : colors.textTertiary, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
                        ],
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 32),

                // Mood
                Text('Humeur', style: TextStyle(color: colors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    {'emoji': '😊', 'label': 'Joyeux'},
                    {'emoji': '😴', 'label': 'Fatigué'},
                    {'emoji': '🧠', 'label': 'Focus'},
                    {'emoji': '😵‍💫', 'label': 'Confus'},
                    {'emoji': '🤢', 'label': 'Nausée'},
                  ].map((item) {
                    final e = item['emoji']!;
                    final label = item['label']!;
                    final selected = tempMood == e;
                    return GestureDetector(
                      onTap: () => setState(() => tempMood = e),
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: selected ? colors.accent.withValues(alpha: 0.1) : Colors.transparent,
                              shape: BoxShape.circle,
                              border: Border.all(color: selected ? colors.accent : Colors.transparent, width: 2),
                            ),
                            child: Text(e, style: TextStyle(fontSize: 28, color: selected ? null : colors.textTertiary)),
                          ),
                          const SizedBox(height: 8),
                          Text(label, style: TextStyle(fontSize: 11, color: selected ? colors.textPrimary : colors.textTertiary, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
                        ],
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 40),

                SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: () {
                      onConfirm(tempWeight, tempEnergy, tempMood);
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors.accent,
                      foregroundColor: colors.accentOnPrimary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(buttonLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCoachQA(BuildContext context, FastingProvider fp, AppColors colors) {
    final protocol = fp.activeFast?.protocol ?? 'morse';
    final questions = FastingCoachKnowledge.qaForProtocol(protocol);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
        decoration: BoxDecoration(
          color: Theme.of(ctx).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: colors.borderSubtle, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('Demander conseil', style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Questions fréquentes — ${protocol == 'morse' ? 'Dr. Morse' : protocol == 'ehret' ? 'Ehret' : 'Dr. Sebi'}', style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: questions.length,
                separatorBuilder: (context, index) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final qa = questions[i];
                  return ExpansionTile(
                    leading: Text(qa.emoji, style: const TextStyle(fontSize: 18)),
                    title: Text(qa.question, style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    tilePadding: const EdgeInsets.symmetric(horizontal: 8),
                    childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    children: [
                      Text(qa.answer, style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.5)),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── SETUP VIEW ──────────────────────────────────────────────────────────────

class _SetupView extends StatefulWidget {
  final AppColors colors;
  final Function(BuildContext, AppColors, String, String, void Function(double?, int?, String)) onShowMetricLog;

  const _SetupView({
    required this.colors,
    required this.onShowMetricLog,
    super.key,
  });

  @override
  State<_SetupView> createState() => _SetupViewState();
}

class _SetupViewState extends State<_SetupView> {
  String _getMotivationalQuote(String modeId) {
    final day = DateTime.now().day;
    if (modeId == 'morse') {
      const quotes = [
        'Le jeûne active la filtration rénale et le drainage lymphatique. — Dr. Morse',
        'Bounce sur un rebounder chaque jour. C\'est le meilleur exercice lymphatique. — Morse',
        'Les fruits sont vos nettoyeurs, les légumes vos bâtisseurs. — Dr. Morse',
        'Sans surrénales fortes, pas de filtration. Sans filtration, pas de guérison. — Morse',
        'Donnez-vous le temps de guérir. Rome ne s\'est pas construite en un jour. — Morse',
      ];
      return quotes[day % quotes.length];
    } else if (modeId == 'ehret') {
      const quotes = [
        'Le jeûne est la clé de la cuisine de Dieu. — Arnold Ehret',
        'V = P − O. Moins d\'obstruction = plus de vitalité. — Ehret',
        'Le jeûne rationnel : commencer doucement, augmenter progressivement. — Ehret',
        'L\'homme sain ne se fatigue pas — il est mouvement perpétuel. — Ehret',
        'La Nature guérit, pas le médecin. Le médecin ne fait qu\'assister la Nature. — Ehret',
      ];
      return quotes[day % quotes.length];
    } else {
      const quotes = [
        'Quand tu arrêtes de mettre des ordures dedans, le corps peut enfin les sortir. — Dr. Sebi',
        'Il n\'y a qu\'une seule maladie : la compromission de la muqueuse. — Dr. Sebi',
        'Le corps est fait de minéraux. Nourris-le de minéraux et il se guérit. — Dr. Sebi',
        'L\'eau est le premier médicament. Mais elle doit être VIVANTE. — Dr. Sebi',
        'Le fer est l\'étincelle de la vie. Sans lui, le corps ne peut fonctionner. — Dr. Sebi',
      ];
      return quotes[day % quotes.length];
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        // ── Quote
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: colors.accent.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.accent.withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              Text('🌿', style: TextStyle(fontSize: 20, color: colors.accent)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _getMotivationalQuote(context.read<ModeProvider>().currentMode.id),
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                      height: 1.4),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        const SizedBox(height: 24),

        // ── Fasting Programs ────────────────────────────────────────────────
        _FastingProgramsSection(
          colors: colors,
          onStartSession: (type, duration, protocol, programId) {
            widget.onShowMetricLog(
              context,
              colors,
              'Avant le jeûne',
              'Commencer',
              (weight, energy, mood) {
                context.read<FastingProvider>().startFast(
                  type: type,
                  plannedMinutes: duration,
                  protocol: protocol,
                  programId: programId,
                ).then((_) {
                  if (context.mounted) {
                    context.read<FastingProvider>().updatePreMetrics(
                      weight: weight,
                      energy: energy,
                      mood: mood,
                    );
                  }
                });
              },
            );
          },
        ),

        // ── History
        const SizedBox(height: 36),
        Row(
          children: [
            Text('Historique',
                style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700)),
            const Spacer(),
            TextButton.icon(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const FastingAnalyticsView()));
              },
              icon: Icon(Icons.analytics_outlined, color: colors.accent, size: 18),
              label: Text(
                context.read<FastingProvider>().history.isEmpty ? 'Aperçu Analyses' : 'Analyses', 
                style: TextStyle(color: colors.accent, fontWeight: FontWeight.w600, fontSize: 13)
              ),
            ),
            if (context.read<FastingProvider>().history.isNotEmpty) ...[
              const SizedBox(width: 8),
              _StreakBadge(colors: colors),
            ]
          ],
        ),
        const SizedBox(height: 12),
        if (context.read<FastingProvider>().history.isNotEmpty) ...[
          ...context.read<FastingProvider>().history.take(10).map(
                (s) => _HistoryTile(session: s, colors: colors),
          ),
        ] else ...[
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: colors.surfaceSubtle,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                'Aucun jeûne enregistré. Clique sur Aperçu Analyses pour voir le potentiel !',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.textTertiary, fontSize: 13),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ─── ACTIVE FAST VIEW ────────────────────────────────────────────────────────

class _ActiveFastView extends StatefulWidget {
  final FastingProvider fp;
  final AppColors colors;
  final Function(BuildContext, AppColors, String, String, void Function(double?, int?, String)) onShowMetricLog;
  final Function(BuildContext, AppColors) onCompletion;
  final Function(BuildContext, FastingProvider, AppColors) onShowQA;
  final Function(BuildContext, FastingProvider, AppColors) onCancel;

  const _ActiveFastView({
    required this.fp,
    required this.colors,
    required this.onShowMetricLog,
    required this.onCompletion,
    required this.onShowQA,
    required this.onCancel,
    super.key,
  });

  @override
  State<_ActiveFastView> createState() => _ActiveFastViewState();
}

class _ActiveFastViewState extends State<_ActiveFastView> {
  final TextEditingController _notesCtrl = TextEditingController();
  String _selectedMood = '';

  static const _moods = ['😊', '😌', '😤', '🥱', '💪'];

  @override
  void initState() {
    super.initState();
    _notesCtrl.text = widget.fp.activeFast?.notes ?? '';
    _selectedMood = widget.fp.activeFast?.moodEmoji ?? '';
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  String _fmtDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  String _fmtRemaining(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    if (h > 0) return '$h h $m min';
    return '$m min';
  }

  @override
  Widget build(BuildContext context) {
    final fp = widget.fp;
    final colors = widget.colors;
    final fast = fp.activeFast!;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
      children: [
        const SizedBox(height: 16),

        // ── Circular Progress Ring
        Center(
          child: SizedBox(
            width: 240,
            height: 240,
            child: CustomPaint(
              painter: _FastingRingPainter(
                progress: fp.progress,
                bgColor: colors.surfaceSubtle,
                fgColor: colors.accent,
                strokeWidth: 14,
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(fast.type.emoji,
                        style: const TextStyle(fontSize: 28)),
                    const SizedBox(height: 4),
                    Text(_fmtDuration(fp.elapsed),
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            fontFeatures: const [
                              FontFeature.tabularFigures()
                            ])),
                    const SizedBox(height: 2),
                    Text('restant: ${_fmtRemaining(fp.remaining)}',
                        style: TextStyle(
                            color: colors.textTertiary, fontSize: 13)),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // ── Phase Indicator
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.accent.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(fp.phaseLabel,
                      style: TextStyle(
                          color: colors.accent,
                          fontSize: 16,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(fp.phaseSubtitle,
                        style:
                        TextStyle(color: colors.textSecondary, fontSize: 12)),
                  ),
                ],
              ),
              if (fp.phaseInsight.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colors.surfaceMuted,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 14)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          fp.phaseInsight,
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 13,
                            height: 1.45,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Hydration Tip
        Builder(builder: (context) {
          final hydrationColor = colors.isDark ? const Color(0xFF7DD3FC) : const Color(0xFF0284C7);
          return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: hydrationColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: hydrationColor.withValues(alpha: 0.18)),
          ),
          child: Row(
            children: [
              const Text('💧', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(fp.hydrationTip,
                    style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.4)),
              ),
            ],
          ),
        );
        }),
        const SizedBox(height: 20),

        // ── Type badge
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: colors.surfaceSubtle,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('${fast.type.emoji}  ${fast.type.label}',
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ),
            const Spacer(),
            Text(
                'Objectif: ${(fast.plannedMinutes / 60).round()}h',
                style:
                TextStyle(color: colors.textTertiary, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 24),

        // ── Mood Selector
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
              onTap: () {
                setState(() => _selectedMood = emoji);
                fp.updateMood(emoji);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: selected ? colors.accent.withValues(alpha: 0.15) : colors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: selected ? colors.accent : colors.borderSubtle,
                    width: selected ? 2 : 1,
                  ),
                ),
                child: Center(
                    child: Text(emoji, style: const TextStyle(fontSize: 22))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // ── Journal
        Text('Journal',
            style: TextStyle(
                color: colors.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: _notesCtrl,
          maxLines: 3,
          style: TextStyle(color: colors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Notes, sensations, observations...',
            hintStyle: TextStyle(color: colors.textTertiary),
            filled: true,
            fillColor: colors.surfaceSubtle,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.all(14),
          ),
          onChanged: (v) => fp.updateNotes(v),
        ),
        const SizedBox(height: 24),

        // ── Break-Fast Recommendation
        Builder(builder: (context) {
          final breakColor = colors.isDark ? const Color(0xFF86EFAC) : const Color(0xFF16A34A);
          return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: breakColor.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: breakColor.withValues(alpha: 0.18)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text('🍇', style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Text('Rupture du jeûne',
                      style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 8),
              Text(fp.breakFastRecommendation,
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 13,
                      height: 1.5)),
            ],
          ),
        );
        }),
        const SizedBox(height: 16),

        // ── Symptom Log ───────────────────────────────────────────────────
        _SymptomLogSection(fp: fp, colors: colors),
        const SizedBox(height: 16),

        // ── Ask Coach Q&A ─────────────────────────────────────────────────
        GestureDetector(
          onTap: () => widget.onShowQA(context, fp, colors),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: colors.accent.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.accent.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Text('🤔', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Text('Demander conseil',
                    style: TextStyle(
                        color: colors.accent,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
                const Spacer(),
                Icon(Icons.chevron_right_rounded,
                    color: colors.accent, size: 20),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // ── End / Cancel
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => widget.onCancel(context, fp, colors),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.error,
                  side: BorderSide(color: colors.error.withValues(alpha: 0.5)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Annuler',
                    style:
                    TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () async {
                  widget.onShowMetricLog(
                    context,
                    colors,
                    'Bilan de fin',
                    'Terminer',
                    (weight, energy, moodEmoji) async {
                      await fp.endFast(
                        notes: _notesCtrl.text,
                        moodEmoji: moodEmoji,
                      );
                      await fp.updatePostMetrics(
                        weight: weight,
                        energy: energy,
                        mood: moodEmoji,
                      );
                      if (context.mounted) widget.onCompletion(context, colors);
                    },
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 3,
                ),
                child: const Text('Terminer le jeûne ✓',
                    style:
                    TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── CIRCULAR RING PAINTER ───────────────────────────────────────────────────

class _FastingRingPainter extends CustomPainter {
  final double progress;
  final Color bgColor;
  final Color fgColor;
  final double strokeWidth;

  _FastingRingPainter({
    required this.progress,
    required this.bgColor,
    required this.fgColor,
    this.strokeWidth = 12,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - strokeWidth) / 2;

    // Background ring
    final bgPaint = Paint()
      ..color = bgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final fgPaint = Paint()
      ..color = fgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(_FastingRingPainter old) =>
      old.progress != progress || old.fgColor != fgColor;
}

// ─── STREAK BADGE ────────────────────────────────────────────────────────────

class _StreakBadge extends StatelessWidget {
  final AppColors colors;
  const _StreakBadge({required this.colors});

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    if (fp.currentStreak == 0) return const SizedBox.shrink();
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
          Text('${fp.currentStreak} jours',
              style: TextStyle(
                  color: colors.accent,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

// ─── HISTORY TILE ────────────────────────────────────────────────────────────

class _HistoryTile extends StatelessWidget {
  final FastingSession session;
  final AppColors colors;
  const _HistoryTile({required this.session, required this.colors});

  @override
  Widget build(BuildContext context) {
    final dur = session.elapsed;
    final h = dur.inHours;
    final m = dur.inMinutes.remainder(60);
    final date = session.startTime;
    final dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.borderSubtle),
      ),
      child: Row(
        children: [
          Text(session.type.emoji, style: const TextStyle(fontSize: 22)),
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
                Text('$dateStr • ${h}h${m > 0 ? ' ${m}min' : ''}',
                    style:
                    TextStyle(color: colors.textTertiary, fontSize: 12)),
              ],
            ),
          ),
          if (session.moodEmoji.isNotEmpty)
            Text(session.moodEmoji, style: const TextStyle(fontSize: 18)),
        ],
      ),
    );
  }
}


// ─── SYMPTOM LOG SECTION ────────────────────────────────────────────────────

class _SymptomLogSection extends StatelessWidget {
  final FastingProvider fp;
  final AppColors colors;
  const _SymptomLogSection({required this.fp, required this.colors});

  @override
  Widget build(BuildContext context) {
    final symptoms = fp.reportedSymptoms;
    if (symptoms.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceSubtle,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('📋', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text('Symptômes rapportés',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
              const Spacer(),
              Text('${symptoms.length}',
                  style: TextStyle(color: colors.textTertiary, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: symptoms.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: colors.borderSubtle),
              ),
              child: Text(s,
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 11)),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

// ─── FASTING PROGRAMS SECTION ────────────────────────────────────────────────

class _FastingProgramsSection extends StatelessWidget {
  final AppColors colors;
  final Function(FastingType type, int durationMinutes, String protocol, String? programId)? onStartSession;

  const _FastingProgramsSection({
    required this.colors,
    this.onStartSession,
  });

  static List<FastingProgram> _templatesForMode(String modeId) {
    switch (modeId) {
      case 'morse':
        return [
          FastingProgram(
            id: 'morse_grape_3',
            name: '🍇 Cure de Raisin',
            targetObjective: 'Nettoyage lymphatique par le raisin noir. Idéal pour activer la filtration.',
            startDate: DateTime.now(),
            configs: List.generate(3, (_) => const FastingSessionConfig(
              type: FastingType.grapeCure,
              durationMinutes: 24 * 60,
              breakHours: 8,
            )),
          ),
          FastingProgram(
            id: 'morse_lymph_5',
            name: '💧 Détox Lymphatique',
            targetObjective: 'Activer la filtration rénale et drainer les toxines tissulaires.',
            startDate: DateTime.now(),
            configs: List.generate(5, (_) => const FastingSessionConfig(
              type: FastingType.fruitFast,
              durationMinutes: 20 * 60,
              breakHours: 4,
            )),
          ),
        ];
      case 'ehret':
        return [
          FastingProgram(
            id: 'ehret_transition_7',
            name: '🌿 Transition Ehret',
            targetObjective: 'Alternance douce pour réduire l\'obstruction. (V = P - O)',
            startDate: DateTime.now(),
            configs: List.generate(7, (i) => FastingSessionConfig(
              type: i.isEven ? FastingType.intermittent : FastingType.fruitFast,
              durationMinutes: i.isEven ? 16 * 60 : 20 * 60,
              breakHours: 8,
            )),
          ),
          FastingProgram(
            id: 'ehret_rational_3',
            name: '🔑 Jeûne Rationnel',
            targetObjective: 'Progression calibrée 16h → 20h → 24h. Laisse la Nature opérer.',
            startDate: DateTime.now(),
            configs: const [
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 16 * 60, breakHours: 8),
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 20 * 60, breakHours: 8),
              FastingSessionConfig(type: FastingType.waterFast, durationMinutes: 24 * 60, breakHours: 0),
            ],
          ),
        ];
      case 'sebi':
      default:
        return [
          FastingProgram(
            id: 'sebi_alkaline_3',
            name: '⚡ Nettoyage Alcalin',
            targetObjective: 'Jus alcalins pour dissoudre le mucus et nettoyer les membranes.',
            startDate: DateTime.now(),
            configs: List.generate(3, (_) => const FastingSessionConfig(
              type: FastingType.juiceFast,
              durationMinutes: 24 * 60,
              breakHours: 6,
            )),
          ),
          FastingProgram(
            id: 'sebi_mineral_5',
            name: '🧬 Cure Minérale',
            targetObjective: 'Fruits électriques (gorgés de soleil) pour nourrir la paroi cellulaire.',
            startDate: DateTime.now(),
            configs: List.generate(5, (_) => const FastingSessionConfig(
              type: FastingType.fruitFast,
              durationMinutes: 20 * 60,
              breakHours: 4,
            )),
          ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final active = fp.activeProgram;
    final modeId = context.watch<ModeProvider>().currentMode.id;
    final modeLabel = modeId == 'morse' ? 'Dr. Morse' : modeId == 'ehret' ? 'Ehret' : 'Dr. Sebi';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Programmes $modeLabel',
                style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800)),
            if (active != null)
              TextButton(
                onPressed: () => fp.endActiveProgram(),
                child: Text('Réinitialiser', style: TextStyle(color: colors.error, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        const SizedBox(height: 16),

        if (active != null)
          _ActiveProgramCard(
             program: active,
             colors: colors,
             onStartSession: () {
                if (onStartSession == null) return;
                final config = active.currentConfig;
                if (config != null) {
                   onStartSession!(config.type, config.durationMinutes, modeId, active.id);
                }
             }
          )
        else
          Column(
            children: _templatesForMode(modeId).map((t) => _ProgramTemplateCard(
              template: t,
              colors: colors,
              onStart: () {
                fp.startProgram(t);
              },
            )).toList(),
          ),
      ],
    );
  }
}

class _ActiveProgramCard extends StatelessWidget {
  final FastingProgram program;
  final AppColors colors;
  final VoidCallback onStartSession;
  const _ActiveProgramCard({required this.program, required this.colors, required this.onStartSession});

  @override
  Widget build(BuildContext context) {
    final config = program.currentConfig;
    if (config == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.borderSubtle),
        boxShadow: [
           BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
           )
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
             mainAxisAlignment: MainAxisAlignment.center,
             children: [
                Text(program.name, style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)),
             ]
          ),
          const SizedBox(height: 8),
          Text(program.targetObjective, textAlign: TextAlign.center, style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.4)),
          const SizedBox(height: 24),
          
          Container(
             padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
             decoration: BoxDecoration(
                color: colors.accent.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.accent.withValues(alpha: 0.15)),
             ),
             child: Column(
                children: [
                   Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                         Text('Prochaine séance', style: TextStyle(color: colors.textTertiary, fontSize: 12, fontWeight: FontWeight.w600)),
                         Text('Étape ${program.currentConfigIndex + 1}/${program.configs.length}', style: TextStyle(color: colors.textPrimary, fontSize: 12, fontWeight: FontWeight.w700)),
                      ]
                   ),
                   const SizedBox(height: 12),
                   Row(
                      children: [
                         Text(config.type.emoji, style: const TextStyle(fontSize: 32)),
                         const SizedBox(width: 16),
                         Expanded(
                            child: Column(
                               crossAxisAlignment: CrossAxisAlignment.start,
                               children: [
                                  Text(config.type.label, style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                                  Text('Objectif: ${(config.durationMinutes / 60).round()} heures', style: TextStyle(color: colors.accent, fontSize: 14, fontWeight: FontWeight.w600)),
                               ]
                            )
                         )
                      ]
                   )
                ]
             )
          ),
          
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
               onPressed: onStartSession,
               style: ElevatedButton.styleFrom(
                 backgroundColor: colors.accent,
                 foregroundColor: colors.accentOnPrimary,
                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                 elevation: 4,
                 shadowColor: colors.accent.withValues(alpha: 0.4),
               ),
               child: const Text('Démarrer la séance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            )
          )
        ],
      ),
    );
  }
}

class _ProgramTemplateCard extends StatelessWidget {
  final FastingProgram template;
  final AppColors colors;
  final VoidCallback onStart;

  const _ProgramTemplateCard({
    required this.template,
    required this.colors,
    required this.onStart,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onStart,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.borderSubtle),
          boxShadow: [
             BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
             )
          ]
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
             Row(
                children: [
                   Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                         color: colors.accent.withValues(alpha: 0.08),
                         shape: BoxShape.circle,
                      ),
                      child: Text(template.configs.first.type.emoji, style: const TextStyle(fontSize: 24)),
                   ),
                   const SizedBox(width: 16),
                   Expanded(
                      child: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                            Text(template.name, style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text('${template.configs.length} sessions • ${template.configs.first.type.label}', style: TextStyle(color: colors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                         ]
                      )
                   )
                ]
             ),
             const SizedBox(height: 16),
             Text(template.targetObjective, style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.4)),
             const SizedBox(height: 16),
             SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                   onPressed: onStart,
                   style: OutlinedButton.styleFrom(
                      foregroundColor: colors.accent,
                      side: BorderSide(color: colors.borderSubtle),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                   ),
                   child: const Text('Sélectionner', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                )
             )
          ]
        )
      )
    );
  }
}