import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/app_settings.dart';
import '../providers/settings_provider.dart';

class AppSettingsScreen extends StatefulWidget {
  const AppSettingsScreen({super.key});

  @override
  State<AppSettingsScreen> createState() => _AppSettingsScreenState();
}

class _AppSettingsScreenState extends State<AppSettingsScreen> {
  static const _palette = [
    (name: 'Зелёный',      value: 0xFF4CAF50),
    (name: 'Синий',        value: 0xFF2196F3),
    (name: 'Голубой',      value: 0xFF00BCD4),
    (name: 'Индиго',       value: 0xFF3F51B5),
    (name: 'Фиолетовый',   value: 0xFF9C27B0),
    (name: 'Красный',      value: 0xFFE53935),
    (name: 'Оранжевый',    value: 0xFFFF6D00),
    (name: 'Жёлтый',       value: 0xFFFFD600),
    (name: 'Розовый',      value: 0xFFE91E63),
    (name: 'Бирюзовый',    value: 0xFF009688),
    (name: 'Лайм',         value: 0xFF8BC34A),
    (name: 'Белый',        value: 0xFFEEEEEE),
  ];

  late AppSettings _current;

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
    final accent = Color(_current.accentColorValue);

    return Scaffold(
      backgroundColor: const Color(0xFF0d1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161b22),
        foregroundColor: Colors.white,
        title: const Text('Настройки приложения'),
        actions: [
          TextButton(
            onPressed: _save,
            child: Text(
              'Сохранить',
              style: TextStyle(
                  color: accent, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Preview of buttons
            _sectionLabel('Предпросмотр кнопок'),
            const SizedBox(height: 14),
            Center(
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: [
                  _previewButton('Замок', Icons.lock_rounded, accent),
                  _previewButton('Старт', Icons.power_settings_new_rounded, accent),
                  _previewButton('Свет', Icons.light_mode_rounded, accent),
                  _previewButton('Климат', Icons.thermostat_rounded, accent),
                  _previewButton('Багаж', Icons.inventory_2_rounded, accent),
                  _previewButton('Охрана', Icons.security_rounded, accent),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Color picker
            _sectionLabel('Цвет иконок команд'),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 14,
              children: _palette.map((c) {
                final selected = _current.accentColorValue == c.value;
                return GestureDetector(
                  onTap: () => setState(() {
                    _current = _current.copyWith(accentColorValue: c.value);
                  }),
                  child: Column(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Color(c.value),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? Colors.white
                                : Colors.white12,
                            width: selected ? 2.5 : 1,
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: Color(c.value)
                                        .withValues(alpha: 0.5),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  )
                                ]
                              : null,
                        ),
                        child: selected
                            ? Icon(
                                Icons.check_rounded,
                                color: c.value == 0xFFFFD600 ||
                                        c.value == 0xFFEEEEEE
                                    ? Colors.black87
                                    : Colors.white,
                                size: 22,
                              )
                            : null,
                      ),
                      const SizedBox(height: 5),
                      Text(
                        c.name,
                        style: const TextStyle(
                            color: Colors.white38, fontSize: 9),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _previewButton(String label, IconData icon, Color accent) {
    return Container(
      width: 78,
      height: 86,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: 0.95),
            accent.withValues(alpha: 0.70),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.45),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.12),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
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
