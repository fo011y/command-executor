import 'package:flutter/material.dart';
import '../models/command.dart';

// Maps command name keywords to icons
IconData _iconForCommand(String name) {
  final n = name.toLowerCase();
  if (n.contains('замок') || n.contains('lock') || n.contains('закр')) {
    return Icons.lock_rounded;
  }
  if (n.contains('откр') || n.contains('unlock') || n.contains('дверь') || n.contains('door')) {
    return Icons.lock_open_rounded;
  }
  if (n.contains('старт') || n.contains('start') || n.contains('запус') || n.contains('двигат')) {
    return Icons.power_settings_new_rounded;
  }
  if (n.contains('стоп') || n.contains('stop') || n.contains('заглу')) {
    return Icons.stop_circle_rounded;
  }
  if (n.contains('trunk') || n.contains('багаж') || n.contains('капот')) {
    return Icons.inventory_2_rounded;
  }
  if (n.contains('окно') || n.contains('window') || n.contains('стекл')) {
    return Icons.window_rounded;
  }
  if (n.contains('свет') || n.contains('light') || n.contains('фар')) {
    return Icons.light_mode_rounded;
  }
  if (n.contains('сигнал') || n.contains('signal') || n.contains('alarm') || n.contains('охран')) {
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

Color _colorForStatus(CommandExecutionStatus status) {
  switch (status) {
    case CommandExecutionStatus.success:
      return const Color(0xFF4CAF50);
    case CommandExecutionStatus.error:
      return const Color(0xFFE53935);
    case CommandExecutionStatus.loading:
      return const Color(0xFF1565C0);
    case CommandExecutionStatus.idle:
      return const Color(0xFF1E3A5F);
  }
}

class CommandIconButton extends StatelessWidget {
  final Command command;
  final CommandExecution? execution;
  final VoidCallback onTap;

  const CommandIconButton({
    super.key,
    required this.command,
    required this.execution,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final status = execution?.status ?? CommandExecutionStatus.idle;
    final isLoading = status == CommandExecutionStatus.loading;
    final bgColor = _colorForStatus(status);
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
              bgColor.withValues(alpha: 0.75),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: bgColor.withValues(alpha: 0.5),
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
