import 'dart:async';
import 'package:flutter/material.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';

class MascotProvider with ChangeNotifier {
  MascotMessage? _currentMessage;
  MascotMood _mood = MascotMood.questioning;
  bool _isVisible = true;
  bool _isSpeaking = false;
  Timer? _autoHideTimer;
  Timer? _idleTimer;

  String _activeModeId = "sebi";

  MascotMessage? get currentMessage => _currentMessage;
  MascotMood get mood => _mood;
  bool get isVisible => _isVisible;
  bool get isSpeaking => _isSpeaking;

  MascotProvider() {
    _startIdleLoop();
  }

  @override
  void dispose() {
    _autoHideTimer?.cancel();
    _idleTimer?.cancel();
    super.dispose();
  }

  // ── PUBLIC API ──────────────────────────────────────────────────────────────

  void onAppLaunch(String modeId) {
    _activeModeId = modeId;
    _showMessage(MascotKnowledgeBase.modeWelcome(modeId), autoDismiss: 5);
  }

  void onModeChanged(String modeId) {
    _activeModeId = modeId;
    _showMessage(MascotKnowledgeBase.modeWelcome(modeId), autoDismiss: 5);
  }

  void onGoodFoodAdded(Food food) {
    _showMessage(
      MascotKnowledgeBase.reactionGoodFood(food.name, _activeModeId),
      autoDismiss: 4,
    );
  }

  void onBadFoodAdded(Food food) {
    _showMessage(
      MascotKnowledgeBase.reactionBadFood(food.name, _activeModeId),
      autoDismiss: 5,
    );
  }

  void onTrophologyWarning(String combo) {
    _showMessage(
      MascotKnowledgeBase.reactionTrophologyWarning(combo),
      autoDismiss: 6,
    );
  }

  void onHighScore(int score) {
    _showMessage(
      MascotKnowledgeBase.reactionHighScore(score),
      autoDismiss: 4,
    );
  }

  void onLowScore(int score) {
    _showMessage(
      MascotKnowledgeBase.reactionLowScore(score),
      autoDismiss: 5,
    );
  }

  void onScanStarted() {
    _showMessage(
      const MascotMessage(
        text: "🔍 J'analyse... Montre-moi ce que tu manges !",
        mood: MascotMood.excited,
      ),
      autoDismiss: 3,
    );
  }

  void onSearchQuery(String query, bool hasExpertMatch) {
    if (!hasExpertMatch && query.length > 2) {
      _showMessage(
        MascotMessage(
          text: "🤔 « $query » n'est pas dans ma base vitaliste. Je consulte OpenFoodFacts…",
          mood: MascotMood.questioning,
        ),
        autoDismiss: 3,
      );
    }
  }

  void showRandomTip() {
    final tips = MascotKnowledgeBase.tipsForMode(_activeModeId);
    final index = DateTime.now().second % tips.length;
    _showMessage(tips[index], autoDismiss: 7);
  }

  void dismiss() {
    _autoHideTimer?.cancel();
    _isSpeaking = false;
    _currentMessage = null;
    notifyListeners();
  }

  void toggleVisibility() {
    _isVisible = !_isVisible;
    notifyListeners();
  }

  // ── PRIVATE ─────────────────────────────────────────────────────────────────

  void _showMessage(MascotMessage message, {int autoDismiss = 5}) {
    _autoHideTimer?.cancel();
    _currentMessage = message;
    _mood = message.mood;
    _isSpeaking = true;
    notifyListeners();

    _autoHideTimer = Timer(Duration(seconds: autoDismiss), () {
      _isSpeaking = false;
      _currentMessage = null;
      notifyListeners();
    });
  }

  void _startIdleLoop() {
    // Show contextual tip every 30s if nothing else is happening
    _idleTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (!_isSpeaking) {
        final idle = MascotKnowledgeBase.idleMessage(_activeModeId);
        _showMessage(idle, autoDismiss: 6);
      }
    });
  }
}