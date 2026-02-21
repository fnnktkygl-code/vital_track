import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:vital_track/ui/theme.dart';

enum CircadianPhase {
  elimination,  // 04:00 - 12:00
  appropriation,// 12:00 - 20:00
  assimilation  // 20:00 - 04:00
}

class CircadianClockCard extends StatefulWidget {
  final AppColors colors;

  const CircadianClockCard({required this.colors, super.key});

  @override
  State<CircadianClockCard> createState() => _CircadianClockCardState();
}

class _CircadianClockCardState extends State<CircadianClockCard> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;
  late DateTime _now;
  late final Stream<DateTime> _timeStream;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timeStream = Stream.periodic(const Duration(minutes: 1), (_) {
      final newNow = DateTime.now();
      if (_now.hour != newNow.hour) {
        // If hour changes, we might change phase. Rebuild.
        setState(() { _now = newNow; });
      } else {
        _now = newNow;
      }
      return _now;
    }).asBroadcastStream();
    
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  CircadianPhase _getCurrentPhase() {
    final hour = _now.hour;
    if (hour >= 4 && hour < 12) return CircadianPhase.elimination;
    if (hour >= 12 && hour < 20) return CircadianPhase.appropriation;
    return CircadianPhase.assimilation;
  }

  String _getPhaseLabel(CircadianPhase phase) {
    switch (phase) {
      case CircadianPhase.elimination: return "Élimination";
      case CircadianPhase.appropriation: return "Appropriation";
      case CircadianPhase.assimilation: return "Assimilation";
    }
  }

  String _getPhaseDescription(CircadianPhase phase) {
    switch (phase) {
      case CircadianPhase.elimination: return "04h - 12h • Nettoyage corporel, jus et fruits recommandés.";
      case CircadianPhase.appropriation: return "12h - 20h • Alimentation principale et digestion.";
      case CircadianPhase.assimilation: return "20h - 04h • Absorption des nutriments et réparation cellulaire.";
    }
  }

  Color _getPhaseColor(CircadianPhase phase, AppColors colors) {
    switch (phase) {
      case CircadianPhase.elimination: return const Color(0xFFF59E0B); // Amber/Yellow
      case CircadianPhase.appropriation: return const Color(0xFF10B981); // Emerald/Green
      case CircadianPhase.assimilation: return const Color(0xFF6366F1); // Indigo/Blue
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final phase = _getCurrentPhase();
    final phaseColor = _getPhaseColor(phase, colors);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: colors.isDark ? 0.2 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Rythme Circadien',
                style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w800),
              ),
              StreamBuilder<DateTime>(
                stream: _timeStream,
                initialData: _now,
                builder: (context, snapshot) {
                  final time = snapshot.data ?? _now;
                  final timeStr = "${time.hour}h${time.minute.toString().padLeft(2, '0')}";
                  return Row(
                    children: [
                      Text(
                        timeStr,
                        style: TextStyle(color: colors.textTertiary, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 8),
                      Icon(Icons.schedule_rounded, color: colors.textTertiary, size: 20),
                    ],
                  );
                }
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: AnimatedBuilder(
                  animation: _anim,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: _CircadianPainter(
                        now: _now,
                        colors: colors,
                        progress: _anim.value,
                        phaseColor: phaseColor,
                        activePhase: phase,
                      ),
                    );
                  }
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cycle actuel',
                      style: TextStyle(color: colors.textTertiary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getPhaseLabel(phase),
                      style: TextStyle(color: phaseColor, fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getPhaseDescription(phase),
                      style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CircadianPainter extends CustomPainter {
  final DateTime now;
  final AppColors colors;
  final double progress;
  final Color phaseColor;
  final CircadianPhase activePhase;

  _CircadianPainter({
    required this.now,
    required this.colors,
    required this.progress,
    required this.phaseColor,
    required this.activePhase,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    
    // Draw background track
    final trackPaint = Paint()
      ..color = colors.borderSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;
      
    canvas.drawCircle(center, radius - 7, trackPaint);
    
    // Calculate current time as an angle
    // 24 hours = 2*PI radians. 
    final currentHourDecimal = now.hour + (now.minute / 60.0);
    // Since 00:00 is top, angle = (hour / 24) * 2PI - PI/2
    final currentTimeAngle = (currentHourDecimal / 24.0) * (2 * math.pi) - (math.pi / 2);

    // Draw active phase segment
    final activePaint = Paint()
      ..color = phaseColor.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;

    double phaseStartHour = 0;
    double phaseEndHour = 0;
    
    if (activePhase == CircadianPhase.elimination) {
       phaseStartHour = 4;
       phaseEndHour = 12;
    } else if (activePhase == CircadianPhase.appropriation) {
       phaseStartHour = 12;
       phaseEndHour = 20;
    } else {
       phaseStartHour = 20;
       phaseEndHour = 28; // Represents 04:00 next day
    }

    final phaseStartAngle = (phaseStartHour / 24.0) * (2 * math.pi) - (math.pi / 2);
    // Clip the sweep angle based on animation progress
    final totalPhaseAngle = ((phaseEndHour - phaseStartHour) / 24.0) * (2 * math.pi);
    final animatedPhaseSweep = totalPhaseAngle * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius - 7),
      phaseStartAngle,
      animatedPhaseSweep,
      false,
      activePaint,
    );

    // Draw current time marker if animation is complete
    if (progress > 0.95) {
       final markerPaint = Paint()
         ..color = phaseColor
         ..style = PaintingStyle.fill;
         
       final markerRadius = radius - 7;
       final markerDx = center.dx + math.cos(currentTimeAngle) * markerRadius;
       final markerDy = center.dy + math.sin(currentTimeAngle) * markerRadius;
       
       canvas.drawCircle(Offset(markerDx, markerDy), 6, markerPaint);
       
       final outlinePaint = Paint()
         ..color = colors.surface
         ..style = PaintingStyle.stroke
         ..strokeWidth = 2;
       canvas.drawCircle(Offset(markerDx, markerDy), 6, outlinePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CircadianPainter oldDelegate) {
     return oldDelegate.progress != progress || 
            oldDelegate.now.hour != now.hour || 
            oldDelegate.now.minute != now.minute ||
            oldDelegate.colors != colors;
  }
}
