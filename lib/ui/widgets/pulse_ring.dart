import 'package:flutter/material.dart';

class PulseRing extends StatefulWidget {
  final Color color;
  final double size;

  const PulseRing({
    super.key,
    required this.color,
    this.size = 60,
  });

  @override
  State<PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<PulseRing> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _buildRing(0.0),
          _buildRing(0.5),
        ],
      ),
    );
  }

  Widget _buildRing(double delay) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = ((_controller.value + delay) % 1.0);
        final scale = 1.0 + (progress * 0.8);
        final opacity = 0.4 * (1.0 - progress);

        return Container(
          width: widget.size * scale,
          height: widget.size * scale,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.color.withValues(alpha: opacity),
              width: 2,
            ),
          ),
        );
      },
    );
  }
}
