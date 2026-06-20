import 'package:flutter/foundation.dart';
import '../api/commands_api.dart';
import '../models/command.dart';
import '../services/socket_service.dart';

class CommandsProvider extends ChangeNotifier {
  final CommandsApi _api;
  final SocketService _socketService;

  List<Command> _commands = [];
  bool _loading = false;
  String? _error;

  // commandId → execution state
  final Map<int, CommandExecution> _executions = {};

  CommandsProvider(this._api, this._socketService) {
    _socketService.addResultListener(_onCommandResult);
  }

  List<Command> get commands => _commands;
  bool get loading => _loading;
  String? get error => _error;

  CommandExecution? executionFor(int commandId) => _executions[commandId];

  // Group commands by category name
  Map<String, List<Command>> get commandsByCategory {
    final map = <String, List<Command>>{};
    for (final cmd in _commands) {
      final key = cmd.categoryName ?? 'Без категории';
      map.putIfAbsent(key, () => []).add(cmd);
    }
    return map;
  }

  Future<void> loadCommands() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _commands = await _api.getActiveCommands();
    } catch (e) {
      _error = 'Не удалось загрузить команды';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> execute(int commandId) async {
    _executions[commandId] = CommandExecution(
      commandId: commandId,
      status: CommandExecutionStatus.loading,
    );
    notifyListeners();

    try {
      final result = await _api.executeCommand(commandId);
      _executions[commandId] = CommandExecution(
        commandId: commandId,
        status: CommandExecutionStatus.success,
        output: result['output'] as String? ?? result['message'] as String?,
      );
    } catch (e) {
      _executions[commandId] = CommandExecution(
        commandId: commandId,
        status: CommandExecutionStatus.error,
        error: 'Ошибка выполнения команды',
      );
    }
    notifyListeners();

    // Auto-clear after 5 seconds like on the website
    await Future.delayed(const Duration(seconds: 5));
    _executions.remove(commandId);
    notifyListeners();
  }

  void _onCommandResult(Map<String, dynamic> data) {
    final commandId = data['commandId'] as int?;
    if (commandId == null) return;

    final status = data['status'] as String?;
    _executions[commandId] = CommandExecution(
      commandId: commandId,
      status: status == 'success'
          ? CommandExecutionStatus.success
          : CommandExecutionStatus.error,
      output: data['output'] as String?,
      error: data['error'] as String?,
    );
    notifyListeners();
  }

  @override
  void dispose() {
    _socketService.removeResultListener(_onCommandResult);
    super.dispose();
  }
}
