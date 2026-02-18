import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/favorites_provider.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/ui/theme.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final favorites = context.watch<FavoritesProvider>().favorites;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Mes Favoris"),
      ),
      body: favorites.isEmpty
          ? _buildEmptyState(colors)
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: favorites.length,
              itemBuilder: (ctx, i) {
                final food = favorites[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildFavoriteCard(context, food, colors),
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(AppColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text("❤️", style: TextStyle(fontSize: 48)),
          const SizedBox(height: 16),
          Text(
            "Aucun favori pour l'instant",
            style: TextStyle(color: colors.textSecondary, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            "Ajoutez vos aliments préférés ici\npour les retrouver rapidement.",
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.textTertiary),
          ),
        ],
      ),
    );
  }

  Widget _buildFavoriteCard(BuildContext context, dynamic food, AppColors colors) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: colors.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Text(food.emoji, style: const TextStyle(fontSize: 28)),
        title: Text(food.name,
            style: TextStyle(
                color: colors.textPrimary, fontWeight: FontWeight.bold)),
        subtitle: Text(food.family, style: TextStyle(color: colors.textTertiary)),
        trailing: Icon(Icons.chevron_right, color: colors.iconMuted),
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => FoodModal(food: food),
          );
        },
      ),
    );
  }
}
