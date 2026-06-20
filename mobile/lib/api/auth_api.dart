import 'package:dio/dio.dart';
import '../models/user.dart';

class AuthApi {
  final Dio _dio;
  AuthApi(this._dio);

  Future<({String token, User user})> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    final token = res.data['token'] as String;
    final user = User.fromJson(res.data['user'] as Map<String, dynamic>);
    return (token: token, user: user);
  }

  Future<User> me() async {
    final res = await _dio.get('/auth/me');
    final data = res.data as Map<String, dynamic>;
    // Response may be { user: {...} } or flat object
    final userMap = data.containsKey('user')
        ? data['user'] as Map<String, dynamic>
        : data;
    return User.fromJson(userMap);
  }
}
