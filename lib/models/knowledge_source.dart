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
  @HiveField(4)
  image,
  @HiveField(5)
  video,
}

@HiveType(typeId: 6)
class KnowledgeSource extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  String title;

  @HiveField(2)
  String content; // Full text for inline sources, preview for file-based sources

  @HiveField(3)
  final KnowledgeType type;

  @HiveField(4)
  final String? sourceUrl; // URL or original file path

  @HiveField(5)
  final DateTime addedDate;

  @HiveField(6)
  List<String> chunks; // Used for inline sources (text/url/youtube)

  // ── Gemini File API fields ──────────────────────────────────────────────────

  @HiveField(7)
  String? geminiFileUri; // Uploaded file URI (e.g. https://...googleapis.com/.../files/abc)

  @HiveField(8)
  String? geminiFileName; // File name for management (e.g. "files/abc123")

  @HiveField(9)
  DateTime? uploadedAt; // When uploaded to Gemini (files expire after 48h)

  @HiveField(10)
  String? localFilePath; // Local copy path for re-upload when expired

  @HiveField(11)
  String? uploadStatus; // null=not uploaded, "uploading", "ready", "expired", "error"

  KnowledgeSource({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    this.sourceUrl,
    required this.addedDate,
    this.chunks = const [],
    this.geminiFileUri,
    this.geminiFileName,
    this.uploadedAt,
    this.localFilePath,
    this.uploadStatus,
  });

  /// Whether this source uses the Gemini File API (large files).
  bool get isFileBased =>
      type == KnowledgeType.pdf ||
      type == KnowledgeType.image ||
      type == KnowledgeType.video;

  /// Whether the uploaded file is still active (not expired).
  bool get isFileActive {
    if (uploadedAt == null) return false;
    // Files expire after 48 hours
    return DateTime.now().difference(uploadedAt!).inHours < 47;
  }
}
