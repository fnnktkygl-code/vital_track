import 'package:flutter/material.dart';
import 'package:vital_track/ui/theme.dart';

class MarkdownBody extends StatelessWidget {
  final String text;
  final AppColors colors;
  const MarkdownBody({super.key, required this.text, required this.colors});

  @override
  Widget build(BuildContext context) {
    // Skip rendering any leftover ```json blocks while still streaming
    final displayText = text.replaceAll(
        RegExp(r'```json[\s\S]*?```', caseSensitive: false), '');

    final lines = displayText.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];

      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 6));
        continue;
      }

      if (line.trimLeft().startsWith('### ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 4),
          child: Text(
            line.trimLeft().substring(4),
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              height: 1.4,
            ),
          ),
        ));
        continue;
      }

      if (line.trimLeft().startsWith('## ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 4),
          child: Text(
            line.trimLeft().substring(3),
            style: TextStyle(
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              height: 1.4,
            ),
          ),
        ));
        continue;
      }

      final bulletMatch = RegExp(r'^\s*[-*]\s+(.+)$').firstMatch(line);
      if (bulletMatch != null) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(left: 8, top: 2, bottom: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('•  ',
                  style: TextStyle(
                      color: colors.accent,
                      fontWeight: FontWeight.bold,
                      fontSize: 16)),
              Expanded(
                  child: _buildRichText(bulletMatch.group(1)!, colors, 16)),
            ],
          ),
        ));
        continue;
      }

      final numMatch = RegExp(r'^\s*(\d+)\.\s+(.+)$').firstMatch(line);
      if (numMatch != null) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(left: 4, top: 2, bottom: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 24,
                child: Text(
                  '${numMatch.group(1)}.',
                  style: TextStyle(
                      color: colors.accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 16),
                ),
              ),
              Expanded(
                  child: _buildRichText(numMatch.group(2)!, colors, 16)),
            ],
          ),
        ));
        continue;
      }

      widgets.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: _buildRichText(line, colors, 16),
      ));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  static Widget _buildRichText(
      String text, AppColors colors, double fontSize) {
    final spans = <TextSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*|\[([^\]]+)\]');
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }

      if (match.group(1) != null) {
        spans.add(TextSpan(
          text: match.group(1),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ));
      } else if (match.group(2) != null) {
        spans.add(TextSpan(
          text: '[${match.group(2)}]',
          style: TextStyle(
            color: colors.accent,
            fontWeight: FontWeight.w600,
            fontSize: fontSize - 1,
          ),
        ));
      }

      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          color: colors.textPrimary,
          fontSize: fontSize,
          height: 1.65,
        ),
        children: spans.isEmpty ? [TextSpan(text: text)] : spans,
      ),
    );
  }
}
