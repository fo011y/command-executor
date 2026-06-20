import 'package:flutter/foundation.dart';
import '../api/profile_api.dart';
import '../models/user.dart';

class ProfileProvider extends ChangeNotifier {
  final ProfileApi _api;

  User? _profile;
  bool _loading = false;
  String? _error;
  String? _successMessage;

  ProfileProvider(this._api);

  User? get profile => _profile;
  bool get loading => _loading;
  String? get error => _error;
  String? get successMessage => _successMessage;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _profile = await _api.getProfile();
    } catch (_) {
      _error = 'Не удалось загрузить профиль';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> update({
    String? phone,
    String? phone2,
    String? phone3,
    String? email,
  }) async {
    _error = null;
    _successMessage = null;
    _loading = true;
    notifyListeners();
    try {
      _profile = await _api.updateProfile(
        phone: phone,
        phone2: phone2,
        phone3: phone3,
        email: email,
      );
      _successMessage = 'Профиль обновлён';
      _loading = false;
      notifyListeners();
      return true;
    } catch (_) {
      _error = 'Не удалось обновить профиль';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  void clearMessages() {
    _error = null;
    _successMessage = null;
    notifyListeners();
  }
}
