import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/providers/diet_plan_provider.dart';
import 'package:vital_track/ui/screens/diet_plan_builder_screen.dart';
import 'package:vital_track/ui/screens/diet_plan_calendar_screen.dart';
import 'package:vital_track/ui/theme.dart';

class DietPlanDashCard extends StatelessWidget {
  const DietPlanDashCard({super.key});

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DietPlanProvider>();
    final colors = context.colors;
    final plan = dp.activePlan;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => plan != null
              ? const DietPlanCalendarScreen()
              : const DietPlanBuilderScreen(),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: plan != null
                ? colors.accent.withValues(alpha: 0.4)
                : colors.borderSubtle,
          ),
          boxShadow: plan != null ? AppShadows.soft(colors.accent) : null,
        ),
        child: plan != null
            ? _activePlanRow(context, plan, colors)
            : _idleContent(context, colors),
      ),
    );
  }

  Widget _activePlanRow(
      BuildContext context, DietPlan plan, AppColors colors) {
    final today = plan.todayPlan;
    final dayLabel = today != null
        ? 'Jour ${today.dayIndex + 1}/${plan.totalDays} · ${today.phaseLabel}'
        : '${plan.totalDays} jours au total';
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.accentMuted,
            borderRadius: AppRadius.brMd,
          ),
          child: Center(
            child: Text(
              plan.protocol.dietProtocolEmoji,
              style: const TextStyle(fontSize: 20),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                plan.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontSize: 14),
              ),
              Text(
                dayLabel,
                style: Theme.of(context)
                    .textTheme
                    .labelMedium
                    ?.copyWith(fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          decoration: BoxDecoration(
            color: colors.accent.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '${(plan.progress * 100).round()}%',
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: colors.accent, fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _idleContent(BuildContext context, AppColors colors) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.accentMuted,
            borderRadius: AppRadius.brMd,
          ),
          child:
              const Center(child: Text('📅', style: TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Créer mon plan alimentaire',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(color: colors.accent, fontSize: 14),
              ),
              Text(
                'Ehret · Dr. Sebi · Dr. Morse · Personnalisé',
                style: Theme.of(context).textTheme.labelMedium,
              ),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded, color: colors.iconMuted, size: 20),
      ],
    );
  }
}
