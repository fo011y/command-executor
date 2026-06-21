import 'package:flutter/foundation.dart';
import '../models/app_settings.dart';
import '../services/settings_service.dart';

class SettingsProvider extends ChangeNotifier {
  final SettingsService _service;
  AppSettings _settings = const AppSettings();

  SettingsProvider(this._service);

  AppSettings get settings => _settings;

  Future<void> load() async {
    _settings = await _service.load();
    notifyListeners();
  }

  Future<void> update(AppSettings updated) async {
    _settings = updated;
    await _service.save(updated);
    notifyListeners();
  }
}
