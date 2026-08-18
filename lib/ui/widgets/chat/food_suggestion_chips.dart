import 'package:flutter/material.dart';
import 'package:vital_track/ui/theme.dart';

class FoodSuggestionChips extends StatefulWidget {
  final List<String> foods;
  final Future<bool> Function(String)? onAdd;

  const FoodSuggestionChips({super.key, required this.foods, this.onAdd});

  @override
  State<FoodSuggestionChips> createState() => _FoodSuggestionChipsState();
}

class _FoodSuggestionChipsState extends State<FoodSuggestionChips> {
  final Set<String> _added = {};
  String? _loading;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ajouter à ta liste du jour ?',
          style: TextStyle(
            color: colors.textTertiary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: widget.foods.map((food) {
            final isAdded = _added.contains(food);
            final isLoading = _loading == food;
            return GestureDetector(
              onTap: isAdded || isLoading
                  ? null
                  : () async {
                      setState(() => _loading = food);
                      final ok = await widget.onAdd?.call(food) ?? false;
                      if (!mounted) return;
                      setState(() {
                        _loading = null;
                        if (ok) _added.add(food);
                      });
                    },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isAdded
                      ? colors.accent.withValues(alpha: 0.15)
                      : colors.accentSubtle,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isAdded
                      ? colors.accent.withValues(alpha: 0.4)
                      : colors.sheetBorder,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(food,
                        style: TextStyle(
                          color:
                              isAdded ? colors.accent : colors.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        )),
                    const SizedBox(width: 6),
                    if (isLoading)
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                            strokeWidth: 1.5, color: colors.accent),
                      )
                    else
                      Icon(
                        isAdded ? Icons.check_rounded : Icons.add_rounded,
                        size: 15,
                        color: isAdded ? colors.accent : colors.textTertiary,
                      ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
