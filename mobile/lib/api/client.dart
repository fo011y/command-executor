import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();
const _tokenKey = 'jwt_token';

const String kApiBase = 'https://connect.gsmcanbox.ru';

Dio buildDio() {
  final dio = Dio(BaseOptions(
    baseUrl: '$kApiBase/api',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storage.read(key: _tokenKey);
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (error, handler) {
      // 401 — token expired or invalid, caller handles redirect
      return handler.next(error);
    },
  ));

  return dio;
}

Future<void> saveToken(String token) =>
    _storage.write(key: _tokenKey, value: token);

Future<void> deleteToken() => _storage.delete(key: _tokenKey);

Future<String?> readToken() => _storage.read(key: _tokenKey);
