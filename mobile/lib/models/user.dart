class User {
  final int id;
  final String email;
  final String role;
  final bool isActive;
  final String? phone;
  final String? phone2;
  final String? phone3;
  final String? moduleSerial;

  const User({
    required this.id,
    required this.email,
    required this.role,
    required this.isActive,
    this.phone,
    this.phone2,
    this.phone3,
    this.moduleSerial,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        email: json['email'] as String,
        role: json['role'] as String,
        isActive: json['is_active'] as bool,
        phone: json['phone'] as String?,
        phone2: json['phone2'] as String?,
        phone3: json['phone3'] as String?,
        moduleSerial: json['module_serial'] as String?,
      );

  bool get isAdmin => role == 'admin';
}
