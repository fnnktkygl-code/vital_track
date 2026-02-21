import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';

/// Represents a file uploaded to the Gemini File API.
class GeminiFile {
  final String name; // e.g. "files/abc123"
  final String uri; // Full URI for use in API calls
  final String mimeType;
  final int sizeBytes;
  final DateTime createTime;
  final DateTime expirationTime;
  final String displayName;
  final String state; // "PROCESSING", "ACTIVE", "FAILED"

  GeminiFile({
    required this.name,
    required this.uri,
    required this.mimeType,
    required this.sizeBytes,
    required this.createTime,
    required this.expirationTime,
    required this.displayName,
    required this.state,
  });

  bool get isActive => state == 'ACTIVE';
  bool get isProcessing => state == 'PROCESSING';
  bool get isExpired => DateTime.now().isAfter(expirationTime);

  factory GeminiFile.fromJson(Map<String, dynamic> json) {
    return GeminiFile(
      name: json['name'] ?? '',
      uri: json['uri'] ?? '',
      mimeType: json['mimeType'] ?? '',
      sizeBytes: int.tryParse('${json['sizeBytes'] ?? 0}') ?? 0,
      createTime: DateTime.tryParse(json['createTime'] ?? '') ?? DateTime.now(),
      expirationTime:
          DateTime.tryParse(json['expirationTime'] ?? '') ?? DateTime.now(),
      displayName: json['displayName'] ?? '',
      state: json['state'] ?? 'PROCESSING',
    );
  }
}

/// Wraps the Gemini File API (REST) for uploading, listing, and deleting files.
class GeminiFileService {
  static const String _apiKey = String.fromEnvironment(
    'GEMINI_API_KEY',
    defaultValue: '',
  );

  static const String _baseUrl =
      'https://generativelanguage.googleapis.com/v1beta';
  static const String _uploadUrl =
      'https://generativelanguage.googleapis.com/upload/v1beta/files';

  /// Upload a local file to the Gemini File API.
  /// Returns a [GeminiFile] with the uploaded file metadata.
  static Future<GeminiFile> uploadFile({
    required String localPath,
    required String displayName,
    String? mimeType,
  }) async {
    if (_apiKey.isEmpty) {
      throw Exception('GEMINI_API_KEY not set.');
    }

    final file = File(localPath);
    if (!await file.exists()) {
      throw Exception('File not found: $localPath');
    }

    final detectedMime =
        mimeType ?? lookupMimeType(localPath) ?? 'application/octet-stream';
    final fileBytes = await file.readAsBytes();
    final fileLength = fileBytes.length;

    debugPrint(
        'GeminiFileService: Uploading $displayName ($detectedMime, ${(fileLength / 1024 / 1024).toStringAsFixed(1)} MB)');

    // Step 1: Start resumable upload to get upload URI
    final startRequest = http.Request(
      'POST',
      Uri.parse('$_uploadUrl?key=$_apiKey'),
    );
    startRequest.headers.addAll({
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': '$fileLength',
      'X-Goog-Upload-Header-Content-Type': detectedMime,
      'Content-Type': 'application/json',
    });
    startRequest.body = json.encode({
      'file': {'displayName': displayName},
    });

    final client = http.Client();
    try {
      final startResponse = await client.send(startRequest);
      final uploadUrl = startResponse.headers['x-goog-upload-url'];

      if (uploadUrl == null) {
        final body = await startResponse.stream.bytesToString();
        throw Exception(
            'Failed to get upload URL. Status: ${startResponse.statusCode}, Body: $body');
      }

      // Step 2: Upload the actual file bytes
      final uploadRequest = http.Request('PUT', Uri.parse(uploadUrl));
      uploadRequest.headers.addAll({
        'Content-Length': '$fileLength',
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      });
      uploadRequest.bodyBytes = fileBytes;

      final uploadResponse = await client.send(uploadRequest);
      final responseBody = await uploadResponse.stream.bytesToString();

      if (uploadResponse.statusCode != 200) {
        throw Exception(
            'Upload failed. Status: ${uploadResponse.statusCode}, Body: $responseBody');
      }

      final responseJson = json.decode(responseBody);
      final fileData = responseJson['file'] ?? responseJson;
      return GeminiFile.fromJson(fileData);
    } finally {
      client.close();
    }
  }

  /// Get the current status of an uploaded file.
  static Future<GeminiFile> getFile(String fileName) async {
    if (_apiKey.isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.get(
      Uri.parse('$_baseUrl/$fileName?key=$_apiKey'),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'Failed to get file. Status: ${response.statusCode}, Body: ${response.body}');
    }

    return GeminiFile.fromJson(json.decode(response.body));
  }

  /// Wait for a file to finish processing (ACTIVE state).
  /// Polls every 2 seconds, up to [maxWait].
  static Future<GeminiFile> waitForProcessing(
    String fileName, {
    Duration maxWait = const Duration(minutes: 5),
  }) async {
    final deadline = DateTime.now().add(maxWait);

    while (DateTime.now().isBefore(deadline)) {
      final file = await getFile(fileName);
      if (file.isActive) return file;
      if (file.state == 'FAILED') {
        throw Exception('File processing failed: $fileName');
      }
      debugPrint('GeminiFileService: File still processing... (${file.state})');
      await Future.delayed(const Duration(seconds: 2));
    }

    throw Exception('File processing timed out: $fileName');
  }

  /// Delete an uploaded file from Google's servers.
  static Future<void> deleteFile(String fileName) async {
    if (_apiKey.isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.delete(
      Uri.parse('$_baseUrl/$fileName?key=$_apiKey'),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      debugPrint(
          'GeminiFileService: Delete warning for $fileName — ${response.statusCode}');
    }
  }

  /// List all files uploaded to the Gemini File API.
  static Future<List<GeminiFile>> listFiles() async {
    if (_apiKey.isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.get(
      Uri.parse('$_baseUrl/files?key=$_apiKey'),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'Failed to list files. Status: ${response.statusCode}');
    }

    final data = json.decode(response.body);
    final files = data['files'] as List<dynamic>? ?? [];
    return files.map((f) => GeminiFile.fromJson(f)).toList();
  }
}
