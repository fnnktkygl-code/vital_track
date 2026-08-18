import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/fasting/fasting_history_tile.dart';

class ActiveFastView extends StatefulWidget {
  final FastingProvider fp;
  final AppColors colors;
  final Function(BuildContext, AppColors, String, String,
      void Function(double?, int?, String)) onShowMetricLog;
  final Function(BuildContext, AppColors) onCompletion;
  final Function(BuildContext, FastingProvider, AppColors) onShowQA;
  final Function(BuildContext, FastingProvider, AppColors) onCancel;

  const ActiveFastView({
    required this.fp,
    required this.colors,
    required this.onShowMetricLog,
    required this.onCompletion,
    required this.onShowQA,
    required this.onCancel,
    super.key,
  });

  @override
  State<ActiveFastView> createState() => _ActiveFastViewState();
}

class _ActiveFastViewState extends State<ActiveFastView> {
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
        Center(
          child: SizedBox(
            width: 240,
            height: 240,
            child: CustomPaint(
              painter: FastingRingPainter(
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
                    Text(
                      _fmtDuration(fp.elapsed),
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
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
                  Text(
                    fp.phaseLabel,
                    style: TextStyle(
                      color: colors.accent,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      fp.phaseSubtitle,
                      style: TextStyle(
                          color: colors.textSecondary, fontSize: 12),
                    ),
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
        Builder(builder: (context) {
          final hydrationColor = colors.isDark
              ? const Color(0xFF7DD3FC)
              : const Color(0xFF0284C7);
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: hydrationColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: hydrationColor.withValues(alpha: 0.18)),
            ),
            child: Row(
              children: [
                const Text('💧', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(fp.hydrationTip,
                      style: TextStyle(
                          color: colors.textSecondary,
                          fontSize: 13,
                          height: 1.4)),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 20),
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
            Text('Objectif: ${(fast.plannedMinutes / 60).round()}h',
                style: TextStyle(color: colors.textTertiary, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 24),
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
                    child: Text(emoji, style: const TextStyle(fontSize: 22))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
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
        Builder(builder: (context) {
          final breakColor = colors.isDark
              ? const Color(0xFF86EFAC)
              : const Color(0xFF16A34A);
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
        FastingSymptomLogSection(fp: fp, colors: colors),
        const SizedBox(height: 16),
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
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => widget.onCancel(context, fp, colors),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.error,
                  side:
                      BorderSide(color: colors.error.withValues(alpha: 0.5)),
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
                      if (context.mounted) {
                        widget.onCompletion(context, colors);
                      }
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

class FastingRingPainter extends CustomPainter {
  final double progress;
  final Color bgColor;
  final Color fgColor;
  final double strokeWidth;

  FastingRingPainter({
    required this.progress,
    required this.bgColor,
    required this.fgColor,
    this.strokeWidth = 12,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - strokeWidth) / 2;

    final bgPaint = Paint()
      ..color = bgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

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
  bool shouldRepaint(FastingRingPainter old) =>
      old.progress != progress || old.fgColor != fgColor;
}
