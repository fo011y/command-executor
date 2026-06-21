import 'package:flutter/material.dart';
import '../models/command.dart';

IconData _iconForCommand(String name) {
  final n = name.toLowerCase();

  // Двигатель — запуск vs остановка
  if (n.contains('запус') || n.contains('старт') || n.contains('start')) {
    return Icons.play_circle_rounded;
  }
  if (n.contains('остан') || n.contains('заглу') || n.contains('стоп') || n.contains('stop')) {
    return Icons.stop_circle_rounded;
  }

  // Двери — открыть vs закрыть
  if (n.contains('откр') || n.contains('unlock')) {
    return Icons.lock_open_rounded;
  }
  if (n.contains('закр') || n.contains('lock') || n.contains('замок')) {
    return Icons.lock_rounded;
  }

  // Стёкла — поднять vs опустить
  if (n.contains('подн') && (n.contains('стекл') || n.contains('окно') || n.contains('window'))) {
    return Icons.arrow_circle_up_rounded;
  }
  if ((n.contains('опус') || n.contains('опуст')) && (n.contains('стекл') || n.contains('окно') || n.contains('window'))) {
    return Icons.arrow_circle_down_rounded;
  }
  if (n.contains('стекл') || n.contains('окно') || n.contains('window')) {
    return Icons.table_rows_rounded;
  }

  // Двойное запирание
  if (n.contains('двойн')) {
    return Icons.enhanced_encryption_rounded;
  }

  // Прочее
  if (n.contains('trunk') || n.contains('багаж') || n.contains('капот')) {
    return Icons.inventory_2_rounded;
  }
  if (n.contains('свет') || n.contains('light') || n.contains('фар')) {
    return Icons.light_mode_rounded;
  }
  if (n.contains('сигнал') || n.contains('alarm') || n.contains('охран')) {
    return Icons.security_rounded;
  }
  if (n.contains('темп') || n.contains('климат') || n.contains('climate') || n.contains('печ')) {
    return Icons.thermostat_rounded;
  }
  if (n.contains('парк') || n.contains('park')) {
    return Icons.local_parking_rounded;
  }
  return Icons.touch_app_rounded;
}

class CommandIconButton extends StatelessWidget {
  final Command command;
  final CommandExecution? execution;
  final VoidCallback onTap;
  final Color accentColor;

  const CommandIconButton({
    super.key,
    required this.command,
    required this.execution,
    required this.onTap,
    required this.accentColor,
  });

  Color _idleColor() {
    final n = command.name.toLowerCase();
    if (n.contains('остан') || n.contains('заглу') || n.contains('стоп') || n.contains('stop')) {
      return const Color(0xFFB71C1C);
    }
    if (n.contains('двойн')) {
      return const Color(0xFF1565C0);
    }
    if (n.contains('подн') && (n.contains('стекл') || n.contains('окно'))) {
      return const Color(0xFF00695C);
    }
    if ((n.contains('опус') || n.contains('опуст')) && (n.contains('стекл') || n.contains('окно'))) {
      return const Color(0xFF4527A0);
    }
    return accentColor;
  }

  @override
  Widget build(BuildContext context) {
    final status = execution?.status ?? CommandExecutionStatus.idle;
    final isLoading = status == CommandExecutionStatus.loading;

    Color bgColor;
    switch (status) {
      case CommandExecutionStatus.success:
        bgColor = const Color(0xFF2E7D32);
      case CommandExecutionStatus.error:
        bgColor = const Color(0xFFC62828);
      case CommandExecutionStatus.loading:
        bgColor = _idleColor().withValues(alpha: 0.6);
      case CommandExecutionStatus.idle:
        bgColor = _idleColor();
    }

    final icon = _iconForCommand(command.name);

    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 80,
        height: 88,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              bgColor.withValues(alpha: 0.95),
              bgColor.withValues(alpha: 0.72),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: bgColor.withValues(alpha: 0.45),
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
            if (isLoading)
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                    strokeWidth: 2.5, color: Colors.white),
              )
            else if (status == CommandExecutionStatus.success)
              const Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 30)
            else if (status == CommandExecutionStatus.error)
              const Icon(Icons.error_rounded, color: Colors.white, size: 30)
            else
              Icon(icon, color: Colors.white, size: 30),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                command.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
