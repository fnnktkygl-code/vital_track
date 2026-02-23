import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/models/fasting_program.dart';
import 'package:vital_track/models/fasting_session.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/providers/fasting_provider.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/knowledge_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/models/chat_message.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/ui/theme.dart';

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
        text: "Coo! Je suis ton guide Vitaliste. Pose-moi des questions sur le Dr. Sebi, Arnold Ehret, ou le Dr. Morse — et demande-moi de te créer un programme de jeûne personnalisé ! 🐦",
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

  /// Parses the AI response text to extract a JSON program block.
  /// Returns a tuple: (cleanText, FastingProgram?)
  (String, FastingProgram?) _parseAiResponse(String text) {
    // Find ``` json { "program": ... } ``` block
    final jsonRegex = RegExp(r'```json\s*(\{[\s\S]*?\})\s*```', caseSensitive: false);
    final match = jsonRegex.firstMatch(text);
    if (match == null) return (text, null);

    try {
      final jsonStr = match.group(1)!;
      final decoded = json.decode(jsonStr);
      final programData = decoded['program'] as Map<String, dynamic>?;
      if (programData == null) return (text, null);

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

      final program = FastingProgram(
        id: const Uuid().v4(),
        name: programData['name'] as String? ?? 'Programme Vitaliste',
        targetObjective: programData['targetObjective'] as String? ?? '',
        startDate: DateTime.now(),
        configs: configs,
        protocol: programData['protocol'] as String? ?? 'vitalist',
      );

      // Strip the JSON block from the displayed text
      final cleanText = text.replaceAll(match.group(0)!, '').trim();
      return (cleanText, program);
    } catch (e) {
      debugPrint('ChatScreen: Failed to parse program JSON: $e');
      return (text, null);
    }
  }

  FastingType _parseFastingType(String typeStr) {
    switch (typeStr.toLowerCase().trim()) {
      case 'waterfast': return FastingType.waterFast;
      case 'juicefast': return FastingType.juiceFast;
      case 'fruitfast': return FastingType.fruitFast;
      case 'grapecure': return FastingType.grapeCure;
      case 'drysunfast': return FastingType.drySunFast;
      case 'monoFruit':
      case 'monofruit': return FastingType.monoFruit;
      default: return FastingType.intermittent;
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
      text, profile, contextSources, historyContext,
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
        // Parse for a program proposal
        final (cleanText, program) = _parseAiResponse(aiMsg.text);
        aiMsg = aiMsg.copyWithText(cleanText, isStreaming: false, proposedProgram: program);
        setState(() {
          _messages[_messages.length - 1] = aiMsg;
          _isTyping = false;
        });
        _hiveService.saveChatMessage(aiMsg.copyWithText(cleanText, isStreaming: false));
        _scrollToBottom();
      },
      onError: (_) {
        if (!mounted) return;
        setState(() {
          if (aiMsg.text.isEmpty) {
            aiMsg = aiMsg.copyWithText("Coo? Je ne peux pas accéder au cloud. Réessaie ! 🐦", isStreaming: false);
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
    
    // Add a confirmation message from the Mascot
    final confirmMsg = ChatMessage(
      text: "🎉 Excellent choix ! Ton programme **${program.name}** est maintenant actif. Retrouve-le dans ta session de jeûne. Coo! 🐦✨",
      isUser: false,
    );
    setState(() {
      _messages.add(confirmMsg);
    });
    _hiveService.saveChatMessage(confirmMsg);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
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
              itemBuilder: (ctx, i) => _ChatBubble(
                msg: _messages[i],
                onAcceptProgram: _acceptProgram,
              ),
            ),
          ),
          _buildInput(colors),
        ],
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
      child: Row(
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
                color: _isTyping ? colors.iconMuted : colors.accentOnPrimary,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── CHAT BUBBLE ──────────────────────────────────────────────────────────────

class _ChatBubble extends StatelessWidget {
  final ChatMessage msg;
  final Future<void> Function(FastingProgram)? onAcceptProgram;
  const _ChatBubble({required this.msg, this.onAcceptProgram});

  @override
  Widget build(BuildContext context) {
    if (msg.isUser) return _buildUserBubble(context);
    return _buildAiBubble(context);
  }

  Widget _buildUserBubble(BuildContext context) {
    final colors = context.colors;
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(top: 16, bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: colors.accent,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(4),
          ),
        ),
        child: Text(
          msg.text,
          style: TextStyle(
            color: colors.accentOnPrimary,
            fontSize: 16,
            height: 1.55,
          ),
        ),
      ),
    );
  }

  Widget _buildAiBubble(BuildContext context) {
    final colors = context.colors;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar row
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: colors.accentSubtle,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                    child: Text('🐦', style: TextStyle(fontSize: 14))),
              ),
              const SizedBox(width: 8),
              Text(
                'VitalTrack',
                style: TextStyle(
                  color: colors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (msg.isStreaming) ...[
                const SizedBox(width: 8),
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: colors.accent,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          // Markdown content
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: msg.text.isEmpty
                ? Text('...', style: TextStyle(color: colors.textTertiary))
                : _MarkdownBody(text: msg.text, colors: colors),
          ),
          // ── PLAN PROPOSAL CARD ──────────────────────────────────────────────
          if (msg.proposedProgram != null && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 16),
              child: _PlanProposalCard(
                program: msg.proposedProgram!,
                onAccept: onAcceptProgram,
              ),
            ),
          // Source chips
          if (!msg.isUser && msg.sources.isNotEmpty && !msg.isStreaming)
            Padding(
              padding: const EdgeInsets.only(left: 36, top: 10),
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: msg.sources.map((s) {
                  final icon = switch (s.type) {
                    KnowledgeType.pdf => Icons.picture_as_pdf,
                    KnowledgeType.url => Icons.link,
                    KnowledgeType.youtube => Icons.video_library,
                    KnowledgeType.text => Icons.description,
                    KnowledgeType.image => Icons.image,
                    KnowledgeType.video => Icons.movie,
                  };
                  return Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.surfaceSubtle,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: colors.borderSubtle),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(icon, size: 12, color: colors.textTertiary),
                        const SizedBox(width: 4),
                        Text(
                          s.title.length > 30
                              ? '${s.title.substring(0, 30)}...'
                              : s.title,
                          style: TextStyle(
                              color: colors.textTertiary, fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

// ── PLAN PROPOSAL CARD ────────────────────────────────────────────────────────

class _PlanProposalCard extends StatefulWidget {
  final FastingProgram program;
  final Future<void> Function(FastingProgram)? onAccept;

  const _PlanProposalCard({required this.program, this.onAccept});

  @override
  State<_PlanProposalCard> createState() => _PlanProposalCardState();
}

class _PlanProposalCardState extends State<_PlanProposalCard> {
  bool _accepted = false;
  bool _loading = false;

  String _protocolLabel(String? p) {
    switch (p) {
      case 'sebi': return 'Dr. Sebi';
      case 'ehret': return 'Arnold Ehret';
      case 'morse': return 'Dr. Morse';
      default: return 'Vitaliste Intégré';
    }
  }
  
  String _formatDuration(int minutes) {
    if (minutes < 60) return '$minutes min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m == 0 ? '${h}h' : '${h}h${m}min';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final program = widget.program;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.accent.withOpacity(0.12),
            colors.accentSubtle.withOpacity(0.06),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.accent.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colors.accent.withOpacity(0.12),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colors.accent.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Text('📋', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        program.name,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.science_outlined,
                              size: 12, color: colors.accent),
                          const SizedBox(width: 4),
                          Text(
                            _protocolLabel(program.protocol),
                            style: TextStyle(
                                color: colors.accent,
                                fontSize: 12,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Goal
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Text(
              '🎯 ${program.targetObjective}',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),
          // Steps timeline
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: Text(
              'Programme (${program.configs.length} étapes)',
              style: TextStyle(
                color: colors.textTertiary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          ...program.configs.asMap().entries.map((entry) {
            final i = entry.key;
            final config = entry.value;
            final isLast = i == program.configs.length - 1;
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 2, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: colors.accent.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            config.type.emoji,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 1.5,
                          height: 20,
                          color: colors.accent.withOpacity(0.2),
                        ),
                    ],
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(top: 3, bottom: isLast ? 8 : 0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              config.type.label,
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                          Text(
                            _formatDuration(config.durationMinutes),
                            style: TextStyle(
                                color: colors.accent,
                                fontSize: 13,
                                fontWeight: FontWeight.w700),
                          ),
                          if (config.breakHours > 0) ...[
                            const SizedBox(width: 4),
                            Text(
                              '+ ${config.breakHours}h pause',
                              style: TextStyle(
                                  color: colors.textTertiary,
                                  fontSize: 11),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 4),
          // Accept button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: _accepted
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle, color: colors.accent, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Programme activé !',
                        style: TextStyle(
                            color: colors.accent,
                            fontWeight: FontWeight.w700,
                            fontSize: 15),
                      ),
                    ],
                  )
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _loading
                          ? null
                          : () async {
                              setState(() => _loading = true);
                              await widget.onAccept?.call(widget.program);
                              if (mounted) {
                                setState(() {
                                  _accepted = true;
                                  _loading = false;
                                });
                              }
                            },
                      icon: _loading
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: colors.accentOnPrimary),
                            )
                          : const Icon(Icons.play_arrow_rounded, size: 20),
                      label: Text(_loading ? 'Activation...' : 'Accepter ce programme'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colors.accent,
                        foregroundColor: colors.accentOnPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        textStyle: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                        elevation: 0,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── SIMPLE MARKDOWN RENDERER ─────────────────────────────────────────────────

class _MarkdownBody extends StatelessWidget {
  final String text;
  final AppColors colors;
  const _MarkdownBody({required this.text, required this.colors});

  @override
  Widget build(BuildContext context) {
    // Skip rendering any leftover ```json blocks while still streaming
    final displayText = text.replaceAll(
        RegExp(r'```json[\s\S]*?```', caseSensitive: false), '');

    final lines = displayText.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];

      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 6));
        continue;
      }

      if (line.trimLeft().startsWith('### ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 4),
          child: Text(
            line.trimLeft().substring(4),
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              height: 1.4,
            ),
          ),
        ));
        continue;
      }

      if (line.trimLeft().startsWith('## ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 4),
          child: Text(
            line.trimLeft().substring(3),
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              height: 1.4,
            ),
          ),
        ));
        continue;
      }

      final bulletMatch = RegExp(r'^\s*[-*]\s+(.+)$').firstMatch(line);
      if (bulletMatch != null) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(left: 8, top: 2, bottom: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('•  ',
                  style: TextStyle(
                      color: colors.accent,
                      fontWeight: FontWeight.bold,
                      fontSize: 16)),
              Expanded(
                  child: _buildRichText(bulletMatch.group(1)!, colors, 16)),
            ],
          ),
        ));
        continue;
      }

      final numMatch = RegExp(r'^\s*(\d+)\.\s+(.+)$').firstMatch(line);
      if (numMatch != null) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(left: 4, top: 2, bottom: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 24,
                child: Text(
                  '${numMatch.group(1)}.',
                  style: TextStyle(
                      color: colors.accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 16),
                ),
              ),
              Expanded(
                  child: _buildRichText(numMatch.group(2)!, colors, 16)),
            ],
          ),
        ));
        continue;
      }

      widgets.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: _buildRichText(line, colors, 16),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  static Widget _buildRichText(
      String text, AppColors colors, double fontSize) {
    final spans = <TextSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*|\[([^\]]+)\]');
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }

      if (match.group(1) != null) {
        spans.add(TextSpan(
          text: match.group(1),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ));
      } else if (match.group(2) != null) {
        spans.add(TextSpan(
          text: '[${match.group(2)}]',
          style: TextStyle(
            color: colors.accent,
            fontWeight: FontWeight.w600,
            fontSize: fontSize - 1,
          ),
        ));
      }

      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          color: colors.textPrimary,
          fontSize: fontSize,
          height: 1.65,
        ),
        children: spans.isEmpty ? [TextSpan(text: text)] : spans,
      ),
    );
  }
}
