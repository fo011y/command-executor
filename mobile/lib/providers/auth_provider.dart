import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../api/auth_api.dart';
import '../api/client.dart';
import '../models/user.dart';
import '../services/socket_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthApi _authApi;
  final SocketService _socketService;

  User? _user;
  bool _loading = true;
  String? _error;

  AuthProvider(this._authApi, this._socketService);

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<void> init() async {
    final token = await readToken();
    if (token == null) {
      _loading = false;
      notifyListeners();
      return;
    }
    try {
      _user = await _authApi.me();
      _socketService.connect(token);
    } catch (_) {
      await deleteToken();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _error = null;
    _loading = true;
    notifyListeners();
    try {
      final result = await _authApi.login(email, password);
      await saveToken(result.token);
      _user = result.user;
      _socketService.connect(result.token);
      _loading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      // 403 = account not activated yet — show clear message
      if (e.response?.statusCode == 403) {
        _error = 'Аккаунт не активирован. Обратитесь к администратору.';
      } else {
        _error = _extractError(e);
      }
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _socketService.disconnect();
    await deleteToken();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _extractError(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'] as String;
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Сервер недоступен';
    }
    return 'Ошибка подключения';
  }
}
