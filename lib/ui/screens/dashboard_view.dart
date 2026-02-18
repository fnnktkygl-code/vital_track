import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';
import 'package:vital_track/models/food.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<ModeProvider>(context);
    final mealProvider = Provider.of<MealProvider>(context);
    final mode = modeProvider.currentMode;
    final mealScore = mealProvider.mealScore?.toDouble() ?? 0;

    return Scaffold(
      floatingActionButton: _AddFab(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ProfileHeader(mode: mode),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: _WeekStrip(),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _VitalityArcCard(score: mealScore, mode: mode),
            ),
            const SizedBox(height: 16),
            if (mealProvider.mealItems.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _AxisDonutRow(items: mealProvider.mealItems),
              ),
            if (mealProvider.mealItems.isNotEmpty) const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _TrackedTodaySection(
                items: mealProvider.mealItems,
                mode: mode,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── FAB ──────────────────────────────────────────────────────────────────────
class _AddFab extends StatelessWidget {
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
          boxShadow: [
            BoxShadow(
              color: colors.accent.withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Icon(Icons.add_rounded, color: colors.accentOnPrimary, size: 28),
      ),
    );
  }
}

// ── PROFILE HEADER ────────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  final ProtocolMode mode;
  const _ProfileHeader({required this.mode});

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return "BONJOUR !";
    if (h < 18) return "BON APRÈS-MIDI !";
    return "BONSOIR !";
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final modeColor = mode.color;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 58, 20, 20),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: modeColor.withValues(alpha: 0.12),
              border: Border.all(color: modeColor.withValues(alpha: 0.4), width: 2),
            ),
            child: Center(
              child: Text(mode.icon,
                  style: const TextStyle(fontSize: 22)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting,
                  style: TextStyle(
                    fontFamily: 'SpaceMono',
                    fontSize: 9,
                    letterSpacing: 1.8,
                    color: colors.textTertiary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "Vitaliste ${mode.label}",
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 17, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── WEEK STRIP ────────────────────────────────────────────────────────────────
class _WeekStrip extends StatelessWidget {
  const _WeekStrip();

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
        return _DayCell(
            label: labels[i], dayNum: day.day, isToday: isToday, isPast: isPast);
      }),
    );
  }
}

