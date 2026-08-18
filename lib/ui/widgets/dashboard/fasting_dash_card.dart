import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/ui/screens/fasting_screen.dart';
import 'package:vital_track/ui/theme.dart';

class FastingDashCard extends StatelessWidget {
  const FastingDashCard({super.key});

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FastingProvider>();
    final colors = context.colors;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const FastingScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: fp.isFasting
                ? colors.accent.withValues(alpha: 0.4)
                : colors.borderSubtle,
          ),
          boxShadow: fp.isFasting ? AppShadows.soft(colors.accent) : null,
        ),
        child: fp.isFasting
            ? _activeFastRow(context, fp, colors)
            : _idleContent(context, fp, colors),
      ),
    );
  }

  Widget _idleContent(
      BuildContext context, FastingProvider fp, AppColors colors) {
    if (fp.history.isNotEmpty) {
      final last = fp.history.first;
      final dur = last.elapsed;
      final h = dur.inHours;
      final m = dur.inMinutes.remainder(60);
      final date = last.startTime;
      final dateStr =
          '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: colors.accentMuted,
                  borderRadius: AppRadius.brMd,
                ),
                child: Center(
                    child: Text(last.type.emoji,
                        style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Dernier jeûne',
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontSize: 14)),
                    Text(
                        '${last.type.label} • ${h}h${m > 0 ? '${m}min' : ''} • $dateStr',
                        style: Theme.of(context)
                            .textTheme
                            .labelMedium
                            ?.copyWith(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              if (fp.currentStreak > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: colors.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🔥', style: TextStyle(fontSize: 12)),
                      const SizedBox(width: 3),
                      Text('${fp.currentStreak}',
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: colors.accent, fontSize: 13)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Icon(Icons.add_circle_outline_rounded,
                  color: colors.accent, size: 16),
              const SizedBox(width: 6),
              Text('Nouveau jeûne',
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: colors.accent, fontSize: 13)),
              const Spacer(),
              Text('${fp.history.length} sessions',
                  style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(width: AppSpacing.xs),
              Icon(Icons.chevron_right_rounded,
                  color: colors.iconMuted, size: 18),
            ],
          ),
        ],
      );
    }

    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.accentMuted,
            borderRadius: AppRadius.brMd,
          ),
          child: const Center(
              child: Text('🌿', style: TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Commencer un jeûne',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(color: colors.accent, fontSize: 14)),
              Text('Hydrique · Fruits · Raisin · Intermittent',
                  style: Theme.of(context).textTheme.labelMedium),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 20),
      ],
    );
  }

  Widget _activeFastRow(
      BuildContext context, FastingProvider fp, AppColors colors) {
    final fast = fp.activeFast!;
    final h = fp.elapsed.inHours;
    final m = fp.elapsed.inMinutes.remainder(60);
    return Row(
      children: [
        SizedBox(
          width: 42,
          height: 42,
          child: CustomPaint(
            painter: MiniRingPainter(
              progress: fp.progress,
              bgColor: colors.surfaceSubtle,
              fgColor: colors.accent,
            ),
            child: Center(
                child:
                    Text(fast.type.emoji, style: const TextStyle(fontSize: 16))),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${fast.type.label} en cours',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
              Text('${h}h${m.toString().padLeft(2, '0')} • ${fp.phaseLabel}',
                  style: TextStyle(color: colors.accent, fontSize: 12)),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 20),
      ],
    );
  }
}

class MiniRingPainter extends CustomPainter {
  final double progress;
  final Color bgColor;
  final Color fgColor;

  MiniRingPainter({
    required this.progress,
    required this.bgColor,
    required this.fgColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - 5) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = bgColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5,
    );

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      Paint()
        ..color = fgColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(MiniRingPainter old) =>
      old.progress != progress || old.fgColor != fgColor;
}
