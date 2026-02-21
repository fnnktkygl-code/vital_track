import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:path_provider/path_provider.dart';
import 'package:vital_track/models/knowledge_source.dart';
import 'package:vital_track/services/gemini_file_service.dart';
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

  // ── FILE-BASED SOURCES (pdf, image, video — uploaded to Gemini) ───────────

  Future<void> addPdfSource(String title, String path) async {
    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'Uploading PDF to Gemini...',
      type: KnowledgeType.pdf,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'uploading',
    );
    await _hiveService.knowledgeSourcesBox.add(source);

    try {
      final geminiFile = await GeminiFileService.uploadFile(
        localPath: localPath,
        displayName: title,
        mimeType: 'application/pdf',
      );

      final activeFile =
          await GeminiFileService.waitForProcessing(geminiFile.name);

      source.geminiFileUri = activeFile.uri;
      source.geminiFileName = activeFile.name;
      source.uploadedAt = DateTime.now();
      source.uploadStatus = 'ready';
      source.content = 'PDF uploaded • ${_formatBytes(activeFile.sizeBytes)}';
      await source.save();
    } catch (e) {
      debugPrint('KnowledgeService: PDF upload failed: $e');
      source.uploadStatus = 'error';
      source.content = 'Upload failed: $e';
      await source.save();
      rethrow;
    }
  }

  Future<void> addImageSource(String title, String path) async {
    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'Uploading image to Gemini...',
      type: KnowledgeType.image,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'uploading',
    );
    await _hiveService.knowledgeSourcesBox.add(source);

    try {
      final mimeType = path.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';
      final geminiFile = await GeminiFileService.uploadFile(
        localPath: localPath,
        displayName: title,
        mimeType: mimeType,
      );

      final activeFile =
          await GeminiFileService.waitForProcessing(geminiFile.name);

      source.geminiFileUri = activeFile.uri;
      source.geminiFileName = activeFile.name;
      source.uploadedAt = DateTime.now();
      source.uploadStatus = 'ready';
      source.content =
          'Image uploaded • ${_formatBytes(activeFile.sizeBytes)}';
      await source.save();
    } catch (e) {
      debugPrint('KnowledgeService: Image upload failed: $e');
      source.uploadStatus = 'error';
      source.content = 'Upload failed: $e';
      await source.save();
      rethrow;
    }
  }

  Future<void> addVideoSource(String title, String path) async {
    final file = File(path);
    final fileSize = await file.length();

    if (fileSize > 2 * 1024 * 1024 * 1024) {
      throw Exception(
          'Video is too large (${_formatBytes(fileSize)}). Maximum is 2 GB.');
    }

    final sourceId = DateTime.now().toIso8601String();
    final localPath = await _copyToLocalStorage(sourceId, path);

    final source = KnowledgeSource(
      id: sourceId,
      title: title,
      content: 'Uploading video to Gemini...',
      type: KnowledgeType.video,
      sourceUrl: path,
      addedDate: DateTime.now(),
      localFilePath: localPath,
      uploadStatus: 'uploading',
    );
    await _hiveService.knowledgeSourcesBox.add(source);

    try {
      final mimeType = path.toLowerCase().endsWith('.mov')
          ? 'video/quicktime'
          : 'video/mp4';
      final geminiFile = await GeminiFileService.uploadFile(
        localPath: localPath,
        displayName: title,
        mimeType: mimeType,
      );

      final activeFile = await GeminiFileService.waitForProcessing(
        geminiFile.name,
        maxWait: const Duration(minutes: 10),
      );

      source.geminiFileUri = activeFile.uri;
      source.geminiFileName = activeFile.name;
      source.uploadedAt = DateTime.now();
      source.uploadStatus = 'ready';
      source.content =
          'Video uploaded • ${_formatBytes(activeFile.sizeBytes)}';
      await source.save();
    } catch (e) {
      debugPrint('KnowledgeService: Video upload failed: $e');
      source.uploadStatus = 'error';
      source.content = 'Upload failed: $e';
      await source.save();
      rethrow;
    }
  }

  // ── FILE MANAGEMENT ───────────────────────────────────────────────────────

  /// Re-upload expired files to Gemini. Call on app startup.
  Future<void> refreshExpiredFiles() async {
    for (final source in sources) {
      if (!source.isFileBased) continue;
      if (source.uploadStatus == 'error') continue;
      if (source.localFilePath == null) continue;

      if (!source.isFileActive && source.uploadedAt != null) {
        debugPrint(
            'KnowledgeService: Re-uploading expired file: ${source.title}');
        try {
          source.uploadStatus = 'uploading';
          await source.save();

          final geminiFile = await GeminiFileService.uploadFile(
            localPath: source.localFilePath!,
            displayName: source.title,
          );

          final activeFile =
              await GeminiFileService.waitForProcessing(geminiFile.name);

          // Clean up old file on Gemini
          if (source.geminiFileName != null) {
            try {
              await GeminiFileService.deleteFile(source.geminiFileName!);
            } catch (_) {}
          }

          source.geminiFileUri = activeFile.uri;
          source.geminiFileName = activeFile.name;
          source.uploadedAt = DateTime.now();
          source.uploadStatus = 'ready';
          await source.save();
        } catch (e) {
          debugPrint('KnowledgeService: Re-upload failed: $e');
          source.uploadStatus = 'expired';
          await source.save();
        }
      }
    }
  }

  /// Manually re-upload a single source.
  Future<void> reuploadSource(KnowledgeSource source) async {
    if (source.localFilePath == null) {
      throw Exception('No local file available for re-upload.');
    }

    source.uploadStatus = 'uploading';
    await source.save();

    try {
      final geminiFile = await GeminiFileService.uploadFile(
        localPath: source.localFilePath!,
        displayName: source.title,
      );

      final activeFile =
          await GeminiFileService.waitForProcessing(geminiFile.name);

      source.geminiFileUri = activeFile.uri;
      source.geminiFileName = activeFile.name;
      source.uploadedAt = DateTime.now();
      source.uploadStatus = 'ready';
      await source.save();
    } catch (e) {
      source.uploadStatus = 'error';
      source.content = 'Re-upload failed: $e';
      await source.save();
      rethrow;
    }
  }

  /// Get FilePart references for all active uploaded files.
  List<FilePart> getFileParts() {
    final parts = <FilePart>[];
    for (final source in sources) {
      if (source.isFileBased &&
          source.uploadStatus == 'ready' &&
          source.geminiFileUri != null &&
          source.isFileActive) {
        parts.add(FilePart(Uri.parse(source.geminiFileUri!)));
      }
    }
    return parts;
  }

  // ── DELETION ──────────────────────────────────────────────────────────────

  Future<void> deleteSource(dynamic key) async {
    final source = _hiveService.knowledgeSourcesBox.get(key);

    if (source != null) {
      // Delete from Gemini if uploaded
      if (source.geminiFileName != null) {
        try {
          await GeminiFileService.deleteFile(source.geminiFileName!);
        } catch (e) {
          debugPrint('KnowledgeService: Gemini delete failed: $e');
        }
      }

      // Delete local copy
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

  /// Keyword-scored search for inline sources (text/url/youtube).
  /// File-based sources are handled via Gemini FileParts directly.
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
