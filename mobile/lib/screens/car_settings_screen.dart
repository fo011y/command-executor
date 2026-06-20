import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/car_settings.dart';
import '../providers/settings_provider.dart';
import '../widgets/car_silhouette.dart';

class CarSettingsScreen extends StatefulWidget {
  const CarSettingsScreen({super.key});

  @override
  State<CarSettingsScreen> createState() => _CarSettingsScreenState();
}

class _CarSettingsScreenState extends State<CarSettingsScreen> {
  static const _colors = [
    (name: 'Чёрный',    value: 0xFF1a1a1a),
    (name: 'Белый',     value: 0xFFF5F5F5),
    (name: 'Серебро',   value: 0xFFB0BEC5),
    (name: 'Серый',     value: 0xFF607D8B),
    (name: 'Красный',   value: 0xFFB71C1C),
    (name: 'Синий',     value: 0xFF0D47A1),
    (name: 'Голубой',   value: 0xFF1565C0),
    (name: 'Тёмно-синий', value: 0xFF1A237E),
    (name: 'Зелёный',   value: 0xFF1B5E20),
    (name: 'Коричневый',value: 0xFF4E342E),
    (name: 'Шампань',   value: 0xFFD7CCC8),
    (name: 'Оранжевый', value: 0xFFE65100),
  ];

  late CarSettings _current;

  @override
  void initState() {
    super.initState();
    _current = context.read<SettingsProvider>().settings;
  }

  void _save() {
    context.read<SettingsProvider>().update(_current);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final carColor = Color(_current.colorValue);

    return Scaffold(
      backgroundColor: const Color(0xFF1a1a2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF16213e),
        foregroundColor: Colors.white,
        title: const Text('Настройки автомобиля'),
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text('Сохранить',
                style: TextStyle(
                    color: Color(0xFF4CAF50), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview
            Center(
              child: Column(
                children: [
                  CarSilhouette(
                    model: _current.model,
                    color: carColor,
                    width: 300,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _current.modelName,
                    style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Model selection
            _sectionLabel('Модель автомобиля'),
            const SizedBox(height: 10),
            Row(
              children: CarModel.values.map((m) {
                final selected = _current.model == m;
                final label = m == CarModel.fordFocus3
                    ? 'Ford Focus 3'
                    : 'Ford Kuga 2';
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() {
                      _current = _current.copyWith(model: m);
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: selected
                            ? const Color(0xFF4CAF50).withValues(alpha: 0.2)
                            : const Color(0xFF16213e),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected
                              ? const Color(0xFF4CAF50)
                              : Colors.white12,
                          width: selected ? 1.5 : 1,
                        ),
                      ),
                      child: Text(
                        label,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: selected ? const Color(0xFF4CAF50) : Colors.white60,
                          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 28),

            // Color selection
            _sectionLabel('Цвет кузова'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _colors.map((c) {
                final selected = _current.colorValue == c.value;
                return GestureDetector(
                  onTap: () => setState(() {
                    _current = _current.copyWith(colorValue: c.value);
                  }),
                  child: Column(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Color(c.value),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF4CAF50)
                                : Colors.white24,
                            width: selected ? 2.5 : 1,
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF4CAF50)
                                        .withValues(alpha: 0.4),
                                    blurRadius: 8,
                                  )
                                ]
                              : null,
                        ),
                        child: selected
                            ? Icon(
                                Icons.check,
                                color: c.value == 0xFFF5F5F5 || c.value == 0xFFD7CCC8
                                    ? Colors.black87
                                    : Colors.white,
                                size: 20,
                              )
                            : null,
                      ),
                      const SizedBox(height: 4),
                      Text(c.name,
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 9)),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 28),

            // Buttons position
            _sectionLabel('Расположение кнопок'),
            const SizedBox(height: 10),
            Row(
              children: [
                _positionTile(
                  label: 'Над машиной',
                  icon: Icons.vertical_align_top_rounded,
                  value: ButtonsPosition.above,
                ),
                const SizedBox(width: 10),
                _positionTile(
                  label: 'Под машиной',
                  icon: Icons.vertical_align_bottom_rounded,
                  value: ButtonsPosition.below,
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _positionTile({
    required String label,
    required IconData icon,
    required ButtonsPosition value,
  }) {
    final selected = _current.buttonsPosition == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _current = _current.copyWith(buttonsPosition: value);
        }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFF4CAF50).withValues(alpha: 0.15)
                : const Color(0xFF16213e),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? const Color(0xFF4CAF50) : Colors.white12,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: selected
                      ? const Color(0xFF4CAF50)
                      : Colors.white38,
                  size: 28),
              const SizedBox(height: 6),
              Text(label,
                  style: TextStyle(
                    color: selected ? const Color(0xFF4CAF50) : Colors.white54,
                    fontSize: 12,
                    fontWeight:
                        selected ? FontWeight.bold : FontWeight.normal,
                  )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(
        text,
        style: const TextStyle(
          color: Colors.white54,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      );
}
