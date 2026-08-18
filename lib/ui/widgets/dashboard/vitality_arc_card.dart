import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/theme.dart';

class VitalityArcCard extends StatelessWidget {
  final double score;
  final ProtocolMode mode;
  const VitalityArcCard({super.key, required this.score, required this.mode});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final modeColor = mode.resolveColor(colors.isDark);
    final scoreColor = score >= 70
        ? colors.accent
        : score >= 40
            ? colors.accentSecondary
            : colors.error;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: AppRadius.brXl,
        border: Border.all(color: colors.borderSubtle),
        boxShadow: AppShadows.soft(colors.shadowBase),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            height: 100,
            child: CustomPaint(
              painter: ArcPainter(
                score: score,
                color: scoreColor,
                trackColor: colors.surfaceSubtle,
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${score.toInt()}',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            fontSize: 28,
                            color: scoreColor,
                          ),
                    ),
                    Text(
                      'VITAL',
                      style: TextStyle(
                        fontSize: 12,
                        color: colors.textTertiary,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.xl),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: modeColor.withValues(alpha: 0.12),
                        borderRadius: AppRadius.brSm,
                        border:
                            Border.all(color: modeColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        '${mode.icon}  ${mode.label}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: modeColor,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                StatRow(
                  label: 'Score du jour',
                  value: '${score.toInt()}/100',
                  color: scoreColor,
                  colors: colors,
                ),
                const SizedBox(height: AppSpacing.sm),
                StatRow(
                  label: 'Catégorie',
                  value: score >= 70
                      ? 'Excellent'
                      : score >= 40
                          ? 'Correct'
                          : 'À améliorer',
                  color: scoreColor,
                  colors: colors,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class StatRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final AppColors colors;

  const StatRow({
    super.key,
    required this.label,
    required this.value,
    required this.color,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .labelMedium
                  ?.copyWith(color: colors.textTertiary)),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .labelMedium
                  ?.copyWith(color: colors.adaptForText(color))),
        ],
      );
}

class ArcPainter extends CustomPainter {
  final double score;
  final Color color;
  final Color trackColor;

  const ArcPainter({
    required this.score,
    required this.color,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = math.min(cx, cy) - 8;
    const strokeW = 8.0;
    const startAngle = math.pi * 0.75;
    const sweepAngle = math.pi * 1.5;

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      startAngle,
      sweepAngle,
      false,
      trackPaint,
    );

    final arcPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      startAngle,
      sweepAngle * (score / 100).clamp(0, 1),
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(ArcPainter old) =>
      old.score != score || old.color != color;
}
