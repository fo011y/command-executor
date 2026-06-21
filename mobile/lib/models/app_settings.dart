class AppSettings {
  final int accentColorValue;

  const AppSettings({
    this.accentColorValue = 0xFF4CAF50, // green by default
  });

  AppSettings copyWith({int? accentColorValue}) => AppSettings(
        accentColorValue: accentColorValue ?? this.accentColorValue,
      );

  Map<String, dynamic> toJson() => {
        'accentColorValue': accentColorValue,
      };

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
        accentColorValue:
            json['accentColorValue'] as int? ?? 0xFF4CAF50,
      );
}
