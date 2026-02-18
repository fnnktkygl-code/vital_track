import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/resource_ingestion_service.dart';

// Legacy entry (to be removed eventually, kept for backward compat if needed)
class KnowledgeEntry {
  final String id;
  final String title;
  final String content;
  final List<String> tags;

  KnowledgeEntry({
    required this.id,
    required this.title,
    required this.content,
    required this.tags,
  });
}

class KnowledgeService {
  final HiveService _hiveService;

  KnowledgeService(this._hiveService);

  // ── RAG SOURCES ─────────────────────────────────────────────────────────────

  List<KnowledgeSource> get sources => 
      _hiveService.knowledgeSourcesBox.values.toList();

  Future<void> addTextSource(String title, String content) async {
    final source = KnowledgeSource(
      id: DateTime.now().toIso8601String(),
      title: title,
      content: content,
      type: KnowledgeType.text,
      addedDate: DateTime.now(),
      chunks: _chunkText(content),
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  Future<void> addPdfSource(String title, String path) async {
    final content = await ResourceIngestionService.extractPdf(path);
    final source = KnowledgeSource(
      id: DateTime.now().toIso8601String(),
      title: title,
      content: content,
      type: KnowledgeType.pdf,
      sourceUrl: path,
      addedDate: DateTime.now(),
      chunks: _chunkText(content),
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  Future<void> addUrlSource(String title, String url) async {
    final content = await ResourceIngestionService.extractUrl(url);
    final source = KnowledgeSource(
      id: DateTime.now().toIso8601String(),
      title: title,
      content: content,
      type: KnowledgeType.url,
      sourceUrl: url,
      addedDate: DateTime.now(),
      chunks: _chunkText(content),
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }
  
  Future<void> deleteSource(dynamic key) async {
    await _hiveService.knowledgeSourcesBox.delete(key);
  }
  
  // Simple check utility (naive chunking for now)
  List<String> _chunkText(String text) {
    // Split by paragraph approx 500 chars 
    // This is very basic, for production use recursive char splitter
    return text.split(RegExp(r'\n\s*\n')).where((s) => s.length > 50).toList();
  }

  // ── RETRIEVAL ───────────────────────────────────────────────────────────────
  
  List<KnowledgeSource> searchSources(String query) {
    if (query.isEmpty) return [];
    final lowerQ = query.toLowerCase();
    
    return sources.where((s) {
      final titleMatch = s.title.toLowerCase().contains(lowerQ);
      final contentMatch = s.content.toLowerCase().contains(lowerQ);
      return titleMatch || contentMatch;
    }).toList();
  }

  // ── LEGACY COMPATIBILITY ────────────────────────────────────────────────────
  // We map KnowledgeEntry calls to our new system if possible, 
  // or just return empty if we fully deprecated the old box.
  // For now, let's keep the old method signature but map to new storage?
  // Or just keep the old helper methods for UI compatibility if the UI hasn't been updated yet.
  
  List<KnowledgeEntry> getAll() {
    // Return empty list as we migrate
    return [];
  }
}
