import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:vital_track/ui/screens/scan_screen.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/pulse_ring.dart';

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
  String _processingLabel = "";

  @override
  void initState() {
    super.initState();
    _speech.initialize();
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
    if (_isListening) {
      _speech.stop();
      setState(() => _isListening = false);
      if (_textController.text.isNotEmpty) _analyzeText(_textController.text);
    } else {
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
    }
  }

  Future<void> _analyzeText(String text) async {
    if (text.isEmpty) return;
    if (!await _confirmAIUsage()) return;
    setState(() {
      _isProcessing = true;
      _processingLabel = "Analyse IA en cours...";
    });
    final json = await AIService.analyzeText(text);
    _handleAIResponse(json);
  }

  Future<void> _analyzeImage(XFile image) async {
    setState(() {
      _isProcessing = true;
      _processingLabel = "Vision IA analyse l'image...";
    });
    final json = await AIService.analyzeImage(image);
    _handleAIResponse(json);
  }

  void _handleAIResponse(Map<String, dynamic>? json) {
    if (!mounted) return;
    setState(() {
      _isProcessing = false;
      _processingLabel = "";
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
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        top: 24,
        left: 24,
        right: 24,
      ),
      decoration: BoxDecoration(
        color: colors.sheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: colors.sheetBorder)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
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
          const SizedBox(height: 24),

          // Header
          Row(
            children: [
              Icon(Icons.add_circle_outline, color: colors.accent, size: 26),
              const SizedBox(width: 12),
              Text(
                "Ajouter un repas",
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Processing indicator
          if (_isProcessing)
            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  PulseRing(color: colors.accent, size: 36),
                  const SizedBox(width: 16),
                  Text(_processingLabel,
                      style: TextStyle(color: colors.textSecondary)),
                ],
              ),
            ),

          // Text input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  style: TextStyle(color: colors.textPrimary),
                  decoration: InputDecoration(
                    hintText: "Décrivez l'aliment...",
                    hintStyle: TextStyle(color: colors.textTertiary),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Send text button
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
          const SizedBox(height: 20),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: _ActionBtn(
                  emoji: "📷",
                  label: "Caméra",
                  onTap: _handlePhoto,
                  colors: colors,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionBtn(
                  emoji: "🖼️",
                  label: "Galerie",
                  onTap: _handleGallery,
                  colors: colors,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionBtn(
                  emoji: "📦",
                  label: "Scanner",
                  onTap: _handleScan,
                  colors: colors,
                  isPrimary: true,
                ),
              ),
              const SizedBox(width: 10),
              // Mic button
              GestureDetector(
                onTap: _toggleListening,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: _isListening
                        ? colors.error.withValues(alpha: 0.12)
                        : colors.surfaceSubtle,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _isListening
                          ? colors.error.withValues(alpha: 0.4)
                          : colors.border,
                    ),
                  ),
                  child: Icon(
                    _isListening ? Icons.mic_off : Icons.mic,
                    color: _isListening ? colors.error : colors.icon,
                    size: 24,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback onTap;
  final AppColors colors;
  final bool isPrimary;

  const _ActionBtn({
    required this.emoji,
    required this.label,
    required this.onTap,
    required this.colors,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: isPrimary
              ? Color.alphaBlend(colors.accentMuted, colors.surface)
              : colors.surfaceSubtle,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isPrimary
                ? colors.accent.withValues(alpha: 0.3)
                : colors.border,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isPrimary ? colors.accent : colors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}