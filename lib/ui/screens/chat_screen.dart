import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/models/chat_message.dart';
import 'package:vital_track/models/diet_plan.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/providers/diet_plan_provider.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/providers/mascot_provider.dart';
import 'package:vital_track/providers/meal_provider.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/diet_plan_generator.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/knowledge_service.dart';
import 'package:vital_track/services/vital_rules_engine.dart';
import 'package:vital_track/ui/screens/diet_plan_calendar_screen.dart';
import 'package:vital_track/ui/theme.dart';
import 'package:vital_track/ui/widgets/chat/chat_bubble.dart';
import 'package:vital_track/utils/food_mapper.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _ctrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final HiveService _hiveService = HiveService();
  late final KnowledgeService _knowledgeService;
  List<ChatMessage> _messages = [];
  bool _isTyping = false;
  StreamSubscription<String>? _streamSub;

  @override
  void initState() {
    super.initState();
    _knowledgeService = KnowledgeService(_hiveService);
    _loadHistory();
  }

  void _loadHistory() {
    final history = _hiveService.loadChatHistory();
    if (history.isEmpty) {
      final welcome = ChatMessage(
        text:
            "Coo! Je suis ton guide Vitaliste. Pose-moi des questions sur le Dr. Sebi, Arnold Ehret, ou le Dr. Morse — je peux aussi te créer un programme de jeûne ou un plan alimentaire complet, calendrier inclus ! 🐦📅",
        isUser: false,
      );
      _messages.add(welcome);
      _hiveService.saveChatMessage(welcome);
    } else {
      _messages = history;
    }
    setState(() {});
  }

  @override
  void dispose() {
    _streamSub?.cancel();
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  ({
    String text,
    FastingProgram? program,
    DietPlan? dietPlan,
    List<String> suggestFoods
  }) _parseAiResponse(String text) {
    final jsonRegex =
        RegExp(r'```json\s*(\{[\s\S]*?\})\s*```', caseSensitive: false);
    final match = jsonRegex.firstMatch(text);
    if (match == null) {
      return (
        text: text,
        program: null,
        dietPlan: null,
        suggestFoods: const []
      );
    }

    FastingProgram? program;
    DietPlan? dietPlan;
    List<String> suggestFoods = const [];

    try {
      final jsonStr = match.group(1)!;
      final decoded = json.decode(jsonStr) as Map<String, dynamic>;

      final programData = decoded['program'] as Map<String, dynamic>?;
      if (programData != null) {
        final configsList = (programData['configs'] as List<dynamic>?) ?? [];
        final configs = configsList.map((c) {
          final typeStr = c['type'] as String? ?? 'intermittent';
          final type = _parseFastingType(typeStr);
          return FastingSessionConfig(
            type: type,
            durationMinutes: (c['durationMinutes'] as num?)?.toInt() ?? 480,
            breakHours: (c['breakHours'] as num?)?.toInt() ?? 0,
          );
        }).toList();

        program = FastingProgram(
          id: const Uuid().v4(),
          name: programData['name'] as String? ?? 'Programme Vitaliste',
          targetObjective: programData['targetObjective'] as String? ?? '',
          startDate: DateTime.now(),
          configs: configs,
          protocol: programData['protocol'] as String? ?? 'vitalist',
        );
      }

      final planReq = decoded['dietPlanRequest'] as Map<String, dynamic>?;
      if (planReq != null) {
        final protocol = planReq['protocol'] as String? ?? 'personalized';
        final objective = planReq['objective'] as String? ?? '';
        final numDays = (planReq['numDays'] as num?)?.toInt() ?? 7;
        final restrictions = planReq['restrictions'] as String? ?? '';
        dietPlan = DietPlanGenerator.generate(
          protocol: protocol,
          numDays: numDays,
          objective: objective,
          restrictions: restrictions,
          source: 'chat',
        );
      }

      final foods = decoded['suggestFoods'] as List<dynamic>?;
      if (foods != null) {
        suggestFoods = foods.map((e) => e.toString()).toList();
      }

      final cleanText = text.replaceAll(match.group(0)!, '').trim();
      return (
        text: cleanText,
        program: program,
        dietPlan: dietPlan,
        suggestFoods: suggestFoods
      );
    } catch (e) {
      debugPrint('ChatScreen: Failed to parse AI JSON block: $e');
      return (
        text: text,
        program: null,
        dietPlan: null,
        suggestFoods: const []
      );
    }
  }

  FastingType _parseFastingType(String typeStr) {
    switch (typeStr.toLowerCase().trim()) {
      case 'waterfast':
        return FastingType.waterFast;
      case 'juicefast':
        return FastingType.juiceFast;
      case 'fruitfast':
        return FastingType.fruitFast;
      case 'grapecure':
        return FastingType.grapeCure;
      case 'drysunfast':
        return FastingType.drySunFast;
      case 'monofruit':
        return FastingType.monoFruit;
      default:
        return FastingType.intermittent;
    }
  }

  Future<void> _sendMessage() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _isTyping) return;

    final contextSources = _knowledgeService.searchSources(text);
    final profile = context.read<ProfileProvider>().profile;
    final fileParts = await _knowledgeService.getFileParts();

    final userMsg = ChatMessage(text: text, isUser: true);
    var aiMsg = ChatMessage(
      text: '',
      isUser: false,
      isStreaming: true,
      sources: contextSources,
    );

    setState(() {
      _messages.add(userMsg);
      _messages.add(aiMsg);
      _isTyping = true;
      _ctrl.clear();
    });
    _scrollToBottom();
    _hiveService.saveChatMessage(userMsg);

    final historyContext = _messages.sublist(0, _messages.length - 1);

    final stream = AIService.chatWithMascotStream(
      text,
      profile,
      contextSources,
      historyContext,
      fileParts: fileParts,
    );

    _streamSub = stream.listen(
      (chunk) {
        if (!mounted) return;
        aiMsg = aiMsg.copyWithText(aiMsg.text + chunk);
        setState(() {
          _messages[_messages.length - 1] = aiMsg;
        });
        _scrollToBottom();
      },
      onDone: () {
        if (!mounted) return;
        final parsed = _parseAiResponse(aiMsg.text);
        aiMsg = aiMsg.copyWithText(
          parsed.text,
          isStreaming: false,
          proposedProgram: parsed.program,
          proposedDietPlan: parsed.dietPlan,
          suggestedFoods: parsed.suggestFoods,
        );
        setState(() {
          _messages[_messages.length - 1] = aiMsg;
          _isTyping = false;
        });
        _hiveService.saveChatMessage(
            aiMsg.copyWithText(parsed.text, isStreaming: false));
        _scrollToBottom();
      },
      onError: (_) {
        if (!mounted) return;
        setState(() {
          if (aiMsg.text.isEmpty) {
            aiMsg = aiMsg.copyWithText(
                "Coo? Je ne peux pas accéder au cloud. Réessaie ! 🐦",
                isStreaming: false);
          } else {
            aiMsg = aiMsg.copyWithText(aiMsg.text, isStreaming: false);
          }
          _messages[_messages.length - 1] = aiMsg;
          _isTyping = false;
        });
        _hiveService.saveChatMessage(aiMsg);
      },
    );
  }

  Future<void> _acceptProgram(FastingProgram program) async {
    await context.read<FastingProvider>().startProgram(program);
    if (!mounted) return;

    final confirmMsg = ChatMessage(
      text:
          "🎉 Excellent choix ! Ton programme **${program.name}** est maintenant actif. Retrouve-le dans ta session de jeûne. Coo! 🐦✨",
      isUser: false,
    );
    setState(() {
      _messages.add(confirmMsg);
    });
    _hiveService.saveChatMessage(confirmMsg);
    _scrollToBottom();
  }

  Future<void> _acceptDietPlan(DietPlan plan) async {
    try {
      await context.read<DietPlanProvider>().activatePlan(plan);
      if (!mounted) return;

      final confirmMsg = ChatMessage(
        text:
            "📅 C'est noté ! Ton plan **${plan.name}** (${plan.totalDays} jours) est activé et rempli dans ton calendrier. Tu peux le consulter et le modifier à tout moment. Coo! 🐦🌿",
        isUser: false,
      );
      setState(() {
        _messages.add(confirmMsg);
      });
      _hiveService.saveChatMessage(confirmMsg);
      _scrollToBottom();

      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const DietPlanCalendarScreen()),
      );
    } catch (e) {
      debugPrint("Erreur lors de l'activation du plan: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<bool> _addSuggestedFood(String name) async {
    final food = VitalRulesEngine.getExpertFood(name) ??
        FoodMapper.fromNameFallback(name);
    context.read<MealProvider>().addFood(food);
    return true;
  }

  @override
  Widget build(BuildContext context) {
    context.read<MascotProvider>().setContext("chat");
    final colors = context.colors;
    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: const Text("Mascot Chat"),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) => ChatBubble(
                msg: _messages[i],
                onAcceptProgram: _acceptProgram,
                onAcceptDietPlan: _acceptDietPlan,
                onAddFood: _addSuggestedFood,
              ),
            ),
          ),
          _buildInput(colors),
        ],
      ),
    );
  }

  Widget _buildQuickActions(AppColors colors) {
    final chips = <(String, String)>[
      ('📅', 'Crée-moi un plan alimentaire'),
      ('🍽️', "Qu'est-ce que je devrais manger aujourd'hui ?"),
    ];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: chips.map((c) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () {
                  _ctrl.text = c.$2;
                  _sendMessage();
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: colors.accentSubtle,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: colors.sheetBorder),
                  ),
                  child: Text(
                    '${c.$1}  ${c.$2}',
                    style: TextStyle(
                      color: colors.accent,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildInput(AppColors colors) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: colors.sheetBg,
        border: Border(top: BorderSide(color: colors.sheetBorder)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_messages.length <= 1) _buildQuickActions(colors),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  style: TextStyle(color: colors.textPrimary),
                  decoration: InputDecoration(
                    hintText: "Posez votre question...",
                    hintStyle: TextStyle(color: colors.textTertiary),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (_) => _sendMessage(),
                  textInputAction: TextInputAction.send,
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _isTyping ? null : _sendMessage,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _isTyping ? colors.surfaceSubtle : colors.accent,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.send_rounded,
                    color:
                        _isTyping ? colors.iconMuted : colors.accentOnPrimary,
                    size: 20,
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
