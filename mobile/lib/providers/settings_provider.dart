import 'package:flutter/foundation.dart';
import '../models/car_settings.dart';
import '../services/settings_service.dart';

class SettingsProvider extends ChangeNotifier {
  final SettingsService _service;
  CarSettings _settings = const CarSettings();

  SettingsProvider(this._service);

  CarSettings get settings => _settings;

  Future<void> load() async {
    _settings = await _service.load();
    notifyListeners();
  }

  Future<void> update(CarSettings updated) async {
    _settings = updated;
    await _service.save(updated);
    notifyListeners();
  }
}
