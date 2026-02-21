import 'dart:async';
import 'package:flutter/material.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/pulse_ring.dart';

class AiLoadingAnimation extends StatefulWidget {
  final String initialTitle;
  final bool darkMode;
  const AiLoadingAnimation({
    super.key,
    this.initialTitle = "Analyse en cours...",
    this.darkMode = false,
  });

  @override
  State<AiLoadingAnimation> createState() => _AiLoadingAnimationState();
}

class _AiLoadingAnimationState extends State<AiLoadingAnimation>
    with SingleTickerProviderStateMixin {
  int _completedSteps = -1; // -1 = none completed yet (showing initial title)
  Timer? _timer;
  late AnimationController _shimmerCtrl;

  static const _steps = [
    "Scan moléculaire des ingrédients",
    "Calcul de l'indice de vitalité",
    "Identification des phytonutriments",
    "Optimisation via VitalTrack IA",
    "Finalisation des résultats",
  ];

  @override
  void initState() {
    super.initState();
    _shimmerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    // Advance steps with varying delays for realism
    _startStepSequence();
  }

  void _startStepSequence() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    setState(() => _completedSteps = 0);

    _timer = Timer.periodic(const Duration(milliseconds: 2200), (t) {
      if (!mounted) return;
      setState(() {
        if (_completedSteps < _steps.length - 1) {
          _completedSteps++;
        } else {
          t.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _shimmerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final accent = colors.accent;
    final textColor = widget.darkMode ? Colors.white : colors.textPrimary;
    final dimColor = widget.darkMode ? Colors.white38 : colors.textTertiary;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Sparkle icon with shimmer + pulse rings ──
          SizedBox(
            width: 120,
            height: 120,
            child: Stack(
              alignment: Alignment.center,
              children: [
                PulseRing(color: accent, size: 120),
                PulseRing(color: accent.withValues(alpha: 0.2), size: 85),
                // Shimmer overlay
                AnimatedBuilder(
                  animation: _shimmerCtrl,
                  builder: (context, child) {
                    return ShaderMask(
                      shaderCallback: (bounds) {
                        return LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            accent.withValues(alpha: 0),
                            accent.withValues(alpha: 0.5),
                            accent.withValues(alpha: 0),
                          ],
                          stops: [
                            (_shimmerCtrl.value - 0.3).clamp(0.0, 1.0),
                            _shimmerCtrl.value,
                            (_shimmerCtrl.value + 0.3).clamp(0.0, 1.0),
                          ],
                        ).createShader(bounds);
                      },
                      blendMode: BlendMode.srcATop,
                      child: child,
                    );
                  },
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: accent.withValues(alpha: 0.1),
                    ),
                    child: Icon(Icons.auto_awesome, color: accent, size: 32),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // ── Initial Title ──
          if (_completedSteps == -1)
             Text(
              widget.initialTitle,
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),

          // ── Step progress list ──
          if (_completedSteps >= 0)
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 260),
              child: Column(
                children: List.generate(_steps.length, (i) {
                  final isCompleted = i < _completedSteps;
                  final isCurrent = i == _completedSteps;

                  return AnimatedOpacity(
                    duration: const Duration(milliseconds: 300),
                    opacity: (isCompleted || isCurrent) ? 1.0 : 0.4,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 24,
                            child: isCompleted
                                ? Icon(Icons.check_circle_rounded,
                                    size: 18, color: accent)
                                : isCurrent
                                    ? _PulsingDot(color: accent)
                                    : Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: dimColor,
                                        ),
                                      ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _steps[i],
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isCurrent
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: isCurrent ? textColor : isCompleted ? textColor.withValues(alpha: 0.7) : dimColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),

          const SizedBox(height: 40),

          Text(
            "VITALTRACK AI ENGINE",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: accent.withValues(alpha: 0.8),
              letterSpacing: 2.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (_, __) => Container(
          width: 10 + _ctrl.value * 4,
          height: 10 + _ctrl.value * 4,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: widget.color.withValues(alpha: 0.4 + _ctrl.value * 0.6),
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.3),
                blurRadius: 8 * _ctrl.value,
                spreadRadius: 2 * _ctrl.value,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
