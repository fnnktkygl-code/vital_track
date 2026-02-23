import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:path_provider/path_provider.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/ai_service.dart';
import 'package:vital_track/services/hive_service.dart';
import 'package:vital_track/services/resource_ingestion_service.dart';

class KnowledgeService {
  final HiveService _hiveService;

  KnowledgeService(this._hiveService);

  // ── DEFAULT KNOWLEDGE SEEDING ─────────────────────────────────────────────

  static const _defaultSources = [
    {
      'title': 'Dr. Sebi — Nutritional Guide',
      'file': 'assets/default_knowledge/dr_sebi.txt'
    },
    {
      'title': 'Arnold Ehret — Mucusless Diet',
      'file': 'assets/default_knowledge/arnold_ehret.txt'
    },
    {
      'title': 'Dr. Morse — Detoxification',
      'file': 'assets/default_knowledge/dr_morse.txt'
    },
  ];

  Future<void> seedDefaultSources() async {
    final seeded = _hiveService.settingsBox
        .get('knowledge_seeded', defaultValue: false);
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

  // ── ALL SOURCES ───────────────────────────────────────────────────────────

  List<KnowledgeSource> get sources =>
      _hiveService.knowledgeSourcesBox.values.toList();

  // ── INLINE SOURCES (text, url, youtube — stored locally) ──────────────────

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

  // ── FILE-BASED SOURCES (pdf, image, video — inline data) ───────────

  Future<void> addPdfSource(String title, String path) async {
    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);
    final file = File(localPath);
    final fileSize = await file.length();

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'PDF added • ${_formatBytes(fileSize)}',
      type: KnowledgeType.pdf,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'ready',
      uploadedAt: DateTime.now(),
      geminiFileUri: localPath, // re-used as local reference
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  Future<void> addImageSource(String title, String path) async {
    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);
    final file = File(localPath);
    final fileSize = await file.length();

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'Image added • ${_formatBytes(fileSize)}',
      type: KnowledgeType.image,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'ready',
      uploadedAt: DateTime.now(),
      geminiFileUri: localPath,
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  Future<void> addVideoSource(String title, String path) async {
    final file = File(path);
    final fileSize = await file.length();

    // Limit to 20MB for Vertex AI inline data compatibility via REST
    if (fileSize > 20 * 1024 * 1024) {
      throw Exception(
          'Video is too large (${_formatBytes(fileSize)}). Maximum is 20 MB for inline base64.');
    }

    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'Video added • ${_formatBytes(fileSize)}',
      type: KnowledgeType.video,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'ready',
      uploadedAt: DateTime.now(),
      geminiFileUri: localPath,
    );
    await _hiveService.knowledgeSourcesBox.add(source);
  }

  // ── FILE MANAGEMENT ───────────────────────────────────────────────────────

  Future<void> refreshExpiredFiles() async {
    // Vertex API inline data doesn't expire, no-op
  }

  Future<void> reuploadSource(KnowledgeSource source) async {
    // No-op for Vertex AI inline
    if (source.localFilePath == null) {
      throw Exception('No local file available.');
    }
    source.uploadStatus = 'ready';
    await source.save();
  }

  /// Get VertexInlineData references for all active uploaded files.
  Future<List<VertexInlineData>> getFileParts() async {
    final parts = <VertexInlineData>[];
    for (final source in sources) {
      if (source.isFileBased &&
          source.uploadStatus == 'ready' &&
          source.localFilePath != null &&
          source.isFileActive) {
        try {
          final file = File(source.localFilePath!);
          if (await file.exists()) {
             final bytes = await file.readAsBytes();
             final b64 = base64Encode(bytes);
             String mime = 'application/octet-stream';
             if (source.type == KnowledgeType.pdf) mime = 'application/pdf';
             else if (source.type == KnowledgeType.image) {
               mime = source.localFilePath!.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
             } else if (source.type == KnowledgeType.video) {
               mime = source.localFilePath!.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
             }
             parts.add(VertexInlineData(mimeType: mime, base64Data: b64));
          }
        } catch (e) {
          debugPrint('KnowledgeService: Error reading local file for inline data: $e');
        }
      }
    }
    return parts;
  }

  // ── DELETION ──────────────────────────────────────────────────────────────

  Future<void> deleteSource(dynamic key) async {
    final source = _hiveService.knowledgeSourcesBox.get(key);

    if (source != null) {
      if (source.localFilePath != null) {
        try {
          final file = File(source.localFilePath!);
          if (await file.exists()) await file.delete();
          final dir = file.parent;
          if (await dir.exists() && await dir.list().isEmpty) {
            await dir.delete();
          }
        } catch (e) {
          debugPrint('KnowledgeService: Local file delete failed: $e');
        }
      }
    }

    await _hiveService.knowledgeSourcesBox.delete(key);
  }

  // ── RETRIEVAL (for inline sources only) ───────────────────────────────────

  List<KnowledgeSource> searchSources(String query) {
    final inlineSources = sources.where((s) => !s.isFileBased).toList();

    if (query.isEmpty) return inlineSources;

    final keywords = query
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((w) => w.length > 2)
        .toList();

    if (keywords.isEmpty) return inlineSources;

    final scored = <KnowledgeSource, int>{};
    for (final s in inlineSources) {
      final lowerTitle = s.title.toLowerCase();
      final lowerContent = s.content.toLowerCase();
      int score = 0;

      for (final kw in keywords) {
        if (lowerTitle.contains(kw)) score += 3;
        if (lowerContent.contains(kw)) score += 1;
      }

      if (score > 0) scored[s] = score;
    }

    final sorted = scored.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sorted.take(5).map((e) => e.key).toList();
  }

  // ── CHUNKING (for inline sources) ─────────────────────────────────────────

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

  // ── HELPERS ───────────────────────────────────────────────────────────────

  Future<String> _copyToLocalStorage(String sourceId, String path) async {
    final appDir = await getApplicationDocumentsDirectory();
    final knowledgeDir = Directory('${appDir.path}/knowledge/$sourceId');
    if (!await knowledgeDir.exists()) {
      await knowledgeDir.create(recursive: true);
    }

    final fileName = path.split('/').last;
    final destPath = '${knowledgeDir.path}/$fileName';
    await File(path).copy(destPath);
    return destPath;
  }

  static String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
  }
}
