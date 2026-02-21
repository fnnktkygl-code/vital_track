import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:vital_track/providers/mascot_knowledge_base.dart';

class AnimatedPigeon extends StatefulWidget {
  final MascotMood mood;
  final bool isSpeaking;
  final double size;

  const AnimatedPigeon({
    super.key,
    required this.mood,
    required this.isSpeaking,
    this.size = 100,
  });

  @override
  State<AnimatedPigeon> createState() => _AnimatedPigeonState();
}

class _AnimatedPigeonState extends State<AnimatedPigeon> with TickerProviderStateMixin {
  late AnimationController _blinkCtrl;
  late AnimationController _waveCtrl;
  
  @override
  void initState() {
    super.initState();
    // 4s blink cycle
    _blinkCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();
    // 0.8s wave cycle
    _waveCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..repeat();
  }

  @override
  void dispose() {
    _blinkCtrl.dispose();
    _waveCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_blinkCtrl, _waveCtrl]),
      builder: (context, child) {
        
        // --- Blink Animation ---
        double blinkL = 1.0;
        final tL = _blinkCtrl.value;
        if (tL > 0.88 && tL < 1.0) {
          if (tL < 0.93) {
            blinkL = 1.0 - ((tL - 0.88) / 0.05) * 0.93;
          } else {
            blinkL = 0.07 + ((tL - 0.93) / 0.07) * 0.93;
          }
        }
        
        double blinkR = 1.0;
        final tR = (tL - 0.045) % 1.0; 
        double clampedTR = tR < 0 ? tR + 1.0 : tR;
        if (clampedTR > 0.90 && clampedTR < 1.0) {
          if (clampedTR < 0.95) {
            blinkR = 1.0 - ((clampedTR - 0.90) / 0.05) * 0.93;
          } else {
            blinkR = 0.07 + ((clampedTR - 0.95) / 0.05) * 0.93;
          }
        }

        // --- Wing Wave Animation ---
        double waveAngle = 0;
        final tw = _waveCtrl.value;
        if (tw < 0.3) {
          waveAngle = (tw / 0.3) * -28.0;
        } else if (tw < 0.6) {
          waveAngle = -28.0 + ((tw - 0.3) / 0.3) * 40.0;
        } else {
          waveAngle = 12.0 - ((tw - 0.6) / 0.4) * 12.0;
        }

        return SizedBox(
          width: widget.size,
          height: widget.size * 1.22, // Maintain React aspect ratio (100x122)
          child: CustomPaint(
            painter: _PigeonPainter(
              mood: widget.mood,
              isSpeaking: widget.isSpeaking,
              blinkL: blinkL,
              blinkR: blinkR,
              waveAngle: waveAngle * (math.pi / 180),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

class PigeonConfig {
  final String le;
  final String re;
  final String? lb;
  final String? rb;
  final String mouth;
  final String wing;
  final String? extras;

  const PigeonConfig({
    required this.le, required this.re, this.lb, this.rb, 
    required this.mouth, required this.wing, this.extras
  });
}

PigeonConfig _getConfig(MascotMood mood, bool isSpeaking) {
  final m = () {
    switch (mood) {
      case MascotMood.excited:
        return const PigeonConfig(le:"wide", re:"wide", lb:"up", rb:"up", mouth:"open", wing:"both-up", extras:"stars");
      case MascotMood.talking:
        return const PigeonConfig(le:"normal", re:"normal", lb:"up", rb:null, mouth:"smile", wing:"left-wave", extras:null); 
      case MascotMood.questioning:
        return const PigeonConfig(le:"normal", re:"squint", lb:"furrow", rb:null, mouth:"hmm", wing:"left-chin", extras:"questions");
      case MascotMood.sad:
        return const PigeonConfig(le:"sad", re:"sad", lb:"sad", rb:"sad", mouth:"frown", wing:"rest", extras:"tear");
      case MascotMood.loving:
        return const PigeonConfig(le:"heart", re:"heart", lb:null, rb:null, mouth:"smile", wing:"rest", extras:"hearts");
      case MascotMood.proud:
        return const PigeonConfig(le:"normal", re:"normal", lb:"up", rb:null, mouth:"smile", wing:"thumbs", extras:null);
      case MascotMood.sleepy:
        return const PigeonConfig(le:"closed", re:"closed", lb:null, rb:null, mouth:"none", wing:"rest", extras:"zzz");
      case MascotMood.stern:
        return const PigeonConfig(le:"normal", re:"squint", lb:"furrow", rb:"furrow", mouth:"frown", wing:"magnifier", extras:null);
      case MascotMood.scared:
        return const PigeonConfig(le:"wide", re:"wide", lb:"up", rb:"up", mouth:"open", wing:"rest", extras:"tear");
    }
  }();

  if (isSpeaking && m.mouth != "none") {
    return PigeonConfig(
      le: m.le, re: m.re, lb: m.lb, rb: m.rb, 
      mouth: "open", 
      wing: m.wing, extras: m.extras,
    );
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM PAINTER
// ─────────────────────────────────────────────────────────────────────────────

class _PigeonPainter extends CustomPainter {
  final MascotMood mood;
  final bool isSpeaking;
  final double blinkL;
  final double blinkR;
  final double waveAngle;

  _PigeonPainter({
    required this.mood,
    required this.isSpeaking,
    required this.blinkL,
    required this.blinkR,
    required this.waveAngle,
  });

  // Modern Clay Palette (Reference-Matched)
  static const Color clayBase = Color(0xFFA5A1C9); 
  static const Color clayShadow = Color(0xFF817B9F);
  static const Color clayLight = Color(0xFFC0BDDC);
  
  static const Color tealBase = Color(0xFF67B5A0);
  static const Color tealShadow = Color(0xFF428E7A);
  
  static const Color beakBase = Color(0xFFF7AB3A);
  static const Color beakShadow = Color(0xFFC47B1E);
  static const Color beakLight = Color(0xFFFFD485);
  
  static const Color footBase = Color(0xFFE27C72);
  static const Color footShadow = Color(0xFFB54C43);
  
  static const Color eyeWhite = Color(0xFFF8F9FA);
  static const Color eyeShadow = Color(0xFFCED3DD);
  static const Color pupil = Color(0xFF2A2D35);
  
  static const Color blush = Color(0x66FF6B6B);

  final Paint _shadowPaint = Paint()
    ..color = const Color.fromRGBO(0, 0, 0, 0.08)
    ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

  final Paint _blushPaint = Paint()
    ..color = blush
    ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);

  final Paint _pupilPaint = Paint()..color = pupil;
  final Paint _whitePaint = Paint()..color = Colors.white;
  final Paint _clayBasePaint = Paint()..color = clayBase;
  final Paint _darkMouthPaint = Paint()..color = const Color(0xFF5A2A2A);
  final Paint _tonguePaint = Paint()..color = const Color(0xFFFF5A5A);

  Paint _radial(Rect bounds, Color c1, Color c2, {Alignment center = const Alignment(-0.3, -0.3)}) {
    return Paint()
      ..shader = RadialGradient(
        colors: [c1, c2],
        center: center,
        radius: 0.9,
      ).createShader(bounds);
  }

  Paint _linear(Rect bounds, Color c1, Color c2, {Alignment begin = Alignment.topCenter, Alignment end = Alignment.bottomCenter}) {
    return Paint()
      ..shader = LinearGradient(colors: [c1, c2], begin: begin, end: end).createShader(bounds);
  }

  @override
  void paint(Canvas canvas, Size size) {
    // The design is based on a 100x122 canvas
    final scale = size.width / 100.0;
    canvas.scale(scale, scale);

    final cfg = _getConfig(mood, isSpeaking);

    // 1. Drop shadow (Soft ambient)
    canvas.drawOval(Rect.fromCenter(center: const Offset(50, 116), width: 50, height: 12), _shadowPaint);

    // 2. Tail (Behind body)
    _drawTail(canvas);

    // 3. Wings (Draw Behind body)
    _drawWings(canvas, cfg.wing, waveAngle);

    // 3. Body
    final bodyRect = Rect.fromCenter(center: const Offset(50, 80), width: 58, height: 60);
    canvas.drawOval(bodyRect, _radial(bodyRect, clayLight, clayShadow, center: const Alignment(-0.2, -0.4)));

    // Chest fluff (3D bumps)
    _drawChestFluff(canvas);

    // 4. Feet
    _drawFeet(canvas);

    // 5. Head
    final headRect = Rect.fromCenter(center: const Offset(50, 41), width: 44, height: 44);
    canvas.drawCircle(const Offset(50, 41), 22, _radial(headRect, clayLight, clayShadow, center: const Alignment(-0.3, -0.3)));

    // 6. Teal Collar (layered 3D look)
    _drawCollar(canvas);

    // Blushing?
    if (mood == MascotMood.sleepy || mood == MascotMood.loving || mood == MascotMood.sad || mood == MascotMood.scared) {
       canvas.drawOval(Rect.fromCenter(center: const Offset(34, 50), width: 12, height: 8), _blushPaint);
       canvas.drawOval(Rect.fromCenter(center: const Offset(66, 50), width: 12, height: 8), _blushPaint);
    }

    // 7. Eyes (Spheres)
    _drawEye(canvas, 36, 38, cfg.le, blinkL);
    _drawEye(canvas, 64, 38, cfg.re, blinkR);

    // 8. Eyebrows
    _drawBrow(canvas, 36, 26, cfg.lb, false);
    _drawBrow(canvas, 64, 26, cfg.rb, true);

    // 9. Beak (3D)
    _drawBeak(canvas, cfg.mouth);

    // 10. Extras
    _drawExtras(canvas, cfg.extras);
  }

  void _drawChestFluff(Canvas canvas) {
    // Subtle raised bumps on chest
    void bump(double cx, double cy, double r) {
       final rect = Rect.fromCenter(center: Offset(cx, cy), width: r*2, height: r*2);
       // shadow below
       canvas.drawArc(rect.translate(0, 1), 0, math.pi, false, Paint()..color = clayShadow.withValues(alpha: 0.5)..style=PaintingStyle.stroke..strokeWidth=2..strokeCap=StrokeCap.round);
       // highlight top
       canvas.drawArc(rect.translate(0, -0.5), math.pi, math.pi, false, Paint()..color = clayLight.withValues(alpha: 0.8)..style=PaintingStyle.stroke..strokeWidth=1.5..strokeCap=StrokeCap.round);
    }
    bump(44, 76, 3);
    bump(54, 82, 3);
    bump(46, 88, 2.5);
  }

  void _drawTail(Canvas canvas) {
    // 3 Fan-out fan feathers behind the body
    void drawTailFeather(double cx, double cy, double rot) {
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(rot * (math.pi / 180));
      final rect = Rect.fromCenter(center: Offset.zero, width: 14, height: 26);
      canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(7)), _linear(rect, clayLight, clayShadow));
      // accent stripe
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-7, 10, 14, 6), Radius.zero), Paint()..color=clayShadow.withValues(alpha: 0.5));
      canvas.restore();
    }
    drawTailFeather(38, 95, -20);
    drawTailFeather(50, 92, 0);
    drawTailFeather(62, 95, 20);
  }

  void _drawCollar(Canvas canvas) {
    // Puffy teal ring
    // cast shadow
    canvas.drawOval(Rect.fromCenter(center: const Offset(50, 68), width: 48, height: 12), Paint()..color=clayShadow.withValues(alpha: 0.4)..maskFilter=const MaskFilter.blur(BlurStyle.normal, 2));

    void drawPetal(double cx, double cy, double r, {double rot = 0}) {
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(rot);
      final rect = Rect.fromCenter(center: Offset.zero, width: r*2, height: r*2.2);
      canvas.drawOval(rect, _radial(rect, const Color(0xFF8ED2C1), tealShadow, center: const Alignment(-0.2, -0.3)));
      canvas.restore();
    }

    // Puffy overlapping ring
    for (int i=0; i<6; i++) {
       double angle = math.pi + (i * math.pi / 5);
       double px = 50 + math.cos(angle) * 22;
       double py = 50 + math.sin(angle) * 10;
       drawPetal(px, py, 9, rot: angle + math.pi/2);
    }
    
    // fill center
    final fillRect = Rect.fromCenter(center: const Offset(50, 48), width: 42, height: 16);
    canvas.drawOval(fillRect, _linear(fillRect, tealBase, tealShadow));
  }

  void _drawBeak(Canvas canvas, String mouthType) {
    // The "Cere" - white waxy part at top base of beak (Characteristic of pigeons)
    final cereRect = Rect.fromCenter(center: const Offset(50, 47), width: 14, height: 8);
    canvas.drawOval(cereRect, _radial(cereRect, Colors.white, eyeShadow));

    // Upper Beak Cone
    final topPath = Path()
      ..moveTo(42, 53)
      ..quadraticBezierTo(50, 46, 58, 53)
      ..lineTo(50, 62)
      ..close();
      
    final topRect = topPath.getBounds();
    canvas.drawPath(topPath, _radial(topRect, beakLight, beakShadow, center: const Alignment(0, -0.5)));

    // Highlight dot on upper beak
    canvas.drawOval(Rect.fromCenter(center: const Offset(50, 50), width: 5, height: 3), Paint()..color = Colors.white.withValues(alpha: 0.8));

    if (mouthType == "open") {
       // Open mouth - dark inside
       final insideMouth = Path()
         ..moveTo(45, 56)..quadraticBezierTo(50, 64, 55, 56)..close();
       canvas.drawPath(insideMouth, _darkMouthPaint);
       // Tongue
       canvas.drawArc(Rect.fromCenter(center: const Offset(50, 60), width: 6, height: 4), 0, math.pi, true, _tonguePaint);
    }

    // Lower Beak
    final botOffset = mouthType == "open" ? 4.0 : 0.0;
    
    final botPath = Path()
      ..moveTo(45, 56 + botOffset)
      ..quadraticBezierTo(50, 60 + botOffset, 55, 56 + botOffset)
      ..lineTo(50, 62 + botOffset)
      ..close();
    canvas.drawPath(botPath, _linear(botPath.getBounds(), beakBase, beakShadow));
  }

  void _drawWings(Canvas canvas, String pose, double waveAngle) {
    // Instead of one ellipse, draw 3 layered feathers per wing for 3D look
    void drawWingFeathers(double cx, double cy, double rotAngle, {bool right = false}) {
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(rotAngle * (math.pi / 180));
      
      final m = right ? -1.0 : 1.0;
      
      void drawFeather(double fx, double fy, double w, double h, double rot) {
         canvas.save();
         canvas.translate(fx, fy);
         canvas.rotate(rot * (math.pi / 180));
         final rect = Rect.fromCenter(center: Offset.zero, width: w, height: h);
         final rrect = RRect.fromRectAndRadius(rect, Radius.circular(w/2));
         // Under shadow
         canvas.drawRRect(rrect.shift(const Offset(0, 1)), Paint()..color = clayShadow..maskFilter=const MaskFilter.blur(BlurStyle.normal, 1));
         // Feather body
         canvas.drawRRect(rrect, _linear(rect, clayLight, clayShadow));
         canvas.restore();
      }

      // 3 overlapping feathers
      drawFeather(m * 6, 4, 12, 36, m * 15);
      drawFeather(m * 0, 2, 12, 40, m * 5);
      drawFeather(m * -6, 0, 12, 38, m * -5);
      
      canvas.restore();
    }

    if (pose == "both-up") {
      drawWingFeathers(18, 55, -120);
      drawWingFeathers(82, 55, 120, right: true);
    } else if (pose == "left-wave") {
      canvas.save();
      canvas.translate(22, 70); 
      canvas.rotate((-70 * (math.pi / 180)) + waveAngle);
      canvas.translate(-22, -70);
      drawWingFeathers(22, 55, 0); 
      canvas.restore();
      drawWingFeathers(82, 75, 25, right: true);
    } else if (pose == "left-chin") {
      drawWingFeathers(28, 62, -45);
      drawWingFeathers(82, 75, 25, right: true);
    } else if (pose == "magnifier") {
      drawWingFeathers(20, 65, -80);
      drawWingFeathers(82, 75, 25, right: true);
      
      // Magnifying glass (3D handle & rim)
      final handlePaint = Paint()..color = const Color(0xFF8C5A35)..style=PaintingStyle.stroke..strokeWidth=4..strokeCap=StrokeCap.round;
      canvas.drawLine(const Offset(18, 60), const Offset(26, 75), handlePaint);
      
      final rimPaint = Paint()..color = const Color(0xFF8B93A0)..style=PaintingStyle.stroke..strokeWidth=4.5;
      final lensPaint = Paint()..color = Colors.lightBlueAccent.withValues(alpha: 0.3)..style=PaintingStyle.fill;
      canvas.drawCircle(const Offset(12, 50), 12, lensPaint);
      canvas.drawCircle(const Offset(12, 50), 12, rimPaint);
      // highlight
      canvas.drawArc(Rect.fromCircle(center: const Offset(12, 50), radius: 10), math.pi, math.pi/2, false, Paint()..color=Colors.white.withValues(alpha: 0.6)..style=PaintingStyle.stroke..strokeWidth=2..strokeCap=StrokeCap.round);
      
    } else if (pose == "thumbs") {
      drawWingFeathers(22, 65, -50);
      // Thumbs up
      final thumbRect = Rect.fromCenter(center: const Offset(12, 50), width: 8, height: 12);
      canvas.drawRRect(RRect.fromRectAndRadius(thumbRect, const Radius.circular(4)), _radial(thumbRect, clayLight, clayShadow));
      drawWingFeathers(82, 75, 25, right: true);
    } else { // rest
      drawWingFeathers(22, 75, -25);
      drawWingFeathers(78, 75, 25, right: true);
    }
  }

  void _drawEye(Canvas canvas, double cx, double cy, String type, double blinkScale) {
    if (type == "closed") {
      final p = Path()..moveTo(cx - 8, cy)..quadraticBezierTo(cx, cy - 6, cx + 8, cy);
      canvas.drawPath(p, Paint()..color = clayShadow..style = PaintingStyle.stroke..strokeWidth = 3..strokeCap = StrokeCap.round);
      return;
    }
    
    // Bulbous 3D Eye
    double r = type == "wide" ? 10.5 : 9.0;

    canvas.save();
    canvas.translate(cx, cy);
    canvas.scale(1.0, blinkScale);
    canvas.translate(-cx, -cy);

    if (type == "heart") {
       final rect = Rect.fromCenter(center: Offset(cx, cy), width: r*2.2, height: r*2.2);
       // Heart draw
       var hp = Path()
         ..moveTo(cx, cy+r)
         ..cubicTo(cx-r*1.5, cy, cx-r, cy-r*1.2, cx, cy-r*0.2)
         ..cubicTo(cx+r, cy-r*1.2, cx+r*1.5, cy, cx, cy+r)
         ..close();
       canvas.drawPath(hp, _radial(rect, const Color(0xFFFF9AC2), const Color(0xFFD84A80), center: const Alignment(-0.2, -0.2)));
    } else {
      // Sclera sphere
      final rect = Rect.fromCenter(center: Offset(cx, cy), width: r*2, height: r*2);
      canvas.drawCircle(Offset(cx, cy), r, _radial(rect, eyeWhite, eyeShadow, center: const Alignment(-0.3, -0.3)));
      
      // Pupil slightly recessed or flat
      final pr = r * 0.45;
      final px = cx + 0.5, py = cy + 0.5;
      canvas.drawCircle(Offset(px, py), pr, _pupilPaint);
      
      // Catchlight (adds tons of life)
      canvas.drawCircle(Offset(px - pr*0.3, py - pr*0.3), pr*0.35, _whitePaint);
      
      // Eyelids (if squint or sad)
      if (type == "squint" || type == "sad") {
        final lidY = type == "squint" ? cy - r*0.2 : cy + r*0.1;
        final lidPath = Path()
          ..moveTo(cx - r*1.2, cy - r*1.2)
          ..lineTo(cx + r*1.2, cy - r*1.2)
          ..lineTo(cx + r*1.2, lidY)
          ..lineTo(cx - r*1.2, lidY)
          ..close();
        
        // Eyelid uses skin colors, plus a shadow below it
        canvas.save();
        canvas.clipPath(Path()..addOval(rect));
        
        canvas.drawPath(lidPath.shift(const Offset(0, 1.5)), Paint()..color = clayShadow..maskFilter=const MaskFilter.blur(BlurStyle.normal, 1));
        canvas.drawPath(lidPath, _clayBasePaint);
        
        // Lower lid for squint
        if (type == "squint") {
           final botLidPath = Path()
             ..moveTo(cx - r*1.2, cy + r*1.2)
             ..lineTo(cx + r*1.2, cy + r*1.2)
             ..lineTo(cx + r*1.2, cy + r*0.4)
             ..lineTo(cx - r*1.2, cy + r*0.4)..close();
           canvas.drawPath(botLidPath, _clayBasePaint);
        }
        
        canvas.restore();
      }
      
      if (type == "sad") {
        // 3D Tear drop
        final tx = cx + r * 0.7;
        final ty = cy + r * 1.3;
        final tear = Path()
           ..moveTo(tx, ty - 3)
           ..cubicTo(tx+2.5, ty, tx+2.5, ty+4, tx, ty+4)
           ..cubicTo(tx-2.5, ty+4, tx-2.5, ty, tx, ty-3)..close();
        canvas.drawPath(tear, _radial(tear.getBounds(), Colors.white, const Color(0xFF63B9EE), center: const Alignment(-0.2, -0.2)));
      }
    }
    canvas.restore();
  }

  void _drawBrow(Canvas canvas, double cx, double cy, String? type, bool flip) {
    if (type == null) return;
    double f = flip ? -1 : 1;
    final paint = Paint()..color = const Color(0xFF4C4D7A)..style = PaintingStyle.stroke..strokeWidth = 2.5..strokeCap = StrokeCap.round;
    var p = Path();
    if (type == "up") {
      p.moveTo(cx - 6, cy);
      p.quadraticBezierTo(cx, cy - 6, cx + 6, cy);
    } else if (type == "sad") {
      p.moveTo(cx - 6, cy - 3);
      p.quadraticBezierTo(cx, cy + 2, cx + 6, cy - 3);
    } else if (type == "furrow") {
      p.moveTo(cx - 5, cy);
      p.lineTo(cx + 5 * f, cy - 4);
    }
    // Shadow
    if (p.computeMetrics().isNotEmpty) {
      canvas.drawPath(p.shift(const Offset(0, 1)), Paint()..color=clayShadow.withValues(alpha: 0.5)..style=PaintingStyle.stroke..strokeWidth=2.5..strokeCap=StrokeCap.round);
      canvas.drawPath(p, paint);
    }
  }

  void _drawFeet(Canvas canvas) {
    // 3D Cylindrical feet
    void drawFoot(double cx, double cy) {
       final rect = Rect.fromCenter(center: Offset(cx, cy), width: 12, height: 8);
       canvas.drawOval(rect, _radial(rect, footBase, footShadow, center: const Alignment(0, -0.5)));
       
       // Leg
       final legRect = Rect.fromCenter(center: Offset(cx, cy - 6), width: 6, height: 10);
       canvas.drawRect(legRect, _linear(legRect, footBase, footShadow));
       
       // Toes (overlapping 3D ovals)
       final toeP = Paint()..color = footBase;
       canvas.drawOval(Rect.fromCenter(center: Offset(cx-4, cy+3), width: 4, height: 6), toeP);
       canvas.drawOval(Rect.fromCenter(center: Offset(cx, cy+4), width: 4, height: 6), toeP);
       canvas.drawOval(Rect.fromCenter(center: Offset(cx+4, cy+3), width: 4, height: 6), toeP);
    }
    
    drawFoot(38, 110);
    drawFoot(62, 110);
  }

  void _drawExtras(Canvas canvas, String? type) {
    if (type == null) return;
    if (type == "stars") {
       _drawText(canvas, "✨", 12, 26, 16, Colors.white, offsetCenter: false);
       _drawText(canvas, "✨", 82, 18, 14, Colors.white, offsetCenter: false);
    } else if (type == "questions") {
       _drawText(canvas, "?", 18, 22, 22, const Color(0xFF8C7BCC), bold: true, offsetCenter: false);
       _drawText(canvas, "?", 78, 16, 18, const Color(0xFF75A1CC), bold: true, offsetCenter: false);
    } else if (type == "zzz") {
       _drawText(canvas, "z", 68, 26, 14, const Color(0xFF8BADD6), bold: true, offsetCenter: false);
       _drawText(canvas, "Z", 82, 14, 20, const Color(0xFF6B8FC8), bold: true, offsetCenter: false);
    }
  }

  void _drawText(Canvas canvas, String text, double x, double y, double fontSize, Color color, {bool bold = false, double size = 0, bool offsetCenter = true}) {
    final textPainter = TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: color, fontSize: size == 0 ? fontSize : size, fontWeight: bold ? FontWeight.w900 : FontWeight.w600)),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    if (offsetCenter) {
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, y - textPainter.height / 2));
    } else {
      textPainter.paint(canvas, Offset(x, y - textPainter.height));
    }
  }

  @override
  bool shouldRepaint(_PigeonPainter old) => 
      old.mood != mood || old.isSpeaking != isSpeaking || 
      old.blinkL != blinkL || old.blinkR != blinkR || old.waveAngle != waveAngle;
}
