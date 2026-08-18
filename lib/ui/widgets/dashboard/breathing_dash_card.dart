import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/ui/screens/breathing_screen.dart';
import 'package:vital_track/ui/theme.dart';

class BreathingDashCard extends StatelessWidget {
  const BreathingDashCard({super.key});

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BreathingProvider>();
    final colors = context.colors;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const BreathingScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: bp.isBreathing
                ? colors.accent.withValues(alpha: 0.4)
                : colors.borderSubtle,
          ),
          boxShadow: bp.isBreathing ? AppShadows.soft(colors.accent) : null,
        ),
        child: bp.isBreathing
            ? _activeBreathingRow(context, bp, colors)
            : _idleBreathingContent(context, bp, colors),
      ),
    );
  }

  Widget _idleBreathingContent(
      BuildContext context, BreathingProvider bp, AppColors colors) {
    if (bp.history.isNotEmpty) {
      final last = bp.history.first;
      final m = last.elapsed.inMinutes;
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
                    Text('Dernière respiration',
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontSize: 14)),
                    Text(
                        '${last.type.label} · ${m}min · $dateStr',
                        style: Theme.of(context)
                            .textTheme
                            .labelMedium
                            ?.copyWith(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              if (bp.currentStreak > 0)
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
                      Text('${bp.currentStreak}',
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
              Text('Nouvelle session',
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: colors.accent, fontSize: 13)),
              const Spacer(),
              Text('${bp.history.length} sessions',
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
              child: Text('🌬️', style: TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Respiration',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(color: colors.accent, fontSize: 14)),
              Text('WHM · Relaxation · Box · Cohérence',
                  style: Theme.of(context).textTheme.labelMedium),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 20),
      ],
    );
  }

  Widget _activeBreathingRow(
      BuildContext context, BreathingProvider bp, AppColors colors) {
    final session = bp.activeSession!;
    final m = bp.elapsed.inMinutes;
    final s = bp.elapsed.inSeconds.remainder(60);
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.accentMuted,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
              child: Text(session.type.emoji,
                  style: const TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${session.type.label} en cours',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
              Text('${m}m${s.toString().padLeft(2, '0')}s · ${bp.phaseLabel}',
                  style: TextStyle(color: colors.accent, fontSize: 12)),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 20),
      ],
    );
  }
}
