import 'package:http/http.dart' as http;
import 'package:html/parser.dart' as html_parser;
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';
import 'dart:io';

class ResourceIngestionService {
  
  /// Extracts text from a PDF file
  static Future<String> extractPdf(String path) async {
      try {
        final File file = File(path);
        final List<int> bytes = await file.readAsBytes();
        final PdfDocument document = PdfDocument(inputBytes: bytes);
        String text = PdfTextExtractor(document).extractText();
        document.dispose();
        return text;
      } catch (e) {
        return "Error extracting PDF: $e";
      }
  }

  /// Extracts text from a generic URL
  static Future<String> extractUrl(String url) async {
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        var document = html_parser.parse(response.body);
        return document.body?.text ?? "No text found";
      } else {
        return "Error: Status ${response.statusCode}";
      }
    } catch (e) {
      return "Error fetching URL: $e";
    }
  }

  /// Extracts transcript from YouTube video
  static Future<String> extractYoutube(String url) async {
    final yt = YoutubeExplode();
    try {
      final video = await yt.videos.get(url);
      final manifest = await yt.videos.closedCaptions.getManifest(video.id);
      
      // Try French first, then English, then any available track
      ClosedCaptionTrackInfo? selectedTrack;
      final frTracks = manifest.getByLanguage('fr');
      if (frTracks.isNotEmpty) {
        selectedTrack = frTracks.first;
      } else {
        final enTracks = manifest.getByLanguage('en');
        if (enTracks.isNotEmpty) {
          selectedTrack = enTracks.first;
        } else if (manifest.tracks.isNotEmpty) {
          selectedTrack = manifest.tracks.first;
        }
      }
      
      if (selectedTrack != null) {
        final track = await yt.videos.closedCaptions.get(selectedTrack);
        return track.captions.map((e) => e.text).join(" ");
      }
      
      return "No captions found for this video.";
    } catch (e) {
      return "Error extracting YouTube: $e";
    } finally {
      yt.close();
    }
  }
}
