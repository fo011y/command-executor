import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'api/auth_api.dart';
import 'api/client.dart';
import 'api/commands_api.dart';
import 'api/profile_api.dart';
import 'providers/auth_provider.dart';
import 'providers/commands_provider.dart';
import 'providers/profile_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/car_settings_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'services/settings_service.dart';
import 'services/socket_service.dart';

void main() {
  runApp(const GcbConnectApp());
}

class GcbConnectApp extends StatelessWidget {
  const GcbConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    final dio = buildDio();
    final socketService = SocketService();
    final settingsService = SettingsService();

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
      ],
      child: MaterialApp(
        title: 'GCB Connect',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.dark(
            primary: const Color(0xFF4CAF50),
            surface: const Color(0xFF161b22),
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
            case '/car-settings':
              return MaterialPageRoute(
                  builder: (_) => const CarSettingsScreen());
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
              Icon(Icons.directions_car_rounded,
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
