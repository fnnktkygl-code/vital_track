import 'package:flutter/material.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';

class AddFab extends StatelessWidget {
  const AddFab({super.key});

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
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: colors.accent,
          shape: BoxShape.circle,
          boxShadow: AppShadows.float(colors.accent),
        ),
        child: Icon(Icons.add_rounded, color: colors.accentOnPrimary, size: 28),
      ),
    );
  }
}

class ProfileHeader extends StatelessWidget {
  final ProtocolMode mode;
  final String userName;
  final VoidCallback? onOpenDrawer;

  const ProfileHeader({
    super.key,
    required this.mode,
    required this.userName,
    this.onOpenDrawer,
  });

  String get _greeting {
    final h = DateTime.now().hour;
    final name = userName.trim().isEmpty ? "l'ami" : userName;
    if (h < 5) return "Bonne nuit, $name";
    if (h < 12) return "Bonjour, $name";
    if (h < 18) return "Bon après-midi, $name";
    return "Bonsoir, $name";
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 56, AppSpacing.xl, AppSpacing.xl),
      child: Row(
        children: [
          GestureDetector(
            onTap: onOpenDrawer,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: colors.surfaceSubtle,
                shape: BoxShape.circle,
                border: Border.all(color: colors.borderSubtle, width: 1),
              ),
              child: Icon(Icons.menu_rounded, color: colors.icon, size: 24),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: colors.textPrimary,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  "Prêt(e) à optimiser ta journée ?",
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.textTertiary,
                        letterSpacing: 0.5,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class WeekStrip extends StatelessWidget {
  const WeekStrip({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    final days = List.generate(7, (i) => monday.add(Duration(days: i)));
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(7, (i) {
        final day = days[i];
        final isToday =
            day.day == now.day && day.month == now.month && day.year == now.year;
        final isPast = day.isBefore(DateTime(now.year, now.month, now.day));
        return DayCell(
            label: labels[i], dayNum: day.day, isToday: isToday, isPast: isPast);
      }),
    );
  }
}

class DayCell extends StatelessWidget {
  final String label;
  final int dayNum;
  final bool isToday;
  final bool isPast;

  const DayCell({
    super.key,
    required this.label,
    required this.dayNum,
    required this.isToday,
    required this.isPast,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: isToday ? colors.accent : colors.textTertiary,
                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: isToday
                ? colors.accent
                : isPast
                    ? colors.surfaceSubtle
                    : colors.surfaceMuted,
            borderRadius: AppRadius.brSm,
            border: Border.all(
              color: isToday ? colors.accent : colors.borderSubtle,
              width: isToday ? 0 : 1,
            ),
          ),
          child: Center(
            child: Text(
              '$dayNum',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                    color: isToday
                        ? colors.accentOnPrimary
                        : isPast
                            ? colors.textTertiary
                            : colors.textSecondary,
                  ),
            ),
          ),
        ),
      ],
    );
  }
}

class AxisDonutRow extends StatelessWidget {
  final List<Food> items;
  const AxisDonutRow({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final approved = items.where((f) => f.approved).length;
    final total = items.length;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: AppRadius.brXl,
        border: Border.all(color: colors.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          DonutStat(
            label: 'Approuvés',
            value: approved,
            total: total,
            color: colors.accent,
            colors: colors,
          ),
          Container(width: 1, height: 40, color: colors.border),
          DonutStat(
            label: 'À éviter',
            value: total - approved,
            total: total,
            color: colors.error,
            colors: colors,
          ),
          Container(width: 1, height: 40, color: colors.border),
          DonutStat(
            label: 'Total',
            value: total,
            total: total,
            color: colors.accentSecondary,
            colors: colors,
          ),
        ],
      ),
    );
  }
}

class DonutStat extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  final Color color;
  final AppColors colors;

  const DonutStat({
    super.key,
    required this.label,
    required this.value,
    required this.total,
    required this.color,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text(
            '$value',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: colors.adaptForText(color),
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: colors.textTertiary),
          ),
        ],
      );
}
