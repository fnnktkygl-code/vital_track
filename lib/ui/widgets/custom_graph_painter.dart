import 'package:flutter/material.dart';
import 'dart:ui' as ui;
import 'package:vital_track/ui/theme.dart';

class CustomGraphPainter extends CustomPainter {
  final List<double> data;
  final List<String> labels;
  final AppColors colors;
  final bool showPoints;
  final bool animate;
  final double animationValue;

  CustomGraphPainter({
    required this.data,
    required this.labels,
    required this.colors,
    this.showPoints = true,
    this.animate = true,
    this.animationValue = 1.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final paint = Paint()
      ..color = colors.accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..style = PaintingStyle.fill;

    final maxVal = data.fold<double>(0, (a, b) => a > b ? a : b);
    final minVal = data.fold<double>(maxVal, (a, b) => a < b ? a : b);
    final range = (maxVal - minVal) == 0 ? 1.0 : (maxVal - minVal);

    final xStep = size.width / (data.length - 1);
    
    final path = Path();
    final fillPath = Path();

    for (var i = 0; i < data.length; i++) {
      final x = i * xStep;
      // Normalizing data to fit height, applying animation if enabled
      final normalizedValue = (data[i] - minVal) / range;
      final y = size.height - (normalizedValue * size.height * animationValue);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
      
      if (i == data.length - 1) {
        fillPath.lineTo(x, size.height);
        fillPath.close();
      }
    }

    // Draw gradient fill
    fillPaint.shader = ui.Gradient.linear(
      const Offset(0, 0),
      Offset(0, size.height),
      [
        colors.accent.withValues(alpha: 0.3),
        colors.accent.withValues(alpha: 0.0),
      ],
    );
    canvas.drawPath(fillPath, fillPaint);

    // Draw line
    canvas.drawPath(path, paint);

    // Draw points
    if (showPoints) {
      final pointPaint = Paint()
        ..color = colors.accent
        ..style = PaintingStyle.fill;
      
      final innerPointPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;

      for (var i = 0; i < data.length; i++) {
        final x = i * xStep;
        final normalizedValue = (data[i] - minVal) / range;
        final y = size.height - (normalizedValue * size.height * animationValue);
        
        canvas.drawCircle(Offset(x, y), 5, pointPaint);
        canvas.drawCircle(Offset(x, y), 2.5, innerPointPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomGraphPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue || oldDelegate.data != data;
  }
}
