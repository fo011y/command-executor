import 'package:dio/dio.dart';
import '../models/user.dart';

class ProfileApi {
  final Dio _dio;
  ProfileApi(this._dio);

  Future<User> getProfile() async {
    final res = await _dio.get('/users/me');
    // Response is { user: {...} }
    final data = res.data as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<User> updateProfile({
    String? phone,
    String? phone2,
    String? phone3,
    String? email,
  }) async {
    final data = <String, dynamic>{};
    if (phone != null) data['phone'] = phone;
    if (phone2 != null) data['phone2'] = phone2;
    if (phone3 != null) data['phone3'] = phone3;
    if (email != null) data['email'] = email;

    final res = await _dio.put('/users/me', data: data);
    final resData = res.data as Map<String, dynamic>;
    return User.fromJson(resData['user'] as Map<String, dynamic>);
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _dio.put('/users/me', data: {
      'current_password': oldPassword,
      'password': newPassword,
    });
  }
}