class _DayCell extends StatelessWidget {
  final String label;
  final int dayNum;
  final bool isToday;
  final bool isPast;
  const _DayCell(
      {required this.label,
        required this.dayNum,
        required this.isToday,
        required this.isPast});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      children: [
        Text(label,
            style: TextStyle(
                fontFamily: 'SpaceMono',
                fontSize: 9,
                color: isToday ? colors.accent : colors.textTertiary,
                fontWeight: isToday ? FontWeight.bold : FontWeight.normal)),
        const SizedBox(height: 6),
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
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isToday ? colors.accent : colors.borderSubtle,
              width: isToday ? 0 : 1,
            ),
          ),
          child: Center(
            child: Text(
              '$dayNum',
              style: TextStyle(
                fontSize: 13,
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

// ── VITALITY ARC CARD ─────────────────────────────────────────────────────────
class _VitalityArcCard extends StatelessWidget {
  final double score;
  final ProtocolMode mode;
  const _VitalityArcCard({required this.score, required this.mode});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final modeColor = mode.color;
    final scoreColor = score >= 70
        ? colors.accent
        : score >= 40
        ? colors.accentSecondary
        : colors.error;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: colors.isDark
                ? Colors.black.withValues(alpha: 0.3)
                : Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Arc chart
          SizedBox(
            width: 100,
            height: 100,
            child: CustomPaint(
              painter: _ArcPainter(
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
                        fontFamily: 'SpaceMono',
                        fontSize: 8,
                        color: colors.textTertiary,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 20),
          // Info column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: modeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: modeColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        '${mode.icon}  ${mode.label}',
                        style: TextStyle(
                          fontSize: 10,
                          color: modeColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _StatRow(
                  label: 'Score du jour',
                  value: '${score.toInt()}/100',
                  color: scoreColor,
                  colors: colors,
                ),
                const SizedBox(height: 8),
                _StatRow(
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

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final AppColors colors;
  const _StatRow({
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
          style: TextStyle(fontSize: 12, color: colors.textTertiary)),
      Text(value,
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color)),
    ],
  );
}

class _ArcPainter extends CustomPainter {
  final double score;
  final Color color;
  final Color trackColor;
  const _ArcPainter({
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
        trackPaint);

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
        arcPaint);
  }

  @override
  bool shouldRepaint(_ArcPainter old) =>
      old.score != score || old.color != color;
}

// ── DONUT ROW ────────────────────────────────────────────────────────────────
class _AxisDonutRow extends StatelessWidget {
  final List<Food> items;
  const _AxisDonutRow({required this.items});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final approved = items.where((f) => f.approved).length;
    final total = items.length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _DonutStat(
            label: 'Approuvés',
            value: approved,
            total: total,
            color: colors.accent,
            colors: colors,
          ),
          Container(
              width: 1, height: 40, color: colors.border),
          _DonutStat(
            label: 'À éviter',
            value: total - approved,
            total: total,
            color: colors.error,
            colors: colors,
          ),
          Container(
              width: 1, height: 40, color: colors.border),
          _DonutStat(
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

class _DonutStat extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  final Color color;
  final AppColors colors;
  const _DonutStat({
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
          color: color,
        ),
      ),
      Text(
        label,
        style: TextStyle(fontSize: 11, color: colors.textTertiary),
      ),
    ],
  );
}

// ── TRACKED TODAY SECTION ────────────────────────────────────────────────────
class _TrackedTodaySection extends StatelessWidget {
  final List<Food> items;
  final ProtocolMode mode;
  const _TrackedTodaySection({required this.items, required this.mode});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("Repas du jour",
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            if (items.isNotEmpty)
              Text("${items.length} aliment${items.length > 1 ? 's' : ''}",
                  style: TextStyle(
                      color: context.colors.textTertiary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 12),
        if (items.isEmpty)
          _EmptyState()
        else ...[
          ...items.map((food) {
            return _FoodCard(food: food);
          }),
          _AddNextCard(),
        ],
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: colors.surfaceMuted,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: colors.borderSubtle),
      ),
      child: Column(
        children: [
          const Text("🌿", style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          Text("Aucun aliment enregistré",
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text("Appuyez sur + pour commencer",
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _FoodCard extends StatelessWidget {
  final Food food;
  const _FoodCard({required this.food});

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
        margin: const EdgeInsets.only(bottom: 10),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: colors.error,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: GestureDetector(
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => FoodModal(food: food),
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: c.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: c.withValues(alpha: 0.08),
                  borderRadius:
                  const BorderRadius.horizontal(left: Radius.circular(20)),
                ),
                child: Center(
                    child:
                    Text(food.emoji, style: const TextStyle(fontSize: 36))),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(food.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 14),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                          ),
                          Text(_fmt(food.addedAt),
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(fontSize: 10)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Wrap(
                        spacing: 5,
                        children: [
                          _Pill(food.scientific.label, food.scientific.color),
                          _Pill("NOVA ${food.vitality.nova}", food.vitality.color),
                          if (food.specific.electric)
                            _Pill("⚡ Électrique", colors.accentSecondary),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _MicroBar(value: food.vitality.freshness.toDouble(), color: c, colors: colors),
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

class _Pill extends StatelessWidget {
  final String label;
  final Color color;
  const _Pill(this.label, this.color);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Text(label,
        style: TextStyle(
            fontSize: 9, fontWeight: FontWeight.bold, color: color)),
  );
}

class _MicroBar extends StatelessWidget {
  final double value;
  final Color color;
  final AppColors colors;
  const _MicroBar({required this.value, required this.color, required this.colors});

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
            BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 4)
          ],
        ),
      ),
    ),
  );
}

class _AddNextCard extends StatelessWidget {
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border, style: BorderStyle.solid),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colors.accentMuted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: colors.accent.withValues(alpha: 0.25)),
              ),
              child: Icon(Icons.add_rounded, color: colors.accent, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Ajouter un aliment",
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: colors.accent)),
                  Text("Scanner · Rechercher · Décrire",
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontSize: 11)),
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