import 'package:flutter/services.dart' show rootBundle;
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/resource_ingestion_service.dart';

class KnowledgeService {
  final HiveService _hiveService;

  KnowledgeService(this._hiveService);

  // ── DEFAULT KNOWLEDGE SEEDING ─────────────────────────────────────────────

  static const _defaultSources = [
    {'title': 'Dr. Sebi — Nutritional Guide', 'file': 'assets/default_knowledge/dr_sebi.txt'},
    {'title': 'Arnold Ehret — Mucusless Diet', 'file': 'assets/default_knowledge/arnold_ehret.txt'},
    {'title': 'Dr. Morse — Detoxification', 'file': 'assets/default_knowledge/dr_morse.txt'},
  ];

  Future<void> seedDefaultSources() async {
    final seeded = _hiveService.settingsBox.get('knowledge_seeded', defaultValue: false);
    if (seeded == true) return;

    for (final entry in _defaultSources) {
      final content = await rootBundle.loadString(entry['file']!);
      final source = KnowledgeSource(
        id: 'default_${entry['file']!.hashCode}',
        title: entry['title']!,
        content: content,
        type: KnowledgeType.text,
        addedDate: DateTime.now(),
        chunks: _chunkText(content),
      );
      await _hiveService.knowledgeSourcesBox.add(source);
    }

    await _hiveService.settingsBox.put('knowledge_seeded', true);
  }

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
  
  Future<void> addYoutubeSource(String title, String url) async {
    final content = await ResourceIngestionService.extractYoutube(url);
    final source = KnowledgeSource(
      id: DateTime.now().toIso8601String(),
      title: title,
      content: content,
      type: KnowledgeType.youtube,
      sourceUrl: url,
      addedDate: DateTime.now(),
      chunks: _chunkText(content),
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  Future<void> deleteSource(dynamic key) async {
    await _hiveService.knowledgeSourcesBox.delete(key);
  }

  List<String> _chunkText(String text) {
    final chunks = <String>[];
    final paragraphs = text.split(RegExp(r'\n\s*\n'));
    final buffer = StringBuffer();

    for (final p in paragraphs) {
      if (p.trim().length < 20) continue;
      if (buffer.length + p.length > 500 && buffer.isNotEmpty) {
        chunks.add(buffer.toString().trim());
        buffer.clear();
      }
      buffer.writeln(p.trim());
    }
    if (buffer.isNotEmpty) chunks.add(buffer.toString().trim());
    return chunks;
  }

  // ── RETRIEVAL ───────────────────────────────────────────────────────────────

  /// Keyword-scored search: splits query into words, scores each source
  /// by how many keywords match in title/content, returns sorted by relevance.
  List<KnowledgeSource> searchSources(String query) {
    if (query.isEmpty) return sources; // Return all if no query (for full context)

    final keywords = query
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((w) => w.length > 2)
        .toList();

    if (keywords.isEmpty) return sources;

    final scored = <KnowledgeSource, int>{};
    for (final s in sources) {
      final lowerTitle = s.title.toLowerCase();
      final lowerContent = s.content.toLowerCase();
      int score = 0;

      for (final kw in keywords) {
        if (lowerTitle.contains(kw)) score += 3; // Title match weighted higher
        if (lowerContent.contains(kw)) score += 1;
      }

      if (score > 0) scored[s] = score;
    }

    final sorted = scored.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    // Return top 5 most relevant sources
    return sorted.take(5).map((e) => e.key).toList();
  }
}
