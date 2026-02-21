import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vital_track/models/knowledge_source.dart';
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

// Removed _ChatMessage in favor of lib/models/chat_message.dart

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
        text: "Coo! I'm your Vitalist guide. Ask me about Dr. Sebi, Arnold Ehret, or Dr. Morse — I have their full teachings in my knowledge base! 🐦",
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

  Future<void> _sendMessage() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _isTyping) return;

    // Inline sources (text/url/youtube) — keyword search
    final contextSources = _knowledgeService.searchSources(text);
    // File-based sources (pdf/image/video) — Gemini FileParts
    final fileParts = _knowledgeService.getFileParts();
    final profile = context.read<ProfileProvider>().profile;

    final userMsg = ChatMessage(text: text, isUser: true);
    
    // We start the AI message empty and streaming
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

    // Pass the entire history to the AI service for context (excluding the currently streaming empty message)
    final historyContext = _messages.sublist(0, _messages.length - 1);

    final stream = AIService.chatWithMascotStream(
      text, profile, contextSources, historyContext,
      fileParts: fileParts,
    );

    _streamSub = stream.listen(
      (chunk) {
        if (!mounted) return;
        // Replace the aiMsg object entirely to ensure Hive captures the update
        aiMsg = aiMsg.copyWithText(aiMsg.text + chunk);
        setState(() {
          _messages[_messages.length - 1] = aiMsg;
        });
        _scrollToBottom();
        // Periodically save to Hive (or wait until done)
      },
      onDone: () {
        if (!mounted) return;
        aiMsg = aiMsg.copyWithText(aiMsg.text, isStreaming: false);
        setState(() {
          _messages[_messages.length - 1] = aiMsg;
          _isTyping = false;
        });
        _hiveService.saveChatMessage(aiMsg);
        _scrollToBottom();
      },
      onError: (_) {
        if (!mounted) return;
        setState(() {
          if (aiMsg.text.isEmpty) {
            aiMsg = aiMsg.copyWithText("Coo? I couldn't reach the cloud. Try again later! 🐦", isStreaming: false);
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
              itemBuilder: (ctx, i) => _ChatBubble(msg: _messages[i]),
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
  const _ChatBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    if (msg.isUser) {
      return _buildUserBubble(context);
    }
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
          // AI avatar row
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
          // Full-width markdown content
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: msg.text.isEmpty
                ? Text('...', style: TextStyle(color: colors.textTertiary))
                : _MarkdownBody(text: msg.text, colors: colors),
          ),
          // Source chips (shown after streaming completes)
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

// ── SIMPLE MARKDOWN RENDERER ─────────────────────────────────────────────────

class _MarkdownBody extends StatelessWidget {
  final String text;
  final AppColors colors;
  const _MarkdownBody({required this.text, required this.colors});

  @override
  Widget build(BuildContext context) {
    final lines = text.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];

      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 6));
        continue;
      }

      // ### Header
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

      // ## Header
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

      // Bullet point (- or *)
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

      // Numbered list (1. 2. 3.)
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

      // Regular paragraph
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

  /// Parses inline **bold** and [Source Title] citations into RichText.
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
        // **bold**
        spans.add(TextSpan(
          text: match.group(1),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ));
      } else if (match.group(2) != null) {
        // [Citation]
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
