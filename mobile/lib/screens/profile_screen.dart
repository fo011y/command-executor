import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _phone1Ctrl = TextEditingController();
  final _phone2Ctrl = TextEditingController();
  final _phone3Ctrl = TextEditingController();
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final prov = context.read<ProfileProvider>();
      await prov.load();
      _fillControllers(prov);
    });
  }

  void _fillControllers(ProfileProvider prov) {
    if (prov.profile == null) return;
    _phone1Ctrl.text = prov.profile!.phone ?? '';
    _phone2Ctrl.text = prov.profile!.phone2 ?? '';
    _phone3Ctrl.text = prov.profile!.phone3 ?? '';
  }

  @override
  void dispose() {
    _phone1Ctrl.dispose();
    _phone2Ctrl.dispose();
    _phone3Ctrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final prov = context.read<ProfileProvider>();
    final ok = await prov.update(
      phone: _phone1Ctrl.text.trim().isEmpty ? null : _phone1Ctrl.text.trim(),
      phone2:
          _phone2Ctrl.text.trim().isEmpty ? null : _phone2Ctrl.text.trim(),
      phone3:
          _phone3Ctrl.text.trim().isEmpty ? null : _phone3Ctrl.text.trim(),
    );
    if (!mounted) return;
    if (ok) {
      setState(() => _editing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Профиль обновлён'),
          backgroundColor: Color(0xFF4CAF50),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(prov.error ?? 'Ошибка'),
          backgroundColor: Colors.red[700],
        ),
      );
    }
    prov.clearMessages();
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<ProfileProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF1a1a2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF16213e),
        foregroundColor: Colors.white,
        title: const Text('Профиль'),
        actions: [
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _editing = true),
            )
          else ...[
            TextButton(
              onPressed: () {
                _fillControllers(prov);
                setState(() => _editing = false);
              },
              child: const Text('Отмена',
                  style: TextStyle(color: Colors.white54)),
            ),
            TextButton(
              onPressed: prov.loading ? null : _save,
              child: const Text('Сохранить',
                  style: TextStyle(
                      color: Color(0xFF4CAF50),
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ],
      ),
      body: prov.loading && prov.profile == null
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF4CAF50)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _avatarSection(auth.user?.email),
                  const SizedBox(height: 24),
                  _infoCard(prov),
                  const SizedBox(height: 16),
                  _phonesCard(prov),
                  const SizedBox(height: 24),
                  _logoutButton(auth),
                ],
              ),
            ),
    );
  }

  Widget _avatarSection(String? email) {
    return Column(
      children: [
        CircleAvatar(
          radius: 42,
          backgroundColor: const Color(0xFF4CAF50),
          child: Text(
            email?.isNotEmpty == true
                ? email![0].toUpperCase()
                : '?',
            style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: Colors.white),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          email ?? '',
          style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _infoCard(ProfileProvider prov) {
    final profile = prov.profile;
    return _card(
      title: 'Аккаунт',
      children: [
        _infoRow('Email', profile?.email ?? '—'),
        _infoRow('Роль', profile?.isAdmin == true ? 'Администратор' : 'Пользователь'),
        _infoRow('Устройство', profile?.moduleSerial ?? '—'),
        _infoRow(
          'Статус',
          profile?.isActive == true ? 'Активен' : 'Не активен',
          valueColor: profile?.isActive == true
              ? const Color(0xFF4CAF50)
              : Colors.redAccent,
        ),
      ],
    );
  }

  Widget _phonesCard(ProfileProvider prov) {
    return _card(
      title: 'Телефоны',
      children: _editing
          ? [
              _phoneField('Основной телефон', _phone1Ctrl),
              const SizedBox(height: 12),
              _phoneField('Телефон 2', _phone2Ctrl),
              const SizedBox(height: 12),
              _phoneField('Телефон 3', _phone3Ctrl),
            ]
          : [
              _infoRow('Основной', prov.profile?.phone ?? '—'),
              _infoRow('Телефон 2', prov.profile?.phone2 ?? '—'),
              _infoRow('Телефон 3', prov.profile?.phone3 ?? '—'),
            ],
    );
  }

  Widget _logoutButton(AuthProvider auth) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => auth.logout(),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.redAccent,
          side: const BorderSide(color: Colors.redAccent),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        icon: const Icon(Icons.logout),
        label: const Text('Выйти из аккаунта',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _card({required String title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF16213e),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style:
                  const TextStyle(color: Colors.white54, fontSize: 14)),
          Text(value,
              style: TextStyle(
                  color: valueColor ?? Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _phoneField(String label, TextEditingController ctrl) {
    return TextFormField(
      controller: ctrl,
      keyboardType: TextInputType.phone,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white54),
        filled: true,
        fillColor: const Color(0xFF0f3460),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide:
              const BorderSide(color: Color(0xFF4CAF50), width: 1.5),
        ),
      ),
    );
  }
}
