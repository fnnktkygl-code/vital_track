import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/utils/food_mapper.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/food_modal.dart';
import 'package:vital_track/ui/widgets/pulse_ring.dart';

class AIInputSheet extends StatefulWidget {
  const AIInputSheet({super.key});

  @override
  State<AIInputSheet> createState() => _AIInputSheetState();
}

class _AIInputSheetState extends State<AIInputSheet> {
  final TextEditingController _textController = TextEditingController();
  final stt.SpeechToText _speech = stt.SpeechToText();
  final ImagePicker _picker = ImagePicker();

  bool _isListening = false;
  bool _isAnalyzing = false;
  String _status = "Posez votre question ou scannez...";

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

  void _listen() async {
    if (!_isListening) {
      bool available = await _speech.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speech.listen(
          onResult: (val) {
            setState(() {
              _textController.text = val.recognizedWords;
              if (val.finalResult) {
                _isListening = false;
                _analyzeText();
              }
            });
          },
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final permission = source == ImageSource.camera
        ? Permission.camera
        : Permission.photos;
    if (await permission.request().isGranted) {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) _analyzeImage(image);
    }
  }

  Future<void> _analyzeText() async {
    if (_textController.text.isEmpty) return;
    setState(() {
      _isAnalyzing = true;
      _status = "Analyse IA en cours...";
    });
    final json = await AIService.analyzeText(_textController.text);
    _handleAIResponse(json);
  }

  Future<void> _analyzeImage(XFile image) async {
    setState(() {
      _isAnalyzing = true;
      _status = "Vision IA analyse l'image...";
    });
    final json = await AIService.analyzeImage(image);
    _handleAIResponse(json);
  }

  void _handleAIResponse(Map<String, dynamic>? json) {
    if (!mounted) return;
    setState(() {
      _isAnalyzing = false;
      _status = "Analyse terminée.";
    });

    if (json != null) {
      final food = FoodMapper.fromAIJson(json);
      if (food != null) {
        Navigator.pop(context);
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => FoodModal(food: food),
        );
        return;
      }
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Text("L'IA n'a pas pu analyser cet élément."),
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
              Icon(Icons.auto_awesome, color: colors.accentSecondary, size: 26),
              const SizedBox(width: 12),
              Text(
                "Vital AI",
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Status / Pulse animation
          if (_isAnalyzing || _isListening)
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                children: [
                  PulseRing(
                    color: _isListening ? colors.error : colors.accent,
                    size: 56,
                  ),
                  const SizedBox(height: 14),
                  Text(_status,
                      style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                ],
              ),
            ),

          // Input field
          TextField(
            controller: _textController,
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              hintText: "Ex: Est-ce que le riz blanc est ok ?",
              hintStyle: TextStyle(color: colors.textTertiary),
              suffixIcon: GestureDetector(
                onTap: _analyzeText,
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colors.accent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.arrow_upward_rounded,
                      color: colors.accentOnPrimary, size: 18),
                ),
              ),
            ),
            onSubmitted: (_) => _analyzeText(),
          ),
          const SizedBox(height: 24),

          // Action buttons row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildActionButton(
                emoji: _isListening ? "🔇" : "🎙️",
                label: "Vocal",
                color: _isListening ? colors.error : colors.accent,
                bgColor: _isListening
                    ? colors.error.withValues(alpha: 0.1)
                    : colors.accentMuted,
                borderColor: _isListening
                    ? colors.error.withValues(alpha: 0.3)
                    : colors.accent.withValues(alpha: 0.25),
                onTap: _listen,
              ),
              _buildActionButton(
                emoji: "📷",
                label: "Caméra",
                color: colors.accentSecondary,
                bgColor: colors.accentSecondary.withValues(alpha: 0.1),
                borderColor: colors.accentSecondary.withValues(alpha: 0.3),
                onTap: () => _pickImage(ImageSource.camera),
              ),
              _buildActionButton(
                emoji: "🖼️",
                label: "Galerie",
                color: colors.textSecondary,
                bgColor: colors.surfaceSubtle,
                borderColor: colors.border,
                onTap: () => _pickImage(ImageSource.gallery),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String emoji,
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
              border: Border.all(color: borderColor),
            ),
            child: Text(emoji, style: const TextStyle(fontSize: 24)),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}