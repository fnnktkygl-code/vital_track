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
            color: Theme.of(context)
                .scaffoldBackgroundColor
                .withValues(alpha: 0.94),
          ),
          padding: const EdgeInsets.only(top: 12, bottom: 32),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(context, 0, "🌿", "Accueil", colors),
              _buildNavItem(context, 1, Icons.add_rounded, "Ajouter", colors, accent: true),
              _buildNavItem(context, 2, "🔍", "Chercher", colors),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
      BuildContext context,
      int index,
      dynamic iconSource,
      String label,
      AppColors colors, {
        bool accent = false,
      }) {
    final isSelected = currentIndex == index;
    final activeColor = colors.accent;
    final inactiveColor = colors.iconMuted;
    final contentColor = accent ? colors.accent : (isSelected ? activeColor : inactiveColor);

    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
            if (iconSource is String)
              Text(
                iconSource,
                style: const TextStyle(fontSize: 20),
              )
            else if (iconSource is IconData)
              Icon(
                iconSource,
                size: 24,
                color: contentColor,
              ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: contentColor,
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