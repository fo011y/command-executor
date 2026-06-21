import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/auth_api.dart';
import 'api/client.dart';
import 'api/commands_api.dart';
import 'api/profile_api.dart';
import 'providers/auth_provider.dart';
import 'providers/commands_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/profile_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/app_settings_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/profile_screen.dart';
import 'services/push_service.dart';
import 'services/settings_service.dart';
import 'services/socket_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const GcbConnectApp());
}

class GcbConnectApp extends StatelessWidget {
  const GcbConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    final dio = buildDio();
    final socketService = SocketService();
    final settingsService = SettingsService();
    final notificationsProvider = NotificationsProvider()..load();

    PushService.setNotificationsProvider(notificationsProvider);
    PushService.init(dio);

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(AuthApi(dio), socketService)..init(),
        ),
        ChangeNotifierProvider(
          create: (_) => CommandsProvider(CommandsApi(dio), socketService),
        ),
        ChangeNotifierProvider(
          create: (_) => ProfileProvider(ProfileApi(dio)),
        ),
        ChangeNotifierProvider(
          create: (_) => SettingsProvider(settingsService)..load(),
        ),
        ChangeNotifierProvider.value(value: notificationsProvider),
      ],
      child: MaterialApp(
        title: 'GCB Connect',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF4CAF50),
            surface: Color(0xFF161b22),
          ),
          scaffoldBackgroundColor: const Color(0xFF0d1117),
          useMaterial3: true,
        ),
        initialRoute: '/',
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/profile':
              return MaterialPageRoute(
                  builder: (_) => const ProfileScreen());
            case '/app-settings':
              return MaterialPageRoute(
                  builder: (_) => const AppSettingsScreen());
            case '/notifications':
              return MaterialPageRoute(
                  builder: (_) => const NotificationsScreen());
            default:
              return MaterialPageRoute(
                  builder: (_) => const _RootRedirect());
          }
        },
      ),
    );
  }
}

class _RootRedirect extends StatelessWidget {
  const _RootRedirect();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0d1117),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.notifications_rounded,
                  size: 64, color: Color(0xFF4CAF50)),
              SizedBox(height: 24),
              CircularProgressIndicator(color: Color(0xFF4CAF50)),
            ],
          ),
        ),
      );
    }

    return auth.isLoggedIn ? const DashboardScreen() : const LoginScreen();
  }
}
