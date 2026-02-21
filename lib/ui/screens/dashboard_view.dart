import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/mode_provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/add_meal_sheet.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/ui/widgets/circadian_clock_card.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/ui/screens/fasting_screen.dart';
import 'package:vital_track/services/smart_insight_service.dart';
import 'package:vital_track/providers/breathing_provider.dart';
import 'package:vital_track/models/breathing_session.dart';
import 'package:vital_track/ui/screens/breathing_screen.dart';


class DashboardView extends StatelessWidget {
  final VoidCallback? onOpenDrawer;
  const DashboardView({super.key, this.onOpenDrawer});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<ModeProvider>(context);
    final mealProvider = Provider.of<MealProvider>(context);
    final profileProvider = Provider.of<ProfileProvider>(context);
    final mode = modeProvider.currentMode;
    final mealScore = mealProvider.mealScore?.toDouble() ?? 0;
    final colors = context.colors;

    return Scaffold(
      floatingActionButton: _AddFab(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ProfileHeader(mode: mode, userName: profileProvider.profile.name, onOpenDrawer: onOpenDrawer),
            const Padding(
              padding: AppSpacing.screenH,
              child: _WeekStrip(),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
              child: _VitalityArcCard(score: mealScore, mode: mode),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Padding(
              padding: AppSpacing.screenH,
              child: _FastingDashCard(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Padding(
              padding: AppSpacing.screenH,
              child: _BreathingDashCard(),
            ),
            const SizedBox(height: AppSpacing.lg),
            Padding(
              padding: AppSpacing.screenH,
              child: _SmartInsightCard(
                modeId: mode.id,
                mealItems: mealProvider.mealItems,
                mealScore: mealProvider.mealScore,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (mealProvider.mealItems.isNotEmpty)
              Padding(
                padding: AppSpacing.screenH,
                child: _AxisDonutRow(items: mealProvider.mealItems),
              ),
            if (mealProvider.mealItems.isNotEmpty) const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
              child: CircadianClockCard(colors: colors),
            ),
            const SizedBox(height: AppSpacing.xl),
            Padding(
              padding: AppSpacing.screenH,
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
          boxShadow: AppShadows.float(colors.accent),
        ),
        child: Icon(Icons.add_rounded, color: colors.accentOnPrimary, size: 28),
      ),
    );
  }
}

// ── PROFILE HEADER ────────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  final ProtocolMode mode;
  final String userName;
  final VoidCallback? onOpenDrawer;
  const _ProfileHeader({required this.mode, required this.userName, this.onOpenDrawer});

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
                      fontSize: 20, fontWeight: FontWeight.bold, color: colors.textPrimary),
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
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: isToday ? colors.accent : colors.textTertiary,
                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500)),
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

// ── VITALITY ARC CARD ─────────────────────────────────────────────────────────
class _VitalityArcCard extends StatelessWidget {
  final double score;
  final ProtocolMode mode;
  const _VitalityArcCard({required this.score, required this.mode});

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
          // Info column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: modeColor.withValues(alpha: 0.12),
                        borderRadius: AppRadius.brSm,
                        border: Border.all(color: modeColor.withValues(alpha: 0.3)),
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
                _StatRow(
                  label: 'Score du jour',
                  value: '${score.toInt()}/100',
                  color: scoreColor,
                  colors: colors,
                ),
                const SizedBox(height: AppSpacing.sm),
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
          style: Theme.of(context).textTheme.labelMedium?.copyWith(color: colors.textTertiary)),
      Text(value,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colors.adaptForText(color))),
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
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: AppRadius.brXl,
        border: Border.all(color: colors.borderSubtle),
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
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
            if (items.isNotEmpty)
              Text("${items.length} aliment${items.length > 1 ? 's' : ''}",
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: context.colors.textTertiary)),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
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
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: AppSpacing.xl),
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
                  borderRadius:
                  const BorderRadius.horizontal(left: Radius.circular(AppRadius.lg)),
                ),
                child: Center(
                    child:
                    Text(food.emoji, style: const TextStyle(fontSize: 36))),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, AppSpacing.md, 14, AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(food.name,
                                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 15),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                          ),
                          Text(_fmt(food.addedAt),
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Wrap(
                        spacing: AppSpacing.xs,
                        children: [
                          _Pill(food.scientific.label, food.scientific.color),
                          _Pill("NOVA ${food.vitality.nova}", food.vitality.color),
                          if (food.specific.electric)
                            _Pill("⚡ Électrique", colors.accentSecondary),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
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
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: AppRadius.brSm,
    ),
    child: Text(label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: context.colors.adaptForText(color))),
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
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 14),
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.borderSubtle, style: BorderStyle.solid),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colors.accentMuted,
                borderRadius: AppRadius.brMd,
                border: Border.all(color: colors.accent.withValues(alpha: 0.25)),
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

// ── FASTING DASHBOARD CARD ───────────────────────────────────────────────────

