import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsProvider>().markAllRead();
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<NotificationsProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0d1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161b22),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Уведомления',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
        actions: [
          if (prov.items.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded,
                  color: Colors.white54, size: 22),
              tooltip: 'Очистить всё',
              onPressed: () => _confirmClear(context, prov),
            ),
        ],
      ),
      body: prov.items.isEmpty ? _emptyState() : _list(prov),
    );
  }

  Widget _list(NotificationsProvider prov) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: prov.items.length,
      separatorBuilder: (_, __) => const Divider(
        color: Color(0xFF21262d),
        height: 1,
        indent: 64,
      ),
      itemBuilder: (_, i) {
        final n = prov.items[i];
        return ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFF1f2937),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.notifications_rounded,
              color: Color(0xFF4CAF50),
              size: 20,
            ),
          ),
          title: Text(
            n.title,
            style: TextStyle(
              color: Colors.white,
              fontWeight:
                  n.isRead ? FontWeight.normal : FontWeight.bold,
              fontSize: 14,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                n.body,
                style:
                    const TextStyle(color: Colors.white60, fontSize: 13),
              ),
              const SizedBox(height: 6),
              Text(
                _formatTime(n.receivedAt),
                style: const TextStyle(
                    color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _emptyState() => const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_off_rounded,
                color: Colors.white12, size: 64),
            SizedBox(height: 16),
            Text(
              'Нет уведомлений',
              style: TextStyle(color: Colors.white38, fontSize: 15),
            ),
          ],
        ),
      );

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'только что';
    if (diff.inMinutes < 60) return '${diff.inMinutes} мин назад';
    if (diff.inHours < 24) return '${diff.inHours} ч назад';
    if (diff.inDays == 1) return 'вчера';

    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
  }

  void _confirmClear(BuildContext context, NotificationsProvider prov) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF161b22),
        title: const Text('Очистить уведомления?',
            style: TextStyle(color: Colors.white, fontSize: 16)),
        content: const Text('Все уведомления будут удалены.',
            style: TextStyle(color: Colors.white60)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена',
                style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () {
              prov.deleteAll();
              Navigator.pop(context);
            },
            child: const Text('Очистить',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}
