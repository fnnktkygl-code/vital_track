import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/screens/chat_screen.dart';

/// Drop-in overlay mascot. Add to any Scaffold as a Stack child.
/// Sits bottom-right above the nav bar.
class MascotOverlay extends StatelessWidget {
  const MascotOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    // The overlay itself now covers the whole screen to allow dragging
    // It's a Stack within a Stack
    return const SizedBox.expand(
      child: Stack(
        children: [
           _MascotStack(),
        ],
      ),
    );
  }
}

class _MascotStack extends StatefulWidget {
  const _MascotStack();

  @override
  State<_MascotStack> createState() => _MascotStackState();
}

class _MascotStackState extends State<_MascotStack>
    with TickerProviderStateMixin {
  // Floating bob
  late AnimationController _floatCtrl;
  late Animation<double> _floatAnim;

  // Speech bubble pop-in
  late AnimationController _bubbleCtrl;
  late Animation<double> _bubbleScaleAnim;
  late Animation<double> _bubbleFadeAnim;

  // Bounce on event
  late AnimationController _bounceCtrl;
  late Animation<double> _bounceAnim;

  // Shake on warning
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;

  // Wing flap (idle)
  late AnimationController _wingCtrl;
  late Animation<double> _wingAnim;

  // Docking
  bool _isDocked = false;
  Offset _position = const Offset(20, 120); // Bottom-Right relative


  String? _lastMessageText;


  @override
  void initState() {
    super.initState();

    // ── Float (perpetual bob up/down) ──────────────────────────────────────
    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
    _floatAnim = Tween<double>(begin: -6, end: 6).animate(
      CurvedAnimation(parent: _floatCtrl, curve: Curves.easeInOut),
    );

    // ── Speech bubble pop-in ──────────────────────────────────────────────
    _bubbleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _bubbleScaleAnim = CurvedAnimation(
      parent: _bubbleCtrl,
      curve: Curves.elasticOut,
    );
    _bubbleFadeAnim = CurvedAnimation(
      parent: _bubbleCtrl,
      curve: Curves.easeIn,
    );

    // ── Bounce (good food) ────────────────────────────────────────────────
    _bounceCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _bounceAnim = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -22.0), weight: 40),
      TweenSequenceItem(tween: Tween(begin: -22.0, end: 0.0), weight: 60),
    ]).animate(CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeOut));

    // ── Shake (warning) ───────────────────────────────────────────────────
    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _shakeAnim = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -8.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: -8.0, end: 8.0), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 8.0, end: -4.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 0.0), weight: 20),
    ]).animate(CurvedAnimation(parent: _shakeCtrl, curve: Curves.linear));

    // ── Wing flap (idle loop every 4s) ────────────────────────────────────
    _wingCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _wingAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _wingCtrl, curve: Curves.easeInOut),
    );
    _scheduleWingFlap();
  }

  void _scheduleWingFlap() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        _wingCtrl.forward().then((_) => _wingCtrl.reverse()).then((_) {
          if (mounted) _scheduleWingFlap();
        });
      }
    });
  }

  @override
  void dispose() {
    _floatCtrl.dispose();
    _bubbleCtrl.dispose();
    _bounceCtrl.dispose();
    _shakeCtrl.dispose();
    _wingCtrl.dispose();
    super.dispose();
  }

  void _triggerBubbleAnim() {
    _bubbleCtrl.forward(from: 0);
  }

  void _triggerBounce() {
    _bounceCtrl.forward(from: 0);
  }

  void _triggerShake() {
    _shakeCtrl.forward(from: 0);
  }

  void _handlePanUpdate(DragUpdateDetails details) {
    setState(() {
      // Invert dx because we are positioning from Right
      _position -= Offset(details.delta.dx, details.delta.dy);
    });
  }

  void _handlePanEnd(DragEndDetails details) {
    // Snap to edge if close
    if (_position.dx < -20) {
      // Dock it
      setState(() {
        _isDocked = true;
        _position = Offset(-40, _position.dy); // Hide slightly offscreen
      });
    } else {
      // Ensure it stays on screen
      if (_position.dx < 0) setState(() => _position = Offset(16, _position.dy));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<MascotProvider>(
      builder: (context, mascot, _) {
        final msg = mascot.currentMessage;
        final mood = mascot.mood;

        // Auto-undock if message arrives
        if (msg != null && _isDocked) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
             setState(() {
               _isDocked = false;
               _position = Offset(16, _position.dy);
             });
          });
        }

        // React to new messages
        if (msg != null && msg.text != _lastMessageText) {
          _lastMessageText = msg.text;

          WidgetsBinding.instance.addPostFrameCallback((_) {
            _triggerBubbleAnim();
            if (mood == MascotMood.loving ||
                mood == MascotMood.excited ||
                mood == MascotMood.proud) {
              _triggerBounce();
            } else if (mood == MascotMood.scared ||
                mood == MascotMood.stern ||
                mood == MascotMood.sad) {
              _triggerShake();
            }
          });
        }

        if (!mascot.isVisible) return const SizedBox.shrink();

        // DOCKED STATE icon
        if (_isDocked) {
          return Positioned(
            right: 0,
            bottom: _position.dy,
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _isDocked = false;
                  _position = Offset(16, _position.dy);
                });
              },
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.9),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(30)),
                  boxShadow: [
                     BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 10)
                  ],
                ),
                child: const Text("🐦", style: TextStyle(fontSize: 24)),
              ),
            ),
          );
        }

        // FLOATING STATE
        return Positioned(
          right: _position.dx.clamp(-50.0, MediaQuery.of(context).size.width - 100),
          bottom: _position.dy.clamp(100.0, MediaQuery.of(context).size.height - 200),
          child: GestureDetector(
            onPanUpdate: _handlePanUpdate,
            onPanEnd: _handlePanEnd,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                // ── SPEECH BUBBLE ─────────────────────────────────────────────
                if (msg != null)
                  AnimatedBuilder(
                    animation: _bubbleCtrl,
                    builder: (_, child) => Opacity(
                      opacity: _bubbleFadeAnim.value,
                      child: Transform.scale(
                        scale: _bubbleScaleAnim.value,
                        alignment: Alignment.bottomRight,
                        child: child,
                      ),
                    ),
                    child: _SpeechBubble(
                      message: msg,
                      onDismiss: mascot.dismiss,
                      onTip: mascot.showRandomTip,
                    ),
                  ),

                if (msg != null) const SizedBox(height: 8),

                // ── PIGEON ────────────────────────────────────────────────────
                AnimatedBuilder(
                  animation: Listenable.merge(
                      [_floatAnim, _bounceAnim, _shakeAnim, _wingAnim]),
                  builder: (context, child) => Transform.translate(
                    offset: Offset(
                      _shakeAnim.value,
                      _floatAnim.value + _bounceAnim.value,
                    ),
                    child: GestureDetector(
                      onTap: mascot.showRandomTip,
                      child: _PigeonBody(
                        mood: mood,
                        wingFlap: _wingAnim.value,
                        isSpeaking: mascot.isSpeaking,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEECH BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
class _SpeechBubble extends StatelessWidget {
  final MascotMessage message;
  final VoidCallback onDismiss;
  final VoidCallback onTip;

  const _SpeechBubble({
    required this.message,
    required this.onDismiss,
    required this.onTip,
  });

  Color _bubbleColor(BuildContext context, MascotMood mood) {
    switch (mood) {
      default:
        // Use card color for ALL moods to ensure text contrast matches the theme
        // The border color will indicate the mood/emotion
        return Theme.of(context).cardColor;
    }
  }

  Color _borderColor(BuildContext context, MascotMood mood) {
    switch (mood) {
      case MascotMood.loving:
      case MascotMood.proud:
      case MascotMood.excited:
        return Theme.of(context).colorScheme.primary.withValues(alpha: 0.4);
      case MascotMood.stern:
      case MascotMood.scared:
      case MascotMood.sad:
        return Theme.of(context).colorScheme.error.withValues(alpha: 0.4);
      case MascotMood.questioning:
        return Theme.of(context).colorScheme.secondaryContainer.withValues(alpha: 0.4);
      default:
        return Theme.of(context).dividerColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _bubbleColor(context, message.mood);
    final borderColor = _borderColor(context, message.mood);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          constraints: const BoxConstraints(maxWidth: 230),
          padding: const EdgeInsets.fromLTRB(14, 12, 32, 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(18),
              topRight: Radius.circular(18),
              bottomLeft: Radius.circular(18),
              bottomRight: Radius.circular(4),
            ),
            border: Border.all(color: borderColor, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Source badge
              if (message.source != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: borderColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Text(
                    message.source!.toUpperCase(),
                    style: TextStyle(
                      fontFamily: 'SpaceMono',
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: borderColor,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),

              // Message text
              Text(
                message.text,
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurface,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 8),

              // Action row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: onTip,
                    child: Text(
                      "Autre conseil",
                      style: TextStyle(
                        fontSize: 10,
                        color: borderColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      onDismiss(); // Close bubble
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatScreen()));
                    },
                    child: Row(
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 10, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 4),
                        Text(
                          "Discuter",
                          style: TextStyle(
                            fontSize: 10,
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                    GestureDetector(
                      onTap: onDismiss,
                      child: Text(
                        "OK",
                        style: TextStyle(
                          fontSize: 10,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),

        // Dismiss X
        Positioned(
          top: 6,
          right: 6,
          child: GestureDetector(
            onTap: onDismiss,
            child: Icon(
              Icons.close_rounded,
              size: 14,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
        ),

        // Bubble tail (bottom-right pointing down)
        Positioned(
          bottom: -8,
          right: 18,
          child: CustomPaint(
            painter: _BubbleTailPainter(borderColor: borderColor, bgColor: bgColor),
            size: const Size(14, 10),
          ),
        ),
      ],
    );
  }
}

class _BubbleTailPainter extends CustomPainter {
  final Color borderColor;
  final Color bgColor;
  const _BubbleTailPainter({required this.borderColor, required this.bgColor});

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();

    canvas.drawPath(path, Paint()..color = borderColor);
    canvas.drawPath(
      Path()
        ..moveTo(1.5, 1.5)
        ..lineTo(size.width - 1.5, 1.5)
        ..lineTo(size.width / 2, size.height - 1)
        ..close(),
      Paint()..color = bgColor,
    );
  }

  @override
  bool shouldRepaint(_BubbleTailPainter old) => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIGEON BODY (CustomPainter · works without image assets)
// To use your actual pigeon PNG sprites, swap the CustomPaint for Image.asset
// and reference: assets/mascot/pigeon_{mood.name}.png
// ─────────────────────────────────────────────────────────────────────────────
class _PigeonBody extends StatelessWidget {
  final MascotMood mood;
  final double wingFlap;
  final bool isSpeaking;

  const _PigeonBody({
    required this.mood,
    required this.wingFlap,
    required this.isSpeaking,
  });

  @override
  Widget build(BuildContext context) {
    // ── Use asset images if available ──────────────────────────────────────
    // Uncomment the block below once you've sliced the pigeon sprite sheet
    // and placed the PNGs in assets/mascot/
    /*
    final assetName = _assetForMood(mood);
    return Image.asset(
      assetName,
      width: 80,
      height: 80,
      errorBuilder: (_, __, ___) => _FallbackPigeon(mood: mood, wingFlap: wingFlap),
    );
    */

    // ── Fallback: CustomPainter pigeon ─────────────────────────────────────
    return _FallbackPigeon(mood: mood, wingFlap: wingFlap, isSpeaking: isSpeaking);
  }


}

/// Lightweight CustomPainter pigeon that matches the sprite sheet style
class _FallbackPigeon extends StatelessWidget {
  final MascotMood mood;
  final double wingFlap;
  final bool isSpeaking;

  const _FallbackPigeon({
    required this.mood,
    required this.wingFlap,
    required this.isSpeaking,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 76,
      height: 76,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Glow halo matching mood
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _moodGlow(context, mood).withValues(alpha: 0.12),
            ),
          ),
          // Pigeon drawn via CustomPaint
          CustomPaint(
            size: const Size(76, 76),
            painter: _PigeonPainter(
              mood: mood,
              wingFlap: wingFlap,
              isSpeaking: isSpeaking,
            ),
          ),
          // Mood overlay emoji (top right)
          Positioned(
            top: 2,
            right: 2,
            child: Text(
              _moodEmoji(mood),
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Color _moodGlow(BuildContext context, MascotMood mood) {
    switch (mood) {
      case MascotMood.loving:
        return Colors.pink;
      case MascotMood.proud:
        return Colors.amber;
      case MascotMood.excited:
        return Theme.of(context).colorScheme.primary;
      case MascotMood.stern:
      case MascotMood.scared:
      case MascotMood.sad:
        return Theme.of(context).colorScheme.error;
      case MascotMood.questioning:
        return Theme.of(context).colorScheme.secondaryContainer;
      case MascotMood.sleepy:
        return Theme.of(context).colorScheme.secondary;
      default:
        return Theme.of(context).colorScheme.onSurface;
    }
  }

  String _moodEmoji(MascotMood mood) {
    switch (mood) {
      case MascotMood.talking:   return "💬";
      case MascotMood.sad:       return "😢";
      case MascotMood.stern:     return "😤";
      case MascotMood.scared:    return "😱";
      case MascotMood.excited:   return "🎉";
      case MascotMood.questioning: return "❓";
      case MascotMood.loving:    return "❤️";
      case MascotMood.sleepy:    return "😴";
      case MascotMood.proud:     return "🏅";
    }
  }
}

/// CustomPainter: draws a stylised pigeon matching the clay-look sprite
class _PigeonPainter extends CustomPainter {
  final MascotMood mood;
  final double wingFlap; // 0–1
  final bool isSpeaking;

  const _PigeonPainter({
    required this.mood,
    required this.wingFlap,
    required this.isSpeaking,
  });

  // ── Palette matching the dark-clay pigeon from the sprite sheet ──────────
  static const _bodyDark   = Color(0xFF4A4A5E);
  static const _bodyMid    = Color(0xFF5A5A70);
  static const _bodyLight  = Color(0xFF3A3A4E);
  static const _irisColor  = Color(0xFF222232);
  static const _sclerColor = Color(0xFFEEEEFF);
  static const _beakColor  = Color(0xFFE8A87C);
  static const _feetColor  = Color(0xFFD4826A);
  static const _sheen      = Color(0xFF7B68EE); // iridescent purple sheen

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // ── WINGS (behind body) ────────────────────────────────────────────────
    final wingOffset = wingFlap * 6;
    _drawWing(canvas, w, h, left: true, offset: wingOffset);
    _drawWing(canvas, w, h, left: false, offset: wingOffset);

    // ── BODY ──────────────────────────────────────────────────────────────
    final bodyPaint = Paint()..color = _bodyMid;
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.50, h * 0.60), width: w * 0.54, height: h * 0.50),
      bodyPaint,
    );

    // Belly highlight
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.50, h * 0.63), width: w * 0.30, height: h * 0.28),
      Paint()..color = _bodyDark.withValues(alpha: 0.5),
    );

    // Iridescent sheen on neck
    final sheenPaint = Paint()
      ..color = _sheen.withValues(alpha: 0.25)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.50, h * 0.44), width: w * 0.26, height: h * 0.18),
      sheenPaint,
    );

    // ── HEAD ─────────────────────────────────────────────────────────────
    final headCenter = Offset(w * 0.50, h * 0.34);
    canvas.drawCircle(headCenter, w * 0.20, Paint()..color = _bodyMid);

    // ── EYES ─────────────────────────────────────────────────────────────
    _drawEye(canvas, Offset(w * 0.42, h * 0.32), w * 0.06);
    _drawEye(canvas, Offset(w * 0.58, h * 0.32), w * 0.06);

    // Mood eyebrows
    _drawEyebrows(canvas, w, h);

    // ── BEAK ─────────────────────────────────────────────────────────────
    final beakPath = Path()
      ..moveTo(w * 0.44, h * 0.38)
      ..lineTo(w * 0.36, h * 0.42)
      ..lineTo(w * 0.44, h * 0.40)
      ..close();
    canvas.drawPath(beakPath, Paint()..color = _beakColor);

    // Mouth open if speaking
    if (isSpeaking) {
      canvas.drawOval(
        Rect.fromCenter(
            center: Offset(w * 0.41, h * 0.42), width: 5, height: 3),
        Paint()..color = Colors.black54,
      );
    }

    // ── FEET ─────────────────────────────────────────────────────────────
    _drawFeet(canvas, w, h);

    // ── MOOD ACCESSORIES ──────────────────────────────────────────────────
    _drawMoodAccessory(canvas, w, h);
  }

  void _drawWing(Canvas canvas, double w, double h,
      {required bool left, required double offset}) {
    final cx = left ? w * 0.22 : w * 0.78;
    final cy = h * 0.60 - offset;

    final paint = Paint()
      ..color = left ? _bodyDark : _bodyLight
      ..style = PaintingStyle.fill;

    final path = Path();
    if (left) {
      path
        ..moveTo(cx + 14, cy - 4)
        ..quadraticBezierTo(cx - 10, cy - 12 - offset * 2, cx - 6, cy + 12)
        ..quadraticBezierTo(cx + 4, cy + 16, cx + 14, cy + 6)
        ..close();
    } else {
      path
        ..moveTo(cx - 14, cy - 4)
        ..quadraticBezierTo(cx + 10, cy - 12 - offset * 2, cx + 6, cy + 12)
        ..quadraticBezierTo(cx - 4, cy + 16, cx - 14, cy + 6)
        ..close();
    }
    canvas.drawPath(path, paint);
  }

  void _drawEye(Canvas canvas, Offset center, double r) {
    // Sclera
    canvas.drawCircle(center, r, Paint()..color = _sclerColor);
    // Iris
    canvas.drawCircle(center, r * 0.65, Paint()..color = _irisColor);
    // Pupil highlight
    canvas.drawCircle(
      center.translate(-r * 0.2, -r * 0.2),
      r * 0.22,
      Paint()..color = Colors.white70,
    );
  }

  void _drawEyebrows(Canvas canvas, double w, double h) {
    final paint = Paint()
      ..color = _bodyDark
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    switch (mood) {
      case MascotMood.stern:
      case MascotMood.scared:
      // Furrowed V brows
        canvas.drawLine(
            Offset(w * 0.37, h * 0.26), Offset(w * 0.44, h * 0.28), paint);
        canvas.drawLine(
            Offset(w * 0.63, h * 0.26), Offset(w * 0.56, h * 0.28), paint);
        break;
      case MascotMood.sad:
      // Sad arched up at inner corners
        canvas.drawLine(
            Offset(w * 0.37, h * 0.28), Offset(w * 0.44, h * 0.26), paint);
        canvas.drawLine(
            Offset(w * 0.56, h * 0.26), Offset(w * 0.63, h * 0.28), paint);
        break;
      case MascotMood.excited:
      case MascotMood.loving:
      case MascotMood.proud:
      // High arch (happy)
        canvas.drawArc(
          Rect.fromCenter(
              center: Offset(w * 0.41, h * 0.29), width: 14, height: 8),
          -math.pi,
          math.pi,
          false,
          paint,
        );
        canvas.drawArc(
          Rect.fromCenter(
              center: Offset(w * 0.59, h * 0.29), width: 14, height: 8),
          -math.pi,
          math.pi,
          false,
          paint,
        );
        break;
      default:
      // Neutral straight
        canvas.drawLine(
            Offset(w * 0.37, h * 0.27), Offset(w * 0.45, h * 0.27), paint);
        canvas.drawLine(
            Offset(w * 0.55, h * 0.27), Offset(w * 0.63, h * 0.27), paint);
    }
  }

  void _drawFeet(Canvas canvas, double w, double h) {
    final paint = Paint()
      ..color = _feetColor
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Left leg
    canvas.drawLine(
        Offset(w * 0.42, h * 0.84), Offset(w * 0.42, h * 0.92), paint);
    canvas.drawLine(
        Offset(w * 0.42, h * 0.92), Offset(w * 0.30, h * 0.95), paint);
    canvas.drawLine(
        Offset(w * 0.42, h * 0.92), Offset(w * 0.40, h * 0.97), paint);
    canvas.drawLine(
        Offset(w * 0.42, h * 0.92), Offset(w * 0.50, h * 0.96), paint);

    // Right leg
    canvas.drawLine(
        Offset(w * 0.58, h * 0.84), Offset(w * 0.58, h * 0.92), paint);
    canvas.drawLine(
        Offset(w * 0.58, h * 0.92), Offset(w * 0.50, h * 0.95), paint);
    canvas.drawLine(
        Offset(w * 0.58, h * 0.92), Offset(w * 0.60, h * 0.97), paint);
    canvas.drawLine(
        Offset(w * 0.58, h * 0.92), Offset(w * 0.68, h * 0.96), paint);
  }

  void _drawMoodAccessory(Canvas canvas, double w, double h) {
    switch (mood) {
      case MascotMood.loving:
      // Small hearts
        _drawHeart(canvas, Offset(w * 0.22, h * 0.28), 6,
            Colors.pinkAccent);
        _drawHeart(canvas, Offset(w * 0.15, h * 0.38), 4,
            Colors.pink.withValues(alpha: 0.7));
        break;

      case MascotMood.proud:
      // Medal circle
        canvas.drawCircle(
          Offset(w * 0.60, h * 0.72),
          8,
          Paint()
            ..color = Colors.amber
            ..style = PaintingStyle.fill,
        );
        canvas.drawLine(
          Offset(w * 0.60, h * 0.62),
          Offset(w * 0.60, h * 0.64),
          Paint()
            ..color = Colors.amber
            ..strokeWidth = 3
            ..strokeCap = StrokeCap.round,
        );
        break;

      case MascotMood.sleepy:
      // Night cap (triangle)
        final capPath = Path()
          ..moveTo(w * 0.34, h * 0.22)
          ..lineTo(w * 0.66, h * 0.22)
          ..lineTo(w * 0.50, h * 0.06)
          ..close();
        canvas.drawPath(
            capPath,
            Paint()
              ..color = AppTheme.secondary.withValues(alpha: 0.8));
        // Pompom
        canvas.drawCircle(
          Offset(w * 0.50, h * 0.08),
          5,
          Paint()..color = Colors.white70,
        );
        break;

      case MascotMood.scared:
      // Sweat drops
        canvas.drawOval(
          Rect.fromCenter(
              center: Offset(w * 0.25, h * 0.30), width: 4, height: 7),
          Paint()..color = Colors.lightBlue,
        );
        canvas.drawOval(
          Rect.fromCenter(
              center: Offset(w * 0.22, h * 0.36), width: 3, height: 5),
          Paint()..color = Colors.lightBlue.withValues(alpha: 0.7),
        );
        break;

      case MascotMood.sad:
      // Teardrop
        final tearPath = Path()
          ..moveTo(w * 0.42, h * 0.36)
          ..quadraticBezierTo(w * 0.38, h * 0.40, w * 0.40, h * 0.44)
          ..quadraticBezierTo(w * 0.44, h * 0.46, w * 0.44, h * 0.40)
          ..close();
        canvas.drawPath(tearPath, Paint()..color = Colors.lightBlue);
        break;

      case MascotMood.questioning:
      // ? mark above head
        final textPainter = TextPainter(
          text: const TextSpan(
            text: "?",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.accent,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        textPainter.layout();
        textPainter.paint(canvas, Offset(w * 0.64, h * 0.05));
        break;

      default:
        break;
    }
  }

  void _drawHeart(Canvas canvas, Offset center, double size, Color color) {
    final path = Path();
    path.moveTo(center.dx, center.dy + size * 0.3);
    path.cubicTo(
        center.dx, center.dy, center.dx - size, center.dy,
        center.dx - size, center.dy - size * 0.5);
    path.cubicTo(
        center.dx - size, center.dy - size * 1.2,
        center.dx, center.dy - size * 1.2,
        center.dx, center.dy - size * 0.5);
    path.cubicTo(
        center.dx, center.dy - size * 1.2,
        center.dx + size, center.dy - size * 1.2,
        center.dx + size, center.dy - size * 0.5);
    path.cubicTo(
        center.dx + size, center.dy,
        center.dx, center.dy,
        center.dx, center.dy + size * 0.3);
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_PigeonPainter old) =>
      old.mood != mood ||
          old.wingFlap != wingFlap ||
          old.isSpeaking != isSpeaking;
}