class _FastingDashCard extends StatelessWidget {
  const _FastingDashCard();

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
          boxShadow: fp.isFasting
              ? AppShadows.soft(colors.accent)
              : null,
        ),
        child: fp.isFasting
            ? _activeFastRow(context, fp, colors)
            : _idleContent(context, fp, colors),
      ),
    );
  }

  Widget _idleContent(BuildContext context, FastingProvider fp, AppColors colors) {
    // Has history → show last fast + streak
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
          // Header row
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
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 14)),
                    Text(
                        '${last.type.label} • ${h}h${m > 0 ? '${m}min' : ''} • $dateStr',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              if (fp.currentStreak > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
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
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: colors.accent,
                              fontSize: 13)),
                    ],
                  ),
                ),
            ],
          ),
          // CTA row
          Row(
            children: [
              Icon(Icons.add_circle_outline_rounded,
                  color: colors.accent, size: 16),
              const SizedBox(width: 6),
              Text('Nouveau jeûne',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: colors.accent,
                      fontSize: 13)),
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

    // No history → simple CTA
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
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colors.accent,
                      fontSize: 14)),
              Text('Hydrique · Fruits · Raisin · Intermittent',
                  style: Theme.of(context).textTheme.labelMedium),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded,
            color: colors.iconMuted, size: 20),
      ],
    );
  }

  Widget _activeFastRow(BuildContext context, FastingProvider fp, AppColors colors) {
    final fast = fp.activeFast!;
    final h = fp.elapsed.inHours;
    final m = fp.elapsed.inMinutes.remainder(60);
    return Row(
      children: [
        // Mini ring
        SizedBox(
          width: 42,
          height: 42,
          child: CustomPaint(
            painter: _MiniRingPainter(
              progress: fp.progress,
              bgColor: colors.surfaceSubtle,
              fgColor: colors.accent,
            ),
            child: Center(
                child: Text(fast.type.emoji,
                    style: const TextStyle(fontSize: 16))),
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
        Icon(Icons.chevron_right_rounded,
            color: colors.iconMuted, size: 20),
      ],
    );
  }
}

class _MiniRingPainter extends CustomPainter {
  final double progress;
  final Color bgColor;
  final Color fgColor;

  _MiniRingPainter({
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
  bool shouldRepaint(_MiniRingPainter old) =>
      old.progress != progress || old.fgColor != fgColor;
}

// ── BREATHING DASH CARD ──────────────────────────────────────────────────────

class _BreathingDashCard extends StatelessWidget {
  const _BreathingDashCard();

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
          boxShadow: bp.isBreathing
              ? AppShadows.soft(colors.accent)
              : null,
        ),
        child: bp.isBreathing
            ? _activeBreathingRow(context, bp, colors)
            : _idleBreathingContent(context, bp, colors),
      ),
    );
  }

  Widget _idleBreathingContent(BuildContext context, BreathingProvider bp, AppColors colors) {
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
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontSize: 14)),
                    Text(
                        '${last.type.label} · ${m}min · $dateStr',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              if (bp.currentStreak > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
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
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: colors.accent,
                              fontSize: 13)),
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
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: colors.accent,
                      fontSize: 13)),
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

    // No history
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
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colors.accent,
                      fontSize: 14)),
              Text('WHM · Relaxation · Box · Cohérence',
                  style: Theme.of(context).textTheme.labelMedium),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded,
            color: colors.iconMuted, size: 20),
      ],
    );
  }

  Widget _activeBreathingRow(BuildContext context, BreathingProvider bp, AppColors colors) {
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
              Text(
                  '${m}m${s.toString().padLeft(2, '0')}s · ${bp.phaseLabel}',
                  style: TextStyle(color: colors.accent, fontSize: 12)),
            ],
          ),
        ),
        Icon(Icons.chevron_right_rounded,
            color: colors.iconMuted, size: 20),
      ],
    );
  }
}

// ── SMART INSIGHT CARD ───────────────────────────────────────────────────────
class _SmartInsightCard extends StatefulWidget {
  final String modeId;
  final List<Food> mealItems;
  final int? mealScore;

  const _SmartInsightCard({
    required this.modeId,
    required this.mealItems,
    required this.mealScore,
  });

  @override
  State<_SmartInsightCard> createState() => _SmartInsightCardState();
}

class _SmartInsightCardState extends State<_SmartInsightCard> {
  late SmartInsight _insight;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void didUpdateWidget(_SmartInsightCard old) {
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
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
                        decoration: BoxDecoration(
                          color: sourceColor.withValues(alpha: 0.12),
                          borderRadius: AppRadius.brSm,
                        ),
                        child: Text(
                          _insight.source,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: colors.adaptForText(sourceColor)),
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
                      Icon(Icons.refresh_rounded, size: 13, color: colors.textTertiary),
                      const SizedBox(width: 4),
                      Text(
                        "Appuyez pour un nouveau conseil",
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: colors.textTertiary),
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