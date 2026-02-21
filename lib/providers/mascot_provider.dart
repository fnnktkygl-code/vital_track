import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:vital_track/models/food.dart';
import 'package:vital_track/ui/widgets/circadian_clock_card.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/providers/mascot_knowledge_base.dart';
import 'package:vital_track/services/fasting_coach_knowledge.dart';

class MascotProvider with ChangeNotifier {
  MascotMessage? _currentMessage;
  MascotMood _mood = MascotMood.questioning;
  bool _isVisible = true;
  bool _isSpeaking = false;
  Timer? _autoHideTimer;
  Timer? _idleTimer;

  String _activeModeId = "sebi";
  String _currentContext = "dashboard"; // current screen/action

  MascotMessage? get currentMessage => _currentMessage;
  MascotMood get mood => _mood;
  bool get isVisible => _isVisible;
  bool get isSpeaking => _isSpeaking;

  MascotProvider() {
    _startIdleLoop();
  }

  void setContext(String contextStr) {
    if (_currentContext != contextStr) {
      _currentContext = contextStr;
    }
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

  // ── Fasting coaching ───────────────────────────────────────────────────────

  /// Show a fasting check-in with quick-reply chips
  void onFastingCheckIn(CoachCheckIn checkIn, void Function(String) onReply) {
    _showMessage(
      MascotMessage(
        text: '${checkIn.emoji} ${checkIn.question}\n\n${checkIn.insight}',
        mood: MascotMood.questioning,
        source: 'Coach Jeûne',
        quickReplies: checkIn.quickReplies,
        onReply: onReply,
      ),
      autoDismiss: 30, // Keep check-ins visible longer
    );
  }

  /// Show symptom-specific advice from the protocol doctor
  void onFastingSymptomAdvice(CoachAdvice advice) {
    _showMessage(
      MascotMessage(
        text: '${advice.emoji} ${advice.quote}\n\n${advice.explanation}\n\n💡 ${advice.actionTip}',
        mood: MascotMood.talking,
        source: 'Coach Jeûne',
      ),
      autoDismiss: 12, // Keep advice visible long enough to read
    );
  }

  /// Show goal-specific motivation during fasting
  void onFastingMotivation(String message) {
    _showMessage(
      MascotMessage(
        text: message,
        mood: MascotMood.proud,
        source: 'Coach Jeûne',
      ),
      autoDismiss: 8,
    );
  }

  CircadianPhase getCurrentCircadianPhase() {
    final hour = DateTime.now().hour;
    if (hour >= 4 && hour < 12) return CircadianPhase.elimination;
    if (hour >= 12 && hour < 20) return CircadianPhase.appropriation;
    return CircadianPhase.assimilation;
  }

  void showRandomTip() {
    // 30% chance to show a Circadian tip if we are on the dashboard
    if (_currentContext == "dashboard" && DateTime.now().millisecond % 3 == 0) {
      final phase = getCurrentCircadianPhase();
      final circadianTip = MascotKnowledgeBase.circadianTipForMode(_activeModeId, phase, DateTime.now());
      if (circadianTip != null) {
        _showMessage(circadianTip, autoDismiss: 7);
        return;
      }
    }

    final tips = _getDynamicTipsForMode(_activeModeId);
    if (tips.isEmpty) return;
    
    // Mix in time to add randomness among contextual tips
    final index = DateTime.now().millisecondsSinceEpoch % tips.length;
    _showMessage(tips[index], autoDismiss: 7);
  }

  // ── Dynamic Hive Knowledge ──────────────────────────────────────────────────

  List<MascotMessage> _getDynamicTipsForMode(String modeId) {
    // 1. Base hardcoded tips filtered by context
    final allBaseTips = MascotKnowledgeBase.tipsForMode(modeId).toList();
    List<MascotMessage> contextualTips = [];

    // Filter base tips heuristically based on context keywords
    for (var tip in allBaseTips) {
       final t = tip.text.toLowerCase();
       if (_currentContext == "fasting" && (t.contains("jeûne") || t.contains("digestion") || t.contains("repos"))) {
         contextualTips.add(tip);
       } else if (_currentContext == "search" && (t.contains("fruit") || t.contains("légume") || t.contains("acid"))) {
         contextualTips.add(tip);
       } else if (_currentContext == "profile" && (t.contains("objectif") || t.contains("corps") || t.contains("santé"))) {
         contextualTips.add(tip);
       } else if (_currentContext == "dashboard" && (t.contains("jour") || t.contains("énergie") || t.contains("vital"))) {
         contextualTips.add(tip);
       }
    }

    // Fallback if no specific hardcoded match
    if (contextualTips.isEmpty) contextualTips = allBaseTips.take(3).toList();

    try {
      if (!Hive.isBoxOpen('knowledge_sources')) return contextualTips;
      
      final box = Hive.box<KnowledgeSource>('knowledge_sources');
      final allSources = box.values;
      
      // 2. Identify relevant sources based on mode
      String searchKeyword = "";
      String sourceAuthor = "";
      if (modeId == "sebi") {
        searchKeyword = "sebi";
        sourceAuthor = "Dr. Sebi";
      } else if (modeId == "ehret") {
        searchKeyword = "ehret";
        sourceAuthor = "Arnold Ehret";
      } else if (modeId == "morse") {
        searchKeyword = "morse";
        sourceAuthor = "Dr. Morse";
      }

      if (searchKeyword.isEmpty) return contextualTips;

      final dynamicMessages = <MascotMessage>[];
      
      // Contextual keywords to map Hive text chunks
      List<String> contextFilters = [];
      if (_currentContext == "fasting") {
          contextFilters = ["jeûne", "fasting", "mucus", "élimination", "repos", "toxine"];
      } else if (_currentContext == "search" || _currentContext == "scan") {
          contextFilters = ["fruit", "digestion", "alcalin", "acide", "plante", "herbe"];
      } else if (_currentContext == "profile") {
          contextFilters = ["guérison", "cellule", "génétique", "faiblesse"];
      } else {
          // Dashboard / default: broad general health terms
          contextFilters = ["vital", "énergie", "nature", "loi", "corps"];
      }

      // Extract chunks from matching sources that fit the context
      for (final source in allSources) {
        if (source.title.toLowerCase().contains(searchKeyword)) {
          for (var chunk in source.chunks) {
            // Clean formatting artifacts and newlines
            chunk = chunk.replaceAll('\n', ' ').trim();
            
            // Strict filtering: exclude formatting separators and enforce chat-bubble lengths
            bool isFormatting = chunk.contains('===') || chunk.contains('---') || chunk.startsWith('http');
            if (!isFormatting && chunk.length >= 20 && chunk.length <= 160) {
              final lowerChunk = chunk.toLowerCase();
              bool matchesContext = contextFilters.any((f) => lowerChunk.contains(f));
              
              if (matchesContext) {
                dynamicMessages.add(MascotMessage(
                  text: "📖 $chunk",
                  mood: MascotMood.talking,
                  source: sourceAuthor,
                ));
              }
            }
          }
        }
      }
      
      // If we found dynamic context messages, prioritize them
      if (dynamicMessages.isNotEmpty) {
          return [...contextualTips, ...dynamicMessages];
      }
      
      return contextualTips;
    } catch (e) {
      debugPrint("Error loading dynamic mascot tips: $e");
      return contextualTips;
    }
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
        // 50% chance to show a time-based idle message, 50% chance for a random knowledge tip
        if (DateTime.now().second % 2 == 0) {
          final idle = MascotKnowledgeBase.idleMessage(_activeModeId);
          _showMessage(idle, autoDismiss: 6);
        } else {
          showRandomTip();
        }
      }
    });
  }
}