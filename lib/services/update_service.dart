import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/material.dart';

class UpdateService {
  static const String versionUrl = 'https://fnnktkygl-code.github.io/vital_track/version.json';
  
  /// Check for updates.
  /// If [forceShow] is true, shows a "you're up to date" dialog when no update is available.
  static Future<void> checkForUpdates(BuildContext context, {bool forceShow = false}) async {
    try {
      final PackageInfo packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;
      final currentBuildNumber = int.tryParse(packageInfo.buildNumber) ?? 0;

      // Make the request preventing caching
      final response = await http.get(Uri.parse('$versionUrl?t=\${DateTime.now().millisecondsSinceEpoch}'));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final latestVersion = data['version'] as String;
        final latestBuildNumber = data['buildNumber'] as int;
        final apkUrl = data['apkUrl'] as String;
        final releaseNotes = data['releaseNotes'] as String?;

        if (latestBuildNumber > currentBuildNumber || _isGreaterVersion(latestVersion, currentVersion)) {
          if (context.mounted) {
            _showUpdateDialog(context, latestVersion, apkUrl, releaseNotes);
          }
        } else if (forceShow && context.mounted) {
          _showUpToDateDialog(context, currentVersion);
        }
      } else if (forceShow && context.mounted) {
        _showErrorDialog(context, 'Erreur serveur (${response.statusCode})');
      }
    } catch (e) {
      debugPrint('Error checking for updates: $e');
      if (forceShow && context.mounted) {
        _showErrorDialog(context, e.toString());
      }
    }
  }

  static bool _isGreaterVersion(String latest, String current) {
    List<int> latestParts = latest.split('.').map((p) => int.tryParse(p) ?? 0).toList();
    List<int> currentParts = current.split('.').map((p) => int.tryParse(p) ?? 0).toList();

    for (int i = 0; i < 3; i++) {
        int l = i < latestParts.length ? latestParts[i] : 0;
        int c = i < currentParts.length ? currentParts[i] : 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
  }

  static void _showUpdateDialog(BuildContext context, String version, String apkUrl, String? notes) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Text('🚀', style: TextStyle(fontSize: 24)),
            SizedBox(width: 10),
            Text('Mise à jour !'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('La version $version de Vital Track est disponible.'),
            if (notes != null && notes.isNotEmpty) ...[
               const SizedBox(height: 16),
               const Text('Nouveautés :', style: TextStyle(fontWeight: FontWeight.bold)),
               const SizedBox(height: 4),
               Text(notes, style: const TextStyle(fontSize: 14)),
            ]
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Plus tard', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              final uri = Uri.parse(apkUrl);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Télécharger'),
          ),
        ],
      ),
    );
  }

  static void _showUpToDateDialog(BuildContext context, String currentVersion) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Text('✅', style: TextStyle(fontSize: 24)),
            SizedBox(width: 10),
            Text('À jour !'),
          ],
        ),
        content: Text('Vous utilisez la dernière version de Vital Track (v$currentVersion).'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('OK', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
          ),
        ],
      ),
    );
  }

  static void _showErrorDialog(BuildContext context, String error) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Text('⚠️', style: TextStyle(fontSize: 24)),
            SizedBox(width: 10),
            Text('Erreur'),
          ],
        ),
        content: Text('Impossible de vérifier les mises à jour.\n\n$error'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
