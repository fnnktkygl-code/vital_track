import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:vital_track/services/hive_service.dart';

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
  static String _proxyBaseUrl() {
    const envUrl = String.fromEnvironment('AI_PROXY_BASE_URL', defaultValue: '');
    return envUrl.trim();
  }

  static bool _useProxy() => _proxyBaseUrl().isNotEmpty;

  static Uri _proxyUri(String path) {
    final base = _proxyBaseUrl().replaceAll(RegExp(r'/$'), '');
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$normalizedPath');
  }

  static String _getApiKey() {
    // Check Hive (user-provided)
    try {
      final hiveKey = HiveService().loadApiKey();
      if (hiveKey != null && hiveKey.isNotEmpty) return hiveKey;
    } catch (_) {}
    return '';
  }

  static bool _hasPrivacyConsent() {
    try {
      return HiveService().settingsBox
              .get('privacy_consent_accepted', defaultValue: false) ==
          true;
    } catch (_) {
      return false;
    }
  }

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
    if (!_hasPrivacyConsent()) {
      throw Exception('Privacy consent not set.');
    }

    if (_useProxy()) {
      return _uploadFileViaProxy(
        localPath: localPath,
        displayName: displayName,
        mimeType: mimeType,
      );
    }

    if (_getApiKey().isEmpty) {
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
      Uri.parse('$_uploadUrl?key=${_getApiKey()}'),
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
    if (!_hasPrivacyConsent()) throw Exception('Privacy consent not set.');

    if (_useProxy()) {
      final encodedName = Uri.encodeComponent(fileName);
      final response = await http.get(_proxyUri('/v1/files/$encodedName'));

      if (response.statusCode != 200) {
        throw Exception(
            'Proxy getFile failed. Status: ${response.statusCode}, Body: ${response.body}');
      }

      final jsonBody = json.decode(response.body);
      final fileData = (jsonBody is Map<String, dynamic> && jsonBody['file'] is Map<String, dynamic>)
          ? jsonBody['file'] as Map<String, dynamic>
          : (jsonBody as Map<String, dynamic>);
      return GeminiFile.fromJson(fileData);
    }

    if (_getApiKey().isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.get(
      Uri.parse('$_baseUrl/$fileName?key=${_getApiKey()}'),
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
    if (!_hasPrivacyConsent()) throw Exception('Privacy consent not set.');

    if (_useProxy()) {
      final encodedName = Uri.encodeComponent(fileName);
      final response = await http.delete(_proxyUri('/v1/files/$encodedName'));
      if (response.statusCode != 200 && response.statusCode != 204) {
        debugPrint(
            'GeminiFileService proxy delete warning for $fileName — ${response.statusCode}');
      }
      return;
    }

    if (_getApiKey().isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.delete(
      Uri.parse('$_baseUrl/$fileName?key=${_getApiKey()}'),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      debugPrint(
          'GeminiFileService: Delete warning for $fileName — ${response.statusCode}');
    }
  }

  /// List all files uploaded to the Gemini File API.
  static Future<List<GeminiFile>> listFiles() async {
    if (!_hasPrivacyConsent()) throw Exception('Privacy consent not set.');

    if (_useProxy()) {
      final response = await http.get(_proxyUri('/v1/files'));

      if (response.statusCode != 200) {
        throw Exception('Proxy listFiles failed. Status: ${response.statusCode}');
      }

      final data = json.decode(response.body);
      final files = (data is Map<String, dynamic>)
          ? (data['files'] as List<dynamic>? ?? [])
          : (data as List<dynamic>? ?? []);
      return files
          .whereType<Map<String, dynamic>>()
          .map((f) => GeminiFile.fromJson(f))
          .toList();
    }

    if (_getApiKey().isEmpty) throw Exception('GEMINI_API_KEY not set.');

    final response = await http.get(
      Uri.parse('$_baseUrl/files?key=${_getApiKey()}'),
    );

    if (response.statusCode != 200) {
      throw Exception(
          'Failed to list files. Status: ${response.statusCode}');
    }

    final data = json.decode(response.body);
    final files = data['files'] as List<dynamic>? ?? [];
    return files.map((f) => GeminiFile.fromJson(f)).toList();
  }

  static Future<GeminiFile> _uploadFileViaProxy({
    required String localPath,
    required String displayName,
    String? mimeType,
  }) async {
    final file = File(localPath);
    if (!await file.exists()) {
      throw Exception('File not found: $localPath');
    }

    final detectedMime =
        mimeType ?? lookupMimeType(localPath) ?? 'application/octet-stream';
    final fileBytes = await file.readAsBytes();

    final request = http.MultipartRequest('POST', _proxyUri('/v1/files/upload'));
    request.fields['displayName'] = displayName;
    request.fields['mimeType'] = detectedMime;
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        fileBytes,
        filename: file.uri.pathSegments.isNotEmpty
            ? file.uri.pathSegments.last
            : 'upload.bin',
      ),
    );

    final streamed = await request.send().timeout(const Duration(minutes: 2));
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
          'Proxy upload failed. Status: ${response.statusCode}, Body: ${response.body}');
    }

    final responseJson = json.decode(response.body);
    final fileData = (responseJson is Map<String, dynamic> &&
            responseJson['file'] is Map<String, dynamic>)
        ? responseJson['file'] as Map<String, dynamic>
        : (responseJson as Map<String, dynamic>);

    return GeminiFile.fromJson(fileData);
  }
}
