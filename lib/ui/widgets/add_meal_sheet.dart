import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:vital_track/ui/screens/scan_screen.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/ai_loading_animation.dart';

class AddMealSheet extends StatefulWidget {
  const AddMealSheet({super.key});

  @override
  State<AddMealSheet> createState() => _AddMealSheetState();
}

class _AddMealSheetState extends State<AddMealSheet> {
  final ImagePicker _picker = ImagePicker();
  final stt.SpeechToText _speech = stt.SpeechToText();
  final TextEditingController _textController = TextEditingController();

  bool _isProcessing = false;
  bool _isListening = false;
  bool _showTextInput = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    // Only initialize on mobile as it often crashes on macOS/Web
    if (kIsWeb || (defaultTargetPlatform != TargetPlatform.android && defaultTargetPlatform != TargetPlatform.iOS)) {
      return;
    }
    try {
      await _speech.initialize();
    } catch (e) {
      debugPrint("Speech initialization failed: $e");
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<bool> _confirmAIUsage() async {
    return await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ctx.colors.surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: ctx.colors.border)),
        title: Text("Utiliser l'IA ?",
            style: TextStyle(color: ctx.colors.textPrimary, fontSize: 18)),
        content: Text(
          "L'analyse consomme 1 crédit par requête. Confirmer ?",
          style: TextStyle(color: ctx.colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text("Annuler",
                style: TextStyle(color: ctx.colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text("Analyser",
                style: TextStyle(
                    color: ctx.colors.accent,
                    fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    ) ??
        false;
  }

  Future<void> _handlePhoto() async {
    if (!await _confirmAIUsage()) return;
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 800,
      imageQuality: 70,
    );
    if (image != null && mounted) _analyzeImage(image);
  }

  Future<void> _handleGallery() async {
    if (!await _confirmAIUsage()) return;
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 70,
    );
    if (image != null && mounted) _analyzeImage(image);
  }

  Future<void> _handleScan() async {
    Navigator.pop(context);
    if (!mounted) return;
    Navigator.push(
        context, MaterialPageRoute(builder: (_) => const ScanScreen()));
  }

  void _toggleListening() async {
    if (kIsWeb || (defaultTargetPlatform != TargetPlatform.android && defaultTargetPlatform != TargetPlatform.iOS)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text("La commande vocale n'est pas disponible sur cet appareil."),
      ));
      return;
    }
    if (_isListening) {
      _speech.stop();
      setState(() => _isListening = false);
      if (_textController.text.isNotEmpty) _analyzeText(_textController.text);
    } else {
      try {
        final available = await _speech.initialize();
        if (available) {
          setState(() => _isListening = true);
          _speech.listen(
            onResult: (val) {
              setState(() => _textController.text = val.recognizedWords);
              if (val.finalResult) {
                setState(() => _isListening = false);
                _analyzeText(val.recognizedWords);
              }
            },
          );
        }
      } catch (e) {
        debugPrint("Speech listen error: $e");
      }
    }
  }

  Future<void> _analyzeText(String text) async {
    if (text.isEmpty) return;
    if (!await _confirmAIUsage()) return;
    setState(() {
      _isProcessing = true;
    });
    final json = await AIService.analyzeText(text);
    _handleAIResponse(json);
  }

  Future<void> _analyzeImage(XFile image) async {
    setState(() {
      _isProcessing = true;
    });
    final json = await AIService.analyzeImage(image);
    _handleAIResponse(json);
  }

  void _handleAIResponse(Map<String, dynamic>? json) {
    if (!mounted) return;
    setState(() {
      _isProcessing = false;
    });

    if (json != null) {
      final foods = FoodMapper.fromAIJsonList(json);
      
      if (foods.length == 1) {
        // Single item -> Quick Add Modal
        Navigator.pop(context);
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => FoodModal(food: foods.first),
        );
        return;
      } else if (foods.length > 1) {
        // Multiple items -> Scan Results Screen
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ScanScreen(initialFoods: foods),
          ),
        );
        return;
      }
    }
    
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Text("L'IA n'a pas pu identifier d'aliments."),
      backgroundColor: context.colors.error,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        top: 12,
        left: 24,
        right: 24,
      ),
      decoration: BoxDecoration(
        color: colors.sheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: colors.sheetBorder)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Drag handle ──
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── Header: title + close ──
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Ajouter un repas",
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: colors.surfaceSubtle,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close, size: 18, color: colors.icon),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── Processing indicator ──
            if (_isProcessing)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: AiLoadingAnimation(
                  initialTitle: "Connexion à VitalTrack AI Engine...",
                ),
              ),

            // ── 2×2 Action Grid ──
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.camera_alt_rounded,
                    iconColor: const Color(0xFF1E8E3E),
                    iconBgColor: const Color(0xFFE6F4EA),
                    title: "Photo",
                    subtitle: "Photographier mon plat",
                    onTap: _handlePhoto,
                    colors: colors,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.mic_rounded,
                    iconColor: const Color(0xFF1A73E8),
                    iconBgColor: const Color(0xFFE8F0FE),
                    title: "Vocal",
                    subtitle: "Dicter mon repas",
                    onTap: _toggleListening,
                    isActive: _isListening,
                    colors: colors,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.edit_rounded,
                    iconColor: const Color(0xFF7C3AED),
                    iconBgColor: const Color(0xFFF3E8FF),
                    title: "Texte",
                    subtitle: "Écrire manuellement",
                    onTap: () {
                      // Show the text input inline
                      setState(() => _showTextInput = true);
                    },
                    colors: colors,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.qr_code_scanner_rounded,
                    iconColor: const Color(0xFFE8710A),
                    iconBgColor: const Color(0xFFFEF3E2),
                    title: "Scan",
                    subtitle: "Scanner un code-barres",
                    onTap: _handleScan,
                    colors: colors,
                  ),
                ),
              ],
            ),

            // ── Inline text input (shown on "Texte" tap) ──
            if (_showTextInput) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      autofocus: true,
                      style: TextStyle(color: colors.textPrimary),
                      decoration: InputDecoration(
                        hintText: "Ex : pommes, bananes, noix...",
                        hintStyle: TextStyle(color: colors.textTertiary, fontSize: 13),
                        helperText: "Séparez les aliments par une virgule pour l'IA",
                        helperStyle: TextStyle(color: colors.accent.withValues(alpha: 0.7), fontSize: 11),
                      ),
                      onSubmitted: (val) => _analyzeText(val),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => _analyzeText(_textController.text),
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: colors.accent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(Icons.arrow_upward_rounded,
                          color: colors.accentOnPrimary, size: 22),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 20),

            // ── Gallery shortcut (secondary action) ──
            GestureDetector(
              onTap: _handleGallery,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: colors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_library_outlined,
                        size: 20, color: colors.textSecondary),
                    const SizedBox(width: 8),
                    Text(
                      "Importer depuis la galerie",
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── Bottom close button ──
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: colors.textPrimary,
                  shape: BoxShape.circle,
                ),
                child:
                    Icon(Icons.close, size: 24, color: colors.sheetBg),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Polished Action Card ──────────────────────────────────────────────────────

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final AppColors colors;
  final bool isActive;

  const _ActionCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.colors,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        decoration: BoxDecoration(
          color: isActive
              ? iconBgColor
              : colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isActive
                ? iconColor.withValues(alpha: 0.4)
                : colors.border,
          ),
        ),
        child: Column(
          children: [
            // Icon circle
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 26),
            ),
            const SizedBox(height: 12),
            // Title
            Text(
              title,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            // Subtitle
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: colors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}