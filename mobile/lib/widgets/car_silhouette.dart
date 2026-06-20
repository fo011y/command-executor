import 'package:flutter/material.dart';
import '../models/car_settings.dart';

class CarSilhouette extends StatelessWidget {
  final CarModel model;
  final Color color;
  final double width;

  const CarSilhouette({
    super.key,
    required this.model,
    required this.color,
    this.width = 320,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(width, width * 0.42),
      painter: model == CarModel.fordFocus3
          ? _Focus3Painter(color)
          : _Kuga2Painter(color),
    );
  }
}

// Ford Focus 3 — sedan/hatchback silhouette
class _Focus3Painter extends CustomPainter {
  final Color color;
  _Focus3Painter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final bodyPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;

    final glassPaint = Paint()
      ..color = Colors.lightBlueAccent.withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;

    final detailPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;

    // Shadow under car
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.5, h * 0.92), width: w * 0.8, height: h * 0.1),
      shadowPaint,
    );

    // Main body
    final body = Path()
      ..moveTo(w * 0.04, h * 0.72)
      ..lineTo(w * 0.04, h * 0.58)
      ..quadraticBezierTo(w * 0.06, h * 0.52, w * 0.14, h * 0.48)
      ..quadraticBezierTo(w * 0.22, h * 0.18, w * 0.35, h * 0.14)
      ..quadraticBezierTo(w * 0.52, h * 0.10, w * 0.68, h * 0.14)
      ..quadraticBezierTo(w * 0.80, h * 0.16, w * 0.86, h * 0.44)
      ..quadraticBezierTo(w * 0.94, h * 0.50, w * 0.96, h * 0.58)
      ..lineTo(w * 0.96, h * 0.72)
      ..close();
    canvas.drawPath(body, bodyPaint);

    // Glass area
    final glass = Path()
      ..moveTo(w * 0.17, h * 0.50)
      ..quadraticBezierTo(w * 0.24, h * 0.22, w * 0.36, h * 0.19)
      ..quadraticBezierTo(w * 0.52, h * 0.15, w * 0.67, h * 0.19)
      ..quadraticBezierTo(w * 0.78, h * 0.20, w * 0.83, h * 0.46)
      ..lineTo(w * 0.56, h * 0.46)
      ..lineTo(w * 0.44, h * 0.46)
      ..close();
    canvas.drawPath(glass, glassPaint);

    // B-pillar
    final pillar = Paint()
      ..color = Colors.black.withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
        Rect.fromLTWH(w * 0.495, h * 0.18, w * 0.01, h * 0.28), pillar);

    // Front windshield highlight
    final highlight = Path()
      ..moveTo(w * 0.46, h * 0.20)
      ..quadraticBezierTo(w * 0.52, h * 0.16, w * 0.60, h * 0.20)
      ..lineTo(w * 0.58, h * 0.28)
      ..quadraticBezierTo(w * 0.52, h * 0.25, w * 0.47, h * 0.28)
      ..close();
    canvas.drawPath(highlight, detailPaint);

    // Front bumper
    final frontBumper = Path()
      ..moveTo(w * 0.86, h * 0.60)
      ..quadraticBezierTo(w * 0.95, h * 0.62, w * 0.97, h * 0.68)
      ..lineTo(w * 0.97, h * 0.72)
      ..lineTo(w * 0.86, h * 0.72)
      ..close();
    canvas.drawPath(frontBumper, bodyPaint);

    // Rear bumper
    final rearBumper = Path()
      ..moveTo(w * 0.14, h * 0.60)
      ..quadraticBezierTo(w * 0.05, h * 0.62, w * 0.03, h * 0.68)
      ..lineTo(w * 0.03, h * 0.72)
      ..lineTo(w * 0.14, h * 0.72)
      ..close();
    canvas.drawPath(rearBumper, bodyPaint);

    // Headlight (front right)
    final headlight = Paint()
      ..color = Colors.yellowAccent.withValues(alpha: 0.8)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.88, h * 0.54, w * 0.07, h * 0.08),
          const Radius.circular(3)),
      headlight,
    );

    // Taillight (rear left)
    final taillight = Paint()
      ..color = Colors.redAccent.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.05, h * 0.54, w * 0.07, h * 0.08),
          const Radius.circular(3)),
      taillight,
    );

    // Door line
    final linePaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.2)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
        Offset(w * 0.17, h * 0.72), Offset(w * 0.83, h * 0.72), linePaint);

    // Wheels
    _drawWheel(canvas, Offset(w * 0.22, h * 0.78), w * 0.10, color);
    _drawWheel(canvas, Offset(w * 0.78, h * 0.78), w * 0.10, color);
  }

  void _drawWheel(Canvas canvas, Offset center, double radius, Color bodyColor) {
    // Tire
    canvas.drawCircle(
        center,
        radius,
        Paint()
          ..color = const Color(0xFF222222)
          ..style = PaintingStyle.fill);
    // Rim
    canvas.drawCircle(
        center,
        radius * 0.62,
        Paint()
          ..color = const Color(0xFFCCCCCC)
          ..style = PaintingStyle.fill);
    // Hub
    canvas.drawCircle(
        center,
        radius * 0.18,
        Paint()
          ..color = const Color(0xFF888888)
          ..style = PaintingStyle.fill);
    // Spokes
    final spokePaint = Paint()
      ..color = const Color(0xFF999999)
      ..strokeWidth = radius * 0.08
      ..style = PaintingStyle.stroke;
    for (int i = 0; i < 5; i++) {
      canvas.drawLine(
        center,
        Offset(
          center.dx + radius * 0.55 * (i % 2 == 0 ? 1 : -1) * 0.7,
          center.dy + radius * 0.55 * (i % 2 == 0 ? -1 : 1) * 0.7,
        ),
        spokePaint,
      );
    }
    // Wheel arch shadow
    canvas.drawArc(
      Rect.fromCenter(center: center, width: radius * 2.4, height: radius * 2.4),
      0,
      3.14159,
      false,
      Paint()
        ..color = Colors.black.withValues(alpha: 0.15)
        ..strokeWidth = 4
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(_Focus3Painter old) => old.color != color;
}

// Ford Kuga 2 — SUV silhouette (higher roofline, larger body)
class _Kuga2Painter extends CustomPainter {
  final Color color;
  _Kuga2Painter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final bodyPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;

    final glassPaint = Paint()
      ..color = Colors.lightBlueAccent.withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;

    final detailPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;

    // Shadow
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.5, h * 0.93), width: w * 0.82, height: h * 0.09),
      shadowPaint,
    );

    // Main body — SUV is taller and squarer
    final body = Path()
      ..moveTo(w * 0.04, h * 0.74)
      ..lineTo(w * 0.04, h * 0.56)
      ..quadraticBezierTo(w * 0.05, h * 0.50, w * 0.12, h * 0.46)
      ..quadraticBezierTo(w * 0.18, h * 0.12, w * 0.32, h * 0.09)
      ..quadraticBezierTo(w * 0.50, h * 0.06, w * 0.70, h * 0.09)
      ..quadraticBezierTo(w * 0.82, h * 0.11, w * 0.88, h * 0.42)
      ..quadraticBezierTo(w * 0.95, h * 0.48, w * 0.96, h * 0.56)
      ..lineTo(w * 0.96, h * 0.74)
      ..close();
    canvas.drawPath(body, bodyPaint);

    // Glass — SUV has more vertical glass
    final glass = Path()
      ..moveTo(w * 0.15, h * 0.48)
      ..quadraticBezierTo(w * 0.20, h * 0.16, w * 0.33, h * 0.13)
      ..quadraticBezierTo(w * 0.50, h * 0.10, w * 0.69, h * 0.13)
      ..quadraticBezierTo(w * 0.80, h * 0.15, w * 0.85, h * 0.44)
      ..lineTo(w * 0.57, h * 0.44)
      ..lineTo(w * 0.43, h * 0.44)
      ..close();
    canvas.drawPath(glass, glassPaint);

    // B-pillar
    final pillar = Paint()
      ..color = Colors.black.withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
        Rect.fromLTWH(w * 0.495, h * 0.13, w * 0.012, h * 0.31), pillar);

    // Roof rails (SUV detail)
    final railPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.35)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
        Offset(w * 0.28, h * 0.10), Offset(w * 0.75, h * 0.10), railPaint);

    // Highlight on glass
    final highlight = Path()
      ..moveTo(w * 0.46, h * 0.14)
      ..quadraticBezierTo(w * 0.52, h * 0.10, w * 0.62, h * 0.14)
      ..lineTo(w * 0.60, h * 0.24)
      ..quadraticBezierTo(w * 0.52, h * 0.20, w * 0.47, h * 0.24)
      ..close();
    canvas.drawPath(highlight, detailPaint);

    // Headlight
    final headlight = Paint()
      ..color = Colors.yellowAccent.withValues(alpha: 0.8)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.88, h * 0.50, w * 0.07, h * 0.10),
          const Radius.circular(3)),
      headlight,
    );

    // Taillight
    final taillight = Paint()
      ..color = Colors.redAccent.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.05, h * 0.50, w * 0.07, h * 0.10),
          const Radius.circular(3)),
      taillight,
    );

    // Body cladding (SUV lower body trim)
    final claddingPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.18)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
        Rect.fromLTWH(w * 0.04, h * 0.66, w * 0.92, h * 0.08), claddingPaint);

    // Wheels — slightly larger for SUV
    _drawWheel(canvas, Offset(w * 0.21, h * 0.80), w * 0.11);
    _drawWheel(canvas, Offset(w * 0.79, h * 0.80), w * 0.11);
  }

  void _drawWheel(Canvas canvas, Offset center, double radius) {
    canvas.drawCircle(
        center,
        radius,
        Paint()
          ..color = const Color(0xFF222222)
          ..style = PaintingStyle.fill);
    canvas.drawCircle(
        center,
        radius * 0.64,
        Paint()
          ..color = const Color(0xFFBBBBBB)
          ..style = PaintingStyle.fill);
    canvas.drawCircle(
        center,
        radius * 0.20,
        Paint()
          ..color = const Color(0xFF888888)
          ..style = PaintingStyle.fill);
    final spokePaint = Paint()
      ..color = const Color(0xFF999999)
      ..strokeWidth = radius * 0.09
      ..style = PaintingStyle.stroke;
    for (int i = 0; i < 5; i++) {
      canvas.drawLine(
        center,
        Offset(
          center.dx + radius * 0.55 * (i % 2 == 0 ? 1 : -1) * 0.7,
          center.dy + radius * 0.55 * (i % 2 == 0 ? -1 : 1) * 0.7,
        ),
        spokePaint,
      );
    }
  }

  @override
  bool shouldRepaint(_Kuga2Painter old) => old.color != color;
}
