import 'package:flutter/material.dart';
import '../models/car_settings.dart';

class CarSilhouette extends StatelessWidget {
  final CarModel model;
  final Color color;

  const CarSilhouette({
    super.key,
    required this.model,
    required this.color,
  });

  String get _assetPath {
    switch (model) {
      case CarModel.fordFocus3:
        return 'assets/ford_focus3.png';
      case CarModel.fordKuga2:
        return 'assets/ford_kuga2.png';
    }
  }

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: ColorFilter.mode(
        color.withValues(alpha: 0.85),
        BlendMode.modulate,
      ),
      child: Image.asset(
        _assetPath,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
      ),
    );
  }
}
