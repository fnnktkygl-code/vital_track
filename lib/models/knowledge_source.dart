import 'package:hive/hive.dart';

part 'knowledge_source.g.dart';

@HiveType(typeId: 5)
enum KnowledgeType {
  @HiveField(0)
  text,
  @HiveField(1)
  pdf,
  @HiveField(2)
  url,
  @HiveField(3)
  youtube,
}

@HiveType(typeId: 6)
class KnowledgeSource extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  String title;

  @HiveField(2)
  String content; // Full text content

  @HiveField(3)
  final KnowledgeType type;

  @HiveField(4)
  final String? sourceUrl; // URL or File Path

  @HiveField(5)
  final DateTime addedDate;

  @HiveField(6)
  List<String> chunks; // Split content for retrieval (simple RAG)

  KnowledgeSource({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    this.sourceUrl,
    required this.addedDate,
    this.chunks = const [],
  });
}
