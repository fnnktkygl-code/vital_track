import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/services/smart_insight_service.dart';
import 'package:vital_track/ui/theme.dart';

class SmartInsightCard extends StatefulWidget {
  final String modeId;
  final List<Food> mealItems;
  final int? mealScore;

  const SmartInsightCard({
    super.key,
    required this.modeId,
    required this.mealItems,
    required this.mealScore,
  });

  @override
  State<SmartInsightCard> createState() => _SmartInsightCardState();
}

class _SmartInsightCardState extends State<SmartInsightCard> {
  late SmartInsight _insight;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void didUpdateWidget(SmartInsightCard old) {
    super.didUpdateWidget(old);
    if (old.modeId != widget.modeId ||
        old.mealItems.length != widget.mealItems.length ||
        old.mealScore != widget.mealScore) {
      _refresh();
    }
  }

  void _refresh() {
    final fasting = Provider.of<FastingProvider>(context, listen: false);
    final breathing = Provider.of<BreathingProvider>(context, listen: false);
    _insight = SmartInsightService.getInsight(
      modeId: widget.modeId,
      mealItems: widget.mealItems,
      mealScore: widget.mealScore,
      isFasting: fasting.isFasting,
      fastingElapsed: fasting.elapsed,
      fastingStreak: fasting.currentStreak,
      isBreathing: breathing.isBreathing,
      breathingStreak: breathing.currentStreak,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final sourceColor = _categoryColor(colors);
    return GestureDetector(
      onTap: () => setState(_refresh),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: sourceColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: sourceColor.withValues(alpha: 0.18)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: sourceColor.withValues(alpha: 0.12),
                borderRadius: AppRadius.brMd,
              ),
              alignment: Alignment.center,
              child: Text(_insight.icon, style: const TextStyle(fontSize: 22)),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _insight.title,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontSize: 15,
                                color: colors.textPrimary,
                              ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm, vertical: 2),
                        decoration: BoxDecoration(
                          color: sourceColor.withValues(alpha: 0.12),
                          borderRadius: AppRadius.brSm,
                        ),
                        child: Text(
                          _insight.source,
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: colors.adaptForText(sourceColor)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    _insight.body,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontSize: 14,
                          color: colors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Icon(Icons.refresh_rounded,
                          size: 13, color: colors.textTertiary),
                      const SizedBox(width: 4),
                      Text(
                        "Appuyez pour un nouveau conseil",
                        style: Theme.of(context)
                            .textTheme
                            .labelSmall
                            ?.copyWith(color: colors.textTertiary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _categoryColor(AppColors colors) {
    switch (_insight.category) {
      case InsightCategory.fasting:
      case InsightCategory.encouragement:
      case InsightCategory.general:
        return colors.accent;
      case InsightCategory.scoreWarning:
      case InsightCategory.trophology:
        return colors.error;
      case InsightCategory.hydration:
      case InsightCategory.breathing:
        return colors.info;
      case InsightCategory.movement:
      case InsightCategory.mealSuggestion:
        return colors.movement;
      case InsightCategory.education:
        return colors.discovery;
      case InsightCategory.rest:
        return colors.rest;
    }
  }
}
