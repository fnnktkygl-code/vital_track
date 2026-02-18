import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/knowledge_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/providers/profile_provider.dart';
import 'package:vital_track/ui/theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatMessage {
  final String id;
  final String text;
  final bool isUser;
  _ChatMessage({required this.text, required this.isUser}) : id = const Uuid().v4();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _ctrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final KnowledgeService _knowledgeService = KnowledgeService(HiveService());
  final List<_ChatMessage> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _initKnowledge();
    _messages.add(_ChatMessage(
      text: "Coo! I'm ready to help you with your Vitalist journey. Ask me anything about Dr. Sebi or Arnold Ehret's principles! 🦜",
      isUser: false,
    ));
  }

  Future<void> _initKnowledge() async {
    // await _knowledgeService.init(); // Hive initialized in main/HiveService
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true));
      _isTyping = true;
      _ctrl.clear();
    });
    _scrollToBottom();

    final contextSources = _knowledgeService.searchSources(text);
    final profile = context.read<ProfileProvider>().profile;
    final response = await AIService.chatWithMascot(text, profile, contextSources);

    if (!mounted) return;
    setState(() {
      _isTyping = false;
      _messages.add(_ChatMessage(
        text: response ?? "Coo? Protocol error...",
        isUser: false,
      ));
    });
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Scaffold(
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
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (i == _messages.length) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 16, top: 8),
                    child: Text(
                      "🦜 En train d'écrire...",
                      style: TextStyle(
                        color: colors.textTertiary,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                      ),
                    ),
                  );
                }
                return _ChatBubble(msg: _messages[i]);
              },
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
              ),
              onSubmitted: (_) => _sendMessage(),
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
                color: _isTyping
                    ? colors.surfaceSubtle
                    : colors.accent,
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

class _ChatBubble extends StatelessWidget {
  final _ChatMessage msg;
  const _ChatBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.isUser;
    final colors = context.colors;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints:
        BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? colors.accent : colors.surfaceSubtle,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 18),
          ),
          border: isUser
              ? null
              : Border.all(color: colors.border),
        ),
        child: Text(
          msg.text,
          style: TextStyle(
            color: isUser ? colors.accentOnPrimary : colors.textPrimary,
            fontSize: 15,
            height: 1.5,
          ),
        ),
      ),
    );
  }
}