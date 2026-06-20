import 'package:dio/dio.dart';
import '../models/command.dart';

class CommandsApi {
  final Dio _dio;
  CommandsApi(this._dio);

  Future<List<Command>> getActiveCommands() async {
    final res = await _dio.get('/commands/active');
    // Response is { commands: [...] }
    final data = res.data as Map<String, dynamic>;
    final list = data['commands'] as List<dynamic>;
    return list
        .map((e) => Command.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> executeCommand(int commandId) async {
    final res = await _dio.post('/commands/$commandId/execute');
    return res.data as Map<String, dynamic>;
  }

  Future<List<CommandLog>> getMyLogs() async {
    final res = await _dio.get('/commands/logs/all');
    final list = res.data as List<dynamic>;
    return list
        .map((e) => CommandLog.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
