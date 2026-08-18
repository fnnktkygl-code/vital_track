import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';

class TrackedTodaySection extends StatelessWidget {
  final List<Food> items;
  final ProtocolMode mode;
  const TrackedTodaySection({super.key, required this.items, required this.mode});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("Repas du jour",
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
            if (items.isNotEmpty)
              Text("${items.length} aliment${items.length > 1 ? 's' : ''}",
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: context.colors.textTertiary)),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        if (items.isEmpty)
          const EmptyMealState()
        else ...[
          ...items.map((food) => DashboardFoodCard(food: food)),
          const AddNextFoodCard(),
        ],
      ],
    );
  }
}

class EmptyMealState extends StatelessWidget {
  const EmptyMealState({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
          vertical: 36, horizontal: AppSpacing.xl),
      decoration: BoxDecoration(
        color: colors.surfaceMuted,
        borderRadius: AppRadius.brXl,
        border: Border.all(color: colors.borderSubtle),
      ),
      child: Column(
        children: [
          const Text("🌿", style: TextStyle(fontSize: 40)),
          const SizedBox(height: AppSpacing.md),
          Text("Prêt à nourrir votre corps aujourd'hui ?",
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpacing.xs),
          Text("Appuyez sur + pour ajouter un repas",
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class DashboardFoodCard extends StatelessWidget {
  final Food food;
  const DashboardFoodCard({super.key, required this.food});

  String _fmt(DateTime dt) =>
      "${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final c = food.approved ? colors.accent : colors.error;
    return Dismissible(
      key: Key(food.id + food.addedAt.toIso8601String()),
      direction: DismissDirection.endToStart,
      onDismissed: (_) {
        context.read<MealProvider>().removeFood(food);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("${food.name} supprimé")),
        );
      },
      background: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        decoration: BoxDecoration(
          color: colors.error,
          borderRadius: AppRadius.brLg,
        ),
        child: Icon(Icons.delete, color: Theme.of(context).colorScheme.onError),
      ),
      child: GestureDetector(
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => FoodModal(food: food),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.md),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: AppRadius.brLg,
            border: Border.all(color: c.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: c.withValues(alpha: 0.08),
                  borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(AppRadius.lg)),
                ),
                child: Center(
                    child:
                        Text(food.emoji, style: const TextStyle(fontSize: 36))),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                      14, AppSpacing.md, 14, AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(food.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(fontSize: 15),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                          ),
                          Text(_fmt(food.addedAt),
                              style: Theme.of(context).textTheme.labelSmall),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Wrap(
                        spacing: AppSpacing.xs,
                        children: [
                          FoodPill(food.scientific.label, food.scientific.color),
                          FoodPill(
                              "NOVA ${food.vitality.nova}", food.vitality.color),
                          if (food.specific.electric)
                            FoodPill("⚡ Électrique", colors.accentSecondary),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      FoodMicroBar(
                          value: food.vitality.freshness.toDouble(),
                          color: c,
                          colors: colors),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class FoodPill extends StatelessWidget {
  final String label;
  final Color color;
  const FoodPill(this.label, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: AppRadius.brSm,
        ),
        child: Text(label,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: context.colors.adaptForText(color))),
      );
}

class FoodMicroBar extends StatelessWidget {
  final double value;
  final Color color;
  final AppColors colors;
  const FoodMicroBar({
    super.key,
    required this.value,
    required this.color,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) => Container(
        height: 3,
        decoration: BoxDecoration(
            color: colors.surfaceSubtle,
            borderRadius: BorderRadius.circular(2)),
        child: FractionallySizedBox(
          widthFactor: (value / 100).clamp(0, 1),
          alignment: Alignment.centerLeft,
          child: Container(
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
              boxShadow: [
                BoxShadow(
                    color: color.withValues(alpha: 0.4), blurRadius: 4)
              ],
            ),
          ),
        ),
      );
}

class AddNextFoodCard extends StatelessWidget {
  const AddNextFoodCard({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const AddMealSheet(),
      ),
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 14),
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: BorderRadius.circular(18),
          border:
              Border.all(color: colors.borderSubtle, style: BorderStyle.solid),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colors.accentMuted,
                borderRadius: AppRadius.brMd,
                border:
                    Border.all(color: colors.accent.withValues(alpha: 0.25)),
              ),
              child: Icon(Icons.add_rounded, color: colors.accent, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Ajouter un aliment",
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontSize: 14,
                          color: colors.accent)),
                  Text("Scanner · Rechercher · Décrire",
                      style: Theme.of(context).textTheme.labelSmall),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: colors.iconMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
