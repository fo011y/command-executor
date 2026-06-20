import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/car_settings.dart';

const _storage = FlutterSecureStorage();
const _key = 'car_settings';

class SettingsService {
  Future<CarSettings> load() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw == null) return const CarSettings();
      return CarSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const CarSettings();
    }
  }

  Future<void> save(CarSettings settings) async {
    await _storage.write(key: _key, value: jsonEncode(settings.toJson()));
  }
}
