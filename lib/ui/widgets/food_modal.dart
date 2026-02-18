import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/score_bar.dart';
import 'package:vital_track/ui/widgets/pulse_ring.dart';

class FoodModal extends StatefulWidget {
  final Food food;

  const FoodModal({super.key, required this.food});

  @override
  State<FoodModal> createState() => _FoodModalState();
}

class _FoodModalState extends State<FoodModal> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final food = widget.food;
    final mealProvider = Provider.of<MealProvider>(context, listen: false);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15), width: 1)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 20),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: food.approved ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.3) : Theme.of(context).colorScheme.error.withValues(alpha: 0.3),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(food.emoji, style: const TextStyle(fontSize: 40)),
                    ),
                    PulseRing(
                      color: food.approved ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.error,
                      size: 80,
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(food.name, style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 22)),
                      const SizedBox(height: 2),
                      Text("${food.family} · ${food.origin}", style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.7))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: food.tags.map((t) => _buildTag(t)).toList(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Tab Bar
          TabBar(
            controller: _tabController,
            dividerColor: Colors.transparent,
            indicatorColor: Theme.of(context).colorScheme.primary,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: Theme.of(context).iconTheme.color,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: const [
              Tab(text: "Scientifique"),
              Tab(text: "Vitalité"),
              Tab(text: "Vitalisme"),
            ],
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAxisContent(
                  icon: "🔬",
                  title: "Axe Scientifique (PRAL)",
                  subtitle: "Données CIQUAL / USDA validées",
                  badge: food.scientific.label,
                  badgeColor: food.scientific.color,
                  items: [
                    _buildDataItem("Indice PRAL", "${food.scientific.pral > 0 ? "+" : ""}${food.scientific.pral} mEq/j", null, food.scientific.color),
                    _buildDataItem("Densité nutritionnelle", "${food.scientific.density}/100", food.scientific.density.toDouble(), food.scientific.color),
                  ],
                  note: "Mesure l'effet sur la charge acide rénale. Valeur négative = alcalinisant.",
                ),
                _buildAxisContent(
                  icon: "🌱",
                  title: "Axe Vitalité (NOVA)",
                  subtitle: "Niveau de transformation",
                  badge: food.vitality.label,
                  badgeColor: food.vitality.color,
                  items: [
                    _buildDataItem("Classe NOVA", "${food.vitality.nova} / 4", (5 - food.vitality.nova) * 25.0, food.vitality.color),
                    _buildDataItem("Potentiel vital", "${food.vitality.freshness}%", food.vitality.freshness.toDouble(), food.vitality.color),
                  ],
                  note: "NOVA 1 = aliment brut non transformé. Plus la valeur est basse, plus l'aliment est vivant.",
                ),
                _buildAxisContent(
                  icon: "⚡",
                  title: "Approche Vitaliste",
                  subtitle: "Selon Dr. Sebi / Ehret / Morse",
                  badge: food.specific.label,
                  badgeColor: food.specific.color,
                  items: [
                    _buildDataItem(
                      "Statut hybride",
                      food.specific.hybrid ? "Hybride ✗" : "Natif ✓",
                      null,
                      food.specific.hybrid ? Theme.of(context).colorScheme.error : Theme.of(context).colorScheme.primary,
                    ),
                    _buildDataItem(
                      "Potentiel mucogène",
                      food.specific.mucus,
                      null,
                      food.specific.mucus == "Dissolvant" ? Theme.of(context).colorScheme.primary : (food.specific.mucus == "Neutre" ? Theme.of(context).colorScheme.secondaryContainer : Colors.orange),
                    ),
                    _buildDataItem(
                      "Charge électrique",
                      food.specific.electric ? "Élevée ⚡" : "Nulle —",
                      null,
                      food.specific.electric ? Theme.of(context).colorScheme.secondary : Colors.grey,
                    ),
                  ],
                  warning: "⚠️ Théories non validées par consensus scientifique. Présentées comme grilles de lecture alternatives.",
                ),
              ],
            ),
          ),

          // Context Note
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Contextualisation", style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 4),
                  Text(food.note, style: TextStyle(fontSize: 13, height: 1.5, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
                ],
              ),
            ),
          ),

          // Add Button
          Padding(
            padding: const EdgeInsets.all(24),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final exists = mealProvider.mealItems.any((f) => f.name.toLowerCase() == food.name.toLowerCase());
                  
                  if (exists) {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: Theme.of(context).cardTheme.color,
                        title: Text("Déjà ajouté", style: Theme.of(context).textTheme.titleLarge),
                        content: Text("${food.name} est déjà dans votre repas. Voulez-vous l'ajouter à nouveau ?", style: Theme.of(context).textTheme.bodyMedium),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text("Annuler"),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pop(ctx); // Close dialog
                              _addToMeal(context, mealProvider, food);
                            },
                            child: const Text("Ajouter quand même"),
                          ),
                        ],
                      ),
                    );
                  } else {
                    _addToMeal(context, mealProvider, food);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                  foregroundColor: Theme.of(context).colorScheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: Theme.of(context).colorScheme.primary),
                  ),
                ),
                child: const Text("AJOUTER AU REPAS", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _addToMeal(BuildContext context, MealProvider provider, Food food) {
    final combo = provider.checkCombos(food);
    provider.addFood(food);
    Navigator.pop(context); // Close modal when invoked from dialog
    // Note: If invoked directly, we might pop twice? 
    // Wait, the dialog pops itself. 
    // In the direct case: Navigator.pop(context) closes the modal.
    // In the dialog case: Navigator.pop(ctx) closes dialog, then we call this which closes modal.
    // So single pop here is correct for closing the FoodModal.

    ScaffoldMessenger.of(context).clearSnackBars(); 
    if (combo != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Theme.of(context).colorScheme.error.withValues(alpha: 0.9),
          content: Text("⚠️ Vérifiez la trophologie : ${combo['reason']} (${combo['a']} + ${combo['b']})"),
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.9),
          content: Text("${food.emoji} Ajouté au repas"),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Widget _buildTag(String text) {
    Color color = Theme.of(context).colorScheme.secondaryContainer;
    if (text.contains("✓")) color = Theme.of(context).colorScheme.primary;
    if (text.contains("✗")) color = Theme.of(context).colorScheme.error;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, color: color, fontFamily: 'SpaceMono'),
      ),
    );
  }

  Widget _buildAxisContent({
    required String icon,
    required String title,
    required String subtitle,
    required String badge,
    required Color badgeColor,
    required List<Widget> items,
    String? note,
    String? warning,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("$icon $title", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
                ),
                child: Text(badge, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: badgeColor)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...items,
          if (note != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).colorScheme.secondary.withValues(alpha: 0.15)),
              ),
              child: Row(
                children: [
                  const Text("💡", style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Expanded(child: Text(note, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.secondary))),
                ],
              ),
            ),
          ],
          if (warning != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondaryContainer.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).colorScheme.secondaryContainer.withValues(alpha: 0.15)),
              ),
              child: Text(warning, style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.secondaryContainer)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDataItem(String label, String value, double? barValue, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
              Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color, fontFamily: 'SpaceMono')),
            ],
          ),
          if (barValue != null) ...[
            const SizedBox(height: 8),
            ScoreBar(value: barValue, color: color),
          ],
        ],
      ),
    );
  }
}
