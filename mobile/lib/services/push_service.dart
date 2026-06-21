import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';
import '../providers/notifications_provider.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {}

class PushService {
  static final _fcm = FirebaseMessaging.instance;
  static final _localNotifications = FlutterLocalNotificationsPlugin();

  static const _channel = AndroidNotificationChannel(
    'gcb_connect_channel',
    'GCB Connect',
    description: 'Уведомления от сервера GCB Connect',
    importance: Importance.high,
  );

  static NotificationsProvider? _notificationsProvider;

  static void setNotificationsProvider(NotificationsProvider p) {
    _notificationsProvider = p;
  }

  static Future<void> init(Dio dio) async {
    await _fcm.requestPermission(alert: true, badge: true, sound: true);

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    FirebaseMessaging.onMessage.listen((message) {
      final notification = message.notification;
      if (notification == null) return;

      _notificationsProvider?.add(
        notification.title ?? '',
        notification.body ?? '',
      );

      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
      );
    });

    // Уведомление открыто из трея (приложение было в фоне)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      final notification = message.notification;
      if (notification == null) return;
      _notificationsProvider?.add(
        notification.title ?? '',
        notification.body ?? '',
      );
    });

    final token = await _fcm.getToken();
    if (token != null) await _registerToken(dio, token);

    _fcm.onTokenRefresh.listen((t) => _registerToken(dio, t));
  }

  static Future<void> _registerToken(Dio dio, String token) async {
    try {
      await dio.post('/notifications/register-token',
          data: {'fcm_token': token});
    } catch (_) {}
  }
}
