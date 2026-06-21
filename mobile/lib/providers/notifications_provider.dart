import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/app_notification.dart';

class NotificationsProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _key = 'app_notifications';
  static const _maxItems = 100;

  List<AppNotification> _items = [];

  List<AppNotification> get items => _items;

  int get unreadCount => _items.where((n) => !n.isRead).length;

  Future<void> load() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw == null) return;
      final list = jsonDecode(raw) as List<dynamic>;
      _items = list
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> add(String title, String body) async {
    final notification = AppNotification(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      title: title,
      body: body,
      receivedAt: DateTime.now(),
    );
    _items = [notification, ..._items.take(_maxItems - 1)];
    notifyListeners();
    await _persist();
  }

  Future<void> markAllRead() async {
    _items = _items.map((n) => n.copyWith(isRead: true)).toList();
    notifyListeners();
    await _persist();
  }

  Future<void> markRead(String id) async {
    _items = _items
        .map((n) => n.id == id ? n.copyWith(isRead: true) : n)
        .toList();
    notifyListeners();
    await _persist();
  }

  Future<void> deleteAll() async {
    _items = [];
    notifyListeners();
    await _persist();
  }

  Future<void> _persist() async {
    try {
      await _storage.write(
        key: _key,
        value: jsonEncode(_items.map((n) => n.toJson()).toList()),
      );
    } catch (_) {}
  }
}
