import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/providers/diet_plan_provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/services/vital_rules_engine.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/ui/screens/diet_plan_builder_screen.dart';
import 'package:vital_track/ui/theme.dart';

/// The diet plan calendar: shows the active plan day by day, lets the user
/// tick meals off, edit food items, regenerate a day, and push the day's
/// foods straight into the daily food tracker.
///
/// Can also be opened in "preview" mode with a plan that hasn't been
/// activated yet (e.g. proposed by the chat mascot), showing an
/// "Activer" banner before it becomes the live plan.
class DietPlanCalendarScreen extends StatefulWidget {
  final DietPlan? previewPlan;
  const DietPlanCalendarScreen({super.key, this.previewPlan});

  @override
  State<DietPlanCalendarScreen> createState() => _DietPlanCalendarScreenState();
}

class _DietPlanCalendarScreenState extends State<DietPlanCalendarScreen> {
  DietPlan? _previewPlan;
  int _selectedIndex = 0;
  bool _activating = false;

  @override
  void initState() {
    super.initState();
    _previewPlan = widget.previewPlan;
    if (_previewPlan == null) {
      final active = context.read<DietPlanProvider>().activePlan;
      if (active != null) {
        final idx = active.days.indexWhere((d) => d.isToday);
        _selectedIndex = idx == -1 ? 0 : idx;
      }
    }
  }

  String _formatDate(DateTime d) {
    const months = [
      'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
      'juil', 'août', 'sep', 'oct', 'nov', 'déc',
    ];
    return '${d.day} ${months[d.month - 1]}';
  }

