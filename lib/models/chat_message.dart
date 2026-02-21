import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';
import 'package:vital_track/models/knowledge_source.dart';

part 'chat_message.g.dart';

@HiveType(typeId: 13) // Next available ID after BreathingSession (12)
class ChatMessage extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String text;

  @HiveField(2)
  final bool isUser;

  @HiveField(3)
  final DateTime timestamp;

  // We won't strictly persist knowledge sources complex objects for now, 
  // as it takes up space and is mostly for active session view.
  // We just persist the text history.
  
  // Non-persistent runtime fields
  bool isStreaming;
  List<KnowledgeSource> sources;

  ChatMessage({
    String? id,
    required this.text,
    required this.isUser,
    DateTime? timestamp,
    this.isStreaming = false,
    this.sources = const [],
  })  : id = id ?? const Uuid().v4(),
        timestamp = timestamp ?? DateTime.now();
  
  ChatMessage copyWithText(String newText, {bool? isStreaming, List<KnowledgeSource>? sources}) {
    return ChatMessage(
      id: id,
      text: newText,
      isUser: isUser,
      timestamp: timestamp,
      isStreaming: isStreaming ?? this.isStreaming,
      sources: sources ?? this.sources,
    );
  }
}
