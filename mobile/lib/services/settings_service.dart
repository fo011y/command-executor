import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/app_settings.dart';

const _storage = FlutterSecureStorage();
const _key = 'app_settings';

class SettingsService {
  Future<AppSettings> load() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw == null) return const AppSettings();
      return AppSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const AppSettings();
    }
  }

  Future<void> save(AppSettings settings) async {
    await _storage.write(key: _key, value: jsonEncode(settings.toJson()));
  }
}