  Future<void> _addDayToMealList(DietDay day) async {
    final mealProvider = context.read<MealProvider>();
    final names = <String>{};
    for (final m in day.meals) {
      names.addAll(m.items);
    }
    for (final n in names) {
      final food = VitalRulesEngine.getExpertFood(n) ?? FoodMapper.fromNameFallback(n);
      mealProvider.addFood(food);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${names.length} aliments ajoutés à ton suivi du jour 🌿'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _renamePlan(DietPlan plan) async {
    final ctrl = TextEditingController(text: plan.name);
    final colors = context.colors;
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        title: Text('Renommer le plan', style: TextStyle(color: colors.textPrimary)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          style: TextStyle(color: colors.textPrimary),
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    if (result != null && result.isNotEmpty && mounted) {
      await context.read<DietPlanProvider>().renameActivePlan(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DietPlanProvider>();
    final plan = _previewPlan ?? provider.activePlan;
    final colors = context.colors;

    if (plan == null) return _buildEmptyState(context);

    final isPreview = _previewPlan != null;
    final safeIndex = _selectedIndex.clamp(0, plan.days.length - 1);
    final day = plan.days[safeIndex];

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: Text(plan.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (!isPreview)
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: colors.icon),
              onSelected: (v) async {
                if (v == 'rename') {
                  await _renamePlan(plan);
                  return;
                }
                if (v == 'end') {
                  final provider = context.read<DietPlanProvider>();
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: colors.surface,
                      title: const Text('Arrêter ce plan ?'),
                      content: const Text(
                          'Il passera dans ton historique. Tu pourras en créer un nouveau à tout moment.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
                        ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Arrêter')),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await provider.endActivePlan();
                  }
                }
              },
              itemBuilder: (ctx) => const [
                PopupMenuItem(value: 'rename', child: Text('Renommer')),
                PopupMenuItem(value: 'end', child: Text('Arrêter ce plan')),
              ],
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (isPreview) _buildPreviewBanner(context, plan),
            _buildDayStrip(context, plan),
            Expanded(child: _buildDayDetail(context, plan, day, isPreview)),
          ],
        ),
      ),
      floatingActionButton: (!isPreview && day.isToday)
          ? FloatingActionButton.extended(
              onPressed: () => _addDayToMealList(day),
              backgroundColor: colors.accent,
              foregroundColor: colors.accentOnPrimary,
              icon: const Icon(Icons.restaurant_menu_rounded),
              label: const Text('Ajouter au suivi du jour'),
            )
          : null,
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(title: const Text('Plan alimentaire')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('📅', style: TextStyle(fontSize: 56)),
              const SizedBox(height: 16),
              Text(
                'Pas encore de plan actif',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700, color: colors.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                "Réponds à quelques questions et je remplis ton calendrier — Ehret, Dr. Sebi, Dr. Morse ou un plan personnalisé.",
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DietPlanBuilderScreen()),
                ),
                icon: const Icon(Icons.auto_awesome_rounded),
                label: const Text('Créer mon plan'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.accent,
                  foregroundColor: colors.accentOnPrimary,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreviewBanner(BuildContext context, DietPlan plan) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: colors.accent.withValues(alpha: 0.12),
      child: Row(
        children: [
          Icon(Icons.visibility_outlined, color: colors.accent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Aperçu — pas encore activé',
              style: TextStyle(color: colors.accent, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
          ElevatedButton(
            onPressed: _activating
                ? null
                : () async {
                    setState(() => _activating = true);
                    await context.read<DietPlanProvider>().activatePlan(plan);
                    if (!mounted) return;
                    setState(() {
                      _previewPlan = null;
                      _activating = false;
                    });
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.accent,
              foregroundColor: colors.accentOnPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: _activating
                ? SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: colors.accentOnPrimary),
                  )
                : const Text('Activer'),
          ),
        ],
      ),
    );
  }

  Widget _buildDayStrip(BuildContext context, DietPlan plan) {
    final colors = context.colors;
    return SizedBox(
      height: 74,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        itemCount: plan.days.length,
        itemBuilder: (ctx, i) {
          final d = plan.days[i];
          final selected = i == _selectedIndex;
          return GestureDetector(
            onTap: () => setState(() => _selectedIndex = i),
            child: Container(
              width: 56,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: selected ? colors.accent : colors.surfaceSubtle,
                borderRadius: BorderRadius.circular(16),
                border: (d.isToday && !selected)
                    ? Border.all(color: colors.accent, width: 1.5)
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'J${d.dayIndex + 1}',
                    style: TextStyle(
                      color: selected ? colors.accentOnPrimary : colors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Icon(
                    d.isComplete ? Icons.check_circle : Icons.circle_outlined,
                    size: 14,
                    color: selected
                        ? colors.accentOnPrimary.withValues(alpha: 0.85)
                        : (d.isComplete ? colors.accent : colors.textTertiary),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDayDetail(BuildContext context, DietPlan plan, DietDay day, bool isPreview) {
    final colors = context.colors;
    final provider = context.read<DietPlanProvider>();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        Text(
          day.phaseLabel,
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: colors.textPrimary),
        ),
        const SizedBox(height: 2),
        Text(_formatDate(day.date), style: TextStyle(color: colors.textTertiary, fontSize: 13)),
        const SizedBox(height: 16),
        ...day.meals.map((meal) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _MealCard(
                meal: meal,
                editable: !isPreview,
                onToggleDone: isPreview ? null : () => provider.toggleMealDone(meal),
                onAddItem: isPreview ? null : (item) => provider.addItemToMeal(meal, item),
                onRemoveItem: isPreview ? null : (item) => provider.removeItemFromMeal(meal, item),
              ),
            )),
        if (!isPreview) ...[
          const SizedBox(height: 4),
          OutlinedButton.icon(
            onPressed: () => provider.regenerateDay(day),
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Régénérer les suggestions du jour'),
            style: OutlinedButton.styleFrom(
              foregroundColor: colors.accent,
              side: BorderSide(color: colors.accent.withValues(alpha: 0.4)),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ],
    );
  }
}

// ── EDITABLE MEAL CARD ───────────────────────────────────────────────────────

class _MealCard extends StatefulWidget {
  final PlannedMeal meal;
  final bool editable;
  final VoidCallback? onToggleDone;
  final void Function(String)? onAddItem;
  final void Function(String)? onRemoveItem;

  const _MealCard({
    required this.meal,
    required this.editable,
    this.onToggleDone,
    this.onAddItem,
    this.onRemoveItem,
  });

  @override
  State<_MealCard> createState() => _MealCardState();
}

class _MealCardState extends State<_MealCard> {
  bool _adding = false;
  final _addCtrl = TextEditingController();

  @override
  void dispose() {
    _addCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final meal = widget.meal;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceRaised,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  meal.slot,
                  style: TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15, color: colors.textPrimary),
                ),
              ),
              if (widget.onToggleDone != null)
                GestureDetector(
                  onTap: widget.onToggleDone,
                  child: Icon(
                    meal.done ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: meal.done ? colors.accent : colors.iconMuted,
                    size: 22,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ...meal.items.map((item) => Chip(
                    label: Text(item, style: TextStyle(fontSize: 12.5, color: colors.textPrimary)),
                    backgroundColor: colors.surfaceSubtle,
                    deleteIcon: widget.editable
                        ? Icon(Icons.close, size: 14, color: colors.iconMuted)
                        : null,
                    onDeleted: widget.editable
                        ? () => widget.onRemoveItem?.call(item)
                        : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(color: colors.border),
                    ),
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  )),
              if (widget.editable)
                GestureDetector(
                  onTap: () => setState(() => _adding = !_adding),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: colors.accentSubtle,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.add_rounded, size: 16, color: colors.accent),
                  ),
                ),
            ],
          ),
          if (_adding)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: TextField(
                controller: _addCtrl,
                autofocus: true,
                style: TextStyle(color: colors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Ajouter un aliment...',
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onSubmitted: (v) {
                  widget.onAddItem?.call(v);
                  _addCtrl.clear();
                  setState(() => _adding = false);
                },
              ),
            ),
          if (meal.note.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                meal.note,
                style: TextStyle(
                  color: colors.textTertiary,
                  fontSize: 12,
                  height: 1.4,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
