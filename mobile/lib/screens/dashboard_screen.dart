import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/car_settings.dart';
import '../providers/auth_provider.dart';
import '../providers/commands_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/car_silhouette.dart';
import '../widgets/command_icon_button.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommandsProvider>().loadCommands();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final commandsProv = context.watch<CommandsProvider>();
    final settings = context.watch<SettingsProvider>().settings;

    return Scaffold(
      backgroundColor: const Color(0xFF0d1117),
      appBar: _buildAppBar(auth, settings),
      body: _buildBody(commandsProv, settings),
    );
  }

  AppBar _buildAppBar(AuthProvider auth, CarSettings settings) {
    return AppBar(
      backgroundColor: const Color(0xFF161b22),
      foregroundColor: Colors.white,
      elevation: 0,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('GCB Connect',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  letterSpacing: 0.5)),
          Text(settings.modelName,
              style: const TextStyle(
                  color: Color(0xFF4CAF50),
                  fontSize: 11,
                  fontWeight: FontWeight.w500)),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded, size: 22),
          onPressed: () => context.read<CommandsProvider>().loadCommands(),
          tooltip: 'Обновить',
        ),
        PopupMenuButton<String>(
          color: const Color(0xFF161b22),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          onSelected: (value) {
            switch (value) {
              case 'profile':
                Navigator.of(context).pushNamed('/profile');
              case 'car':
                Navigator.of(context).pushNamed('/car-settings');
              case 'logout':
                context.read<AuthProvider>().logout();
            }
          },
          itemBuilder: (_) => [
            PopupMenuItem(
              value: 'profile',
              child: _menuItem(Icons.person_rounded, auth.user?.email ?? 'Профиль'),
            ),
            PopupMenuItem(
              value: 'car',
              child: _menuItem(Icons.directions_car_rounded, 'Настройки авто'),
            ),
            const PopupMenuDivider(),
            PopupMenuItem(
              value: 'logout',
              child: Row(children: [
                const Icon(Icons.logout_rounded,
                    color: Colors.redAccent, size: 18),
                const SizedBox(width: 10),
                const Text('Выйти',
                    style: TextStyle(color: Colors.redAccent)),
              ]),
            ),
          ],
          child: Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF4CAF50),
            ),
            padding: const EdgeInsets.all(8),
            child: const Icon(Icons.person_rounded, size: 18, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _menuItem(IconData icon, String label) => Row(children: [
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(width: 10),
        Text(label, style: const TextStyle(color: Colors.white)),
      ]);

  Widget _buildBody(CommandsProvider prov, CarSettings settings) {
    if (prov.loading && prov.commands.isEmpty) {
      return const Center(
          child: CircularProgressIndicator(color: Color(0xFF4CAF50)));
    }

    if (prov.error != null && prov.commands.isEmpty) {
      return _errorState(prov);
    }

    return RefreshIndicator(
      color: const Color(0xFF4CAF50),
      backgroundColor: const Color(0xFF161b22),
      onRefresh: prov.loadCommands,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            if (settings.buttonsPosition == ButtonsPosition.above) ...[
              _commandsSection(prov),
              _carSection(settings),
            ] else ...[
              _carSection(settings),
              _commandsSection(prov),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _carSection(CarSettings settings) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF161b22),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Car model badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: const Color(0xFF4CAF50).withValues(alpha: 0.3)),
            ),
            child: Text(
              settings.modelName,
              style: const TextStyle(
                  color: Color(0xFF4CAF50),
                  fontSize: 12,
                  fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 16),
          // Car silhouette
          Center(
            child: CarSilhouette(
              model: settings.model,
              color: Color(settings.colorValue),
              width: MediaQuery.of(context).size.width - 80,
            ),
          ),
          const SizedBox(height: 8),
          // Ford logo text
          const Text(
            'FORD',
            style: TextStyle(
              color: Colors.white12,
              fontSize: 11,
              letterSpacing: 6,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _commandsSection(CommandsProvider prov) {
    if (prov.commands.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Icon(Icons.touch_app_rounded,
                color: Colors.white.withValues(alpha: 0.15), size: 48),
            const SizedBox(height: 12),
            const Text('Нет доступных команд',
                style: TextStyle(color: Colors.white38, fontSize: 14)),
          ],
        ),
      );
    }

    final categories = prov.commandsByCategory;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: categories.entries.map((entry) {
          return _categorySection(entry.key, entry.value, prov);
        }).toList(),
      ),
    );
  }

  Widget _categorySection(
      String categoryName, List commands, CommandsProvider prov) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 10),
          child: Row(
            children: [
              Container(
                width: 3,
                height: 14,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF4CAF50),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                categoryName.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: commands
              .map((cmd) => CommandIconButton(
                    command: cmd,
                    execution: prov.executionFor(cmd.id),
                    onTap: () => prov.execute(cmd.id),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _errorState(CommandsProvider prov) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded, color: Colors.white24, size: 56),
          const SizedBox(height: 16),
          Text(prov.error!,
              style:
                  const TextStyle(color: Colors.white38, fontSize: 14)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: prov.loadCommands,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            label: const Text('Повторить',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
