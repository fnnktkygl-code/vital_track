import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:vital_track/ui/theme.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            // Use a slightly transparent version of the scaffold background
            color: Theme.of(context)
                .scaffoldBackgroundColor
                .withValues(alpha: 0.94),
            border: Border(
              top: BorderSide(color: colors.border, width: 1),
            ),
          ),
          padding: const EdgeInsets.only(top: 12, bottom: 28),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(context, 0, "🌿", "Accueil", colors),
              _buildNavItem(context, 1, "🔍", "Chercher", colors),
              _buildNavItem(context, 2, "➕", "Ajouter", colors, accent: true),
              _buildNavItem(context, 3, "❤️", "Favoris", colors),
              _buildNavItem(context, 4, "📊", "Modes", colors),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
      BuildContext context,
      int index,
      String emoji,
      String label,
      AppColors colors, {
        bool accent = false,
      }) {
    final isSelected = currentIndex == index;
    final activeColor = colors.accent;
    final inactiveColor = colors.iconMuted;

    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: accent
            ? BoxDecoration(
          color: Color.alphaBlend(
            colors.accentMuted,
            Theme.of(context).scaffoldBackgroundColor,
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: colors.accent.withValues(alpha: 0.3),
          ),
        )
            : null,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              emoji,
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? (accent ? activeColor : activeColor)
                    : inactiveColor,
              ),
            ),
            // Active indicator dot (not on accent button)
            if (!accent)
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(top: 4),
                width: isSelected ? 4 : 0,
                height: isSelected ? 4 : 0,
                decoration: BoxDecoration(
                  color: activeColor,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}