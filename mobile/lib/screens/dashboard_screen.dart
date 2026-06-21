import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/commands_provider.dart';
import '../providers/notifications_provider.dart';
import '../providers/settings_provider.dart';
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
    final accent = Color(settings.accentColorValue);

    return Scaffold(
      backgroundColor: const Color(0xFF0d1117),
      appBar: _buildAppBar(auth, accent),
      body: _buildBody(commandsProv, accent),
    );
  }

  AppBar _buildAppBar(AuthProvider auth, Color accent) {
    final unread = context.watch<NotificationsProvider>().unreadCount;

    return AppBar(
      backgroundColor: const Color(0xFF161b22),
      foregroundColor: Colors.white,
      elevation: 0,
      title: const Text(
        'GCB Connect',
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded, size: 22),
          onPressed: () => context.read<CommandsProvider>().loadCommands(),
        ),
        Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_rounded, size: 24),
              onPressed: () =>
                  Navigator.of(context).pushNamed('/notifications'),
            ),
            if (unread > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.redAccent,
                    shape: BoxShape.circle,
                  ),
                  constraints:
                      const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text(
                    unread > 99 ? '99+' : '$unread',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        PopupMenuButton<String>(
          color: const Color(0xFF161b22),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          onSelected: (value) {
            switch (value) {
              case 'profile':
                Navigator.of(context).pushNamed('/profile');
              case 'settings':
                Navigator.of(context).pushNamed('/app-settings');
              case 'logout':
                context.read<AuthProvider>().logout();
            }
          },
          itemBuilder: (_) => [
            PopupMenuItem(
              value: 'profile',
              child: _menuItem(Icons.person_rounded,
                  auth.user?.email ?? 'Профиль'),
            ),
            PopupMenuItem(
              value: 'settings',
              child: _menuItem(Icons.settings_rounded, 'Настройки'),
            ),
            const PopupMenuDivider(),
            const PopupMenuItem(
              value: 'logout',
              child: Row(children: [
                Icon(Icons.logout_rounded, color: Colors.redAccent, size: 18),
                SizedBox(width: 10),
                Text('Выйти',
                    style: TextStyle(color: Colors.redAccent)),
              ]),
            ),
          ],
          child: Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accent,
            ),
            padding: const EdgeInsets.all(8),
            child: const Icon(Icons.person_rounded,
                size: 18, color: Colors.white),
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

  Widget _buildBody(CommandsProvider prov, Color accent) {
    if (prov.loading && prov.commands.isEmpty) {
      return Center(
          child: CircularProgressIndicator(color: accent));
    }
    if (prov.error != null && prov.commands.isEmpty) {
      return _errorState(prov, accent);
    }

    return RefreshIndicator(
      color: accent,
      backgroundColor: const Color(0xFF161b22),
      onRefresh: prov.loadCommands,
      child: prov.commands.isEmpty
          ? _emptyState()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: prov.commandsByCategory.entries.map((entry) {
                return _categorySection(entry.key, entry.value, prov, accent);
              }).toList(),
            ),
    );
  }

  Widget _categorySection(
      String categoryName, List commands, CommandsProvider prov, Color accent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 12),
          child: Row(
            children: [
              Container(
                width: 3,
                height: 13,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: accent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                categoryName.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        Center(
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.center,
            children: commands
                .map((cmd) => CommandIconButton(
                      command: cmd,
                      execution: prov.executionFor(cmd.id),
                      onTap: () => prov.execute(cmd.id),
                      accentColor: accent,
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _emptyState() => const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.touch_app_rounded, color: Colors.white12, size: 56),
            SizedBox(height: 12),
            Text('Нет доступных команд',
                style: TextStyle(color: Colors.white38, fontSize: 14)),
          ],
        ),
      );

  Widget _errorState(CommandsProvider prov, Color accent) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, color: Colors.white24, size: 56),
            const SizedBox(height: 16),
            Text(prov.error!,
                style: const TextStyle(color: Colors.white38, fontSize: 14)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: prov.loadCommands,
              style: ElevatedButton.styleFrom(
                backgroundColor: accent,
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
