import 'package:flutter/material.dart';

class ScoreBar extends StatelessWidget {
  final double value;
  final Color color;
  final double max;

  const ScoreBar({
    super.key,
    required this.value,
    required this.color,
    this.max = 100,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (value / max).clamp(0.0, 1.0);

    return Container(
      height: 6,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(3),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FractionallySizedBox(
            widthFactor: percentage,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color.withValues(alpha: 0.53), color], // 0x88 is ~53%
                ),
                borderRadius: BorderRadius.circular(3),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.4),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
