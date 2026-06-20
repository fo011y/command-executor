import 'package:flutter/material.dart';
import '../models/command.dart';

class CommandCard extends StatelessWidget {
  final Command command;
  final CommandExecution? execution;
  final VoidCallback onExecute;

  const CommandCard({
    super.key,
    required this.command,
    required this.execution,
    required this.onExecute,
  });

  @override
  Widget build(BuildContext context) {
    final status = execution?.status ?? CommandExecutionStatus.idle;
    final isLoading = status == CommandExecutionStatus.loading;

    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case CommandExecutionStatus.success:
        statusColor = const Color(0xFF4CAF50);
        statusIcon = Icons.check_circle;
      case CommandExecutionStatus.error:
        statusColor = Colors.redAccent;
        statusIcon = Icons.error;
      default:
        statusColor = Colors.white24;
        statusIcon = Icons.radio_button_unchecked;
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF16213e),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: status == CommandExecutionStatus.idle
              ? Colors.white10
              : statusColor.withValues(alpha:0.5),
          width: 1,
        ),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha:0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: isLoading
              ? const Padding(
                  padding: EdgeInsets.all(10),
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white54),
                )
              : Icon(statusIcon, color: statusColor, size: 22),
        ),
        title: Text(
          command.name,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
        ),
        subtitle: _buildSubtitle(status),
        trailing: ElevatedButton(
          onPressed: isLoading ? null : onExecute,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4CAF50),
            disabledBackgroundColor: Colors.grey[800],
            foregroundColor: Colors.white,
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            minimumSize: Size.zero,
          ),
          child: const Text('Выполнить',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  Widget? _buildSubtitle(CommandExecutionStatus status) {
    if (command.description != null && status == CommandExecutionStatus.idle) {
      return Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Text(
          command.description!,
          style: TextStyle(color: Colors.white.withValues(alpha:0.5), fontSize: 12),
        ),
      );
    }
    if (status == CommandExecutionStatus.success &&
        execution?.output != null) {
      return Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          execution!.output!,
          style: const TextStyle(color: Color(0xFF4CAF50), fontSize: 12),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      );
    }
    if (status == CommandExecutionStatus.error) {
      return Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          execution?.error ?? 'Ошибка выполнения',
          style: const TextStyle(color: Colors.redAccent, fontSize: 12),
        ),
      );
    }
    if (status == CommandExecutionStatus.loading) {
      return const Padding(
        padding: EdgeInsets.only(top: 2),
        child: Text('Отправка команды...',
            style: TextStyle(color: Colors.white38, fontSize: 12)),
      );
    }
    return null;
  }
}
