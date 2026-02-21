
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/animated_pigeon.dart';
import 'package:vital_track/ui/screens/chat_screen.dart';

/// Drop-in overlay mascot. Add to any Scaffold as a Stack child.
/// Sits bottom-right above the nav bar.
class MascotOverlay extends StatelessWidget {
  final GlobalKey<NavigatorState> navigatorKey;
  const MascotOverlay({super.key, required this.navigatorKey});

  @override
  Widget build(BuildContext context) {
    return _MascotStack(navigatorKey: navigatorKey);
  }
}

class _MascotStack extends StatefulWidget {
  final GlobalKey<NavigatorState> navigatorKey;
  const _MascotStack({required this.navigatorKey});

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
    if (_position.dx < -20) {
      setState(() {
        _isDocked = true;
        _position = Offset(-40, _position.dy > 0 ? _position.dy : 120.0);
      });
    } else {
      if (_position.dy < 40) {
        setState(() {
          _isDocked = false;
          _position = Offset(_position.dx < 0 ? 16 : _position.dx, -32.0);
        });
      } else {
        setState(() {
          _position = Offset(_position.dx < 0 ? 16 : _position.dx, _position.dy < 100 ? 100.0 : _position.dy);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<MascotProvider>(
      builder: (context, mascot, _) {
        final msg = mascot.currentMessage;
        final mood = mascot.mood;

          // Auto-undock or un-hide if message arrives
          if (msg != null && (_isDocked || _position.dy < 0)) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
               setState(() {
                 _isDocked = false;
                 _position = Offset(16, _position.dy < 0 ? 120.0 : _position.dy);
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
            child: Material(
              type: MaterialType.transparency,
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
            ),
          );
        }

        // FLOATING STATE
        return Positioned(
          right: _position.dx.clamp(-50.0, MediaQuery.of(context).size.width - 100),
          bottom: _position.dy.clamp(-35.0, MediaQuery.of(context).size.height - 200),
          child: Material(
            type: MaterialType.transparency,
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
                      navigatorKey: widget.navigatorKey,
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
  final GlobalKey<NavigatorState> navigatorKey;

  const _SpeechBubble({
    required this.message,
    required this.onDismiss,
    required this.onTip,
    required this.navigatorKey,
  });

  Color _bubbleColor(AppColors colors, MascotMood mood) {
    return colors.surface;
  }

  Color _borderColor(AppColors colors, MascotMood mood) {
    switch (mood) {
      case MascotMood.loving:
      case MascotMood.proud:
      case MascotMood.excited:
        return colors.accent;
      case MascotMood.stern:
      case MascotMood.scared:
      case MascotMood.sad:
        return colors.error;
      case MascotMood.questioning:
        return colors.accentSecondary;
      default:
        return colors.border;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bgColor = _bubbleColor(colors, message.mood);
    final baseBorderColor = _borderColor(colors, message.mood);
    final adaptiveTextBorderColor = colors.adaptForText(baseBorderColor);

    return Material(
      type: MaterialType.transparency,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            constraints: const BoxConstraints(maxWidth: 240),
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(4),
              ),
              border: Border.all(color: adaptiveTextBorderColor.withValues(alpha: 0.3), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: colors.isDark ? 0.5 : 0.15),
                  blurRadius: 12,
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
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: adaptiveTextBorderColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: adaptiveTextBorderColor.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      message.source!.toUpperCase(),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: adaptiveTextBorderColor,
                        letterSpacing: 0.8,
                        decoration: TextDecoration.underline, // Keeping underline for author as requested
                      ),
                    ),
                  ),

                // Message text
                Text(
                  message.text,
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textPrimary,
                    height: 1.5,
                    fontWeight: FontWeight.w500,
                    decoration: TextDecoration.none,
                  ),
                ),

                // Quick-reply chips (fasting check-ins)
                if (message.quickReplies.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: message.quickReplies.map((reply) {
                      return GestureDetector(
                        onTap: () {
                          message.onReply?.call(reply);
                          onDismiss();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: colors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: colors.accent.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            reply,
                            style: TextStyle(
                              fontSize: 11,
                              color: colors.adaptForText(colors.accent),
                              fontWeight: FontWeight.w700,
                              decoration: TextDecoration.none,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],

                const SizedBox(height: 16),

                // Action row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: onTip,
                      child: Text(
                        "Autre conseil",
                        style: TextStyle(
                          fontSize: 11,
                          color: colors.textSecondary,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            onDismiss();
                            navigatorKey.currentState?.push(MaterialPageRoute(builder: (_) => const ChatScreen()));
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: colors.accent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.chat_bubble_rounded, size: 11, color: colors.accentOnPrimary),
                                const SizedBox(width: 4),
                                Text(
                                  "Discuter",
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: colors.accentOnPrimary,
                                    fontWeight: FontWeight.w800,
                                    decoration: TextDecoration.none,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: onDismiss,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: colors.surfaceSubtle,
                              border: Border.all(color: colors.border),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "OK",
                              style: TextStyle(
                                fontSize: 11,
                                color: colors.textPrimary,
                                fontWeight: FontWeight.w800,
                                decoration: TextDecoration.none,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Dismiss X
          Positioned(
            top: -8,
            right: -8,
            child: GestureDetector(
              onTap: onDismiss,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: colors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: colors.border),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4),
                  ],
                ),
                child: Icon(
                  Icons.close_rounded,
                  size: 14,
                  color: colors.textTertiary,
                ),
              ),
            ),
          ),

          // Bubble tail (bottom-right pointing down)
          Positioned(
            bottom: -8,
            right: 18,
            child: CustomPaint(
              painter: _BubbleTailPainter(
                borderColor: adaptiveTextBorderColor.withValues(alpha: 0.3),
                bgColor: bgColor,
              ),
              size: const Size(14, 10),
            ),
          ),
        ],
      ),
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
// PIGEON BODY
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
          // Mascot Vector SVG equivalent
          AnimatedPigeon(
            mood: mood,
            isSpeaking: isSpeaking,
            size: 64, // Keep it relatively contained to the 76x76 box
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